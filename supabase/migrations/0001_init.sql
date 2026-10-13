-- SetTimer, migration 0001: exercises, workouts and sets.
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- It is safe to run again; it will not duplicate anything.
--
-- Row Level Security (RLS): the database itself refuses to show or change
-- anyone else's rows, even if the app code had a bug. Every policy below
-- compares the row's user_id with the signed-in user's id (auth.uid()).
-- (select auth.uid()) is wrapped in a select so Postgres evaluates it once
-- per query instead of once per row.

-- ---------------------------------------------------------------------
-- exercises: the preset list. Everyone can read it; nobody can change it
-- from the app (custom exercises are a later feature).
-- ---------------------------------------------------------------------
create table if not exists public.exercises (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);

alter table public.exercises enable row level security;

drop policy if exists "Anyone can read exercises" on public.exercises;
create policy "Anyone can read exercises"
  on public.exercises for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------
-- workouts: one row per user per date.
-- on delete cascade: deleting a user's account deletes their workouts.
-- ---------------------------------------------------------------------
create table if not exists public.workouts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid()
                 references auth.users (id) on delete cascade,
  workout_date date not null,
  created_at   timestamptz not null default now(),
  unique (user_id, workout_date)
);

alter table public.workouts enable row level security;

drop policy if exists "Users manage their own workouts" on public.workouts;
create policy "Users manage their own workouts"
  on public.workouts for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------
-- sets: one row per logged set. Weight is in pounds.
-- ---------------------------------------------------------------------
create table if not exists public.sets (
  id          uuid primary key default gen_random_uuid(),
  workout_id  uuid not null references public.workouts (id) on delete cascade,
  user_id     uuid not null default auth.uid()
                references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  reps        integer not null check (reps between 1 and 999),
  weight_lb   numeric(6, 2) not null check (weight_lb between 0 and 2000),
  created_at  timestamptz not null default now()
);

create index if not exists sets_workout_idx
  on public.sets (workout_id, created_at);
create index if not exists sets_user_recent_idx
  on public.sets (user_id, created_at desc);

alter table public.sets enable row level security;

-- The "with check" also requires that the workout belongs to the same user,
-- so nobody can attach a set to someone else's workout.
drop policy if exists "Users manage their own sets" on public.sets;
create policy "Users manage their own sets"
  on public.sets for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- Seed: the 34 preset exercises (approved list). Safe to re-run.
-- ---------------------------------------------------------------------
insert into public.exercises (name) values
  ('Back Squat'), ('Barbell Curl'), ('Barbell Row'), ('Bench Press'),
  ('Bulgarian Split Squat'), ('Cable Fly'), ('Calf Raise'), ('Chin-Up'),
  ('Deadlift'), ('Dip'), ('Dumbbell Bench Press'), ('Dumbbell Curl'),
  ('Dumbbell Row'), ('Dumbbell Shoulder Press'), ('Face Pull'),
  ('Front Squat'), ('Goblet Squat'), ('Hammer Curl'), ('Hip Thrust'),
  ('Incline Bench Press'), ('Incline Dumbbell Press'), ('Lat Pulldown'),
  ('Lateral Raise'), ('Leg Curl'), ('Leg Extension'), ('Leg Press'),
  ('Lunge'), ('Lying Triceps Extension'), ('Overhead Press'), ('Pull-Up'),
  ('Push-Up'), ('Romanian Deadlift'), ('Seated Cable Row'),
  ('Triceps Pushdown')
on conflict do nothing;
