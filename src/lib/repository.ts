import { getSupabaseClient, isSupabaseConfigured } from './supabase/client';
import { Exercise, Routine, Workout, AppUser, WorkoutExercise, SetLog } from './types';
import { EXERCISES as SEED_EXERCISES, SEED_ROUTINES, SEED_WORKOUTS } from './seedData';

const LOCAL_STORAGE_KEYS = {
  USER: 'gp_user',
  EXERCISES: 'gp_exercises',
  ROUTINES: 'gp_routines',
  WORKOUTS: 'gp_workouts',
  ACTIVE_WORKOUT: 'gp_active_workout',
  ACCOUNTS: 'gp_accounts',
};

// Generate random ID helper
export function mkId(): string {
  return Math.random().toString(36).slice(2, 9);
}

// Local storage fallback helpers
function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

export const repository = {
  isCloudConnected(): boolean {
    return isSupabaseConfigured();
  },

  // ──────────────── AUTH ────────────────
  async getInitialUser(): Promise<AppUser | null> {
    const client = getSupabaseClient();
    if (client) {
      const { data } = await client.auth.getUser();
      if (data.user) {
        return { id: data.user.id, email: data.user.email || '' };
      }
      return null;
    }
    return getLocal<AppUser | null>(LOCAL_STORAGE_KEYS.USER, null);
  },

  async signIn(email: string, pass: string): Promise<{ user: AppUser | null; error: string | null }> {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.auth.signInWithPassword({ email, password: pass });
      if (error) return { user: null, error: error.message };
      if (!data.user) return { user: null, error: 'User not found' };
      return { user: { id: data.user.id, email: data.user.email || '' }, error: null };
    }

    // Local / Demo auth
    const accounts = getLocal<{ email: string; password: string }[]>(LOCAL_STORAGE_KEYS.ACCOUNTS, [
      { email: 'demo@gymapp.io', password: 'demo1234' },
    ]);
    const acc = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase() && a.password === pass);
    if (!acc && email !== 'demo@gymapp.io') {
      return { user: null, error: 'Nieprawidłowy e-mail lub hasło.' };
    }
    const user: AppUser = { id: 'demo-user-id', email };
    setLocal(LOCAL_STORAGE_KEYS.USER, user);
    return { user, error: null };
  },

  async signUp(email: string, pass: string): Promise<{ user: AppUser | null; error: string | null }> {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.auth.signUp({ email, password: pass });
      if (error) return { user: null, error: error.message };
      if (!data.user) return { user: null, error: 'Sign up failed' };
      return { user: { id: data.user.id, email: data.user.email || '' }, error: null };
    }

    // Local fallback
    const accounts = getLocal<{ email: string; password: string }[]>(LOCAL_STORAGE_KEYS.ACCOUNTS, [
      { email: 'demo@gymapp.io', password: 'demo1234' },
    ]);
    if (accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
      return { user: null, error: 'Konto z tym adresem już istnieje.' };
    }
    accounts.push({ email, password: pass });
    setLocal(LOCAL_STORAGE_KEYS.ACCOUNTS, accounts);

    const user: AppUser = { id: mkId(), email };
    setLocal(LOCAL_STORAGE_KEYS.USER, user);
    return { user, error: null };
  },

  async signOut(): Promise<void> {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
    }
  },

  async resetPassword(email: string): Promise<{ success: boolean; error: string | null }> {
    const client = getSupabaseClient();
    if (client) {
      const { error } = await client.auth.resetPasswordForEmail(email);
      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    }
    return { success: true, error: null };
  },

  async deleteAccount(): Promise<void> {
    const client = getSupabaseClient();
    if (client) {
      // In Supabase client, user cannot delete own auth account directly without RPC or service role,
      // but can wipe profile data and sign out.
      const { data } = await client.auth.getUser();
      if (data.user) {
        await client.from('workouts').delete().eq('user_id', data.user.id);
        await client.from('routines').delete().eq('user_id', data.user.id);
        await client.from('exercises').delete().eq('user_id', data.user.id);
      }
      await client.auth.signOut();
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.WORKOUTS);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.ROUTINES);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.ACTIVE_WORKOUT);
    }
  },

  // ──────────────── EXERCISES ────────────────
  async getExercises(userId?: string): Promise<Exercise[]> {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.from('exercises').select('*').order('name');
      let notesMap: Record<string, string> = {};

      if (userId) {
        const { data: notesData } = await client
          .from('user_exercise_notes')
          .select('exercise_id, notes')
          .eq('user_id', userId);
        if (notesData) {
          notesData.forEach((n: any) => {
            notesMap[n.exercise_id] = n.notes || '';
          });
        }
      }

      if (!error && data && data.length > 0) {
        return data.map((e: any) => ({
          id: e.id,
          name: e.name,
          category: e.category,
          muscle: e.muscle,
          description: e.description || '',
          notes: notesMap[e.id] || '',
          isCustom: !!e.user_id,
        }));
      }
    }

    // Local fallback: Predefined immutable exercises + user-specific custom exercises + user notes
    const userCustomKey = userId ? `gp_custom_exercises_${userId}` : 'gp_custom_exercises_demo';
    const customExercises = getLocal<Exercise[]>(userCustomKey, []);
    const notesKey = userId ? `gp_exercise_notes_${userId}` : 'gp_exercise_notes_demo';
    const localNotes = getLocal<Record<string, string>>(notesKey, {});

    const all = [...SEED_EXERCISES.map((e) => ({ ...e, isCustom: false })), ...customExercises];
    return all.map((e) => ({
      ...e,
      notes: localNotes[e.id] || e.notes || '',
    }));
  },

  async saveExercise(exercise: Exercise, userId?: string): Promise<Exercise> {
    const client = getSupabaseClient();
    if (client && userId) {
      await client.from('exercises').upsert({
        id: exercise.id,
        name: exercise.name,
        category: exercise.category,
        muscle: exercise.muscle,
        description: exercise.description || null,
        user_id: userId,
      });

      if (exercise.notes !== undefined) {
        await this.saveExerciseNote(exercise.id, exercise.notes, userId);
      }
      return exercise;
    }

    // Local fallback
    const userCustomKey = userId ? `gp_custom_exercises_${userId}` : 'gp_custom_exercises_demo';
    const current = getLocal<Exercise[]>(userCustomKey, []);
    const updated = [...current.filter((e) => e.id !== exercise.id), { ...exercise, isCustom: true }];
    setLocal(userCustomKey, updated);

    if (exercise.notes !== undefined) {
      await this.saveExerciseNote(exercise.id, exercise.notes, userId);
    }
    return exercise;
  },

  async saveExerciseNote(exerciseId: string, notes: string, userId?: string): Promise<void> {
    const client = getSupabaseClient();
    if (client && userId) {
      await client.from('user_exercise_notes').upsert({
        user_id: userId,
        exercise_id: exerciseId,
        notes,
        updated_at: new Date().toISOString(),
      });
      return;
    }

    // Local fallback
    const notesKey = userId ? `gp_exercise_notes_${userId}` : 'gp_exercise_notes_demo';
    const current = getLocal<Record<string, string>>(notesKey, {});
    current[exerciseId] = notes;
    setLocal(notesKey, current);
  },

  async deleteExercise(exerciseId: string, userId?: string): Promise<void> {
    const client = getSupabaseClient();
    if (client && userId) {
      // Supabase RLS enforces that users can only delete where user_id = auth.uid()
      await client.from('exercises').delete().eq('id', exerciseId).eq('user_id', userId);
      return;
    }

    // Local fallback
    const userCustomKey = userId ? `gp_custom_exercises_${userId}` : 'gp_custom_exercises_demo';
    const current = getLocal<Exercise[]>(userCustomKey, []);
    setLocal(
      userCustomKey,
      current.filter((e) => e.id !== exerciseId)
    );
  },

  // ──────────────── ROUTINES (PLANOWANIE) ────────────────
  async getRoutines(userId?: string): Promise<Routine[]> {
    const client = getSupabaseClient();
    if (client && userId) {
      const { data, error } = await client
        .from('routines')
        .select(`
          id,
          name,
          routine_exercises (
            exercise_id,
            target_sets,
            target_reps,
            sort_order
          )
        `)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((r: any) => ({
          id: r.id,
          name: r.name,
          exercises: (r.routine_exercises || [])
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((re: any) => ({
              exerciseId: re.exercise_id,
              targetSets: re.target_sets,
              targetReps: re.target_reps,
            })),
        }));
      }

      // If user has no routines in Supabase yet, seed default routines for this user so they can customize them
      if (!error && data && data.length === 0) {
        for (const sr of SEED_ROUTINES) {
          const { data: newR } = await client
            .from('routines')
            .insert({ name: sr.name, user_id: userId })
            .select()
            .single();
          if (newR) {
            await client.from('routine_exercises').insert(
              sr.exercises.map((re, idx) => ({
                routine_id: newR.id,
                exercise_id: re.exerciseId,
                target_sets: re.targetSets,
                target_reps: re.targetReps,
                sort_order: idx,
              }))
            );
          }
        }
        // Refetch after seeding
        return this.getRoutines(userId);
      }
    }

    // Local fallback: routines specific to user
    const routinesKey = userId ? `gp_routines_${userId}` : LOCAL_STORAGE_KEYS.ROUTINES;
    return getLocal<Routine[]>(routinesKey, SEED_ROUTINES);
  },

  async saveRoutine(routine: Routine, userId?: string): Promise<Routine> {
    const client = getSupabaseClient();
    if (client && userId) {
      // 1. Upsert routine
      const { data: routineData, error: routineErr } = await client
        .from('routines')
        .upsert({
          id: routine.id,
          name: routine.name,
          user_id: userId,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!routineErr && routineData) {
        // 2. Delete existing routine_exercises and re-insert
        await client.from('routine_exercises').delete().eq('routine_id', routine.id);
        if (routine.exercises.length > 0) {
          await client.from('routine_exercises').insert(
            routine.exercises.map((re, index) => ({
              routine_id: routine.id,
              exercise_id: re.exerciseId,
              target_sets: re.targetSets,
              target_reps: re.targetReps,
              sort_order: index,
            }))
          );
        }
      }
      return routine;
    }

    const routinesKey = userId ? `gp_routines_${userId}` : LOCAL_STORAGE_KEYS.ROUTINES;
    const current = getLocal<Routine[]>(routinesKey, SEED_ROUTINES);
    const existingIndex = current.findIndex((r) => r.id === routine.id);
    let updated: Routine[];
    if (existingIndex >= 0) {
      updated = current.map((r) => (r.id === routine.id ? routine : r));
    } else {
      updated = [...current, routine];
    }
    setLocal(routinesKey, updated);
    return routine;
  },

  async deleteRoutine(routineId: string, userId?: string): Promise<void> {
    const client = getSupabaseClient();
    if (client && userId) {
      await client.from('routines').delete().eq('id', routineId).eq('user_id', userId);
      return;
    }
    const routinesKey = userId ? `gp_routines_${userId}` : LOCAL_STORAGE_KEYS.ROUTINES;
    const current = getLocal<Routine[]>(routinesKey, SEED_ROUTINES);
    setLocal(
      routinesKey,
      current.filter((r) => r.id !== routineId)
    );
  },

  // ──────────────── WORKOUTS (ZAPIS & UAKTUALNIENIE) ────────────────
  async getWorkouts(userId?: string): Promise<Workout[]> {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client
        .from('workouts')
        .select(`
          id,
          routine_id,
          routine_name,
          date,
          duration,
          notes,
          status,
          workout_exercises (
            id,
            exercise_id,
            sort_order,
            workout_sets (
              id,
              set_number,
              weight,
              reps,
              rpe,
              done
            )
          )
        `)
        .order('date', { ascending: false });

      if (!error && data) {
        return data.map((w: any) => ({
          id: w.id,
          routineId: w.routine_id,
          routineName: w.routine_name,
          date: w.date,
          duration: w.duration || 0,
          notes: w.notes,
          status: w.status || 'completed',
          exercises: (w.workout_exercises || [])
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((we: any) => ({
              exerciseId: we.exercise_id,
              sets: (we.workout_sets || [])
                .sort((a: any, b: any) => a.set_number - b.set_number)
                .map((s: any) => ({
                  id: s.id,
                  weight: Number(s.weight),
                  reps: Number(s.reps),
                  rpe: s.rpe ? Number(s.rpe) : null,
                  done: s.done ?? true,
                })),
            })),
        }));
      }
    }

    // Workouts for every user start 100% clean and empty by default
    const workoutKey = userId ? `gp_workouts_${userId}` : LOCAL_STORAGE_KEYS.WORKOUTS;
    return getLocal<Workout[]>(workoutKey, []);
  },

  async saveWorkout(workout: Workout, userId?: string): Promise<Workout> {
    const client = getSupabaseClient();
    if (client && userId) {
      // 1. Insert or update workout
      const { data: wData, error: wErr } = await client
        .from('workouts')
        .upsert({
          id: workout.id,
          user_id: userId,
          routine_id: workout.routineId || null,
          routine_name: workout.routineName,
          date: workout.date,
          duration: workout.duration,
          notes: workout.notes || null,
          status: workout.status || 'completed',
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!wErr && wData) {
        // 2. Clear previous workout_exercises and sets
        await client.from('workout_exercises').delete().eq('workout_id', workout.id);

        for (let i = 0; i < workout.exercises.length; i++) {
          const we = workout.exercises[i];
          const { data: weData, error: weErr } = await client
            .from('workout_exercises')
            .insert({
              workout_id: workout.id,
              exercise_id: we.exerciseId,
              sort_order: i,
            })
            .select()
            .single();

          if (!weErr && weData && we.sets.length > 0) {
            await client.from('workout_sets').insert(
              we.sets.map((s, si) => ({
                workout_exercise_id: weData.id,
                set_number: si + 1,
                weight: s.weight,
                reps: s.reps,
                rpe: s.rpe,
                done: s.done,
              }))
            );
          }
        }
      }
      return workout;
    }

    const workoutKey = userId ? `gp_workouts_${userId}` : LOCAL_STORAGE_KEYS.WORKOUTS;
    const current = getLocal<Workout[]>(workoutKey, []);
    const existingIndex = current.findIndex((w) => w.id === workout.id);
    let updated: Workout[];
    if (existingIndex >= 0) {
      updated = current.map((w) => (w.id === workout.id ? workout : w));
    } else {
      updated = [workout, ...current];
    }
    setLocal(workoutKey, updated);
    return workout;
  },

  async deleteWorkout(workoutId: string, userId?: string): Promise<void> {
    const client = getSupabaseClient();
    if (client && userId) {
      await client.from('workouts').delete().eq('id', workoutId).eq('user_id', userId);
      return;
    }
    const workoutKey = userId ? `gp_workouts_${userId}` : LOCAL_STORAGE_KEYS.WORKOUTS;
    const current = getLocal<Workout[]>(workoutKey, []);
    setLocal(
      workoutKey,
      current.filter((w) => w.id !== workoutId)
    );
  },
};
