-- ============================================================
-- ZTC SHOP — Nouveau produit : CapCut Pro 1 Mois (AI Tools)
-- À exécuter UNE FOIS dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

insert into public.products (id, category, name, subtitle, image, badge, description, variants, stock, rating) values
('capcut-pro-1m','ai-tools','CapCut Pro Subscription (PC)','1 Month • Private Account (Global)','https://ztcshop.github.io/ZTC-shop/capcut-pro.jpg','NEW','Edit High-Quality Videos. Hundreds of Special Effects. No Watermark. Unlimited Video Exports. Why Should You Buy Now? Limited Offer - Only for ZTC-shop Purchases. Special Price Just For You. Get Full Access to All Features Immediately. Premium! All Devices.','[{"id":"cc-1m","label":"1 Month – Private Account","price":25}]',50,5.0)
on conflict (id) do update set category=excluded.category, name=excluded.name, subtitle=excluded.subtitle, image=excluded.image, badge=excluded.badge, description=excluded.description, variants=excluded.variants, stock=excluded.stock, rating=excluded.rating;
