-- Format tournoi: single/double elimination + format finale BO1/BO3
alter table public.tournaments add column if not exists elimination text default 'single';
alter table public.tournaments add column if not exists final_format text default 'BO1';
