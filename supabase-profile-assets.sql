-- ZTC SHOP : photos + bannieres profils visibles par TOUS
-- Copie ce bloc, colle-le dans Supabase > SQL Editor > New query > Run

create table if not exists public.profile_assets (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar text,
  banner text,
  games text[] not null default '{}',
  updated_at timestamptz default now()
);

alter table public.profile_assets add column if not exists games text[] not null default '{}';
notify pgrst, 'reload schema';

alter table public.profile_assets enable row level security;

drop policy if exists "profile_assets_public_read" on public.profile_assets;
create policy "profile_assets_public_read" on public.profile_assets
  for select using (true);

drop policy if exists "profile_assets_write_own" on public.profile_assets;
create policy "profile_assets_write_own" on public.profile_assets
  for all using (auth.uid() = id) with check (auth.uid() = id);
