'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Theme, getColors, Colors } from '@/lib/theme';
import { Lang, T } from '@/lib/i18n';
import {
  AppUser,
  Routine,
  Workout,
  Exercise,
  ActiveWorkout,
  ActiveExercise,
} from '@/lib/types';
import { repository, mkId } from '@/lib/repository';
import { Header, ViewType } from '@/components/layout/Header';
import { BottomNav, MobileHeader } from '@/components/layout/BottomNav';
import { AmbientBlobs } from '@/components/layout/AmbientBlobs';
import { AuthView } from '@/components/auth/AuthView';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { RoutinesView } from '@/components/routines/RoutinesView';
import { ExercisesView } from '@/components/exercises/ExercisesView';
import { CalendarView } from '@/components/calendar/CalendarView';
import { ActiveWorkoutLogger } from '@/components/workouts/ActiveWorkoutLogger';
import { ProgressView } from '@/components/progress/ProgressView';
import { SettingsView } from '@/components/settings/SettingsView';
import { WorkoutEditModal } from '@/components/workouts/WorkoutEditModal';
import { WorkoutDetailModal } from '@/components/workouts/WorkoutDetailModal';
import { ManualWorkoutModal } from '@/components/workouts/ManualWorkoutModal';
import { RoutineModal } from '@/components/routines/RoutineModal';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');
  const [lang, setLang] = useState<Lang>('pl');
  const [view, setView] = useState<ViewType>('dashboard');

  // Application Data State
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);

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
    setMounted(true);
    const savedTheme = localStorage.getItem('gp_theme') as Theme;
    if (savedTheme === 'dark' || savedTheme === 'light') setTheme(savedTheme);

    const savedLang = localStorage.getItem('gp_lang') as Lang;
    if (savedLang === 'pl' || savedLang === 'en') setLang(savedLang);

    const savedActive = localStorage.getItem('gp_active_workout');
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
    if (typeof document !== 'undefined') {
      document.body.style.backgroundColor = C.bg;
      document.body.style.color = C.text;
    }
  }, [C.bg, C.text]);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('gp_theme', newTheme);
  };

  const handleLangChange = (newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem('gp_lang', newLang);
  };

  // Load data for active user
  const loadUserData = useCallback(async (userId?: string) => {
    const [fetchedRoutines, fetchedWorkouts, fetchedExercises] = await Promise.all([
      repository.getRoutines(userId),
      repository.getWorkouts(userId),
      repository.getExercises(userId),
    ]);
    setRoutines(fetchedRoutines);
    setWorkouts(fetchedWorkouts);
    setExercises(fetchedExercises);
  }, []);

  useEffect(() => {
    if (user) {
      loadUserData(user.id);
    }
  }, [user, loadUserData]);

  // Persist active workout to local storage
  const handleUpdateActiveWorkout = (updated: ActiveWorkout) => {
    setActiveWorkout(updated);
    localStorage.setItem('gp_active_workout', JSON.stringify(updated));
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
          weight: '',
          reps: String(re.targetReps),
          rpe: '',
          done: false,
        })),
      })),
    };
    handleUpdateActiveWorkout(newActive);
    setView('workout');
  };

  // Finish and save live workout to Supabase
  const handleFinishActiveWorkout = async () => {
    if (!activeWorkout) return;
    const duration = Math.max(1, Math.floor((Date.now() - activeWorkout.startedAt) / 60000));
    const newWorkout: Workout = {
      id: mkId(),
      routineId: activeWorkout.routineId,
      routineName: activeWorkout.routineName,
      date: new Date().toISOString().slice(0, 10),
      duration,
      status: 'completed',
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

    await repository.saveWorkout(newWorkout, user?.id);
    setWorkouts((prev) => [newWorkout, ...prev]);
    setActiveWorkout(null);
    localStorage.removeItem('gp_active_workout');
    setView('dashboard');
  };

  const handleDiscardActiveWorkout = () => {
    setActiveWorkout(null);
    localStorage.removeItem('gp_active_workout');
    setView('dashboard');
  };

  // Save updated workout ("Uaktualnienie swojego treningu")
  const handleSaveUpdatedWorkout = async (updated: Workout) => {
    await repository.saveWorkout(updated, user?.id);
    setWorkouts((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
  };

  // Delete workout
  const handleDeleteWorkout = async (workoutId: string) => {
    await repository.deleteWorkout(workoutId, user?.id);
    setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
  };

  // Save or update routine ("Planowanie")
  const handleSaveRoutine = async (routine: Routine) => {
    await repository.saveRoutine(routine, user?.id);
    setRoutines((prev) => {
      const idx = prev.findIndex((r) => r.id === routine.id);
      if (idx >= 0) {
        return prev.map((r) => (r.id === routine.id ? routine : r));
      }
      return [...prev, routine];
    });
  };

  // Delete routine
  const handleDeleteRoutine = async (routineId: string) => {
    await repository.deleteRoutine(routineId, user?.id);
    setRoutines((prev) => prev.filter((r) => r.id !== routineId));
  };

  // Custom exercise actions
  const handleAddExercise = async (ex: Exercise) => {
    await repository.saveExercise(ex, user?.id);
    setExercises((prev) => [...prev, ex]);
  };

  const handleUpdateExercise = async (updated: Exercise) => {
    await repository.saveExercise(updated, user?.id);
    setExercises((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e))
    );
  };

  const handleSaveExerciseNote = async (exerciseId: string, notes: string) => {
    await repository.saveExerciseNote(exerciseId, notes, user?.id);
    setExercises((prev) =>
      prev.map((e) => (e.id === exerciseId ? { ...e, notes } : e))
    );
  };

  const handleDeleteExercise = async (exId: string) => {
    await repository.deleteExercise(exId, user?.id);
    setExercises((prev) => prev.filter((e) => e.id !== exId));
  };

  // Auth actions
  const handleLoginSuccess = (loggedInUser: AppUser) => {
    setUser(loggedInUser);
    loadUserData(loggedInUser.id);
  };

  const handleLogout = async () => {
    await repository.signOut();
    setUser(null);
    setActiveWorkout(null);
    setView('dashboard');
  };

  const handleDeleteAccount = async () => {
    await repository.deleteAccount();
    setUser(null);
    setActiveWorkout(null);
    setView('dashboard');
  };

  const handleResetLocalData = () => {
    if (typeof window !== 'undefined') {
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
        C={C}
        theme={theme}
        setTheme={handleThemeChange}
        lang={lang}
        setLang={handleLangChange}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] relative overflow-hidden" style={{ background: C.bg, color: C.text }}>
      <AmbientBlobs C={C} />

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
        {view === 'dashboard' && (
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

        {view === 'routines' && (
          <RoutinesView
            routines={routines}
            exercises={exercises}
            hasActiveWorkout={!!activeWorkout}
            onStartWorkout={handleStartWorkout}
            onSaveRoutine={handleSaveRoutine}
            onDeleteRoutine={handleDeleteRoutine}
            C={C}
            t={t}
          />
        )}

        {view === 'exercises' && (
          <ExercisesView
            exercises={exercises}
            workouts={workouts}
            onAddExercise={handleAddExercise}
            onUpdateExercise={handleUpdateExercise}
            onSaveExerciseNote={handleSaveExerciseNote}
            onDeleteExercise={handleDeleteExercise}
            onViewProgress={() => setView('progress')}
            C={C}
            t={t}
          />
        )}

        {view === 'calendar' && (
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

        {view === 'workout' && activeWorkout && (
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

        {view === 'progress' && (
          <ProgressView
            workouts={workouts}
            exercises={exercises}
            C={C}
            t={t}
          />
        )}

        {view === 'settings' && (
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
            await repository.saveWorkout(newWorkout, user.id);
            setWorkouts((prev) => [newWorkout, ...prev]);
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
