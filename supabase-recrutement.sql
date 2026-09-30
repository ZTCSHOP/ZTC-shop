-- ============================================================
-- ZTC SHOP — Recrutement Esport (candidatures pro players)
-- À exécuter UNE FOIS dans : Supabase Dashboard > SQL Editor > New query
-- La page /recrutement envoie aussi vers Discord (webhook).
-- ============================================================

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  game text not null,
  pseudo text not null,
  nom text,
  age integer,
  phone text,
  discord text,
  email text,
  ville text,
  rank text,
  role text,
  tracker text,
  extra jsonb default '{}'::jsonb,
  experience text,
  dispo text,
  motivation text,
  video text,
  status text default 'new',
  created_at timestamptz default now()
);

alter table public.applications enable row level security;

-- Candidature ouverte à TOUS (même sans compte) : comme la page standalone
drop policy if exists "applications_insert_public" on public.applications;
create policy "applications_insert_public" on public.applications
  for insert with check (true);

-- Lecture admin uniquement
drop policy if exists "applications_select_admin" on public.applications;
create policy "applications_select_admin" on public.applications
  for select using (public.is_admin());

-- L'admin met à jour le statut (new / contacté / retenu / refusé)
drop policy if exists "applications_update_admin" on public.applications;
create policy "applications_update_admin" on public.applications
  for update using (public.is_admin());

alter publication supabase_realtime add table public.applications;
