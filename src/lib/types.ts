export type ExerciseCategory = "push" | "pull" | "legs" | "core";

export type Exercise = {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscle: string;
  isCustom?: boolean;
};

export type SetLog = {
  id: string;
  weight: number;
  reps: number;
  rpe: number | null;
  done: boolean;
};

export type WorkoutExercise = {
  exerciseId: string;
  sets: SetLog[];
};

export type WorkoutStatus = "completed" | "planned" | "in_progress";

export type Workout = {
  id: string;
  routineId: string | null;
  routineName: string;
  date: string; // YYYY-MM-DD
  duration: number; // in minutes
  exercises: WorkoutExercise[];
  notes?: string;
  status?: WorkoutStatus;
};

export type RoutineExercise = {
  exerciseId: string;
  targetSets: number;
  targetReps: number;
};

export type Routine = {
  id: string;
  name: string;
  exercises: RoutineExercise[];
};

export type ActiveSet = {
  weight: string;
  reps: string;
  rpe: string;
  done: boolean;
};

export type ActiveExercise = {
  exerciseId: string;
  sets: ActiveSet[];
};

export type ActiveWorkout = {
  id?: string;
  routineId: string | null;
  routineName: string;
  startedAt: number;
  exercises: ActiveExercise[];
  notes?: string;
};

export type AppUser = {
  id: string;
  email: string;
};
