-- SetTimer, migration 0003: custom exercises (Req 8).
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- It is safe to run again, and it only ADDS things: every existing exercise,
-- workout and set is left exactly as it is.
--
-- An exercise with no owner (user_id is null) is one of the 34 presets that
-- everybody sees. An exercise with a user_id is that user's own custom
-- exercise: only they can see it, add it or rename it. Row Level Security
-- enforces this in the database itself.

-- 1. Who owns an exercise. Deleting a user deletes their custom exercises too.
alter table public.exercises
  add column if not exists user_id uuid
    references auth.users (id) on delete cascade;

-- 2. Basic name rules, checked by the database itself:
--    1 to 40 characters, no leading/trailing spaces, no control characters.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'exercises_name_rules'
  ) then
    alter table public.exercises
      add constraint exercises_name_rules check (
        char_length(name) between 1 and 40
        and name = btrim(name)
        and name !~ '[[:cntrl:]]'
      );
  end if;
end $$;

-- 3. Names used to be unique across the whole table. Now: preset names are
--    unique, and each user's own names are unique for that user (ignoring
--    capital letters).
alter table public.exercises drop constraint if exists exercises_name_key;

create unique index if not exists exercises_preset_name_unique
  on public.exercises (lower(name)) where user_id is null;
create unique index if not exists exercises_custom_name_unique
  on public.exercises (user_id, lower(name)) where user_id is not null;

-- 4. Two rules a plain constraint cannot express: a custom exercise may not
--    reuse a preset's name, and each user may have at most 50 of their own.
create or replace function public.enforce_exercise_rules()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is not null then
    if exists (
      select 1 from public.exercises p
      where p.user_id is null and lower(p.name) = lower(new.name)
    ) then
      raise exception 'EXERCISE_DUPLICATE_PRESET' using errcode = 'P0001';
    end if;
    if tg_op = 'INSERT' and (
      select count(*) from public.exercises c where c.user_id = new.user_id
    ) >= 50 then
      raise exception 'EXERCISE_LIMIT' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists exercises_rules on public.exercises;
create trigger exercises_rules
  before insert or update of name on public.exercises
  for each row execute function public.enforce_exercise_rules();

-- 5. Who can see and change what. (The old "anyone can read everything"
--    policy is replaced.)
drop policy if exists "Anyone can read exercises" on public.exercises;
drop policy if exists "Anyone can read preset exercises" on public.exercises;
drop policy if exists "Users read their own exercises" on public.exercises;
drop policy if exists "Users add their own exercises" on public.exercises;
drop policy if exists "Users rename their own exercises" on public.exercises;

-- Everyone, even signed-out visitors (the daily keep-alive relies on this),
-- can read the presets.
create policy "Anyone can read preset exercises"
  on public.exercises for select
  to anon, authenticated
  using (user_id is null);

-- A signed-in user can also read their own.
create policy "Users read their own exercises"
  on public.exercises for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- A signed-in user can add exercises, but only as themselves.
create policy "Users add their own exercises"
  on public.exercises for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- A signed-in user can rename their own. There is deliberately no delete
-- policy: exercises cannot be deleted from the app.
create policy "Users rename their own exercises"
  on public.exercises for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Renaming may change the name and nothing else (so nobody can hand an
-- exercise to someone else, or turn it into a preset).
revoke update on public.exercises from anon, authenticated;
grant update (name) on public.exercises to authenticated;

-- 6. A set may only use an exercise its owner can see (a preset or one of
--    their own). Without this, someone who somehow knew another user's
--    private exercise id could attach a set to it.
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
    and exists (
      select 1 from public.exercises e where e.id = exercise_id
    )
  );

-- Tell the API layer to pick up the changes straight away.
notify pgrst, 'reload schema';
