import React, { useState, useEffect } from 'react';
import { Colors } from '@/lib/theme';
import { Translations } from '@/lib/i18n';
import { ActiveWorkout, Exercise } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Plus, Check, Clock, Trash2 } from 'lucide-react';

interface ActiveWorkoutLoggerProps {
  active: ActiveWorkout;
  onUpdate: (w: ActiveWorkout) => void;
  onFinish: () => void;
  onDiscard: () => void;
  exercises: Exercise[];
  C: Colors;
  t: Translations;
}

// minmax(0, 1fr) keeps the number inputs from forcing the row wider than the card
const SET_GRID = 'grid-cols-[26px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_36px_24px]';

export const ActiveWorkoutLogger: React.FC<ActiveWorkoutLoggerProps> = ({
  active,
  onUpdate,
  onFinish,
  onDiscard,
  exercises,
  C,
  t,
}) => {
  const [elapsed, setElapsed] = useState(
    Math.floor((Date.now() - active.startedAt) / 60000)
  );
  const [seconds, setSeconds] = useState(0);
  const [showAddEx, setShowAddEx] = useState(false);
  const [exSearch, setExSearch] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);

  // Live timer
  useEffect(() => {
    const timer = setInterval(() => {
      const diffMs = Date.now() - active.startedAt;
      setElapsed(Math.floor(diffMs / 60000));
      setSeconds(Math.floor((diffMs % 60000) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [active.startedAt]);

  const totalDone = active.exercises.reduce(
    (s, e) => s + e.sets.filter((x) => x.done).length,
    0
  );

  const getExName = (id: string) => {
    return exercises.find((e) => e.id === id)?.name || id;
  };

  const toggleSetDone = (ei: number, si: number) => {
    const n = structuredClone(active);
    n.exercises[ei].sets[si].done = !n.exercises[ei].sets[si].done;
    onUpdate(n);
  };

  const updateSetField = (
    ei: number,
    si: number,
    field: 'weight' | 'reps' | 'rpe',
    val: string
  ) => {
    const n = structuredClone(active);
    n.exercises[ei].sets[si][field] = val;
    onUpdate(n);
  };

  const addSetToExercise = (ei: number) => {
    const n = structuredClone(active);
    const prev = n.exercises[ei].sets.at(-1);
    n.exercises[ei].sets.push({
      weight: prev?.weight || '',
      reps: prev?.reps || '8',
      rpe: '',
      done: false,
    });
    onUpdate(n);
  };

  const removeSetFromExercise = (ei: number, si: number) => {
    const n = structuredClone(active);
    n.exercises[ei].sets.splice(si, 1);
    onUpdate(n);
  };

  const addExerciseToActive = (exerciseId: string) => {
    if (active.exercises.some((e) => e.exerciseId === exerciseId)) return;
    const n = structuredClone(active);
    n.exercises.push({
      exerciseId,
      sets: [
        { weight: '', reps: '8', rpe: '', done: false },
        { weight: '', reps: '8', rpe: '', done: false },
        { weight: '', reps: '8', rpe: '', done: false },
      ],
    });
    onUpdate(n);
    setShowAddEx(false);
    setExSearch('');
  };

  const removeExerciseFromActive = (ei: number) => {
    const n = structuredClone(active);
    n.exercises.splice(ei, 1);
    onUpdate(n);
  };

  const availableEx = exercises.filter(
    (e) =>
      !active.exercises.some((ae) => ae.exerciseId === e.id) &&
      e.name.toLowerCase().includes(exSearch.toLowerCase())
  );

  return (
    <div className="h-full overflow-y-auto pb-24 md:pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Top workout summary */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="font-mono text-xs mb-1 flex items-center gap-2" style={{ color: C.cyan }}>
              <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: C.cyan }} />
              {t.activeTraining}
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tight" style={{ color: C.text }}>
              {active.routineName.toUpperCase()}
            </h1>
            <div className="flex items-center gap-3 font-mono text-xs sm:text-sm mt-1" style={{ color: C.muted }}>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {String(elapsed).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span>·</span>
              <span>
                {totalDone} {t.sets.toLowerCase()} ukończonych
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              small
              onClick={() => setConfirmDiscard(true)}
              C={C}
            >
              ✕ {t.cancel}
            </Button>
            <Button onClick={() => setConfirmFinish(true)} C={C}>
              <Check size={16} /> {t.finish}
            </Button>
          </div>
        </div>

        {/* Exercises list */}
        <div className="space-y-5">
          {active.exercises.map((ex, ei) => (
            <div
              key={ei}
              className="p-4 sm:p-5 slide-up min-w-0 overflow-hidden"
              style={{ background: C.card, borderLeft: `3px solid ${C.violet}` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="font-display font-bold text-lg sm:text-xl tracking-wide min-w-0 break-words" style={{ color: C.text }}>
                  {getExName(ex.exerciseId).toUpperCase()}
                </div>
                <button
                  type="button"
                  onClick={() => removeExerciseFromActive(ei)}
                  className="font-mono text-xs hover:text-red-500 p-1 cursor-pointer shrink-0"
                  style={{ color: C.muted }}
                  title="Usuń ćwiczenie"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Sets Table Header */}
              <div
                className={`grid ${SET_GRID} gap-2 font-display font-bold text-xs tracking-widest px-1 mb-2`}
                style={{ color: C.muted }}
              >
                <span className="text-center">#</span>
                <span>{t.kg}</span>
                <span>{t.reps}</span>
                <span>{t.rpe}</span>
                <span className="text-center">OK</span>
                <span />
              </div>

              {/* Sets Rows */}
              <div className="space-y-2">
                {ex.sets.map((s, si) => (
                  <div
                    key={si}
                    className={`grid ${SET_GRID} gap-2 items-center transition-opacity ${
                      s.done ? 'opacity-40' : ''
                    }`}
                  >
                    <span className="font-mono text-xs text-center font-bold" style={{ color: C.muted }}>
                      {si + 1}
                    </span>

                    <input
                      type="number"
                      step="0.5"
                      value={s.weight}
                      onChange={(e) => updateSetField(ei, si, 'weight', e.target.value)}
                      placeholder="0"
                      className="w-full min-w-0 px-2 py-2 font-mono text-sm text-center outline-none transition-all rounded-none"
                      style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}
                      onFocus={(e) => (e.target.style.borderColor = C.violet)}
                      onBlur={(e) => (e.target.style.borderColor = C.border)}
                    />

                    <input
                      type="number"
                      value={s.reps}
                      onChange={(e) => updateSetField(ei, si, 'reps', e.target.value)}
                      placeholder="0"
                      className="w-full min-w-0 px-2 py-2 font-mono text-sm text-center outline-none transition-all rounded-none"
                      style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}
                      onFocus={(e) => (e.target.style.borderColor = C.violet)}
                      onBlur={(e) => (e.target.style.borderColor = C.border)}
                    />

                    <input
                      type="number"
                      step="0.5"
                      value={s.rpe}
                      onChange={(e) => updateSetField(ei, si, 'rpe', e.target.value)}
                      placeholder="—"
                      className="w-full min-w-0 px-2 py-2 font-mono text-sm text-center outline-none transition-all rounded-none"
                      style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}
                      onFocus={(e) => (e.target.style.borderColor = C.violet)}
                      onBlur={(e) => (e.target.style.borderColor = C.border)}
                    />

                    <button
                      type="button"
                      onClick={() => toggleSetDone(ei, si)}
                      className="w-9 h-9 flex items-center justify-center font-mono text-sm font-bold transition-all mx-auto cursor-pointer"
                      style={{
                        background: s.done ? C.orange : 'transparent',
                        border: `1px solid ${s.done ? C.orange : C.border}`,
                        color: s.done ? '#ffffff' : C.muted,
                      }}
                    >
                      {s.done ? '✓' : '○'}
                    </button>

                    <button
                      type="button"
                      onClick={() => removeSetFromExercise(ei, si)}
                      className="font-mono text-xs text-center hover:text-red-500 cursor-pointer"
                      style={{ color: C.muted }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => addSetToExercise(ei)}
                className="mt-4 font-display font-bold text-xs tracking-widest transition-all cursor-pointer hover:underline flex items-center gap-1"
                style={{ color: C.muted }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.violet)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
              >
                <Plus size={14} /> {t.addSet}
              </button>
            </div>
          ))}

          {/* Add extra exercise button */}
          <div className="pt-2">
            {!showAddEx ? (
              <Button
                variant="ghost"
                fullWidth
                onClick={() => setShowAddEx(true)}
                C={C}
              >
                <Plus size={16} /> {t.addExToWorkout}
              </Button>
            ) : (
              <div
                className="p-4 slide-up"
                style={{ background: C.card, border: `1px solid ${C.border}` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-bold text-xs tracking-widest" style={{ color: C.muted }}>
                    WYBIERZ ĆWICZENIE
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddEx(false)}
                    className="font-mono text-xs cursor-pointer"
                    style={{ color: C.muted }}
                  >
                    ✕
                  </button>
                </div>
                <input
                  type="text"
                  placeholder={t.searchExercise}
                  value={exSearch}
                  onChange={(e) => setExSearch(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-xs outline-none mb-3"
                  style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}
                  autoFocus
                />
                <div className="max-h-44 overflow-y-auto space-y-1">
                  {availableEx.slice(0, 10).map((ex) => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => addExerciseToActive(ex.id)}
                      className="w-full text-left px-3 py-2 font-display font-bold text-xs tracking-wide flex items-center justify-between transition-all"
                      style={{ background: C.surface, color: C.text, border: `1px solid ${C.border}` }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.violet)}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
                    >
                      <span>{ex.name}</span>
                      <span className="font-mono text-[10px]" style={{ color: C.muted }}>
                        {ex.muscle}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation modal: Discard workout */}
        {confirmDiscard && (
          <Modal onClose={() => setConfirmDiscard(false)} C={C}>
            <h3 className="font-display font-black text-xl tracking-tight mb-2" style={{ color: C.text }}>
              {t.discardWorkout}?
            </h3>
            <p className="font-mono text-xs mb-6" style={{ color: C.muted }}>
              Wszystkie odhaczone serie z tej sesji zostaną utracone. Czy na pewno?
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" small onClick={() => setConfirmDiscard(false)} C={C}>
                {t.cancel}
              </Button>
              <Button
                variant="danger"
                small
                onClick={() => {
                  setConfirmDiscard(false);
                  onDiscard();
                }}
                C={C}
              >
                {t.discardWorkout}
              </Button>
            </div>
          </Modal>
        )}

        {/* Confirmation modal: Finish workout */}
        {confirmFinish && (
          <Modal onClose={() => setConfirmFinish(false)} C={C}>
            <h3 className="font-display font-black text-xl tracking-tight mb-2" style={{ color: C.text }}>
              {t.finish}?
            </h3>
            <p className="font-mono text-xs mb-6" style={{ color: C.muted }}>
              Trening ({elapsed} min, {totalDone} {t.sets.toLowerCase()}) zostanie zapisany w bazie danych.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" small onClick={() => setConfirmFinish(false)} C={C}>
                {t.cancel}
              </Button>
              <Button
                small
                onClick={() => {
                  setConfirmFinish(false);
                  onFinish();
                }}
                C={C}
              >
                {t.save}
              </Button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};
