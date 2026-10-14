-- ZTC Shop: colonne vidéo YouTube pour les tournois
-- À exécuter UNE FOIS dans Supabase > SQL Editor
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS video TEXT DEFAULT '';
