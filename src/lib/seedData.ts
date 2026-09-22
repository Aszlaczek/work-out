import { Exercise, Routine, Workout, SetLog } from "./types";

export const EXERCISES: Exercise[] = [
  { id: "bench", name: "Bench Press", category: "push", muscle: "Chest" },
  { id: "incline-bench", name: "Incline Bench Press", category: "push", muscle: "Chest" },
  { id: "ohp", name: "Overhead Press", category: "push", muscle: "Shoulders" },
  { id: "dip", name: "Weighted Dip", category: "push", muscle: "Chest / Triceps" },
  { id: "tricep-pd", name: "Tricep Pushdown", category: "push", muscle: "Triceps" },
  { id: "squat", name: "Back Squat", category: "legs", muscle: "Quads / Glutes" },
  { id: "rdl", name: "Romanian Deadlift", category: "legs", muscle: "Hamstrings" },
  { id: "leg-press", name: "Leg Press", category: "legs", muscle: "Quads" },
  { id: "deadlift", name: "Deadlift", category: "pull", muscle: "Full Back" },
  { id: "row", name: "Barbell Row", category: "pull", muscle: "Upper Back" },
  { id: "cable-row", name: "Cable Row", category: "pull", muscle: "Mid Back" },
  { id: "pullup", name: "Pull-up", category: "pull", muscle: "Lats" },
  { id: "lat-pd", name: "Lat Pulldown", category: "pull", muscle: "Lats" },
  { id: "curl", name: "Barbell Curl", category: "pull", muscle: "Biceps" },
  { id: "face-pull", name: "Face Pull", category: "pull", muscle: "Rear Delts" },
];

const mkSet = (weight: number, reps: number): SetLog => ({
  id: Math.random().toString(36).slice(2, 9),
  weight,
  reps,
  rpe: null,
  done: true,
});

export const SEED_WORKOUTS: Workout[] = [
  {
    id: "w1",
    routineId: "r1",
    routineName: "Push A",
    date: "2026-09-01",
    duration: 62,
    status: "completed",
    exercises: [
      { exerciseId: "bench", sets: [mkSet(80, 5), mkSet(80, 5), mkSet(80, 4)] },
      { exerciseId: "ohp", sets: [mkSet(52.5, 8), mkSet(52.5, 7)] },
      { exerciseId: "dip", sets: [mkSet(20, 10), mkSet(20, 9)] },
    ],
  },
  {
    id: "w2",
    routineId: "r2",
    routineName: "Pull A",
    date: "2026-09-03",
    duration: 55,
    status: "completed",
    exercises: [
      { exerciseId: "deadlift", sets: [mkSet(120, 5), mkSet(120, 5), mkSet(120, 5)] },
      { exerciseId: "row", sets: [mkSet(70, 8), mkSet(70, 8)] },
      { exerciseId: "pullup", sets: [mkSet(0, 10), mkSet(0, 9), mkSet(0, 8)] },
    ],
  },
  {
    id: "w3",
    routineId: "r3",
    routineName: "Legs A",
    date: "2026-09-05",
    duration: 70,
    status: "completed",
    exercises: [
      { exerciseId: "squat", sets: [mkSet(100, 5), mkSet(100, 5), mkSet(100, 5)] },
      { exerciseId: "rdl", sets: [mkSet(80, 10), mkSet(80, 10)] },
      { exerciseId: "leg-press", sets: [mkSet(150, 12), mkSet(150, 12)] },
    ],
  },
  {
    id: "w4",
    routineId: "r1",
    routineName: "Push A",
    date: "2026-09-07",
    duration: 60,
    status: "completed",
    exercises: [
      { exerciseId: "bench", sets: [mkSet(82.5, 5), mkSet(82.5, 5), mkSet(82.5, 5)] },
      { exerciseId: "ohp", sets: [mkSet(55, 7), mkSet(55, 6)] },
    ],
  },
  {
    id: "w5",
    routineId: "r1",
    routineName: "Push A",
    date: "2026-09-09",
    duration: 58,
    status: "completed",
    exercises: [
      { exerciseId: "bench", sets: [mkSet(85, 5), mkSet(85, 4), mkSet(82.5, 5)] },
      { exerciseId: "ohp", sets: [mkSet(55, 8), mkSet(55, 7)] },
    ],
  },
];

export const SEED_ROUTINES: Routine[] = [
  {
    id: "r1",
    name: "Push A",
    exercises: [
      { exerciseId: "bench", targetSets: 3, targetReps: 5 },
      { exerciseId: "ohp", targetSets: 3, targetReps: 8 },
      { exerciseId: "dip", targetSets: 3, targetReps: 10 },
      { exerciseId: "tricep-pd", targetSets: 3, targetReps: 12 },
    ],
  },
  {
    id: "r2",
    name: "Pull A",
    exercises: [
      { exerciseId: "deadlift", targetSets: 3, targetReps: 5 },
      { exerciseId: "row", targetSets: 3, targetReps: 8 },
      { exerciseId: "pullup", targetSets: 3, targetReps: 8 },
      { exerciseId: "curl", targetSets: 3, targetReps: 12 },
    ],
  },
  {
    id: "r3",
    name: "Legs A",
    exercises: [
      { exerciseId: "squat", targetSets: 3, targetReps: 5 },
      { exerciseId: "rdl", targetSets: 3, targetReps: 10 },
      { exerciseId: "leg-press", targetSets: 3, targetReps: 12 },
    ],
  },
];
