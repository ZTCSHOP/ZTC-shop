-- ============================================================
-- ZTC SHOP — Nouveau produit : Google AI Pro 18 Mois (AI Tools)
-- À exécuter UNE FOIS dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

insert into public.products (id, category, name, subtitle, image, badge, description, variants, stock, rating) values
('gemini-pro-18m','ai-tools','Google AI Pro Subscription','18 Months • Activation Link (Global)','https://ztcshop.github.io/ZTC-shop/google-ai-pro.jpg','NEW','Google One Subscription Pro 5TB Activation link (CONTACT US IN CHAT FOR BULK OFFERS). Activate Google One (Gemini Pro) ON YOUR OWN GOOGLE ACCOUNT! Special Offer, DURATION = 1 + 17 MONTHS (total 18 Months offer). Plan Warranty Duration: 1 Month FROM DATE OF PURCHASE.','[{"id":"gai-18m","label":"18 Months – Activation Link","price":40}]',50,5.0)
on conflict (id) do update set category=excluded.category, name=excluded.name, subtitle=excluded.subtitle, image=excluded.image, badge=excluded.badge, description=excluded.description, variants=excluded.variants, stock=excluded.stock, rating=excluded.rating;
