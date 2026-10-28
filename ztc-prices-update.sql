-- ============================================================
-- ZTC-SHOP — Mise à jour prix + nouveau Battle.net
-- Supabase (projet ztc) > SQL Editor > New query > coller > Run
-- ============================================================

-- Valorant Gift Cards
update public.products set
name = 'Valorant Gift Cards',
subtitle = 'Cartes € • Europe',
variants = '[{"id":"val-eu10","label":"Carte 10€","price":41},{"id":"val-eu15","label":"Carte 15€","price":61},{"id":"val-eu20","label":"Carte 20€","price":82},{"id":"val-eu25","label":"Carte 25€","price":105},{"id":"val-eu30","label":"Carte 30€","price":122},{"id":"val-eu35","label":"Carte 35€","price":142},{"id":"val-eu50","label":"Carte 50€","price":200}]'::jsonb
where id = 'val-1';

-- LoL : recharge RP
update public.products set
name = 'League of Legends TOP-UP',
subtitle = 'RP • Recharge League of Legends',
description = 'Recharge ton compte League of Legends avec le pack RP de ton choix.',
variants = '[{"id":"lol-rp575","label":"575 RP","price":21},{"id":"lol-rp1380","label":"1380 RP","price":42},{"id":"lol-rp1955","label":"1955 RP","price":67},{"id":"lol-rp2800","label":"2800 RP","price":90},{"id":"lol-rp3375","label":"3375 RP","price":110},{"id":"lol-rp4500","label":"4500 RP","price":140},{"id":"lol-rp6500","label":"6500 RP","price":205},{"id":"lol-rp13500","label":"13500 RP","price":400}]'::jsonb
where id = 'lol-1';

-- Steam : wallet €
update public.products set
variants = '[{"id":"stm-eu10","label":"Carte 10€","price":45},{"id":"stm-eu15","label":"Carte 15€","price":60},{"id":"stm-eu20","label":"Carte 20€","price":84},{"id":"stm-eu25","label":"Carte 25€","price":105},{"id":"stm-eu35","label":"Carte 35€","price":145},{"id":"stm-eu50","label":"Carte 50€","price":220},{"id":"stm-eu100","label":"Carte 100€","price":430}]'::jsonb
where id = 'steam-1';

-- Roblox
update public.products set
variants = '[{"id":"rbx-eu10","label":"Roblox 10€","price":40},{"id":"rbx-eu20","label":"Roblox 20€","price":78}]'::jsonb
where id = 'roblox-1';

-- PlayStation
update public.products set
variants = '[{"id":"psn-eu10","label":"Carte 10€","price":42},{"id":"psn-eu20","label":"Carte 20€","price":82},{"id":"psn-eu25","label":"Carte 25€","price":105},{"id":"psn-eu50","label":"Carte 50€","price":202},{"id":"psn-eu100","label":"Carte 100€","price":398}]'::jsonb
where id = 'psn-1';

-- Xbox
update public.products set
variants = '[{"id":"xbx-eu10","label":"Carte 10€","price":39},{"id":"xbx-eu15","label":"Carte 15€","price":58},{"id":"xbx-eu20","label":"Carte 20€","price":75},{"id":"xbx-eu25","label":"Carte 25€","price":95},{"id":"xbx-eu30","label":"Carte 30€","price":115},{"id":"xbx-eu50","label":"Carte 50€","price":190},{"id":"xbx-eu100","label":"Carte 100€","price":380}]'::jsonb
where id = 'xbox-1';

-- Battle.net (NOUVEAU — image à compléter)
insert into public.products (id, category, name, subtitle, image, badge, description, variants, stock, rating) values
('bnet-1','battlenet','Battle.net Gift Card','Cartes € • Europe','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxpXqKxg_9IdZaofj07PB2EW0EOxCkrD3E2J6dX5Rqzw&s=10','NEW','Cartes Battle.net Europe pour jeux Blizzard et solde Battle.net.',
'[{"id":"bnet-eu20","label":"Carte 20€","price":80},{"id":"bnet-eu50","label":"Carte 50€","price":200}]',50,4.8)
on conflict (id) do update set category=excluded.category, name=excluded.name, subtitle=excluded.subtitle, description=excluded.description, variants=excluded.variants, stock=excluded.stock;

-- image Battle.net (au cas où la ligne existait déjà sans image)
update public.products set image = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxpXqKxg_9IdZaofj07PB2EW0EOxCkrD3E2J6dX5Rqzw&s=10' where id = 'bnet-1';

-- Steam en double : supprimer l'extra (1 variante) + image officielle sur la vraie
delete from public.products where id = 'custom-1789985803499';
update public.products set image = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBt5pqA1fBJMEFHNDI_MsG9_INeuXR-mb-TOtzdLTcsw&s=10' where id = 'steam-1';

