-- SetTimer, migration 0002: per-user settings (Req 7: adjustable rest length).
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- It is safe to run again; it will not duplicate anything.
--
-- One row per user. Row Level Security means the database itself only shows
-- and changes the signed-in user's own row, exactly like workouts and sets.

create table if not exists public.user_settings (
  user_id      uuid primary key default auth.uid()
                 references auth.users (id) on delete cascade,
  -- 15 seconds to 10 minutes, matching the app's limits.
  rest_seconds integer not null default 90
                 check (rest_seconds between 15 and 600),
  updated_at   timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "Users manage their own settings" on public.user_settings;
create policy "Users manage their own settings"
  on public.user_settings for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
