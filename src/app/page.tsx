"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Theme, getColors, Colors } from "@/lib/theme";
import { Lang, T } from "@/lib/i18n";
import {
  AppUser,
  Routine,
  Workout,
  Exercise,
  ActiveWorkout,
  ActiveExercise,
} from "@/lib/types";
import { repository, mkId } from "@/lib/repository";
import { Header, ViewType } from "@/components/layout/Header";
import { BottomNav, MobileHeader } from "@/components/layout/BottomNav";
import { AmbientBlobs } from "@/components/layout/AmbientBlobs";
import { AuthView } from "@/components/auth/AuthView";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { RoutinesView } from "@/components/routines/RoutinesView";
import { ExercisesView } from "@/components/exercises/ExercisesView";
import { CalendarView } from "@/components/calendar/CalendarView";
import { ActiveWorkoutLogger } from "@/components/workouts/ActiveWorkoutLogger";
import { ProgressView } from "@/components/progress/ProgressView";
import { SettingsView } from "@/components/settings/SettingsView";
import { WorkoutEditModal } from "@/components/workouts/WorkoutEditModal";
import { WorkoutDetailModal } from "@/components/workouts/WorkoutDetailModal";
import { ManualWorkoutModal } from "@/components/workouts/ManualWorkoutModal";
import { RoutineModal } from "@/components/routines/RoutineModal";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  // The Supabase session died while the app was open - the login screen shows why
  const [sessionExpired, setSessionExpired] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [lang, setLang] = useState<Lang>("pl");
  const [view, setView] = useState<ViewType>("dashboard");

  // Application Data State
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [hiddenRoutines, setHiddenRoutines] = useState<Routine[]>([]);
  const [hiddenExercises, setHiddenExercises] = useState<Exercise[]>([]);
  // set whenever a write to the database failed - nothing was changed then
  const [dataError, setDataError] = useState<string | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(
    null,
  );

  // Modals State
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [viewingWorkout, setViewingWorkout] = useState<Workout | null>(null);
  const [isManualLogOpen, setIsManualLogOpen] = useState(false);
  const [isPlanRoutineOpen, setIsPlanRoutineOpen] = useState(false);

  const C: Colors = getColors(theme);
  const t = T[lang];
  const isCloud = repository.isCloudConnected();

  // Load initial settings and active user
  useEffect(() => {
    // A password reset was started on this device - a new password has to be
    // set before the application lets anybody in. The recovery tokens in the
    // url are kept so /reset-password can pick them up.
    if (repository.hasPendingPasswordReset()) {
      window.location.replace("/reset-password" + window.location.search + window.location.hash);
      return;
    }
    setMounted(true);
    const savedTheme = localStorage.getItem("gp_theme") as Theme;
    if (savedTheme === "dark" || savedTheme === "light") setTheme(savedTheme);

    const savedLang = localStorage.getItem("gp_lang") as Lang;
    if (savedLang === "pl" || savedLang === "en") setLang(savedLang);

    const savedActive = localStorage.getItem("gp_active_workout");
    if (savedActive) {
      try {
        setActiveWorkout(JSON.parse(savedActive));
      } catch (e) {}
    }

    // Load initial user session
    repository.getInitialUser().then((u) => {
      if (u) setUser(u);
    });
  }, []);

  // Update HTML body style on theme change
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.style.backgroundColor = C.bg;
      document.body.style.color = C.text;
    }
  }, [C.bg, C.text]);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("gp_theme", newTheme);
  };

  const handleLangChange = (newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem("gp_lang", newLang);
  };

  // Load data for active user
  const loadUserData = useCallback(async (userId?: string) => {
    try {
      const [
        fetchedRoutines,
        fetchedWorkouts,
        fetchedExercises,
        fetchedHiddenRoutines,
        fetchedHiddenExercises,
      ] = await Promise.all([
        repository.getRoutines(userId),
        repository.getWorkouts(userId),
        repository.getExercises(userId),
        repository.getHiddenRoutines(userId),
        repository.getHiddenExercises(userId),
      ]);
      setRoutines(fetchedRoutines);
      setWorkouts(fetchedWorkouts);
      setExercises(fetchedExercises);
      setHiddenRoutines(fetchedHiddenRoutines);
      setHiddenExercises(fetchedHiddenExercises);
    } catch (e) {
      console.error("[data] loading failed:", e);
      const message = e instanceof Error ? e.message : String(e);
      if ((e as { sessionExpired?: boolean })?.sessionExpired) {
        // A stale session cannot be repaired by the user inside the app:
        // end it cleanly and let the login screen explain what happened.
        try {
          await repository.signOut();
        } catch {}
        setUser(null);
        setSessionExpired(true);
        return;
      }
      setDataError(message);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadUserData(user.id);
    }
  }, [user, loadUserData]);

  // Persist active workout to local storage
  const handleUpdateActiveWorkout = (updated: ActiveWorkout) => {
    setActiveWorkout(updated);
    localStorage.setItem("gp_active_workout", JSON.stringify(updated));
  };

  // Start live workout from routine
  const handleStartWorkout = (routine: Routine) => {
    const newActive: ActiveWorkout = {
      routineId: routine.id,
      routineName: routine.name,
      startedAt: Date.now(),
      exercises: routine.exercises.map((re) => ({
        exerciseId: re.exerciseId,
        sets: Array.from({ length: re.targetSets }, () => ({
          weight: "",
          reps: String(re.targetReps),
          rpe: "",
          done: false,
        })),
      })),
    };
    handleUpdateActiveWorkout(newActive);
    setView("workout");
  };

  // A failed write must never change the UI, otherwise the deleted item would
  // simply come back after the next reload.
  const reportError = (e: unknown) => {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[data] operation failed:", message);
    setDataError(message);
  };

  // Finish and save live workout to Supabase
  const handleFinishActiveWorkout = async () => {
    if (!activeWorkout) return;
    const duration = Math.max(
      1,
      Math.floor((Date.now() - activeWorkout.startedAt) / 60000),
    );
    const newWorkout: Workout = {
      id: mkId(),
      routineId: activeWorkout.routineId,
      routineName: activeWorkout.routineName,
      date: new Date().toISOString().slice(0, 10),
      duration,
      status: "completed",
      exercises: activeWorkout.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        sets: e.sets
          .filter((s) => s.done)
          .map((s) => ({
            id: mkId(),
            weight: Number(s.weight) || 0,
            reps: Number(s.reps) || 0,
            rpe: s.rpe ? Number(s.rpe) : null,
            done: true,
          })),
      })),
    };

    try {
      const saved = await repository.saveWorkout(newWorkout, user?.id);
      setWorkouts((prev) => [saved, ...prev]);
      setActiveWorkout(null);
      localStorage.removeItem("gp_active_workout");
      setDataError(null);
      setView("dashboard");
    } catch (e) {
      // the active workout stays so the training can be saved again
      reportError(e);
    }
  };

  const handleDiscardActiveWorkout = () => {
    setActiveWorkout(null);
    localStorage.removeItem("gp_active_workout");
    setView("dashboard");
  };

  // Save updated workout ("Uaktualnienie swojego treningu")
  const handleSaveUpdatedWorkout = async (updated: Workout) => {
    try {
      const saved = await repository.saveWorkout(updated, user?.id);
      setWorkouts((prev) => prev.map((w) => (w.id === updated.id ? saved : w)));
      setDataError(null);
    } catch (e) {
      reportError(e);
    }
  };

  // Delete workout
  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      await repository.deleteWorkout(workoutId, user?.id);
      setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
      setDataError(null);
    } catch (e) {
      reportError(e);
    }
  };

  // Save or update routine ("Planowanie").
  // Saving a predefined routine returns a new private copy of it.
  const handleSaveRoutine = async (routine: Routine): Promise<Routine> => {
    try {
      const saved = await repository.saveRoutine(routine, user?.id);
      setRoutines((prev) => {
        const originalIndex = prev.findIndex((r) => r.id === routine.id);
        const next = prev.filter((r) => r.id !== routine.id && r.id !== saved.id);
        const insertAt =
          originalIndex >= 0 ? Math.min(originalIndex, next.length) : next.length;
        next.splice(insertAt, 0, saved);
        return next;
      });

      // Editing a predefined plan hides the shared original for this user only
      if (routine.isPredefined && saved.id !== routine.id) {
        setHiddenRoutines((prev) =>
          prev.some((r) => r.id === routine.id)
            ? prev
            : [...prev, { ...routine, isPredefined: true }],
        );
      }
      setDataError(null);
      return saved;
    } catch (e) {
      reportError(e);
      // the modal must not close with a routine that was never saved
      throw e;
    }
  };

  // Delete routine: predefined plans are only hidden for this user
  const handleDeleteRoutine = async (routineId: string) => {
    try {
      const routine = routines.find((r) => r.id === routineId);
      const isPredefined = !!routine?.isPredefined;
      await repository.deleteRoutine(routineId, user?.id, isPredefined);
      setRoutines((prev) => prev.filter((r) => r.id !== routineId));
      if (isPredefined && routine) {
        setHiddenRoutines((prev) =>
          prev.some((r) => r.id === routineId)
            ? prev
            : [...prev, { ...routine, isPredefined: true }],
        );
      }
      setDataError(null);
    } catch (e) {
      reportError(e);
    }
  };

  const handleRestoreRoutine = async (routineId: string) => {
    try {
      await repository.restoreRoutine(routineId, user?.id);
      setHiddenRoutines((prev) => prev.filter((r) => r.id !== routineId));
      const restored = hiddenRoutines.find((r) => r.id === routineId);
      if (restored) {
        setRoutines((prev) => {
          const insertAt = prev.findIndex((r) => !r.isPredefined);
          const next = [...prev];
          next.splice(insertAt >= 0 ? insertAt : next.length, 0, {
            ...restored,
            isPredefined: true,
          });
          return next;
        });
      }
      setDataError(null);
    } catch (e) {
      reportError(e);
    }
  };

  // Custom exercise actions
  const handleAddExercise = async (ex: Exercise) => {
    try {
      const saved = await repository.saveExercise(ex, user?.id);
      setExercises((prev) => [...prev, saved]);
      setDataError(null);
    } catch (e) {
      reportError(e);
    }
  };

  const handleUpdateExercise = async (updated: Exercise) => {
    try {
      const saved = await repository.saveExercise(updated, user?.id);
      setExercises((prev) =>
        prev.map((e) => (e.id === saved.id ? saved : e)),
      );
      setDataError(null);
    } catch (e) {
      reportError(e);
    }
  };

  const handleSaveExerciseNote = async (exerciseId: string, notes: string) => {
    try {
      await repository.saveExerciseNote(exerciseId, notes, user?.id);
      setExercises((prev) =>
        prev.map((e) => (e.id === exerciseId ? { ...e, notes } : e)),
      );
      setDataError(null);
    } catch (e) {
      reportError(e);
    }
  };

  // Custom exercises are removed permanently, predefined ones are only hidden
  // for the current user (other users keep seeing them)
  const handleDeleteExercise = async (exId: string) => {
    try {
      const exercise = exercises.find((e) => e.id === exId);
      const isCustom = !!exercise?.isCustom;
      await repository.deleteExercise(exId, user?.id, isCustom);
      setExercises((prev) => prev.filter((e) => e.id !== exId));
      if (!isCustom && exercise) {
        setHiddenExercises((prev) =>
          prev.some((e) => e.id === exId) ? prev : [...prev, exercise],
        );
      }
      setDataError(null);
    } catch (e) {
      reportError(e);
    }
  };

  const handleRestoreExercise = async (exId: string) => {
    try {
      await repository.restoreExercise(exId, user?.id);
      setHiddenExercises((prev) => prev.filter((e) => e.id !== exId));
      const restored = hiddenExercises.find((e) => e.id === exId);
      if (restored) {
        const refreshed = await repository.getExercises(user?.id);
        setExercises(refreshed);
      }
      setDataError(null);
    } catch (e) {
      reportError(e);
    }
  };

  // Auth actions
  const handleLoginSuccess = (loggedInUser: AppUser) => {
    setSessionExpired(false);
    setUser(loggedInUser);
    loadUserData(loggedInUser.id);
  };

  const handleLogout = async () => {
    await repository.signOut();
    setUser(null);
    setActiveWorkout(null);
    setView("dashboard");
  };

  const handleDeleteAccount = async () => {
    await repository.deleteAccount();
    setUser(null);
    setActiveWorkout(null);
    setView("dashboard");
  };

  const handleResetLocalData = () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
      window.location.reload();
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-[#07071a]" />;
  }

  // Not logged in -> Show Auth Screen
  if (!user) {
    return (
      <AuthView
        onLoginSuccess={handleLoginSuccess}
        notice={sessionExpired ? t.sessionExpiredNotice : null}
        C={C}
        theme={theme}
        setTheme={handleThemeChange}
        lang={lang}
        setLang={handleLangChange}
      />
    );
  }

  return (
    <div
      className="flex flex-col min-h-[100dvh] relative overflow-hidden"
      style={{ background: C.bg, color: C.text }}
    >
      <AmbientBlobs C={C} />

      {/* Failed write: nothing changed, the item stays where it was */}
      {dataError && (
        <div
          className="fixed top-3 left-1/2 -translate-x-1/2 z-[80] p-3 flex items-start gap-3 w-[min(94vw,540px)]"
          style={{
            background: C.card,
            border: `1px solid ${C.danger}`,
            borderRadius: 10,
            boxShadow: "0 10px 34px rgba(0,0,0,.4)",
          }}
        >
          <div className="flex-1 min-w-0">
            <p
              className="font-display font-bold text-xs tracking-widest"
              style={{ color: C.danger }}
            >
              {t.syncErrorTitle}
            </p>
            <p className="font-mono text-[11px] mt-1" style={{ color: C.muted }}>
              {t.syncErrorHint}
            </p>
            <p
              className="font-mono text-[11px] mt-1 break-words"
              style={{ color: C.text }}
            >
              {dataError}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <button
              onClick={() => {
                setDataError(null);
                loadUserData(user?.id);
              }}
              className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 cursor-pointer"
              style={{ color: C.orange, border: `1px solid ${C.orange}` }}
            >
              {t.retryBtn}
            </button>
            <button
              onClick={() => setDataError(null)}
              className="font-mono text-base leading-none px-2 cursor-pointer"
              style={{ color: C.muted }}
              aria-label="close"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Desktop Header Navigation */}
      <Header
        view={view}
        setView={setView}
        hasActive={!!activeWorkout}
        onLogout={handleLogout}
        isCloudConnected={isCloud}
        C={C}
        t={t}
      />

      {/* Mobile Top Bar */}
      <MobileHeader
        view={view}
        setView={setView}
        hasActive={!!activeWorkout}
        onLogout={handleLogout}
        isCloudConnected={isCloud}
        C={C}
        t={t}
      />

      {/* Main View Area */}
      <main className="flex-1 min-h-0 relative z-10">
        {view === "dashboard" && (
          <DashboardView
            workouts={workouts}
            routines={routines}
            exercises={exercises}
            hasActiveWorkout={!!activeWorkout}
            onStartWorkout={handleStartWorkout}
            onViewWorkout={(w) => setViewingWorkout(w)}
            onEditWorkout={(w) => setEditingWorkout(w)}
            onPlanWorkout={() => setIsPlanRoutineOpen(true)}
            onManualLog={() => setIsManualLogOpen(true)}
            setView={setView}
            C={C}
            t={t}
            lang={lang}
          />
        )}

        {view === "routines" && (
          <RoutinesView
            routines={routines}
            hiddenRoutines={hiddenRoutines}
            exercises={exercises}
            hasActiveWorkout={!!activeWorkout}
            onStartWorkout={handleStartWorkout}
            onSaveRoutine={handleSaveRoutine}
            onDeleteRoutine={handleDeleteRoutine}
            onRestoreRoutine={handleRestoreRoutine}
            C={C}
            t={t}
          />
        )}

        {view === "exercises" && (
          <ExercisesView
            exercises={exercises}
            hiddenExercises={hiddenExercises}
            workouts={workouts}
            onAddExercise={handleAddExercise}
            onUpdateExercise={handleUpdateExercise}
            onSaveExerciseNote={handleSaveExerciseNote}
            onDeleteExercise={handleDeleteExercise}
            onRestoreExercise={handleRestoreExercise}
            onViewProgress={() => setView("progress")}
            C={C}
            t={t}
          />
        )}

        {view === "calendar" && (
          <CalendarView
            workouts={workouts}
            routines={routines}
            onViewWorkout={(w) => setViewingWorkout(w)}
            onEditWorkout={(w) => setEditingWorkout(w)}
            onStartWorkout={handleStartWorkout}
            C={C}
            t={t}
            lang={lang}
          />
        )}

        {view === "workout" && activeWorkout && (
          <ActiveWorkoutLogger
            active={activeWorkout}
            onUpdate={handleUpdateActiveWorkout}
            onFinish={handleFinishActiveWorkout}
            onDiscard={handleDiscardActiveWorkout}
            exercises={exercises}
            C={C}
            t={t}
          />
        )}

        {view === "progress" && (
          <ProgressView workouts={workouts} exercises={exercises} C={C} t={t} />
        )}

        {view === "settings" && (
          <SettingsView
            user={user}
            theme={theme}
            setTheme={handleThemeChange}
            lang={lang}
            setLang={handleLangChange}
            onDeleteAccount={handleDeleteAccount}
            onResetLocalData={handleResetLocalData}
            C={C}
            t={t}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        view={view}
        setView={setView}
        hasActive={!!activeWorkout}
        activeRoutineName={activeWorkout?.routineName}
        C={C}
        t={t}
      />

      {/* Modals */}
      {/* 1. Workout Edit Modal ("Uaktualnienie swojego treningu") */}
      {editingWorkout && (
        <WorkoutEditModal
          workout={editingWorkout}
          allExercises={exercises}
          onSave={handleSaveUpdatedWorkout}
          onDelete={handleDeleteWorkout}
          onClose={() => setEditingWorkout(null)}
          C={C}
          t={t}
        />
      )}

      {/* 2. Workout Detail Modal */}
      {viewingWorkout && (
        <WorkoutDetailModal
          workout={viewingWorkout}
          allExercises={exercises}
          onEdit={(w) => {
            setViewingWorkout(null);
            setEditingWorkout(w);
          }}
          onClose={() => setViewingWorkout(null)}
          C={C}
          t={t}
          lang={lang}
        />
      )}

      {/* 3. Manual Workout Log Modal */}
      {isManualLogOpen && (
        <ManualWorkoutModal
          routines={routines}
          exercises={exercises}
          onSave={async (newWorkout) => {
            try {
              const saved = await repository.saveWorkout(newWorkout, user.id);
              setWorkouts((prev) => [saved, ...prev]);
              setDataError(null);
            } catch (e) {
              reportError(e);
            }
          }}
          onClose={() => setIsManualLogOpen(false)}
          C={C}
          t={t}
        />
      )}

      {/* 4. Plan Routine Modal */}
      {isPlanRoutineOpen && (
        <RoutineModal
          routine={null}
          allExercises={exercises}
          onSave={handleSaveRoutine}
          onClose={() => setIsPlanRoutineOpen(false)}
          C={C}
          t={t}
        />
      )}
    </div>
  );
}
