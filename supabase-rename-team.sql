-- ZTC Shop: securely rename a team and update its existing tournament history.
-- Run once in Supabase Dashboard > SQL Editor.

create or replace function public.update_team_identity(
  p_team_id text,
  p_name text,
  p_logo text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_team public.teams%rowtype;
  v_has_team boolean := false;
  v_asset_target_exists boolean;
  v_owner_id uuid;
  v_old_name text;
  v_name text := btrim(coalesce(p_name, ''));
  v_logo text := nullif(btrim(coalesce(p_logo, '')), '');
begin
  if v_uid is null then
    raise exception 'login required' using errcode = '28000';
  end if;

  select * into v_team
  from public.teams
  where id = p_team_id
  for update;

  if found then
    v_has_team := true;
    v_old_name := v_team.name;
    v_owner_id := v_team.user_id;
    v_logo := nullif(btrim(coalesce(p_logo, v_team.logo, '')), '');
  else
    select team, user_id, logo
      into v_old_name, v_owner_id, v_logo
    from public.tournament_regs
    where id::text = p_team_id
    for update;
    if not found then
      raise exception 'team not found' using errcode = 'P0002';
    end if;
    v_logo := nullif(btrim(coalesce(p_logo, v_logo, '')), '');
  end if;

  if not public.is_admin()
     and v_owner_id is distinct from v_uid
     and not exists (
       select 1 from public.tournament_regs r
       where lower(r.team) = lower(v_old_name)
         and r.user_id = v_uid
     )
     and not exists (
       select 1
       from public.tournament_regs r
       join public.tournament_join_requests j on j.reg_id = r.id
       where lower(r.team) = lower(v_team.name)
         and j.user_id = v_uid
         and j.status = 'accepted'
     ) then
    raise exception 'team membership required' using errcode = '42501';
  end if;

  if length(v_name) < 2 or length(v_name) > 40 then
    raise exception 'invalid team name' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext(lower(v_name)));

  if exists (
    select 1 from public.teams
    where id <> p_team_id and lower(name) = lower(v_name)
  ) then
    raise exception 'team name already taken' using errcode = '23505';
  end if;
  if exists (
    select 1 from public.tournament_regs
    where lower(team) = lower(v_name)
      and lower(team) <> lower(v_old_name)
  ) then
    raise exception 'team name already taken' using errcode = '23505';
  end if;

  if v_has_team then
    update public.teams
    set name = v_name, logo = v_logo
    where id = p_team_id
    returning * into v_team;
  end if;

  update public.tournament_regs
  set team = v_name, logo = v_logo
  where lower(team) = lower(v_old_name);

  if to_regclass('public.lfg_posts') is not null then
    execute 'update public.lfg_posts
      set team_name = $1
      where lower(team_name) = lower($2)'
      using v_name, v_old_name;
  end if;

  update public.tournaments t
  set bracket = (
    select coalesce(jsonb_agg(
      jsonb_set(
        round_item.round_data,
        '{matches}',
        coalesce((
          select jsonb_agg(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  match_item.match_data,
                  '{teamA}',
                  case when lower(match_item.match_data->>'teamA') = lower(v_old_name)
                    then to_jsonb(v_name) else coalesce(match_item.match_data->'teamA', 'null'::jsonb) end,
                  true
                ),
                '{teamB}',
                case when lower(match_item.match_data->>'teamB') = lower(v_old_name)
                  then to_jsonb(v_name) else coalesce(match_item.match_data->'teamB', 'null'::jsonb) end,
                true
              ),
              '{winner}',
              case when lower(match_item.match_data->>'winner') = lower(v_old_name)
                then to_jsonb(v_name) else coalesce(match_item.match_data->'winner', 'null'::jsonb) end,
              true
            )
            order by match_item.match_order
          )
          from jsonb_array_elements(coalesce(round_item.round_data->'matches', '[]'::jsonb))
            with ordinality as match_item(match_data, match_order)
        ), '[]'::jsonb),
        true
      )
      order by round_item.round_order
    ), '[]'::jsonb)
    from jsonb_array_elements(coalesce(t.bracket, '[]'::jsonb))
      with ordinality as round_item(round_data, round_order)
  )
  where exists (
    select 1
    from jsonb_array_elements(coalesce(t.bracket, '[]'::jsonb)) as rounds(round_data)
    cross join lateral jsonb_array_elements(coalesce(rounds.round_data->'matches', '[]'::jsonb)) as matches(match_data)
    where lower(matches.match_data->>'teamA') = lower(v_old_name)
       or lower(matches.match_data->>'teamB') = lower(v_old_name)
       or lower(matches.match_data->>'winner') = lower(v_old_name)
  );

  if to_regclass('public.team_assets') is not null then
    if lower(v_old_name) <> lower(v_name) then
      execute 'select exists (
        select 1 from public.team_assets
        where lower(team_name) = lower($1)
      )' into v_asset_target_exists using v_name;

      if v_asset_target_exists then
        execute 'update public.team_assets new_asset
          set banner = coalesce(new_asset.banner, old_asset.banner), updated_at = now()
          from public.team_assets old_asset
          where lower(new_asset.team_name) = lower($1)
            and lower(old_asset.team_name) = lower($2)'
          using v_name, v_old_name;
        execute 'delete from public.team_assets where lower(team_name) = lower($1)'
          using v_old_name;
      else
        execute 'update public.team_assets
          set team_name = $1, updated_at = now()
          where lower(team_name) = lower($2)'
          using v_name, v_old_name;
      end if;
    end if;
  end if;

  return jsonb_build_object('name', v_name, 'logo', v_logo);
end;
$$;

revoke all on function public.update_team_identity(text, text, text) from public;
grant execute on function public.update_team_identity(text, text, text) to authenticated;
