-- ============================================================
-- ZTC SHOP — VIP Membership 29.99 TND/mois
-- À exécuter UNE FOIS dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- 1) Flag VIP sur les profils
alter table public.profiles add column if not exists is_vip boolean default false;
alter table public.profiles add column if not exists vip_until timestamptz;

-- L'admin peut modifier les profils (ex: activer le VIP) depuis l'appli
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- 2) Demandes d'abonnement VIP
create table if not exists public.vip_subs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  months integer default 1,
  amount numeric default 29.99,
  status text default 'pending',
  created_at timestamptz default now()
);

alter table public.vip_subs enable row level security;

-- Création : compte connecté uniquement, pour soi-même
drop policy if exists "vip_insert_own" on public.vip_subs;
create policy "vip_insert_own" on public.vip_subs
  for insert with check (auth.uid() is not null and user_id = auth.uid());

-- Lecture : soi-même ou admin
drop policy if exists "vip_select_own_or_admin" on public.vip_subs;
create policy "vip_select_own_or_admin" on public.vip_subs
  for select using (user_id = auth.uid() or public.is_admin());

-- Validation : admin uniquement
drop policy if exists "vip_update_admin" on public.vip_subs;
create policy "vip_update_admin" on public.vip_subs
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "vip_delete_admin" on public.vip_subs;
create policy "vip_delete_admin" on public.vip_subs
  for delete using (public.is_admin());

alter publication supabase_realtime add table public.vip_subs;
