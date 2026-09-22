import React, { useState } from 'react';
import { Colors } from '@/lib/theme';
import { Translations } from '@/lib/i18n';
import { Workout, Routine, Exercise, WorkoutExercise, SetLog } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, SectionTitle } from '@/components/ui/Field';
import { mkId } from '@/lib/repository';
import { Plus, Trash2 } from 'lucide-react';

interface ManualWorkoutModalProps {
  routines: Routine[];
  exercises: Exercise[];
  onSave: (workout: Workout) => Promise<void>;
  onClose: () => void;
  C: Colors;
  t: Translations;
}

export const ManualWorkoutModal: React.FC<ManualWorkoutModalProps> = ({
  routines,
  exercises,
  onSave,
  onClose,
  C,
  t,
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>(
    routines[0]?.id || 'custom'
  );
  const [routineName, setRoutineName] = useState(
    routines[0]?.name || 'Freestyle Trening'
  );
  const [date, setDate] = useState(today);
  const [duration, setDuration] = useState('60');
  const [notes, setNotes] = useState('');
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>(
    routines[0]?.exercises.map((re) => ({
      exerciseId: re.exerciseId,
      sets: Array.from({ length: re.targetSets }, (_, i) => ({
        id: mkId(),
        weight: 60,
        reps: re.targetReps,
        rpe: null,
        done: true,
      })),
    })) || []
  );
  const [showAddEx, setShowAddEx] = useState(false);
  const [exSearch, setExSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const handleRoutineSelect = (routineId: string) => {
    setSelectedRoutineId(routineId);
    if (routineId === 'custom') {
      setRoutineName('Własny Trening');
    } else {
      const found = routines.find((r) => r.id === routineId);
      if (found) {
        setRoutineName(found.name);
        setWorkoutExercises(
          found.exercises.map((re) => ({
            exerciseId: re.exerciseId,
            sets: Array.from({ length: re.targetSets }, () => ({
              id: mkId(),
              weight: 60,
              reps: re.targetReps,
              rpe: null,
              done: true,
            })),
          }))
        );
      }
    }
  };

  const getExName = (id: string) => {
    return exercises.find((e) => e.id === id)?.name || id;
  };

  const handleAddSet = (exIdx: number) => {
    const updated = [...workoutExercises];
    const prev = updated[exIdx].sets.at(-1);
    updated[exIdx].sets.push({
      id: mkId(),
      weight: prev?.weight || 0,
      reps: prev?.reps || 8,
      rpe: null,
      done: true,
    });
    setWorkoutExercises(updated);
  };

  const handleRemoveSet = (exIdx: number, sIdx: number) => {
    const updated = [...workoutExercises];
    updated[exIdx].sets.splice(sIdx, 1);
    setWorkoutExercises(updated);
  };

  const handleUpdateSet = (
    exIdx: number,
    sIdx: number,
    field: keyof SetLog,
    val: any
  ) => {
    const updated = [...workoutExercises];
    updated[exIdx].sets[sIdx] = {
      ...updated[exIdx].sets[sIdx],
      [field]: val,
    };
    setWorkoutExercises(updated);
  };

  const handleAddExercise = (exerciseId: string) => {
    if (workoutExercises.some((e) => e.exerciseId === exerciseId)) return;
    setWorkoutExercises([
      ...workoutExercises,
      {
        exerciseId,
        sets: [
          { id: mkId(), weight: 60, reps: 8, rpe: null, done: true },
          { id: mkId(), weight: 60, reps: 8, rpe: null, done: true },
          { id: mkId(), weight: 60, reps: 8, rpe: null, done: true },
        ],
      },
    ]);
    setShowAddEx(false);
    setExSearch('');
  };

  const handleRemoveExercise = (exIdx: number) => {
    const updated = [...workoutExercises];
    updated.splice(exIdx, 1);
    setWorkoutExercises(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (workoutExercises.length === 0) return;
    setSaving(true);
    try {
      const newWorkout: Workout = {
        id: mkId(),
        routineId: selectedRoutineId === 'custom' ? null : selectedRoutineId,
        routineName: routineName.trim() || 'Trening',
        date,
        duration: Math.max(1, parseInt(duration) || 60),
        notes: notes.trim() || undefined,
        status: 'completed',
        exercises: workoutExercises,
      };
      await onSave(newWorkout);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const availableEx = exercises.filter(
    (e) =>
      !workoutExercises.some((we) => we.exerciseId === e.id) &&
      e.name.toLowerCase().includes(exSearch.toLowerCase())
  );

  return (
    <Modal onClose={onClose} C={C} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: C.border }}>
          <div>
            <span className="font-mono text-xs uppercase" style={{ color: C.orange }}>
              ZAPIS ODBYTEGO TRENINGU
            </span>
            <h2 className="font-display font-black text-2xl tracking-tight" style={{ color: C.text }}>
              {t.manualLogWorkout}
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

        {/* Routine selector or custom */}
        <div>
          <label className="block font-display font-bold text-xs tracking-widest mb-1.5" style={{ color: C.muted }}>
            SZABLON / PLAN TRENINGOWY
          </label>
          <select
            value={selectedRoutineId}
            onChange={(e) => handleRoutineSelect(e.target.value)}
            className="w-full px-4 py-2.5 font-mono text-sm outline-none rounded-none"
            style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}
          >
            {routines.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
            <option value="custom">Inny / Własny trening</option>
          </select>
        </div>

        {/* Date, Duration, Name */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field
            label="NAZWA TRENINGU"
            value={routineName}
            onChange={setRoutineName}
            required
            C={C}
          />
          <Field
            label={t.workoutDate}
            value={date}
            onChange={setDate}
            type="date"
            required
            C={C}
          />
          <Field
            label={t.workoutDuration}
            value={duration}
            onChange={setDuration}
            type="number"
            min={1}
            required
            C={C}
          />
        </div>

        {/* Exercises list with sets */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <SectionTitle C={C} className="mb-0">
              {t.exercise} ({workoutExercises.length})
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

          {showAddEx && (
            <div
              className="p-3 mb-3 slide-up"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}
            >
              <input
                type="text"
                placeholder={t.searchExercise}
                value={exSearch}
                onChange={(e) => setExSearch(e.target.value)}
                className="w-full px-3 py-1.5 font-mono text-xs outline-none mb-2"
                style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}
                autoFocus
              />
              <div className="max-h-36 overflow-y-auto space-y-1">
                {availableEx.slice(0, 8).map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => handleAddExercise(ex.id)}
                    className="w-full text-left px-3 py-1 font-display font-bold text-xs tracking-wide flex items-center justify-between border"
                    style={{ background: C.card, color: C.text, borderColor: C.border }}
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

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {workoutExercises.map((we, exIdx) => (
              <div
                key={we.exerciseId}
                className="p-3 border-l-2"
                style={{ background: C.surface, borderColor: C.violet }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-bold text-sm" style={{ color: C.text }}>
                    {getExName(we.exerciseId).toUpperCase()}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(exIdx)}
                    className="font-mono text-xs hover:text-red-500 cursor-pointer p-1"
                    style={{ color: C.muted }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="space-y-1.5">
                  {we.sets.map((s, sIdx) => (
                    <div
                      key={s.id || sIdx}
                      className="grid grid-cols-[24px_1fr_1fr_1fr_24px] gap-2 items-center"
                    >
                      <span className="font-mono text-xs text-center" style={{ color: C.muted }}>
                        {sIdx + 1}
                      </span>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="kg"
                        value={s.weight}
                        onChange={(e) =>
                          handleUpdateSet(exIdx, sIdx, 'weight', parseFloat(e.target.value) || 0)
                        }
                        className="px-2 py-1 font-mono text-xs text-center outline-none"
                        style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}
                      />
                      <input
                        type="number"
                        placeholder="powt."
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
                        placeholder="RPE"
                        value={s.rpe === null ? '' : s.rpe}
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
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t flex justify-end gap-2" style={{ borderColor: C.border }}>
          <Button variant="ghost" small onClick={onClose} C={C}>
            {t.cancel}
          </Button>
          <Button
            type="submit"
            small
            disabled={saving || workoutExercises.length === 0}
            C={C}
          >
            {saving ? '...' : t.save}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