-- Steam Fresh Account : EA FC 27 Standard (v1)
insert into public.products (id, category, name, subtitle, image, badge, description, variants, stock, rating) values
('sf-fc27','steamfresh','EA FC 27 — Fresh Account','0H Played • Full Access','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQReH_mDCUQAdNNtUM4zFpCRmDeInuB9-ggZWxMZtkWxQ&s','NEW','Compte Steam fresh : 0H Played • Full Access • Can Change Data (email + mot de passe modifiables).',
'[{"id":"sf-fc27-std","label":"Standard Edition","price":135}]',20,5.0)
on conflict (id) do update set category=excluded.category, name=excluded.name, subtitle=excluded.subtitle, image=excluded.image, badge=excluded.badge, description=excluded.description, variants=excluded.variants, stock=excluded.stock;

-- Steam : nom section Euro (+ Dollars à venir)
update public.products set name = 'Steam Wallet Euro', subtitle = 'Cartes € • Europe' where id = 'steam-1';

-- Steam Wallet Dollars (même image que Euro)
insert into public.products (id, category, name, subtitle, image, badge, description, variants, stock, rating) values
('stm-usd','other','Steam Wallet Dollars','Cartes $ • USA','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBt5pqA1fBJMEFHNDI_MsG9_INeuXR-mb-TOtzdLTcsw&s=10',null,'Code Steam Wallet USD à activer sur votre compte Steam.',
'[{"id":"stm-usd10","label":"Carte 10$","price":40},{"id":"stm-usd20","label":"Carte 20$","price":77},{"id":"stm-usd30","label":"Carte 30$","price":120},{"id":"stm-usd50","label":"Carte 50$","price":190},{"id":"stm-usd100","label":"Carte 100$","price":380}]',50,4.9)
on conflict (id) do update set category=excluded.category, name=excluded.name, subtitle=excluded.subtitle, image=excluded.image, description=excluded.description, variants=excluded.variants, stock=excluded.stock;

-- FC27 PC : affiche accueil 130 / 240
update public.products set variants = '[{"id":"fc27-pc-std","label":"Standard Edition – Full Access","price":130},{"id":"fc27-pc-ult","label":"Ultimate Edition – Full Access","price":240}]'::jsonb where id = 'fc27-pc';

-- Jeux plateformes (prix 0 = à fixer par le propriétaire)
insert into public.products (id, category, name, subtitle, image, badge, description, variants, stock, rating) values
('stmg-1','steam-games','GTA V Premium Edition','Jeu Steam • Clé Europe',null,null,'Grand Theft Auto V Premium Edition — clé Steam Europe.','[{"id":"stmg-1-std","label":"Standard","price":0}]',20,4.8),
('stmg-2','steam-games','Elden Ring','Jeu Steam • Clé Europe',null,null,'Elden Ring — clé Steam Europe.','[{"id":"stmg-2-std","label":"Standard","price":0}]',20,4.8),
('stmg-3','steam-games','Red Dead Redemption 2','Jeu Steam • Clé Europe',null,null,'Red Dead Redemption 2 — clé Steam Europe.','[{"id":"stmg-3-std","label":"Standard","price":0}]',20,4.8),
('stmg-4','steam-games','Cyberpunk 2077','Jeu Steam • Clé Europe',null,null,'Cyberpunk 2077 — clé Steam Europe.','[{"id":"stmg-4-std","label":"Standard","price":0}]',20,4.8),
('stmg-5','steam-games','Baldur''s Gate 3','Jeu Steam • Clé Europe',null,null,'Baldur''s Gate 3 — clé Steam Europe.','[{"id":"stmg-5-std","label":"Standard","price":0}]',20,4.8),
('stmg-6','steam-games','Rust','Jeu Steam • Clé Europe',null,null,'Rust — clé Steam Europe.','[{"id":"stmg-6-std","label":"Standard","price":0}]',20,4.8),
('bnetg-1','battlenet-games','Diablo IV','Jeu Battle.net • Europe',null,null,'Diablo IV — clé Battle.net Europe.','[{"id":"bnetg-1-std","label":"Standard","price":0}]',20,4.8),
('bnetg-2','battlenet-games','Diablo II Resurrected','Jeu Battle.net • Europe',null,null,'Diablo II Resurrected — clé Battle.net Europe.','[{"id":"bnetg-2-std","label":"Standard","price":0}]',20,4.8),
('bnetg-3','battlenet-games','World of Warcraft — 60 jours','Battle.net • Abonnement',null,null,'World of Warcraft — 60 jours de jeu, Battle.net Europe.','[{"id":"bnetg-3-std","label":"Standard","price":0}]',20,4.8),
('bnetg-4','battlenet-games','Call of Duty: Black Ops 6','Jeu Battle.net • Europe',null,null,'Call of Duty: Black Ops 6 — clé Battle.net Europe.','[{"id":"bnetg-4-std","label":"Standard","price":0}]',20,4.8),
('bnetg-5','battlenet-games','Overwatch 2 — Pack pièces','Battle.net • Europe',null,null,'Overwatch 2 — pack de pièces, Battle.net Europe.','[{"id":"bnetg-5-std","label":"Standard","price":0}]',20,4.8),
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
on conflict (id) do update set category=excluded.category, name=excluded.name, subtitle=excluded.subtitle, description=excluded.description, variants=excluded.variants, stock=excluded.stock;

-- vérif :
-- select id, category, jsonb_array_length(variants) as nb from public.products where id in ('lol-1','steam-1','roblox-1','psn-1','xbox-1','bnet-1');
