-- ZTC Shop: one-time 2,500 XP reward for following each social account.
-- Run once in Supabase Dashboard > SQL Editor after xp-system-sql.txt.

create unique index if not exists xp_logs_uniq_social_follow
  on public.xp_logs(user_id, ref)
  where action = 'social_follow';

create or replace function public.claim_social_follow(p_network text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_network text := lower(btrim(coalesce(p_network, '')));
  v_total integer;
begin
  if v_uid is null then
    raise exception 'auth required' using errcode = '28000';
  end if;

  if v_network not in ('instagram', 'youtube', 'facebook') then
    raise exception 'invalid social network' using errcode = '22023';
  end if;

  begin
    insert into public.xp_logs(user_id, action, xp, ref)
    values (v_uid, 'social_follow', 2500, v_network);
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'reason', 'claimed');
  end;

  update public.profiles
  set xp = coalesce(xp, 0) + 2500
  where id = v_uid
  returning xp into v_total;

  if not found then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;

  return jsonb_build_object('ok', true, 'xp', 2500, 'total', v_total);
end;
$$;

revoke all on function public.claim_social_follow(text) from public;
grant execute on function public.claim_social_follow(text) to authenticated;
