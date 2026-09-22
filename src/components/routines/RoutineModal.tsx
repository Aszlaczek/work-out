import React, { useState } from 'react';
import { Colors } from '@/lib/theme';
import { Translations } from '@/lib/i18n';
import { Routine, Exercise, RoutineExercise } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, SectionTitle } from '@/components/ui/Field';
import { Plus, Trash2 } from 'lucide-react';
import { mkId } from '@/lib/repository';

interface RoutineModalProps {
  routine?: Routine | null;
  allExercises: Exercise[];
  onSave: (routine: Routine) => Promise<void>;
  onClose: () => void;
  C: Colors;
  t: Translations;
}

export const RoutineModal: React.FC<RoutineModalProps> = ({
  routine,
  allExercises,
  onSave,
  onClose,
  C,
  t,
}) => {
  const isNew = !routine;
  const [name, setName] = useState(routine?.name || '');
  const [exercises, setExercises] = useState<RoutineExercise[]>(
    routine?.exercises.map((e) => ({ ...e })) || []
  );
  const [exSearch, setExSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const getExName = (id: string) => {
    return allExercises.find((e) => e.id === id)?.name || id;
  };

  const handleAddExercise = (exerciseId: string) => {
    if (exercises.some((e) => e.exerciseId === exerciseId)) return;
    setExercises([
      ...exercises,
      { exerciseId, targetSets: 3, targetReps: 8 },
    ]);
    setExSearch('');
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setExercises(exercises.filter((e) => e.exerciseId !== exerciseId));
  };

  const handleUpdateField = (
    exerciseId: string,
    field: 'targetSets' | 'targetReps',
    val: number
  ) => {
    setExercises(
      exercises.map((e) =>
        e.exerciseId === exerciseId ? { ...e, [field]: val } : e
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || exercises.length === 0) return;
    setSaving(true);
    try {
      const routineToSave: Routine = {
        id: routine?.id || mkId(),
        name: name.trim(),
        exercises,
      };
      await onSave(routineToSave);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const availableEx = allExercises.filter(
    (e) =>
      !exercises.some((re) => re.exerciseId === e.id) &&
      e.name.toLowerCase().includes(exSearch.toLowerCase())
  );

  return (
    <Modal onClose={onClose} C={C} maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: C.border }}>
          <h2 className="font-display font-black text-2xl tracking-tight" style={{ color: C.text }}>
            {isNew ? t.newRoutine : `${t.edit}: ${routine.name}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-sm p-1 cursor-pointer hover:opacity-75"
            style={{ color: C.muted }}
          >
            ✕
          </button>
        </div>

        {/* Routine Name */}
        <Field
          label={t.routineName}
          value={name}
          onChange={setName}
          placeholder="np. Push A, FBW B, Góra Siła"
          required
          C={C}
        />

        {/* Exercises included in routine */}
        <div>
          <SectionTitle C={C}>{t.exercise} ({exercises.length})</SectionTitle>
          {exercises.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {exercises.map((e) => (
                <div
                  key={e.exerciseId}
                  className="flex items-center gap-3 px-3 py-2 border"
                  style={{ background: C.surface, borderColor: C.border }}
                >
                  <span className="font-display font-bold text-sm flex-1 truncate" style={{ color: C.text }}>
                    {getExName(e.exerciseId)}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-xs" style={{ color: C.muted }}>
                      {t.setsLabel}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={e.targetSets}
                      onChange={(x) =>
                        handleUpdateField(e.exerciseId, 'targetSets', parseInt(x.target.value) || 1)
                      }
                      className="w-12 px-1.5 py-1 font-mono text-xs text-center outline-none"
                      style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}
                    />

                    <span className="font-mono text-xs ml-1" style={{ color: C.muted }}>
                      {t.targetReps}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={e.targetReps}
                      onChange={(x) =>
                        handleUpdateField(e.exerciseId, 'targetReps', parseInt(x.target.value) || 1)
                      }
                      className="w-12 px-1.5 py-1 font-mono text-xs text-center outline-none"
                      style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(e.exerciseId)}
                      className="font-mono text-xs p-1 hover:text-red-500 cursor-pointer ml-1"
                      style={{ color: C.muted }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-mono text-xs py-2" style={{ color: C.muted }}>
              Dodaj ćwiczenia poniżej do tego planu.
            </p>
          )}
        </div>

        {/* Exercise picker */}
        <div>
          <SectionTitle C={C}>{t.addExercise}</SectionTitle>
          <input
            type="text"
            value={exSearch}
            onChange={(e) => setExSearch(e.target.value)}
            placeholder={t.searchExercise}
            className="w-full px-3 py-2 font-mono text-xs outline-none mb-2"
            style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}
          />

          <div className="max-h-36 overflow-y-auto space-y-1">
            {availableEx.slice(0, 10).map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => handleAddExercise(ex.id)}
                className="w-full text-left px-3 py-1.5 font-display font-bold text-xs tracking-wide flex items-center justify-between border transition-all"
                style={{ background: C.surface, color: C.muted, borderColor: C.border }}
                onMouseEnter={(x) => {
                  x.currentTarget.style.color = C.text;
                  x.currentTarget.style.borderColor = C.orange;
                }}
                onMouseLeave={(x) => {
                  x.currentTarget.style.color = C.muted;
                  x.currentTarget.style.borderColor = C.border;
                }}
              >
                <span>{ex.name}</span>
                <span className="font-mono text-[10px] uppercase">{ex.category}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t flex justify-end gap-2" style={{ borderColor: C.border }}>
          <Button variant="ghost" small onClick={onClose} C={C}>
            {t.cancel}
          </Button>
          <Button
            type="submit"
            small
            disabled={saving || !name.trim() || exercises.length === 0}
            C={C}
          >
            {saving ? '...' : t.save}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
