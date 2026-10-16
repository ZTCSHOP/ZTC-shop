-- ============================================================
-- ZTC SHOP — Bannières équipes visibles par TOUT le monde (cloud)
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query > Run
-- ============================================================

create table if not exists public.team_assets (
  team_name text primary key,
  banner text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz default now()
);

alter table public.team_assets enable row level security;

-- Lecture publique : tout le monde voit les bannières (PC + mobile)
drop policy if exists "team_assets_public_read" on public.team_assets;
create policy "team_assets_public_read" on public.team_assets
  for select using (true);

-- Écriture : tout membre connecté (l'UI limite au capitaine/admin)
drop policy if exists "team_assets_write_auth" on public.team_assets;
create policy "team_assets_write_auth" on public.team_assets
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- Realtime
do $$
begin
  alter publication supabase_realtime add table public.team_assets;
exception when duplicate_object then null;
end $$;
