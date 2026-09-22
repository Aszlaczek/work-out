import React, { useState } from 'react';
import { Colors } from '@/lib/theme';
import { Translations } from '@/lib/i18n';
import { Workout, Exercise, WorkoutExercise, SetLog } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, SectionTitle } from '@/components/ui/Field';
import { mkId } from '@/lib/repository';
import { Trash2, Plus, Check } from 'lucide-react';

interface WorkoutEditModalProps {
  workout: Workout;
  allExercises: Exercise[];
  onSave: (updatedWorkout: Workout) => Promise<void>;
  onDelete: (workoutId: string) => Promise<void>;
  onClose: () => void;
  C: Colors;
  t: Translations;
}

export const WorkoutEditModal: React.FC<WorkoutEditModalProps> = ({
  workout,
  allExercises,
  onSave,
  onDelete,
  onClose,
  C,
  t,
}) => {
  const [date, setDate] = useState(workout.date);
  const [routineName, setRoutineName] = useState(workout.routineName);
  const [duration, setDuration] = useState(workout.duration.toString());
  const [notes, setNotes] = useState(workout.notes || '');
  const [exercises, setExercises] = useState<WorkoutExercise[]>(
    workout.exercises.map((e) => ({
      exerciseId: e.exerciseId,
      sets: e.sets.map((s) => ({ ...s })),
    }))
  );
  const [showAddEx, setShowAddEx] = useState(false);
  const [exSearch, setExSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const getExName = (id: string) => {
    return allExercises.find((e) => e.id === id)?.name || id;
  };

  const handleUpdateSet = (
    exIdx: number,
    setIdx: number,
    field: keyof SetLog,
    val: any
  ) => {
    const updated = [...exercises];
    updated[exIdx].sets[setIdx] = {
      ...updated[exIdx].sets[setIdx],
      [field]: val,
    };
    setExercises(updated);
  };

  const handleAddSet = (exIdx: number) => {
    const updated = [...exercises];
    const prevSet = updated[exIdx].sets.at(-1);
    const newSet: SetLog = {
      id: mkId(),
      weight: prevSet?.weight || 0,
      reps: prevSet?.reps || 8,
      rpe: prevSet?.rpe || null,
      done: true,
    };
    updated[exIdx].sets.push(newSet);
    setExercises(updated);
  };

  const handleRemoveSet = (exIdx: number, setIdx: number) => {
    const updated = [...exercises];
    updated[exIdx].sets.splice(setIdx, 1);
    setExercises(updated);
  };

  const handleAddExercise = (exerciseId: string) => {
    if (exercises.some((e) => e.exerciseId === exerciseId)) return;
    setExercises([
      ...exercises,
      {
        exerciseId,
        sets: [
          { id: mkId(), weight: 60, reps: 8, rpe: 8, done: true },
          { id: mkId(), weight: 60, reps: 8, rpe: 8, done: true },
          { id: mkId(), weight: 60, reps: 8, rpe: 8.5, done: true },
        ],
      },
    ]);
    setShowAddEx(false);
    setExSearch('');
  };

  const handleRemoveExercise = (exIdx: number) => {
    const updated = [...exercises];
    updated.splice(exIdx, 1);
    setExercises(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated: Workout = {
        ...workout,
        routineName: routineName.trim() || workout.routineName,
        date,
        duration: Math.max(1, parseInt(duration) || 0),
        notes: notes.trim() || undefined,
        exercises,
      };
      await onSave(updated);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const availableEx = allExercises.filter(
    (e) =>
      !exercises.some((we) => we.exerciseId === e.id) &&
      e.name.toLowerCase().includes(exSearch.toLowerCase())
  );

  return (
    <Modal onClose={onClose} C={C} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: C.border }}>
          <div>
            <span className="font-mono text-xs" style={{ color: C.orange }}>
              {t.editWorkoutTitle}
            </span>
            <h2 className="font-display font-black text-2xl tracking-tight" style={{ color: C.text }}>
              {workout.routineName.toUpperCase()}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-sm p-1.5 cursor-pointer hover:opacity-75"
            style={{ color: C.muted }}
          >
            ✕
          </button>
        </div>

        {/* General details: Name, Date, Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field
            label="NAZWA TRENINGU"
            value={routineName}
            onChange={setRoutineName}
            C={C}
            required
          />
          <Field
            label={t.workoutDate}
            value={date}
            onChange={setDate}
            type="date"
            C={C}
            required
          />
          <Field
            label={t.workoutDuration}
            value={duration}
            onChange={setDuration}
            type="number"
            min={1}
            C={C}
            required
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block font-display font-bold text-xs tracking-widest mb-1.5" style={{ color: C.muted }}>
            {t.workoutNotes}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="np. Dobry trening, lekki dyskomfort w lewym barku..."
            rows={2}
            className="w-full px-4 py-2.5 font-mono text-xs outline-none transition-all rounded-none resize-none"
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              color: C.text,
            }}
            onFocus={(e) => (e.target.style.borderColor = C.orange)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
          />
        </div>

        {/* Exercises list with sets */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <SectionTitle C={C} className="mb-0">
              {t.exercisesTitle} ({exercises.length})
            </SectionTitle>
            <button
              type="button"
              onClick={() => setShowAddEx((v) => !v)}
              className="font-display font-bold text-xs tracking-wider cursor-pointer hover:underline flex items-center gap-1"
              style={{ color: C.orange }}
            >
              <Plus size={14} /> {t.addExercise}
            </button>
          </div>

          {/* Add exercise selector drawer */}
          {showAddEx && (
            <div
              className="p-3 mb-4 slide-up"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}
            >
              <input
                type="text"
                placeholder={t.searchExercise}
                value={exSearch}
                onChange={(e) => setExSearch(e.target.value)}
                className="w-full px-3 py-2 font-mono text-xs outline-none mb-2"
                style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}
                autoFocus
              />
              <div className="max-h-36 overflow-y-auto space-y-1">
                {availableEx.slice(0, 8).map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => handleAddExercise(ex.id)}
                    className="w-full text-left px-3 py-1.5 font-display font-bold text-xs tracking-wide flex items-center justify-between hover:border-gym-orange transition-all"
                    style={{ background: C.card, color: C.text, border: `1px solid ${C.border}` }}
                  >
                    <span>{ex.name}</span>
                    <span className="font-mono text-[10px]" style={{ color: C.muted }}>
                      {ex.muscle}
                    </span>
                  </button>
                ))}
                {availableEx.length === 0 && (
                  <p className="font-mono text-xs text-center py-2" style={{ color: C.muted }}>
                    Brak pasujących ćwiczeń
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Exercises and sets editors */}
          <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
            {exercises.map((we, exIdx) => (
              <div
                key={we.exerciseId}
                className="p-3 border-l-2"
                style={{ background: C.surface, borderColor: C.violet }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-bold text-sm tracking-wide" style={{ color: C.text }}>
                    {getExName(we.exerciseId).toUpperCase()}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(exIdx)}
                    className="font-mono text-xs hover:text-red-500 cursor-pointer p-1"
                    style={{ color: C.muted }}
                    title="Usuń ćwiczenie z treningu"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Sets header */}
                <div
                  className="grid grid-cols-[28px_1fr_1fr_1fr_32px_28px] gap-2 font-display font-bold text-[10px] tracking-wider px-1 mb-1"
                  style={{ color: C.muted }}
                >
                  <span className="text-center">#</span>
                  <span>{t.kg}</span>
                  <span>{t.reps}</span>
                  <span>{t.rpe}</span>
                  <span className="text-center">OK</span>
                  <span />
                </div>

                {/* Sets rows */}
                <div className="space-y-1.5">
                  {we.sets.map((s, sIdx) => (
                    <div
                      key={s.id || sIdx}
                      className="grid grid-cols-[28px_1fr_1fr_1fr_32px_28px] gap-2 items-center"
                    >
                      <span className="font-mono text-xs text-center" style={{ color: C.muted }}>
                        {sIdx + 1}
                      </span>
                      <input
                        type="number"
                        step="0.5"
                        value={s.weight}
                        onChange={(e) =>
                          handleUpdateSet(exIdx, sIdx, 'weight', parseFloat(e.target.value) || 0)
                        }
                        className="px-2 py-1 font-mono text-xs text-center outline-none"
                        style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}
                      />
                      <input
                        type="number"
                        value={s.reps}
                        onChange={(e) =>
                          handleUpdateSet(exIdx, sIdx, 'reps', parseInt(e.target.value) || 0)
                        }
                        className="px-2 py-1 font-mono text-xs text-center outline-none"
                        style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}
                      />
                      <input
                        type="number"
                        step="0.5"
                        value={s.rpe === null ? '' : s.rpe}
                        placeholder="—"
                        onChange={(e) =>
                          handleUpdateSet(
                            exIdx,
                            sIdx,
                            'rpe',
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        className="px-2 py-1 font-mono text-xs text-center outline-none"
                        style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateSet(exIdx, sIdx, 'done', !s.done)}
                        className="w-7 h-7 flex items-center justify-center font-mono text-xs transition-all mx-auto"
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
                        onClick={() => handleRemoveSet(exIdx, sIdx)}
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
                  onClick={() => handleAddSet(exIdx)}
                  className="mt-2 font-display font-bold text-[11px] tracking-widest cursor-pointer hover:underline flex items-center gap-1"
                  style={{ color: C.violet }}
                >
                  <Plus size={12} /> {t.addSet}
                </button>
              </div>
            ))}

            {exercises.length === 0 && (
              <p className="font-mono text-xs text-center py-4" style={{ color: C.muted }}>
                Brak ćwiczeń w tym treningu. Dodaj ćwiczenie powyżej.
              </p>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-2" style={{ borderColor: C.border }}>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="font-mono text-xs hover:underline flex items-center gap-1 cursor-pointer"
              style={{ color: C.danger }}
            >
              <Trash2 size={14} /> {t.deleteWorkout}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs" style={{ color: C.danger }}>
                Potwierdzić?
              </span>
              <button
                type="button"
                onClick={async () => {
                  await onDelete(workout.id);
                  onClose();
                }}
                className="font-display font-bold text-xs px-2.5 py-1 bg-red-600 text-white"
              >
                TAK, USUŃ
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="font-mono text-xs text-gray-400 hover:underline"
              >
                {t.cancel}
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" small onClick={onClose} C={C}>
              {t.cancel}
            </Button>
            <Button
              type="submit"
              small
              disabled={saving || exercises.length === 0}
              C={C}
            >
              {saving ? '...' : t.updateWorkoutBtn}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
