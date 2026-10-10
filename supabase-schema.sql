-- ============================================================
-- ZTC SHOP — Backend partagé (Supabase)
-- À exécuter UNE FOIS dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- ---------- Tables ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  provider text default 'email',
  is_admin boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.products (
  id text primary key,
  category text not null,
  name text not null,
  subtitle text,
  image text,
  badge text,
  description text,
  variants jsonb default '[]'::jsonb,
  stock integer default 0,
  rating numeric default 5.0
);

create table if not exists public.orders (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  customer jsonb default '{}'::jsonb,
  items jsonb default '[]'::jsonb,
  total numeric default 0,
  method text default 'card',
  status text default 'En attente de confirmation (paiement reçu)',
  created_at timestamptz default now()
);

-- ---------- Fonction admin (bypass RLS, usage interne des policies) ----------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

-- ---------- Anti-escalade : personne ne peut se nommer admin seul via l'appli ----------
-- (le SQL Editor connecté en postgres/service_role reste autorisé pour le réglage initial)
create or replace function public.prevent_admin_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.is_admin is distinct from OLD.is_admin
     and not public.is_admin()
     and current_user not in ('postgres', 'service_role') then
    raise exception 'Seul un admin peut modifier le rôle admin.';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_no_self_admin on public.profiles;
create trigger trg_no_self_admin
  before update on public.profiles
  for each row execute function public.prevent_admin_escalation();

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.products enable row level security;

-- profiles
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles_insert_own" on public.profiles;
-- VERROUILLE : nul ne peut se mettre admin a l'inscription (admin = SQL/service_role uniquement)
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid() and coalesce(is_admin, false) = false);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- orders : chacun voit SES commandes, l'admin voit TOUT et confirme
drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "orders_insert_own" on public.orders;
-- VERROUILLE : statut "En attente" obligatoire a la creation (pas de fausse commande confirmee)
create policy "orders_insert_own" on public.orders
  for insert with check (user_id = auth.uid() and status like 'En attente%');
drop policy if exists "orders_update_admin" on public.orders;
create policy "orders_update_admin" on public.orders
  for update using (public.is_admin());

-- products : catalogue public en lecture, admin seul en écriture
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select using (true);
drop policy if exists "products_write_admin" on public.products;
create policy "products_write_admin" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- suppressions admin (bouton poubelle : commandes + comptes)
drop policy if exists "orders_delete_admin" on public.orders;
create policy "orders_delete_admin" on public.orders
  for delete using (public.is_admin());
drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin" on public.profiles
  for delete using (public.is_admin());

