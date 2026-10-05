-- ============================================================
-- ZTC SHOP — Push notifications (abonnements navigateur/app)
-- À exécuter UNE FOIS dans : Supabase Dashboard > SQL Editor > New query
-- Utilisé par : bouton cloche (Support/Admin) + Edge Function push-message
-- ============================================================

create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  ua text default '',
  created_at timestamptz default now()
);

alter table public.push_subscriptions enable row level security;

-- Chacun gère SES abonnements (insert + update pour upsert + delete + lecture)
drop policy if exists "push_subs_owner" on public.push_subscriptions;
create policy "push_subs_owner" on public.push_subscriptions
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
