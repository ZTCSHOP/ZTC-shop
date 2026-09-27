-- ============================================================
-- ZTC SHOP — FIX tournois : erreur "tournament_regs not in schema cache"
-- + page Équipes publique + demandes pour rejoindre une équipe
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query > Run
-- ============================================================

-- 1) Tables (si jamais créées : c'est la cause de ton erreur)
create table if not exists public.tournaments (
  id text primary key,
  game text not null,
  title text not null,
  date timestamptz,
  prize text,
  max_teams integer default 16,
  entry_fee numeric default 0,
  status text default 'soon',
  rules text,
  image text,
  created_by uuid references auth.users(id) on delete set null,
  bracket jsonb default '[]'
);

create table if not exists public.tournament_regs (
  id uuid primary key default gen_random_uuid(),
  tournament_id text references public.tournaments(id) on delete cascade,
  team text not null,
  captain text,
  phone text,
  game_id text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- 2) Demandes pour rejoindre une équipe (nouveau)
create table if not exists public.tournament_join_requests (
  id uuid primary key default gen_random_uuid(),
  tournament_id text references public.tournaments(id) on delete cascade,
  reg_id uuid references public.tournament_regs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  message text,
  status text default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz default now(),
  unique(reg_id, user_id)
);

-- 3) RLS
alter table public.tournaments enable row level security;
alter table public.tournament_regs enable row level security;
alter table public.tournament_join_requests enable row level security;

-- Tournois : lecture publique (sauf pending)
drop policy if exists "tournaments_public_read" on public.tournaments;
create policy "tournaments_public_read" on public.tournaments
  for select using (status <> 'pending' or created_by = auth.uid() or public.is_admin());
drop policy if exists "tournaments_write_admin" on public.tournaments;
create policy "tournaments_write_admin" on public.tournaments
  for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "tournaments_insert_pending" on public.tournaments;
create policy "tournaments_insert_pending" on public.tournaments
  for insert with check (status = 'pending' and auth.uid() is not null);

-- Équipes : LECTURE PUBLIQUE (sans ça, la page Équipes + participants reste vide)
-- Note : le téléphone reste caché dans l'UI pour les non-admins.
drop policy if exists "regs_select_own_or_admin" on public.tournament_regs;
drop policy if exists "regs_public_read" on public.tournament_regs;
create policy "regs_public_read" on public.tournament_regs
  for select using (true);
drop policy if exists "regs_insert_own" on public.tournament_regs;
create policy "regs_insert_own" on public.tournament_regs
  for insert with check (user_id = auth.uid());
drop policy if exists "regs_insert_admin" on public.tournament_regs;
create policy "regs_insert_admin" on public.tournament_regs
  for insert with check (public.is_admin());
drop policy if exists "regs_delete_admin" on public.tournament_regs;
create policy "regs_delete_admin" on public.tournament_regs
  for delete using (public.is_admin());

-- Demandes : chacun voit les siennes, le capitaine de l'équipe + admin voient tout
drop policy if exists "join_req_select" on public.tournament_join_requests;
create policy "join_req_select" on public.tournament_join_requests
  for select using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.tournament_regs r
      where r.id = tournament_join_requests.reg_id
        and r.user_id = auth.uid()
    )
  );
drop policy if exists "join_req_insert" on public.tournament_join_requests;
create policy "join_req_insert" on public.tournament_join_requests
  for insert with check (user_id = auth.uid() and status = 'pending');
drop policy if exists "join_req_update" on public.tournament_join_requests;
create policy "join_req_update" on public.tournament_join_requests
  for update using (
    public.is_admin()
    or exists (
      select 1 from public.tournament_regs r
      where r.id = tournament_join_requests.reg_id
        and r.user_id = auth.uid()
    )
  );

-- 4) Realtime
alter publication supabase_realtime add table public.tournaments;
alter publication supabase_realtime add table public.tournament_regs;
alter publication supabase_realtime add table public.tournament_join_requests;