-- ---------- Realtime (commandes + produits en direct pour l'admin) ----------
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.profiles;

-- ---------- Seed catalogue (prix TND) ----------
insert into public.products (id, category, name, subtitle, image, badge, description, variants, stock, rating) values
('val-1','valorant','Valorant Points','VP • Livraison instantanée','https://images.g2a.com/300x400/1x1x1/valorant-gift-card-10-usd-riot-key-latam-i10000206410010/6a355b9399534a69b7985242','HOT','Recharge ton compte Valorant en quelques secondes. Code officiel Riot. Carte EU.','[{"id":"val-1000","label":"1000 VP","price":38},{"id":"val-2050","label":"2050 VP","price":76},{"id":"val-2450","label":"2450 VP","price":92}]',124,4.9),
('lol-1','lol','League of Legends RP','Cartes € • Europe','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNztnpwTexsNw2a58jD4GD3VukhzYqPHAouBNgep7nzA&s=10','BEST SELLER','Débloque skins, champions et chromas. Code valable Europe.','[{"id":"lol-eu10","label":"Carte 10€","price":38},{"id":"lol-eu15","label":"Carte 15€","price":59},{"id":"lol-eu20","label":"Carte 20€","price":78},{"id":"lol-eu25","label":"Carte 25€","price":96},{"id":"lol-eu35","label":"Carte 35€","price":135},{"id":"lol-eu50","label":"Carte 50€","price":195},{"id":"lol-eu100","label":"Carte 100€","price":380}]',89,4.8),
('fc26-1','fc26','FC 26 Coins Ultimate Team','Livraison 5-15 min • PS / Xbox / PC','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhPfUeZMBSqKcCZINmj7HGMN4nDmh3OVPLURigP-u5bg&s=10','NEW','Coins pour FC 26 UT. Méthode sécurisée Player Auction, garantie anti-ban.','[{"id":"fc-50k","label":"50K Coins","price":9.99},{"id":"fc-100k","label":"100K Coins","price":18.99},{"id":"fc-300k","label":"300K Coins","price":49.99},{"id":"fc-700k","label":"700K Coins","price":104.99},{"id":"fc-1m","label":"1M Coins","price":139.99}]',42,4.7),
('pubg-1','pubg','PUBG Mobile UC','Unknown Cash','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2k0Xlx3K5dZvgyfn4R20bh_OFVCv93xOJkyMmx-g-Zg&s=10',null,'UC pour PUBG Mobile. Compatible Global. ID joueur requis à la livraison pour méthode directe, ou code.','[{"id":"pubg-60","label":"60 UC","price":0.99},{"id":"pubg-325","label":"325 UC","price":4.99},{"id":"pubg-660","label":"660 UC","price":9.99},{"id":"pubg-1800","label":"1800 UC","price":24.99},{"id":"pubg-3850","label":"3850 UC","price":49.99}]',210,4.8),
('wz-1','warzone','Warzone COD Points','CP • Toutes plateformes','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZyqv8ihFLqe-huGX1idY3forMuHcN39UzhSDqVNCQ4g&s=10','HOT','COD Points pour Warzone / Modern Warfare. Débloque Battle Pass, skins et bundles. Livraison instantanée.','[{"id":"wz-500","label":"500 CP","price":19},{"id":"wz-1100","label":"1100 CP","price":38},{"id":"wz-2400","label":"2400 CP","price":75},{"id":"wz-5000","label":"5000 CP","price":145}]',78,4.8),
('r6-1','r6','Rainbow Six Credits','R6 Credits • Ubisoft','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBN2ACWqqVPyzbeCQUHPa9BmoN5rgkkccXtbNxOohIYg&s', 'NEW','Crédits R6 pour Rainbow Six Siege. Opérateurs élite, skins et Battle Pass. Code Ubisoft.','[{"id":"r6-600","label":"600 Credits","price":18},{"id":"r6-1200","label":"1200 Credits","price":35},{"id":"r6-2670","label":"2670 Credits","price":72},{"id":"r6-4920","label":"4920 Credits","price":125}]',54,4.7),
('roblox-1','roblox','Roblox Gift Card','Robux & Premium','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyCcKCRn3kSwAHeU7aumRfEv7QvfvG639Rn5HkcsNUiA&s=10',null,'Carte Roblox officielle. Échangeable en Robux ou abonnement Premium.','[{"id":"rbx-eu10","label":"Roblox 10€","price":40},{"id":"rbx-eu20","label":"Roblox 20€","price":78}]',67,4.9),
('ff-1','freefire','Free Fire Diamonds','Garena • Instantané','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQd5HuED_JGEoLag7MWcOoH5IXb-RT85bqifrp5p71oBQ&s=10','PROMO','Diamants Free Fire. Livraison par ID ou code.','[{"id":"ff-100","label":"100 Diamonds","price":1.29},{"id":"ff-520","label":"520 Diamonds","price":5.99},{"id":"ff-1060","label":"1060 Diamonds","price":11.99},{"id":"ff-2180","label":"2180 Diamonds","price":22.99}]',150,4.6),
('netflix-1','netflix','Netflix E-Card','Abonnement Prépayé','https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&q=80&auto=format&fit=crop',null,'Carte Netflix France. Compatible Essentiel, Standard et Premium. Durée selon formule.','[{"id":"nfx-25","label":"25 TND","price":25},{"id":"nfx-50","label":"50 TND","price":50},{"id":"nfx-100","label":"100 TND","price":100}]',33,4.8),
('psn-1','other','PlayStation Store Card','PSN Wallet FR','https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&q=80&auto=format&fit=crop',null,'Recharge portefeuille PSN. Jeux, add-ons, PS Plus.','[{"id":"psn-eu10","label":"Carte 10€","price":42},{"id":"psn-eu20","label":"Carte 20€","price":82},{"id":"psn-eu25","label":"Carte 25€","price":105},{"id":"psn-eu50","label":"Carte 50€","price":202},{"id":"psn-eu100","label":"Carte 100€","price":398}]',55,4.9),
('xbox-1','other','Xbox Gift Card','Microsoft Store','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdUTxVzAMksOUL5_nc1gzb-P20RB_y8e27POgEpdp2LQ&s',null,'Pour Game Pass, jeux et contenus Xbox & PC.','[{"id":"xbx-eu10","label":"Carte 10€","price":39},{"id":"xbx-eu15","label":"Carte 15€","price":58},{"id":"xbx-eu20","label":"Carte 20€","price":75},{"id":"xbx-eu25","label":"Carte 25€","price":95},{"id":"xbx-eu30","label":"Carte 30€","price":115},{"id":"xbx-eu50","label":"Carte 50€","price":190},{"id":"xbx-eu100","label":"Carte 100€","price":380}]',40,4.7),
('steam-1','other','Steam Wallet Euro','Cartes € • Europe','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBt5pqA1fBJMEFHNDI_MsG9_INeuXR-mb-TOtzdLTcsw&s=10',null,'Code Steam Wallet à activer sur votre compte Steam.','[{"id":"stm-eu10","label":"Carte 10€","price":45},{"id":"stm-eu15","label":"Carte 15€","price":60},{"id":"stm-eu20","label":"Carte 20€","price":84},{"id":"stm-eu25","label":"Carte 25€","price":105},{"id":"stm-eu35","label":"Carte 35€","price":145},{"id":"stm-eu50","label":"Carte 50€","price":220},{"id":"stm-eu100","label":"Carte 100€","price":430}]',71,4.9),
('stm-usd','other','Steam Wallet Dollars','Cartes $ • USA','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBt5pqA1fBJMEFHNDI_MsG9_INeuXR-mb-TOtzdLTcsw&s=10',null,'Code Steam Wallet USD à activer sur votre compte Steam.','[{"id":"stm-usd10","label":"Carte 10$","price":40},{"id":"stm-usd20","label":"Carte 20$","price":77},{"id":"stm-usd30","label":"Carte 30$","price":120},{"id":"stm-usd50","label":"Carte 50$","price":190},{"id":"stm-usd100","label":"Carte 100$","price":380}]',50,4.9),
('bnet-1','battlenet','Battle.net Gift Card','Cartes € • Europe','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxpXqKxg_9IdZaofj07PB2EW0EOxCkrD3E2J6dX5Rqzw&s=10','NEW','Cartes Battle.net Europe pour jeux Blizzard et solde Battle.net.','[{"id":"bnet-eu20","label":"Carte 20€","price":80},{"id":"bnet-eu50","label":"Carte 50€","price":200}]',50,4.8),
('sf-fc27','steamfresh','EA FC 27 — Fresh Account','0H Played • Full Access','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQReH_mDCUQAdNNtUM4zFpCRmDeInuB9-ggZWxMZtkWxQ&s','NEW','Compte Steam fresh : 0H Played • Full Access • Can Change Data.','[{"id":"sf-fc27-std","label":"Standard Edition","price":135}]',20,5.0),
('stmg-1','steam-games','GTA V Premium Edition','Jeu Steam • Clé Europe',null,null,'Grand Theft Auto V Premium Edition — clé Steam Europe.','[{"id":"stmg-1-std","label":"Standard","price":0}]',20,4.8),
('stmg-2','steam-games','Elden Ring','Jeu Steam • Clé Europe',null,null,'Elden Ring — clé Steam Europe.','[{"id":"stmg-2-std","label":"Standard","price":0}]',20,4.8),
('stmg-3','steam-games','Red Dead Redemption 2','Jeu Steam • Clé Europe',null,null,'Red Dead Redemption 2 — clé Steam Europe.','[{"id":"stmg-3-std","label":"Standard","price":0}]',20,4.8),
('stmg-4','steam-games','Cyberpunk 2077','Jeu Steam • Clé Europe',null,null,'Cyberpunk 2077 — clé Steam Europe.','[{"id":"stmg-4-std","label":"Standard","price":0}]',20,4.8),
('stmg-5','steam-games','Baldur''s Gate 3','Jeu Steam • Clé Europe',null,null,'Baldur''s Gate 3 — clé Steam Europe.','[{"id":"stmg-5-std","label":"Standard","price":0}]',20,4.8),
('stmg-6','steam-games','Rust','Jeu Steam • Clé Europe',null,null,'Rust — clé Steam Europe.','[{"id":"stmg-6-std","label":"Standard","price":0}]',20,4.8),
('bnetg-1','battlenet-games','Diablo IV','Jeu Battle.net • Europe',null,null,'Diablo IV — clé Battle.net Europe.','[{"id":"bnetg-1-std","label":"Standard","price":0}]',20,4.8),
('bnetg-2','battlenet-games','Diablo II Resurrected','Jeu Battle.net • Europe',null,null,'Diablo II Resurrected — clé Battle.net Europe.','[{"id":"bnetg-2-std","label":"Standard","price":0}]',20,4.8),
('bnetg-3','battlenet-games','World of Warcraft — 60 jours','Battle.net • Abonnement',null,null,'World of Warcraft — 60 jours de jeu.','[{"id":"bnetg-3-std","label":"Standard","price":0}]',20,4.8),
('bnetg-4','battlenet-games','Call of Duty: Black Ops 6','Jeu Battle.net • Europe',null,null,'Call of Duty: Black Ops 6 — clé Battle.net Europe.','[{"id":"bnetg-4-std","label":"Standard","price":0}]',20,4.8),
('bnetg-5','battlenet-games','Overwatch 2 — Pack pièces','Battle.net • Europe',null,null,'Overwatch 2 — pack de pièces.','[{"id":"bnetg-5-std","label":"Standard","price":0}]',20,4.8),
('bnetg-6','battlenet-games','StarCraft Remastered','Jeu Battle.net • Europe',null,null,'StarCraft Remastered — clé Battle.net Europe.','[{"id":"bnetg-6-std","label":"Standard","price":0}]',20,4.8),
('xboxg-1','xbox-games','Forza Horizon 5','Jeu Xbox • Europe',null,null,'Forza Horizon 5 — clé Xbox Europe.','[{"id":"xboxg-1-std","label":"Standard","price":0}]',20,4.8),
('xboxg-2','xbox-games','Starfield','Jeu Xbox • Europe',null,null,'Starfield — clé Xbox Europe.','[{"id":"xboxg-2-std","label":"Standard","price":0}]',20,4.8),
('xboxg-3','xbox-games','Sea of Thieves','Jeu Xbox • Europe',null,null,'Sea of Thieves — clé Xbox Europe.','[{"id":"xboxg-3-std","label":"Standard","price":0}]',20,4.8),
('xboxg-4','xbox-games','Halo Infinite — Campagne','Jeu Xbox • Europe',null,null,'Halo Infinite Campagne — clé Xbox Europe.','[{"id":"xboxg-4-std","label":"Standard","price":0}]',20,4.8),
('xboxg-5','xbox-games','Gears 5','Jeu Xbox • Europe',null,null,'Gears 5 — clé Xbox Europe.','[{"id":"xboxg-5-std","label":"Standard","price":0}]',20,4.8),
('xboxg-6','xbox-games','Minecraft','Jeu Xbox • Europe',null,null,'Minecraft — clé Xbox Europe.','[{"id":"xboxg-6-std","label":"Standard","price":0}]',20,4.8),
('ps5g-1','ps5-games','God of War Ragnarök','Jeu PS5 • Europe',null,null,'God of War Ragnarök — PS5 Europe.','[{"id":"ps5g-1-std","label":"Standard","price":0}]',20,4.8),
('ps5g-2','ps5-games','Marvel''s Spider-Man 2','Jeu PS5 • Europe',null,null,'Marvel''s Spider-Man 2 — PS5 Europe.','[{"id":"ps5g-2-std","label":"Standard","price":0}]',20,4.8),
('ps5g-3','ps5-games','Horizon Forbidden West','Jeu PS5 • Europe',null,null,'Horizon Forbidden West — PS5 Europe.','[{"id":"ps5g-3-std","label":"Standard","price":0}]',20,4.8),
('ps5g-4','ps5-games','The Last of Us Part II Remastered','Jeu PS5 • Europe',null,null,'The Last of Us Part II Remastered — PS5 Europe.','[{"id":"ps5g-4-std","label":"Standard","price":0}]',20,4.8),
('ps5g-5','ps5-games','Ghost of Tsushima Director’s Cut','Jeu PS5 • Europe',null,null,'Ghost of Tsushima Director’s Cut — PS5 Europe.','[{"id":"ps5g-5-std","label":"Standard","price":0}]',20,4.8),
('ps5g-6','ps5-games','Gran Turismo 7','Jeu PS5 • Europe',null,null,'Gran Turismo 7 — PS5 Europe.','[{"id":"ps5g-6-std","label":"Standard","price":0}]',20,4.8)
on conflict (id) do nothing;

-- ============================================================
-- APRÈS le 1er login du propriétaire, exécute cette ligne
-- (remplace l’email si besoin) pour le nommer ADMIN :
-- ============================================================
-- update public.profiles set is_admin = true where email = 'apatchegaming@gmail.com';

-- ---------- FC 27 (PC + PS5) ----------
delete from public.products where id = 'fc27-1';
insert into public.products (id, category, name, subtitle, image, badge, description, variants, stock, rating) values
('fc27-pc','fc27','FC 27 PC – Steam Full Access','Compte complet • Version PC','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhc6Hl7O2D2ZMM5mGE1Ou40bK_4_xPxWdJW8VsQ7faUHqHInv68ByFjCMH&s=10','NEW','Compte Steam FC 27 version PC en plein accès : email et mot de passe modifiables, jeu à vie. Livraison 5-30 min.','[{"id":"fc27-pc-std","label":"Standard Edition – Full Access","price":130},{"id":"fc27-pc-ult","label":"Ultimate Edition – Full Access","price":240}]',25,5.0),
('fc27-ps5','fc27','FC 27 PS5 – PSN','Compte complet • Version PS5','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHFwBgEcKi_xb22H3SlkrPBNlUjsOwHxCey-epDjbKyQ&s=10','NEW','FC 27 version PS5 (compte PSN) : Standard ou Ultimate, accès complet. Livraison 5-30 min.','[{"id":"fc27-ps5-std","label":"Standard Edition – PSN","price":240},{"id":"fc27-ps5-ult","label":"Ultimate Edition – PSN","price":340}]',20,5.0)
on conflict (id) do update set name=excluded.name, subtitle=excluded.subtitle, image=excluded.image, badge=excluded.badge, description=excluded.description, variants=excluded.variants, stock=excluded.stock, rating=excluded.rating;

-- ============================================================
-- MESSAGES : conversation directe admin <-> client (support)
-- ============================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  order_id text,
  sender text not null check (sender in ('client','admin')),
  name text,
  text text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

drop policy if exists "messages_select_own_or_admin" on public.messages;
create policy "messages_select_own_or_admin" on public.messages
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "messages_insert_own" on public.messages;
-- VERROUILLE : un client ne peut pas ecrire en tant qu'admin
create policy "messages_insert_own" on public.messages
  for insert with check (user_id = auth.uid() and sender = 'client');
drop policy if exists "messages_insert_admin" on public.messages;
create policy "messages_insert_admin" on public.messages
  for insert with check (public.is_admin());
drop policy if exists "messages_update_admin" on public.messages;
create policy "messages_update_admin" on public.messages
  for update using (public.is_admin());

alter publication supabase_realtime add table public.messages;

-- ============================================================
-- TOURNOIS gaming (Valorant, LoL, etc.)
-- ============================================================
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
  image text
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

alter table public.tournaments enable row level security;
alter table public.tournament_regs enable row level security;

drop policy if exists "tournaments_public_read" on public.tournaments;
-- VERROUILLE : propositions en cours invisibles sauf auteur + admin
create policy "tournaments_public_read" on public.tournaments
  for select using (status <> 'pending' or created_by = auth.uid() or public.is_admin());
drop policy if exists "tournaments_write_admin" on public.tournaments;
create policy "tournaments_write_admin" on public.tournaments for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "regs_select_own_or_admin" on public.tournament_regs;
create policy "regs_select_own_or_admin" on public.tournament_regs for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "regs_insert_own" on public.tournament_regs;
create policy "regs_insert_own" on public.tournament_regs for insert with check (user_id = auth.uid());
drop policy if exists "regs_insert_admin" on public.tournament_regs;
create policy "regs_insert_admin" on public.tournament_regs for insert with check (public.is_admin());
drop policy if exists "regs_delete_admin" on public.tournament_regs;
create policy "regs_delete_admin" on public.tournament_regs for delete using (public.is_admin());

alter publication supabase_realtime add table public.tournaments;
alter publication supabase_realtime add table public.tournament_regs;

-- propositions de tournois par les clients (validées par l'admin)
alter table public.tournaments add column if not exists created_by uuid references auth.users(id) on delete set null;
-- bracket + scores (JSON, géré par l'admin)
alter table public.tournaments add column if not exists bracket jsonb default '[]';
drop policy if exists "tournaments_insert_pending" on public.tournaments;
-- VERROUILLE : comptes verifies uniquement (pas de spam anonyme)
create policy "tournaments_insert_pending" on public.tournaments
  for insert with check (status = 'pending' and auth.uid() is not null);

-- 2 tournois d'exemple
insert into public.tournaments (id, game, title, date, prize, max_teams, entry_fee, status, rules, image) values
('lol-clash-1','lol','LoL Tunisian Showdown', now() + interval '23 days','2000 TND cash prize',32,0,'soon','5v5 Summoners Rift • Tournoi à élimination directe. Règlement complet publié à l’ouverture des inscriptions.','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNztnpwTexsNw2a58jD4GD3VukhzYqPHAouBNgep7nzA&s=10')
on conflict (id) do nothing;
