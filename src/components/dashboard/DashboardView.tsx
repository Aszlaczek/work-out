import React, { useState } from 'react';
import { Colors } from '@/lib/theme';
import { Translations } from '@/lib/i18n';
import { Workout, Routine, Exercise } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { SectionTitle } from '@/components/ui/Field';
import { ViewType } from '@/components/layout/Header';
import { Play, Plus, Edit3, Eye, Clock, CheckCircle2 } from 'lucide-react';

interface DashboardViewProps {
  workouts: Workout[];
  routines: Routine[];
  exercises: Exercise[];
  hasActiveWorkout: boolean;
  onStartWorkout: (r: Routine) => void;
  onViewWorkout: (w: Workout) => void;
  onEditWorkout: (w: Workout) => void;
  onPlanWorkout: () => void;
  onManualLog: () => void;
  setView: (v: ViewType) => void;
  C: Colors;
  t: Translations;
  lang: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  workouts,
  routines,
  exercises,
  hasActiveWorkout,
  onStartWorkout,
  onViewWorkout,
  onEditWorkout,
  onPlanWorkout,
  onManualLog,
  setView,
  C,
  t,
  lang,
}) => {
  const recentWorkouts = [...workouts]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6);

  const totalSets = workouts.reduce(
    (n, w) =>
      n +
      w.exercises.reduce(
        (m, e) => m + e.sets.filter((s) => s.done).length,
        0
      ),
    0
  );

  const totalMin = workouts.reduce((n, w) => n + w.duration, 0);

  const todayFormatted = new Date().toLocaleDateString(
    lang === 'pl' ? 'pl-PL' : 'en-GB',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  ).toUpperCase();

  return (
    <div className="h-full overflow-y-auto pb-24 md:pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header with Date & Active status */}
        <div className="mb-6 sm:mb-8 flex items-start sm:items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-xs mb-1 tracking-wider" style={{ color: C.muted }}>
              {todayFormatted}
            </p>
            <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tight leading-none" style={{ color: C.text }}>
              {t.today}<br />
              <span style={{ color: C.orange }}>—</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {hasActiveWorkout && (
              <button
                onClick={() => setView('workout')}
                className="flex items-center gap-2 font-display font-bold text-xs tracking-widest px-4 py-2.5 transition-all cursor-pointer shadow-lg animate-pulse"
                style={{
                  background: C.cyan + '22',
                  color: C.cyan,
                  border: `1px solid ${C.cyan}`,
                }}
              >
                <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: C.cyan }} />
                {t.activeWorkout} →
              </button>
            )}

            <Button small variant="ghost" onClick={onManualLog} C={C}>
              <Plus size={14} /> {t.manualLogWorkout}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-8">
          {[
            { label: t.workouts, val: workouts.length, icon: '🏋️' },
            { label: t.sets, val: totalSets, icon: '⚡' },
            { label: t.minutes, val: totalMin, icon: '⏱️' },
          ].map(({ label, val }) => (
            <div
              key={label}
              className="p-3.5 sm:p-4 transition-all"
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${C.orange}`,
              }}
            >
              <div className="font-mono font-bold text-2xl sm:text-3xl" style={{ color: C.text }}>
                {val}
              </div>
              <div className="font-display font-bold text-[10px] sm:text-xs tracking-widest mt-1" style={{ color: C.muted }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Start Routines */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <SectionTitle C={C} className="mb-0">{t.quickStart}</SectionTitle>
            <button
              onClick={() => setView('routines')}
              className="font-display font-bold text-xs tracking-wider cursor-pointer hover:underline"
              style={{ color: C.orange }}
            >
              WSZYSTKIE PLANY ({routines.length}) →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {routines.slice(0, 3).map((r) => (
              <button
                key={r.id}
                onClick={() => onStartWorkout(r)}
                disabled={hasActiveWorkout}
                className="p-4 text-left transition-all cursor-pointer disabled:opacity-40 flex flex-col justify-between group"
                style={{ background: C.card, border: `1px solid ${C.border}` }}
                onMouseEnter={(e) => {
                  if (!hasActiveWorkout) e.currentTarget.style.borderColor = C.orange;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.border;
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display font-black text-lg sm:text-xl tracking-tight group-hover:text-gym-orange transition-colors" style={{ color: C.text }}>
                      {r.name}
                    </span>
                    <span className="p-1 rounded-full text-gym-orange opacity-80 group-hover:scale-110 transition-transform">
                      <Play size={14} />
                    </span>
                  </div>
                  <div className="font-mono text-xs" style={{ color: C.muted }}>
                    {r.exercises.length} {t.exercise.toLowerCase()} · {r.exercises.reduce((s, e) => s + e.targetSets, 0)} {t.setsLabel.toLowerCase()}
                  </div>
                </div>
              </button>
            ))}

            {routines.length === 0 && (
              <div
                className="col-span-3 p-6 text-center border border-dashed"
                style={{ borderColor: C.border, color: C.muted }}
              >
                <p className="font-mono text-xs mb-3">{t.noRoutines}</p>
                <Button small C={C} onClick={onPlanWorkout}>
                  <Plus size={14} /> {t.planNewWorkout}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* History / Recent Workouts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <SectionTitle C={C} className="mb-0">{t.history}</SectionTitle>
            <button
              onClick={() => setView('calendar')}
              className="font-display font-bold text-xs tracking-wider cursor-pointer hover:underline"
              style={{ color: C.orange }}
            >
              ZOBACZ KALENDARZ →
            </button>
          </div>

          <div className="space-y-2">
            {recentWorkouts.map((w, i) => {
              const completedSets = w.exercises.reduce(
                (s, e) => s + e.sets.filter((x) => x.done).length,
                0
              );

              return (
                <div
                  key={w.id}
                  className="flex items-center gap-3 sm:gap-4 px-3.5 sm:px-4 py-3 transition-all group"
                  style={{
                    background: i === 0 ? C.card : C.surface,
                    borderLeft: `3px solid ${i === 0 ? C.orange : C.dim}`,
                    border: `1px solid ${C.border}`,
                    borderLeftColor: i === 0 ? C.orange : C.dim,
                  }}
                >
                  <span className="font-mono text-xs w-14 sm:w-16 shrink-0" style={{ color: C.muted }}>
                    {new Date(w.date).toLocaleDateString(
                      lang === 'pl' ? 'pl-PL' : 'en-GB',
                      { day: '2-digit', month: '2-digit' }
                    )}
                  </span>

                  <div className="flex-1 min-w-0">
                    <span className="font-display font-bold text-base tracking-wide block truncate" style={{ color: C.text }}>
                      {w.routineName}
                    </span>
                    <span className="font-mono text-[11px] block sm:hidden" style={{ color: C.muted }}>
                      {completedSets} {t.sets.toLowerCase()} · {w.duration} min
                    </span>
                  </div>

                  <span className="font-mono text-xs hidden sm:block shrink-0" style={{ color: C.muted }}>
                    {completedSets} {t.sets.toLowerCase()} · {w.duration} min
                  </span>

                  {/* Actions: View details + Quick Edit */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onViewWorkout(w)}
                      className="p-1.5 font-mono text-xs cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ color: C.muted }}
                      title="Pokaż szczegóły"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditWorkout(w)}
                      className="p-1.5 font-mono text-xs cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ color: C.orange }}
                      title={t.editWorkoutTitle}
                    >
                      <Edit3 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}

            {recentWorkouts.length === 0 && (
              <div
                className="p-8 text-center border border-dashed"
                style={{ borderColor: C.border, color: C.muted }}
              >
                <p className="font-mono text-xs mb-3">{t.noHistory}</p>
                {routines[0] && (
                  <Button small C={C} onClick={() => onStartWorkout(routines[0])}>
                    <Play size={14} /> {t.start}: {routines[0].name}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
