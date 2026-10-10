-- ============================================================
-- ZTC SHOP — Wallet ZTC (1 TND = 1 coin, recharge via D17)
-- À exécuter UNE FOIS dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- 1) Solde sur les profils
alter table public.profiles add column if not exists ztc_balance numeric default 0;

-- 2) Demandes de recharge
create table if not exists public.recharges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  amount_tnd numeric not null,
  coins integer not null,
  method text default 'D17',
  phone text default '',
  status text default 'pending',
  created_at timestamptz default now()
);

alter table public.recharges enable row level security;

-- Création : compte connecté uniquement, pour soi-même
drop policy if exists "recharges_insert_own" on public.recharges;
create policy "recharges_insert_own" on public.recharges
  for insert with check (auth.uid() is not null and user_id = auth.uid());

-- Lecture : soi-même ou admin
drop policy if exists "recharges_select_own_or_admin" on public.recharges;
create policy "recharges_select_own_or_admin" on public.recharges
  for select using (user_id = auth.uid() or public.is_admin());

-- Validation : admin uniquement
drop policy if exists "recharges_update_admin" on public.recharges;
create policy "recharges_update_admin" on public.recharges
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "recharges_delete_admin" on public.recharges;
create policy "recharges_delete_admin" on public.recharges
  for delete using (public.is_admin());

alter publication supabase_realtime add table public.recharges;

-- ============================================================
-- DURCISSEMENT (anti-triche) : à exécuter aussi (idempotent)
-- ============================================================

-- Le solde ne peut jamais passer sous zéro
alter table public.profiles drop constraint if exists profiles_balance_nonneg;
alter table public.profiles add constraint profiles_balance_nonneg check (ztc_balance is null or ztc_balance >= 0);

-- Personne ne peut s'octroyer le VIP seul (même logique que l'anti-escalade admin)
create or replace function public.prevent_vip_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.is_vip is distinct from OLD.is_vip
     and not public.is_admin()
     and current_user not in ('postgres', 'service_role') then
    raise exception 'Seul un admin peut modifier le statut VIP.';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_no_self_vip on public.profiles;
create trigger trg_no_self_vip
  before update on public.profiles
  for each row execute function public.prevent_vip_escalation();
