-- ============================================================
-- ZTC SHOP — Équipes créées par les clients (standalone)
-- À exécuter UNE FOIS dans : Supabase Dashboard > SQL Editor > New query
-- La page /teams (onglet Créer) utilise cette table.
-- ============================================================

create table if not exists public.teams (
  id text primary key,
  name text not null,
  game text not null default 'valorant',
  logo text,
  captain text default '',
  phone text default '',
  description text default '',
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- Nom d'équipe unique (insensible à la casse)
create unique index if not exists teams_name_unique on public.teams (lower(name));

alter table public.teams enable row level security;

-- Lecture publique (tout le monde voit les équipes)
drop policy if exists "teams_public_read" on public.teams;
create policy "teams_public_read" on public.teams
  for select using (true);

-- Création : comptes connectés uniquement (le nom unique est garanti par l'index)
drop policy if exists "teams_insert_auth" on public.teams;
create policy "teams_insert_auth" on public.teams
  for insert with check (auth.uid() is not null);

-- Modif : le créateur ou un admin
drop policy if exists "teams_update_owner_or_admin" on public.teams;
create policy "teams_update_owner_or_admin" on public.teams
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- Suppression : le créateur ou un admin
drop policy if exists "teams_delete_owner_or_admin" on public.teams;
create policy "teams_delete_owner_or_admin" on public.teams
  for delete using (user_id = auth.uid() or public.is_admin());

alter publication supabase_realtime add table public.teams;
