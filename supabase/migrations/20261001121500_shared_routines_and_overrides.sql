-- ==============================================================================
-- GYM PROGRESS - MIGRATION (existing project)
-- Shared predefined training sessions + per user hides/overrides
--
-- Run this ONCE in the Supabase SQL Editor on a project that already has the
-- old schema. Fresh projects only need supabase/schema.sql.
-- ==============================================================================

-- 1. Predefined (shared) routines are stored with user_id = null
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'routines'
      and column_name = 'user_id'
      and is_nullable = 'NO'
  ) then
    alter table public.routines alter column user_id drop not null;
  end if;
end $$;

-- 2. Per user hiding of a predefined training session
create table if not exists public.user_routine_hides (
  user_id uuid references auth.users on delete cascade not null,
  routine_id uuid references public.routines on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, routine_id)
);

alter table public.user_routine_hides enable row level security;

drop policy if exists "Users can CRUD their own routine hides" on public.user_routine_hides;
create policy "Users can CRUD their own routine hides"
  on public.user_routine_hides for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Per user edit/hide of a predefined exercise (shared row stays untouched)
create table if not exists public.user_exercise_overrides (
  user_id uuid references auth.users on delete cascade not null,
  exercise_id text references public.exercises on delete cascade not null,
  name text,
  category text check (category in ('push', 'pull', 'legs', 'core')),
  muscle text,
  description text,
  hidden boolean not null default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, exercise_id)
);

alter table public.user_exercise_overrides enable row level security;

drop policy if exists "Users can CRUD their own exercise overrides" on public.user_exercise_overrides;
create policy "Users can CRUD their own exercise overrides"
  on public.user_exercise_overrides for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. Routines: predefined plans are readable for everybody, private plans only for their owner
drop policy if exists "Users can CRUD their own routines" on public.routines;
drop policy if exists "Users can view predefined and own routines" on public.routines;
drop policy if exists "Users can insert own routines" on public.routines;
drop policy if exists "Users can update own routines" on public.routines;
drop policy if exists "Users can delete own routines" on public.routines;

create policy "Users can view predefined and own routines"
  on public.routines for select
  using (user_id is null or auth.uid() = user_id);

create policy "Users can insert own routines"
  on public.routines for insert
  with check (auth.uid() = user_id);

create policy "Users can update own routines"
  on public.routines for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own routines"
  on public.routines for delete
  using (auth.uid() = user_id);

-- 5. Routine exercises: reading a predefined plan is allowed for everybody,
--    changing the exercise list only for the owner of the routine
drop policy if exists "Users can CRUD routine exercises if routine belongs to user" on public.routine_exercises;
drop policy if exists "Users can view exercises of predefined and own routines" on public.routine_exercises;
drop policy if exists "Users can insert routine exercises of own routines" on public.routine_exercises;
drop policy if exists "Users can update routine exercises of own routines" on public.routine_exercises;
drop policy if exists "Users can delete routine exercises of own routines" on public.routine_exercises;

create policy "Users can view exercises of predefined and own routines"
  on public.routine_exercises for select
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_exercises.routine_id
        and (r.user_id is null or r.user_id = auth.uid())
    )
  );

create policy "Users can insert routine exercises of own routines"
  on public.routine_exercises for insert
  with check (
    exists (
      select 1 from public.routines r
      where r.id = routine_exercises.routine_id and r.user_id = auth.uid()
    )
  );

create policy "Users can update routine exercises of own routines"
  on public.routine_exercises for update
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_exercises.routine_id and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.routines r
      where r.id = routine_exercises.routine_id and r.user_id = auth.uid()
    )
  );

create policy "Users can delete routine exercises of own routines"
  on public.routine_exercises for delete
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_exercises.routine_id and r.user_id = auth.uid()
    )
  );

-- 6. Optional cleanup: the old app copied the predefined plans into every
--    account. Those exact, never edited copies (with no logged workouts) are
--    removed so each user sees the shared predefined plan only once.
with expected(routine_name, exercise_id, target_sets, target_reps) as (
  values
    ('Push A', 'bench', 3, 5),
    ('Push A', 'ohp', 3, 8),
    ('Push A', 'dip', 3, 10),
    ('Push A', 'tricep-pd', 3, 12),
    ('Pull A', 'deadlift', 3, 5),
    ('Pull A', 'row', 3, 8),
    ('Pull A', 'pullup', 3, 8),
    ('Pull A', 'curl', 3, 12),
    ('Legs A', 'squat', 3, 5),
    ('Legs A', 'rdl', 3, 10),
    ('Legs A', 'leg-press', 3, 12)
),
candidates as (
  select r.id, r.name
  from public.routines r
  where r.user_id is not null
    and r.name in ('Push A', 'Pull A', 'Legs A')
    and r.updated_at <= r.created_at + interval '5 seconds'
    and not exists (select 1 from public.workouts w where w.routine_id = r.id)
),
identical as (
  select c.id
  from candidates c
  where not exists (
      select 1 from public.routine_exercises re
      where re.routine_id = c.id
        and not exists (
          select 1 from expected e
          where e.routine_name = c.name
            and e.exercise_id = re.exercise_id
            and e.target_sets = re.target_sets
            and e.target_reps = re.target_reps
        )
    )
    and (select count(*) from public.routine_exercises re where re.routine_id = c.id)
      = (select count(*) from expected e where e.routine_name = c.name)
)
delete from public.routines
where id in (select id from identical);

-- 7. Predefined training sessions shared by every user
insert into public.routines (id, user_id, name) values
  ('20000000-0000-4000-8000-000000000001', null, 'Push A'),
  ('20000000-0000-4000-8000-000000000002', null, 'Pull A'),
  ('20000000-0000-4000-8000-000000000003', null, 'Legs A')
on conflict (id) do nothing;

insert into public.routine_exercises (id, routine_id, exercise_id, target_sets, target_reps, sort_order) values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'bench', 3, 5, 0),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'ohp', 3, 8, 1),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 'dip', 3, 10, 2),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', 'tricep-pd', 3, 12, 3),
  ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000002', 'deadlift', 3, 5, 0),
  ('30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000002', 'row', 3, 8, 1),
  ('30000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000002', 'pullup', 3, 8, 2),
  ('30000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000002', 'curl', 3, 12, 3),
  ('30000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000003', 'squat', 3, 5, 0),
  ('30000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000003', 'rdl', 3, 10, 1),
  ('30000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000003', 'leg-press', 3, 12, 2)
on conflict (id) do nothing;
