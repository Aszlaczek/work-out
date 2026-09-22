import React, { useState } from 'react';
import { Colors } from '@/lib/theme';
import { Translations } from '@/lib/i18n';
import { Exercise, Workout, ExerciseCategory } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, SectionTitle } from '@/components/ui/Field';
import { Trash2, TrendingUp, Check, Save, Info, Sparkles } from 'lucide-react';

interface ExerciseDetailModalProps {
  exercise: Exercise;
  workouts: Workout[];
  onSaveNote: (exerciseId: string, notes: string) => Promise<void>;
  onUpdateCustomExercise?: (updated: Exercise) => Promise<void>;
  onDeleteExercise?: (exerciseId: string) => Promise<void>;
  onViewProgress?: (exerciseId: string) => void;
  onClose: () => void;
  C: Colors;
  t: Translations;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  workouts,
  onSaveNote,
  onUpdateCustomExercise,
  onDeleteExercise,
  onViewProgress,
  onClose,
  C,
  t,
}) => {
  const [notes, setNotes] = useState(exercise.notes || exercise.description || '');
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [name, setName] = useState(exercise.name);
  const [category, setCategory] = useState<ExerciseCategory>(exercise.category);
  const [muscle, setMuscle] = useState(exercise.muscle);
  const [savingNote, setSavingNote] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Compute PR and statistics from user's workouts for this exercise
  const exerciseWorkouts = workouts.filter((w) =>
    w.exercises.some((e) => e.exerciseId === exercise.id)
  );

  const allSets = exerciseWorkouts.flatMap((w) => {
    const ex = w.exercises.find((e) => e.exerciseId === exercise.id);
    return ex ? ex.sets.filter((s) => s.done) : [];
  });

  const pr = allSets.length > 0 ? Math.max(...allSets.map((s) => s.weight)) : 0;
  const bestSet = allSets.find((s) => s.weight === pr);
  const totalVolume = allSets.reduce((acc, s) => acc + s.weight * s.reps, 0);

  const handleSaveNotes = async () => {
    setSavingNote(true);
    try {
      await onSaveNote(exercise.id, notes.trim());
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } finally {
      setSavingNote(false);
    }
  };

  const handleSaveCustomDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateCustomExercise) return;
    const updated: Exercise = {
      ...exercise,
      name: name.trim() || exercise.name,
      category,
      muscle: muscle.trim() || exercise.muscle,
      notes: notes.trim(),
    };
    await onUpdateCustomExercise(updated);
    setIsEditingCustom(false);
  };

  return (
    <Modal onClose={onClose} C={C} maxWidth="max-w-xl">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-3" style={{ borderColor: C.border }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="font-display font-bold text-[10px] tracking-widest px-2 py-0.5 uppercase"
                style={{
                  background: exercise.isCustom ? C.violet + '22' : C.dim,
                  color: exercise.isCustom ? C.violet : C.muted,
                  border: `1px solid ${exercise.isCustom ? C.violet + '44' : C.border}`,
                }}
              >
                {exercise.isCustom ? 'WŁASNE (CUSTOM)' : 'BAZOWE (PREDEFINIOWANE)'}
              </span>
              <span
                className="font-display font-bold text-[10px] tracking-widest px-2 py-0.5 uppercase"
                style={{ background: C.orange + '18', color: C.orange }}
              >
                {exercise.category}
              </span>
            </div>

            <h2 className="font-display font-black text-2xl sm:text-3xl tracking-tight" style={{ color: C.text }}>
              {exercise.name.toUpperCase()}
            </h2>
            <p className="font-mono text-xs mt-0.5" style={{ color: C.muted }}>
              Partie docelowe: <span className="font-bold" style={{ color: C.text }}>{exercise.muscle}</span>
            </p>
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

        {/* Quick Stats Banner if user has logged this exercise */}
        <div className="grid grid-cols-3 gap-2 p-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div>
            <div className="font-display font-bold text-[10px] tracking-wider uppercase" style={{ color: C.muted }}>
              REKORD (PR)
            </div>
            <div className="font-mono font-bold text-lg" style={{ color: pr > 0 ? C.orange : C.muted }}>
              {pr > 0 ? `${pr} kg` : '—'}
            </div>
          </div>
          <div>
            <div className="font-display font-bold text-[10px] tracking-wider uppercase" style={{ color: C.muted }}>
              ODBYTE SERIE
            </div>
            <div className="font-mono font-bold text-lg" style={{ color: C.text }}>
              {allSets.length}
            </div>
          </div>
          <div>
            <div className="font-display font-bold text-[10px] tracking-wider uppercase" style={{ color: C.muted }}>
              SESJE
            </div>
            <div className="font-mono font-bold text-lg" style={{ color: C.text }}>
              {exerciseWorkouts.length}
            </div>
          </div>
        </div>

        {/* Description & Technical Notes Section */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block font-display font-bold text-xs tracking-widest uppercase" style={{ color: C.muted }}>
              OPIS & WSKAZÓWKI TECHNICZNE
            </label>
            {savedSuccess && (
              <span className="font-mono text-xs flex items-center gap-1 text-emerald-400 animate-fadeIn">
                <Check size={13} /> ZAPISANO W BAZIE!
              </span>
            )}
          </div>

          <p className="font-mono text-[11px] mb-2 leading-relaxed" style={{ color: C.muted }}>
            Możesz tutaj opisać technikę wykonania, ustawienia maszyn (np. wysokość siedziska), rozstaw chwytu lub swoje prywatne wskazówki do tego ćwiczenia.
          </p>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="np. Ustawienie ławki: skos 30°. Chwyt średni, na szerokość barków. Łopatki spięte w dół i do kręgosłupa. Pauza 1 sekunda na dole przy klatce. Nie blokuj łokci na górze."
            rows={4}
            className="w-full px-3.5 py-2.5 font-mono text-xs outline-none transition-all resize-y rounded-none"
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              color: C.text,
            }}
            onFocus={(e) => (e.target.style.borderColor = C.orange)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
          />

          <div className="flex justify-end mt-2">
            <Button
              small
              onClick={handleSaveNotes}
              disabled={savingNote}
              C={C}
            >
              <Save size={13} /> {savingNote ? 'ZAPISYWANIE...' : 'ZAPISZ OPIS'}
            </Button>
          </div>
        </div>

        {/* Custom exercise extra edit mode */}
        {exercise.isCustom && isEditingCustom && (
          <form
            onSubmit={handleSaveCustomDetails}
            className="p-3.5 slide-up space-y-3"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}
          >
            <span className="font-display font-bold text-xs tracking-wider uppercase" style={{ color: C.violet }}>
              EDYTUJ DANE ĆWICZENIA WŁASNEGO
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Field label="NAZWA" value={name} onChange={setName} C={C} />
              <div>
                <label className="block font-display font-bold text-xs tracking-widest mb-1.5" style={{ color: C.muted }}>
                  KATEGORIA
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExerciseCategory)}
                  className="w-full px-3 py-2 font-mono text-xs outline-none rounded-none"
                  style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}
                >
                  <option value="push">Pchające</option>
                  <option value="pull">Ciągnące</option>
                  <option value="legs">Nogi</option>
                  <option value="core">Core</option>
                </select>
              </div>
              <Field label="PARTIA MIĘŚNIOWA" value={muscle} onChange={setMuscle} C={C} />
            </div>
            <div className="flex justify-end gap-2">
              <Button small variant="ghost" onClick={() => setIsEditingCustom(false)} C={C}>
                {t.cancel}
              </Button>
              <Button small type="submit" C={C}>
                Zapisz zmiany
              </Button>
            </div>
          </form>
        )}

        {/* Footer actions */}
        <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-2" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-2">
            {onViewProgress && (
              <Button
                small
                variant="outline"
                onClick={() => {
                  onClose();
                  onViewProgress(exercise.id);
                }}
                C={C}
              >
                <TrendingUp size={14} /> ZOBACZ PROGRES
              </Button>
            )}

            {exercise.isCustom && !isEditingCustom && (
              <Button
                small
                variant="ghost"
                onClick={() => setIsEditingCustom(true)}
                C={C}
              >
                EDYTUJ DANE
              </Button>
            )}
          </div>

          {exercise.isCustom && onDeleteExercise && (
            <div>
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="font-mono text-xs hover:text-red-500 cursor-pointer flex items-center gap-1"
                  style={{ color: C.muted }}
                >
                  <Trash2 size={13} /> {t.delete}
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px]" style={{ color: C.danger }}>
                    Usunąć?
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await onDeleteExercise(exercise.id);
                      onClose();
                    }}
                    className="font-display font-bold text-[11px] px-2 py-0.5 bg-red-600 text-white"
                  >
                    TAK
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="font-mono text-[11px] hover:underline"
                    style={{ color: C.muted }}
                  >
                    NIE
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
