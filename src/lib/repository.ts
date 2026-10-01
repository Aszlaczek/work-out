import { getSupabaseClient, isSupabaseConfigured } from './supabase/client';
import { Exercise, Routine, Workout, AppUser, WorkoutExercise, SetLog, ExerciseCategory } from './types';
import { EXERCISES as SEED_EXERCISES, SEED_ROUTINES, SEED_WORKOUTS } from './seedData';

const LOCAL_STORAGE_KEYS = {
  USER: 'gp_user',
  EXERCISES: 'gp_exercises',
  ROUTINES: 'gp_routines',
  WORKOUTS: 'gp_workouts',
  ACTIVE_WORKOUT: 'gp_active_workout',
  ACCOUNTS: 'gp_accounts',
};

// Generate random ID helper. Ids are stored in uuid columns on Supabase
// (routines, workouts), so every generated id has to be a valid UUID.
export function mkId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const hex = '0123456789abcdef';
  const bytes: number[] = [];
  for (let i = 0; i < 16; i++) bytes.push(Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const h = bytes.map((b) => hex[(b >> 4) & 0xf] + hex[b & 0xf]);
  return [
    h.slice(0, 4).join(''),
    h.slice(4, 6).join(''),
    h.slice(6, 8).join(''),
    h.slice(8, 10).join(''),
    h.slice(10, 16).join(''),
  ].join('-');
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// An id generated in the old local mode (7 chars) can never be a primary key
// on Supabase - such a row does not exist yet and must get a server-side id.
function isUuid(value?: string | null): boolean {
  return !!value && UUID_RE.test(value);
}

export type AuthResult = {
  user: AppUser | null;
  error: string | null;
  // true = account exists but the e-mail address was not confirmed yet
  needsConfirmation?: boolean;
};

type LocalAccount = { email: string; password: string; confirmed?: boolean };

const DEMO_ACCOUNT: LocalAccount = {
  email: 'demo@gymapp.io',
  password: 'demo1234',
  confirmed: true,
};

function getEmailRedirectTo(): string | undefined {
  return typeof window !== 'undefined' ? window.location.origin : undefined;
}

function getLocalAccounts(): LocalAccount[] {
  const stored = getLocal<LocalAccount[]>(LOCAL_STORAGE_KEYS.ACCOUNTS, []);
  return stored.length > 0 ? stored : [DEMO_ACCOUNT];
}

// Per user modification of a predefined exercise (null/undefined field = keep original value)
type ExerciseOverride = {
  name?: string | null;
  category?: ExerciseCategory | null;
  muscle?: string | null;
  description?: string | null;
  hidden?: boolean;
};

const localKey = (base: string, userId?: string) => (userId ? `${base}_${userId}` : `${base}_demo`);
const exerciseOverridesKey = (userId?: string) => localKey('gp_exercise_overrides', userId);
const hiddenRoutinesKey = (userId?: string) => localKey('gp_hidden_routines', userId);

// A write that failed must never look successful - the row would simply come
// back after the next reload. Every Supabase error is therefore surfaced.
function assertNoError(action: string, error: { message?: string } | null | undefined): void {
  if (!error) return;
  const message = error.message || String(error);
  console.error(`[repository] ${action} failed:`, message);
  throw new Error(message);
}

function mapSupabaseRoutine(r: any): Routine {
  return {
    id: r.id,
    name: r.name,
    isPredefined: !r.user_id,
    exercises: (r.routine_exercises || [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((re: any) => ({
        exerciseId: re.exercise_id,
        targetSets: re.target_sets,
        targetReps: re.target_reps,
      })),
  };
}

function isSameRoutineContent(a: Routine, b: Routine): boolean {
  if (a.name !== b.name || a.exercises.length !== b.exercises.length) return false;
  return a.exercises.every((re, i) => {
    const other = b.exercises[i];
    return (
      other &&
      re.exerciseId === other.exerciseId &&
      re.targetSets === other.targetSets &&
      re.targetReps === other.targetReps
    );
  });
}

// Older local/demo versions copied the predefined plans into every account.
// Untouched copies are dropped (the shared predefined plan is back), edited ones
// are kept as private plans with a new id so they never collide with the seeds.
function migrateLegacyLocalRoutines(userId?: string): Routine[] {
  const key = userId ? `gp_routines_${userId}` : LOCAL_STORAGE_KEYS.ROUTINES;
  const stored = getLocal<Routine[]>(key, []);
  const seedIds = new Set(SEED_ROUTINES.map((s) => s.id));

  if (!stored.some((r) => seedIds.has(r.id))) return stored;

  const migrated = stored
    .filter((r) => {
      const seed = SEED_ROUTINES.find((s) => s.id === r.id);
      return seed ? !isSameRoutineContent(r, seed) : true;
    })
    .map((r) => (seedIds.has(r.id) ? { ...r, id: 'mine-' + r.id } : r));

  setLocal(key, migrated);
  return migrated;
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
        // Never let an unconfirmed account into the application
        if (!data.user.email_confirmed_at) {
          await client.auth.signOut();
          return null;
        }
        return { id: data.user.id, email: data.user.email || '' };
      }
      return null;
    }
    return getLocal<AppUser | null>(LOCAL_STORAGE_KEYS.USER, null);
  },

  async signIn(email: string, pass: string): Promise<AuthResult> {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.auth.signInWithPassword({ email, password: pass });
      if (error) {
        if (/not confirmed|confirmation/i.test(error.message || '')) {
          return { user: null, error: null, needsConfirmation: true };
        }
        return { user: null, error: error.message };
      }
      if (!data.user) return { user: null, error: 'User not found' };
      if (!data.user.email_confirmed_at) {
        await client.auth.signOut();
        return { user: null, error: null, needsConfirmation: true };
      }
      return { user: { id: data.user.id, email: data.user.email || '' }, error: null };
    }

    // Local / Demo auth
    const accounts = getLocalAccounts();
    const emailLc = email.trim().toLowerCase();
    const acc = accounts.find((a) => a.email.toLowerCase() === emailLc);
    const isDemoFallback = emailLc === DEMO_ACCOUNT.email && pass === DEMO_ACCOUNT.password;

    if (!acc) {
      if (!isDemoFallback) return { user: null, error: 'Nieprawidłowy e-mail lub hasło.' };
    } else {
      if (acc.password !== pass) return { user: null, error: 'Nieprawidłowy e-mail lub hasło.' };
      if (acc.confirmed === false) {
        return { user: null, error: null, needsConfirmation: true };
      }
    }

    const user: AppUser = { id: 'demo-user-id', email };
    setLocal(LOCAL_STORAGE_KEYS.USER, user);
    return { user, error: null };
  },

  async signUp(email: string, pass: string): Promise<AuthResult> {
    const cleanEmail = email.trim();
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: { emailRedirectTo: getEmailRedirectTo() },
      });
      if (error) return { user: null, error: error.message };

      const signedUpUser = data.user;
      if (!signedUpUser) return { user: null, error: 'Sign up failed' };

      // Nobody gets in before the e-mail link was used (and a session exists)
      if (!data.session || !signedUpUser.email_confirmed_at) {
        if (data.session) await client.auth.signOut();
        return { user: null, error: null, needsConfirmation: true };
      }
      return { user: { id: signedUpUser.id, email: signedUpUser.email || '' }, error: null };
    }

    // Local fallback: accounts start unconfirmed, confirmation has to happen first
    const accounts = getLocalAccounts();
    if (accounts.some((a) => a.email.toLowerCase() === cleanEmail.toLowerCase())) {
      return { user: null, error: 'Konto z tym adresem już istnieje.' };
    }
    accounts.push({ email: cleanEmail, password: pass, confirmed: false });
    setLocal(LOCAL_STORAGE_KEYS.ACCOUNTS, accounts);

    return { user: null, error: null, needsConfirmation: true };
  },

  async resendConfirmation(email: string): Promise<{ success: boolean; error: string | null }> {
    const client = getSupabaseClient();
    if (client) {
      const { error } = await client.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: { emailRedirectTo: getEmailRedirectTo() },
      });
      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    }
    return { success: true, error: null };
  },

  // Local/demo counterpart of the e-mail confirmation link
  async confirmLocalAccount(email: string): Promise<boolean> {
    if (getSupabaseClient()) return false;
    const accounts = getLocalAccounts();
    const idx = accounts.findIndex((a) => a.email.toLowerCase() === email.trim().toLowerCase());
    if (idx < 0) return false;
    accounts[idx] = { ...accounts[idx], confirmed: true };
    setLocal(LOCAL_STORAGE_KEYS.ACCOUNTS, accounts);
    return true;
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
        await client.from('user_routine_hides').delete().eq('user_id', data.user.id);
        await client.from('user_exercise_overrides').delete().eq('user_id', data.user.id);
        await client.from('user_exercise_notes').delete().eq('user_id', data.user.id);
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
  // Predefined exercises (user_id = null) are visible for everybody.
  // Custom exercises belong to their creator only.
  // Editing/hiding a predefined exercise is stored as a per user override,
  // so the change is visible only for that user.
  async getExercises(userId?: string): Promise<Exercise[]> {
    const client = getSupabaseClient();
    if (client) {
      const [exRes, ovRes, notesRes] = await Promise.all([
        client.from('exercises').select('id, name, category, muscle, description, user_id').order('name'),
        client.from('user_exercise_overrides').select('exercise_id, name, category, muscle, description, hidden'),
        client.from('user_exercise_notes').select('exercise_id, notes').eq('user_id', userId ?? ''),
      ]);

      if (!exRes.error && exRes.data && exRes.data.length > 0) {
        const ovMap = new Map<string, any>();
        (ovRes.data || []).forEach((o: any) => ovMap.set(o.exercise_id, o));

        const notesMap: Record<string, string> = {};
        (notesRes.data || []).forEach((n: any) => {
          notesMap[n.exercise_id] = n.notes || '';
        });

        const merged: Exercise[] = [];
        exRes.data.forEach((e: any) => {
          const ov = ovMap.get(e.id);
          if (ov?.hidden) return;
          merged.push({
            id: e.id,
            name: ov?.name || e.name,
            category: (ov?.category || e.category) as ExerciseCategory,
            muscle: ov?.muscle || e.muscle,
            description: ov?.description ?? e.description ?? '',
            notes: notesMap[e.id] || '',
            isCustom: !!e.user_id,
            isOverridden: !!(ov && (ov.name || ov.category || ov.muscle || ov.description)),
          });
        });
        return merged;
      }
    }

    // Local fallback: Predefined immutable exercises + user-specific custom exercises + user notes
    const userCustomKey = userId ? `gp_custom_exercises_${userId}` : 'gp_custom_exercises_demo';
    const customExercises = getLocal<Exercise[]>(userCustomKey, []);
    const notesKey = userId ? `gp_exercise_notes_${userId}` : 'gp_exercise_notes_demo';
    const localNotes = getLocal<Record<string, string>>(notesKey, {});
    const overrides = getLocal<Record<string, ExerciseOverride>>(exerciseOverridesKey(userId), {});

    const all = [...SEED_EXERCISES.map((e) => ({ ...e, isCustom: false })), ...customExercises];
    return all
      .filter((e) => !overrides[e.id]?.hidden)
      .map((e) => {
        const ov = overrides[e.id];
        return {
          ...e,
          name: ov?.name || e.name,
          category: (ov?.category || e.category) as ExerciseCategory,
          muscle: ov?.muscle || e.muscle,
          description: ov?.description ?? e.description ?? '',
          notes: localNotes[e.id] || e.notes || '',
          isOverridden: !!(ov && !e.isCustom && (ov.name || ov.category || ov.muscle || ov.description)),
        };
      });
  },

  // Exercises the current user hid from the predefined library (can be restored)
  async getHiddenExercises(userId?: string): Promise<Exercise[]> {
    const client = getSupabaseClient();
    if (client && userId) {
      const { data: hidden } = await client
        .from('user_exercise_overrides')
        .select('exercise_id')
        .eq('hidden', true);
      const ids = (hidden || []).map((h: any) => h.exercise_id);
      if (ids.length === 0) return [];

      const { data } = await client
        .from('exercises')
        .select('id, name, category, muscle, description, user_id')
        .in('id', ids)
        .order('name');
      return (data || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        category: e.category as ExerciseCategory,
        muscle: e.muscle,
        description: e.description || '',
        isCustom: !!e.user_id,
      }));
    }

    const overrides = getLocal<Record<string, ExerciseOverride>>(exerciseOverridesKey(userId), {});
    const hiddenIds = Object.keys(overrides).filter((id) => overrides[id].hidden);
    return SEED_EXERCISES.filter((e) => hiddenIds.includes(e.id)).map((e) => ({
      ...e,
      isCustom: false,
    }));
  },

  async saveExercise(exercise: Exercise, userId?: string): Promise<Exercise> {
    const isCustom = !!exercise.isCustom;
    const client = getSupabaseClient();
    if (client && userId) {
      if (isCustom) {
        const { error } = await client.from('exercises').upsert({
          id: exercise.id,
          name: exercise.name,
          category: exercise.category,
          muscle: exercise.muscle,
          description: exercise.description || null,
          user_id: userId,
        });
        assertNoError('save custom exercise', error);
      } else {
        // Predefined exercise -> only this user sees the change
        const { error } = await client.from('user_exercise_overrides').upsert({
          user_id: userId,
          exercise_id: exercise.id,
          name: exercise.name,
          category: exercise.category,
          muscle: exercise.muscle,
          description: exercise.description || null,
          hidden: false,
          updated_at: new Date().toISOString(),
        });
        assertNoError('save exercise override', error);
      }

      if (exercise.notes !== undefined) {
        await this.saveExerciseNote(exercise.id, exercise.notes, userId);
      }
      return { ...exercise, isOverridden: !isCustom };
    }

    if (isCustom) {
      // Local fallback
      const userCustomKey = userId ? `gp_custom_exercises_${userId}` : 'gp_custom_exercises_demo';
      const current = getLocal<Exercise[]>(userCustomKey, []);
      const updated = [...current.filter((e) => e.id !== exercise.id), { ...exercise, isCustom: true }];
      setLocal(userCustomKey, updated);
    } else {
      const overrides = getLocal<Record<string, ExerciseOverride>>(exerciseOverridesKey(userId), {});
      overrides[exercise.id] = {
        ...overrides[exercise.id],
        name: exercise.name,
        category: exercise.category,
        muscle: exercise.muscle,
        description: exercise.description || null,
        hidden: false,
      };
      setLocal(exerciseOverridesKey(userId), overrides);
    }

    if (exercise.notes !== undefined) {
      await this.saveExerciseNote(exercise.id, exercise.notes, userId);
    }
    return { ...exercise, isOverridden: !isCustom };
  },

  async saveExerciseNote(exerciseId: string, notes: string, userId?: string): Promise<void> {
    const client = getSupabaseClient();
    if (client && userId) {
      const { error } = await client.from('user_exercise_notes').upsert({
        user_id: userId,
        exercise_id: exerciseId,
        notes,
        updated_at: new Date().toISOString(),
      });
      assertNoError('save exercise note', error);
      return;
    }

    // Local fallback
    const notesKey = userId ? `gp_exercise_notes_${userId}` : 'gp_exercise_notes_demo';
    const current = getLocal<Record<string, string>>(notesKey, {});
    current[exerciseId] = notes;
    setLocal(notesKey, current);
  },

  // Custom exercise = hard delete (creator only).
  // Predefined exercise = hide it for this user only, everybody else still sees it.
  async deleteExercise(exerciseId: string, userId?: string, isCustom?: boolean): Promise<void> {
    const client = getSupabaseClient();
    if (client && userId) {
      if (isCustom) {
        // Supabase RLS enforces that users can only delete where user_id = auth.uid()
        const { data, error } = await client
          .from('exercises')
          .delete()
          .eq('id', exerciseId)
          .eq('user_id', userId)
          .select('id');
        assertNoError('delete custom exercise', error);
        if (!data || data.length === 0) {
          throw new Error('Exercise was not deleted');
        }
        return;
      }
      const { error } = await client.from('user_exercise_overrides').upsert({
        user_id: userId,
        exercise_id: exerciseId,
        hidden: true,
        updated_at: new Date().toISOString(),
      });
      assertNoError('hide exercise', error);
      return;
    }

    if (isCustom) {
      const userCustomKey = userId ? `gp_custom_exercises_${userId}` : 'gp_custom_exercises_demo';
      const current = getLocal<Exercise[]>(userCustomKey, []);
      setLocal(
        userCustomKey,
        current.filter((e) => e.id !== exerciseId)
      );
      return;
    }

    const overrides = getLocal<Record<string, ExerciseOverride>>(exerciseOverridesKey(userId), {});
    overrides[exerciseId] = { ...overrides[exerciseId], hidden: true };
    setLocal(exerciseOverridesKey(userId), overrides);
  },

  // Bring a hidden predefined exercise back to this user's library
  async restoreExercise(exerciseId: string, userId?: string): Promise<void> {
    const client = getSupabaseClient();
    if (client && userId) {
      const { error } = await client
        .from('user_exercise_overrides')
        .upsert({ user_id: userId, exercise_id: exerciseId, hidden: false, updated_at: new Date().toISOString() });
      assertNoError('restore exercise', error);
      return;
    }

    const overrides = getLocal<Record<string, ExerciseOverride>>(exerciseOverridesKey(userId), {});
    if (overrides[exerciseId]) {
      overrides[exerciseId] = { ...overrides[exerciseId], hidden: false };
      setLocal(exerciseOverridesKey(userId), overrides);
    }
  },

  // ──────────────── ROUTINES (PLANOWANIE) ────────────────
  // user_id = null  -> predefined plan visible for every user
  // user_id = user  -> private plan, visible only for its creator
  // Deleting a predefined plan only hides it for the current user
  async getRoutines(userId?: string): Promise<Routine[]> {
    const client = getSupabaseClient();
    if (client && userId) {
      const [routinesRes, hidesRes] = await Promise.all([
        client
          .from('routines')
          .select(`
            id,
            name,
            user_id,
            routine_exercises (
              exercise_id,
              target_sets,
              target_reps,
              sort_order
            )
          `)
          .order('created_at', { ascending: true }),
        client.from('user_routine_hides').select('routine_id'),
      ]);

      if (routinesRes.error) {
        console.error('[repository] reading plans failed:', routinesRes.error.message);
      }
      if (hidesRes.error) {
        console.error('[repository] reading hidden plans failed:', hidesRes.error.message);
      }

      if (!routinesRes.error && routinesRes.data) {
        const hidden = new Set((hidesRes.data || []).map((h: any) => h.routine_id));
        return routinesRes.data
          .filter((r: any) => !hidden.has(r.id))
          .map((r: any) => mapSupabaseRoutine(r));
      }
    }

    // Local fallback: shared predefined plans + private plans of this user
    const ownRoutines = migrateLegacyLocalRoutines(userId);
    const hiddenIds = getLocal<string[]>(hiddenRoutinesKey(userId), []);
    const predefined = SEED_ROUTINES.filter((r) => !hiddenIds.includes(r.id)).map((r) => ({
      ...r,
      isPredefined: true,
    }));
    return [...predefined, ...ownRoutines.map((r) => ({ ...r, isPredefined: false }))];
  },

  // Predefined plans the current user hid (can be restored at any time)
  async getHiddenRoutines(userId?: string): Promise<Routine[]> {
    const client = getSupabaseClient();
    if (client && userId) {
      const { data: hides } = await client.from('user_routine_hides').select('routine_id');
      const ids = (hides || []).map((h: any) => h.routine_id);
      if (ids.length === 0) return [];

      const { data } = await client
        .from('routines')
        .select(`
          id,
          name,
          user_id,
          routine_exercises (
            exercise_id,
            target_sets,
            target_reps,
            sort_order
          )
        `)
        .in('id', ids)
        .order('created_at', { ascending: true });
      return (data || []).map((r: any) => mapSupabaseRoutine(r));
    }

    const hiddenIds = getLocal<string[]>(hiddenRoutinesKey(userId), []);
    return SEED_ROUTINES.filter((r) => hiddenIds.includes(r.id)).map((r) => ({
      ...r,
      isPredefined: true,
    }));
  },

  async saveRoutine(routine: Routine, userId?: string): Promise<Routine> {
    const client = getSupabaseClient();

    // Editing a predefined plan creates a private copy for this user,
    // the shared plan stays untouched for everybody else
    if (routine.isPredefined) {
      if (client && userId) {
        const { data: newR, error } = await client
          .from('routines')
          .insert({ name: routine.name, user_id: userId })
          .select()
          .single();

        assertNoError('create private copy of a predefined plan', error);
        if (!newR) throw new Error('Private copy was not created');

        if (routine.exercises.length > 0) {
          const { error: exErr } = await client.from('routine_exercises').insert(
            routine.exercises.map((re, index) => ({
              routine_id: newR.id,
              exercise_id: re.exerciseId,
              target_sets: re.targetSets,
              target_reps: re.targetReps,
              sort_order: index,
            }))
          );
          assertNoError('fill private copy', exErr);
        }
        // Hide the predefined original so only the private copy shows up for this user
        const { error: hideErr } = await client
          .from('user_routine_hides')
          .upsert({ user_id: userId, routine_id: routine.id });
        if (hideErr) {
          // the copy must not survive without the hide - otherwise the plan shows up twice
          await client.from('routines').delete().eq('id', newR.id);
          assertNoError('hide predefined original', hideErr);
        }
        return { ...routine, id: newR.id, isPredefined: false };
      }

      const routinesKey = userId ? `gp_routines_${userId}` : LOCAL_STORAGE_KEYS.ROUTINES;
      const copy: Routine = { ...routine, id: 'r-' + mkId(), isPredefined: false };
      setLocal(routinesKey, [...getLocal<Routine[]>(routinesKey, []), copy]);

      const hiddenIds = getLocal<string[]>(hiddenRoutinesKey(userId), []);
      if (!hiddenIds.includes(routine.id)) {
        setLocal(hiddenRoutinesKey(userId), [...hiddenIds, routine.id]);
      }
      return copy;
    }

    if (client && userId) {
      // 1. Upsert routine - a non-uuid id cannot be a primary key, so in that
      // case a fresh row is created and Postgres assigns the uuid itself
      const isNew = !isUuid(routine.id);
      const { data: routineData, error: routineErr } = isNew
        ? await client
            .from('routines')
            .insert({ name: routine.name, user_id: userId })
            .select()
            .single()
        : await client
            .from('routines')
            .upsert({
              id: routine.id,
              name: routine.name,
              user_id: userId,
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

      assertNoError('save plan', routineErr);
      if (!routineData) throw new Error('Plan was not saved');
      const savedId: string = routineData.id;

      // 2. Delete existing routine_exercises and re-insert
      const { error: delErr } = await client.from('routine_exercises').delete().eq('routine_id', savedId);
      assertNoError('save plan exercises', delErr);
      if (routine.exercises.length > 0) {
        const { error: insErr } = await client.from('routine_exercises').insert(
          routine.exercises.map((re, index) => ({
            routine_id: savedId,
            exercise_id: re.exerciseId,
            target_sets: re.targetSets,
            target_reps: re.targetReps,
            sort_order: index,
          }))
        );
        assertNoError('save plan exercises', insErr);
      }
      return { ...routine, id: savedId, isPredefined: false };
    }

    const routinesKey = userId ? `gp_routines_${userId}` : LOCAL_STORAGE_KEYS.ROUTINES;
    const current = getLocal<Routine[]>(routinesKey, []);
    const saved: Routine = { ...routine, isPredefined: false };
    const existingIndex = current.findIndex((r) => r.id === routine.id);
    let updated: Routine[];
    if (existingIndex >= 0) {
      updated = current.map((r) => (r.id === routine.id ? saved : r));
    } else {
      updated = [...current, saved];
    }
    setLocal(routinesKey, updated);
    return saved;
  },

  // Custom plan = permanent delete.
  // Predefined plan = hide it for this user only, other users keep it.
  async deleteRoutine(routineId: string, userId?: string, isPredefined?: boolean): Promise<void> {
    const client = getSupabaseClient();
    if (client && userId) {
      if (isPredefined) {
        const { error } = await client.from('user_routine_hides').upsert({ user_id: userId, routine_id: routineId });
        assertNoError('hide predefined plan', error);
        return;
      }
      const { data, error } = await client
        .from('routines')
        .delete()
        .eq('id', routineId)
        .eq('user_id', userId)
        .select('id');
      assertNoError('delete plan', error);
      if (!data || data.length === 0) {
        throw new Error('Plan was not deleted');
      }
      return;
    }

    if (isPredefined) {
      const hiddenIds = getLocal<string[]>(hiddenRoutinesKey(userId), []);
      if (!hiddenIds.includes(routineId)) {
        setLocal(hiddenRoutinesKey(userId), [...hiddenIds, routineId]);
      }
      return;
    }

    const routinesKey = userId ? `gp_routines_${userId}` : LOCAL_STORAGE_KEYS.ROUTINES;
    const current = getLocal<Routine[]>(routinesKey, []);
    setLocal(
      routinesKey,
      current.filter((r) => r.id !== routineId)
    );
  },

  // Bring a hidden predefined plan back to this user's list
  async restoreRoutine(routineId: string, userId?: string): Promise<void> {
    const client = getSupabaseClient();
    if (client && userId) {
      const { error } = await client
        .from('user_routine_hides')
        .delete()
        .eq('user_id', userId)
        .eq('routine_id', routineId);
      assertNoError('restore predefined plan', error);
      return;
    }

    const hiddenIds = getLocal<string[]>(hiddenRoutinesKey(userId), []);
    setLocal(
      hiddenRoutinesKey(userId),
      hiddenIds.filter((id) => id !== routineId)
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
      // 1. Insert or update workout - a non-uuid id (legacy local mode) cannot
      // be a primary key, so Postgres assigns a fresh uuid instead
      const routineId = isUuid(workout.routineId) ? workout.routineId : null;
      const base = {
        user_id: userId,
        routine_id: routineId,
        routine_name: workout.routineName,
        date: workout.date,
        duration: workout.duration,
        notes: workout.notes || null,
        status: workout.status || 'completed',
        updated_at: new Date().toISOString(),
      };
      const { data: wData, error: wErr } = !isUuid(workout.id)
        ? await client.from('workouts').insert(base).select().single()
        : await client.from('workouts').upsert({ id: workout.id, ...base }).select().single();

      assertNoError('save workout', wErr);
      if (!wData) throw new Error('Workout was not saved');
      const savedId: string = wData.id;

      // 2. Clear previous workout_exercises and sets
      const { error: delErr } = await client.from('workout_exercises').delete().eq('workout_id', savedId);
      assertNoError('save workout', delErr);

      for (let i = 0; i < workout.exercises.length; i++) {
        const we = workout.exercises[i];
        const { data: weData, error: weErr } = await client
          .from('workout_exercises')
          .insert({
            workout_id: savedId,
            exercise_id: we.exerciseId,
            sort_order: i,
          })
          .select()
          .single();

        assertNoError('save workout exercise', weErr);
        if (!weData) throw new Error('Workout exercise was not saved');

        if (we.sets.length > 0) {
          const { error: setsErr } = await client.from('workout_sets').insert(
            we.sets.map((s, si) => ({
              workout_exercise_id: weData.id,
              set_number: si + 1,
              weight: s.weight,
              reps: s.reps,
              rpe: s.rpe,
              done: s.done,
            }))
          );
          assertNoError('save workout sets', setsErr);
        }
      }
      return { ...workout, id: savedId };
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
      const { data, error } = await client
        .from('workouts')
        .delete()
        .eq('id', workoutId)
        .eq('user_id', userId)
        .select('id');
      assertNoError('delete workout', error);
      if (!data || data.length === 0) {
        throw new Error('Workout was not deleted');
      }
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
