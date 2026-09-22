-- ==============================================================================
-- GYM PROGRESS - Supabase Schema & Initial Data
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

create policy "Users can view their own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Users can update their own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

create policy "Users can insert their own profile" 
  on public.profiles for insert 
  with check (auth.uid() = id);

-- Auto create profile on auth.users sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. EXERCISES TABLE
-- Seed/system exercises have user_id = null
-- User custom exercises have user_id = auth.uid()
create table if not exists public.exercises (
  id text primary key,
  user_id uuid references auth.users on delete cascade null,
  name text not null,
  category text not null check (category in ('push', 'pull', 'legs', 'core')),
  muscle text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.exercises enable row level security;

create policy "Anyone authenticated can view system and their own exercises" 
  on public.exercises for select 
  using (user_id is null or auth.uid() = user_id);

create policy "Users can insert their own custom exercises" 
  on public.exercises for insert 
  with check (auth.uid() = user_id);

create policy "Users can update their own custom exercises" 
  on public.exercises for update 
  using (auth.uid() = user_id);

create policy "Users can delete their own custom exercises" 
  on public.exercises for delete 
  using (auth.uid() = user_id);

-- Personal user notes/cues for any exercise (both system and custom)
create table if not exists public.user_exercise_notes (
  user_id uuid references auth.users on delete cascade not null,
  exercise_id text references public.exercises on delete cascade not null,
  notes text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, exercise_id)
);

alter table public.user_exercise_notes enable row level security;

create policy "Users can CRUD their own exercise notes"
  on public.user_exercise_notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);



-- 3. ROUTINES (Plany treningowe)
create table if not exists public.routines (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.routines enable row level security;

create policy "Users can CRUD their own routines" 
  on public.routines for all 
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- 4. ROUTINE EXERCISES
create table if not exists public.routine_exercises (
  id uuid primary key default uuid_generate_v4(),
  routine_id uuid references public.routines on delete cascade not null,
  exercise_id text references public.exercises on delete cascade not null,
  target_sets integer not null default 3,
  target_reps integer not null default 8,
  sort_order integer not null default 0
);

alter table public.routine_exercises enable row level security;

create policy "Users can CRUD routine exercises if routine belongs to user" 
  on public.routine_exercises for all 
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


-- 5. WORKOUTS (Zapisane i aktualizowane sesje treningowe)
create table if not exists public.workouts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  routine_id uuid references public.routines on delete set null,
  routine_name text not null,
  date date not null default current_date,
  duration integer not null default 0, -- minutes
  status text not null default 'completed' check (status in ('completed', 'in_progress', 'planned')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.workouts enable row level security;

create policy "Users can CRUD their own workouts" 
  on public.workouts for all 
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- 6. WORKOUT EXERCISES
create table if not exists public.workout_exercises (
  id uuid primary key default uuid_generate_v4(),
  workout_id uuid references public.workouts on delete cascade not null,
  exercise_id text references public.exercises on delete cascade not null,
  sort_order integer not null default 0
);

alter table public.workout_exercises enable row level security;

create policy "Users can CRUD workout exercises if workout belongs to user" 
  on public.workout_exercises for all 
  using (
    exists (
      select 1 from public.workouts w 
      where w.id = workout_exercises.workout_id and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workouts w 
      where w.id = workout_exercises.workout_id and w.user_id = auth.uid()
    )
  );


-- 7. WORKOUT SETS (Serie)
create table if not exists public.workout_sets (
  id uuid primary key default uuid_generate_v4(),
  workout_exercise_id uuid references public.workout_exercises on delete cascade not null,
  set_number integer not null default 1,
  weight numeric not null default 0,
  reps integer not null default 0,
  rpe numeric null,
  done boolean not null default true
);

alter table public.workout_sets enable row level security;

create policy "Users can CRUD workout sets if workout belongs to user" 
  on public.workout_sets for all 
  using (
    exists (
      select 1 from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_sets.workout_exercise_id and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_sets.workout_exercise_id and w.user_id = auth.uid()
    )
  );


-- 8. SEED SYSTEM EXERCISES
insert into public.exercises (id, user_id, name, category, muscle)
values
  ('bench', null, 'Bench Press', 'push', 'Chest'),
  ('incline-bench', null, 'Incline Bench Press', 'push', 'Chest'),
  ('ohp', null, 'Overhead Press', 'push', 'Shoulders'),
  ('dip', null, 'Weighted Dip', 'push', 'Chest / Triceps'),
  ('tricep-pd', null, 'Tricep Pushdown', 'push', 'Triceps'),
  ('squat', null, 'Back Squat', 'legs', 'Quads / Glutes'),
  ('rdl', null, 'Romanian Deadlift', 'legs', 'Hamstrings'),
  ('leg-press', null, 'Leg Press', 'legs', 'Quads'),
  ('deadlift', null, 'Deadlift', 'pull', 'Full Back'),
  ('row', null, 'Barbell Row', 'pull', 'Upper Back'),
  ('cable-row', null, 'Cable Row', 'pull', 'Mid Back'),
  ('pullup', null, 'Pull-up', 'pull', 'Lats'),
  ('lat-pd', null, 'Lat Pulldown', 'pull', 'Lats'),
  ('curl', null, 'Barbell Curl', 'pull', 'Biceps'),
  ('face-pull', null, 'Face Pull', 'pull', 'Rear Delts')
on conflict (id) do nothing;
