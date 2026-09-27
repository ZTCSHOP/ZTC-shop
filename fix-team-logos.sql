-- ============================================================
-- ZTC SHOP — Logos d'équipes (upload manuel par le capitaine)
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query > Run
-- ============================================================

-- 1) Colonne logo (URL ou image réduite en data URL)
alter table public.tournament_regs
  add column if not exists logo text;

-- 2) Le capitaine peut modifier SON inscription (ex: changer le logo),
--    l'admin peut tout modifier
drop policy if exists "regs_update_own_or_admin" on public.tournament_regs;
create policy "regs_update_own_or_admin" on public.tournament_regs
  for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
