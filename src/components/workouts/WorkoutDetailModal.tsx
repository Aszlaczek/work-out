import React from 'react';
import { Colors } from '@/lib/theme';
import { Translations } from '@/lib/i18n';
import { Workout, Exercise } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Clock, Calendar, Edit3, Dumbbell } from 'lucide-react';

interface WorkoutDetailModalProps {
  workout: Workout;
  allExercises: Exercise[];
  onEdit: (workout: Workout) => void;
  onClose: () => void;
  C: Colors;
  t: Translations;
  lang: string;
}

export const WorkoutDetailModal: React.FC<WorkoutDetailModalProps> = ({
  workout,
  allExercises,
  onEdit,
  onClose,
  C,
  t,
  lang,
}) => {
  const getExName = (id: string) => {
    return allExercises.find((e) => e.id === id)?.name || id;
  };

  const totalSets = workout.exercises.reduce(
    (acc, e) => acc + e.sets.filter((s) => s.done).length,
    0
  );

  const totalTonnage = workout.exercises.reduce(
    (acc, e) =>
      acc +
      e.sets.reduce((sAcc, s) => (s.done ? sAcc + s.weight * s.reps : sAcc), 0),
    0
  );

  const formattedDate = new Date(workout.date).toLocaleDateString(
    lang === 'pl' ? 'pl-PL' : 'en-GB',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );

  return (
    <Modal onClose={onClose} C={C} maxWidth="max-w-xl">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-3" style={{ borderColor: C.border }}>
          <div>
            <span className="font-mono text-xs uppercase" style={{ color: C.orange }}>
              {formattedDate}
            </span>
            <h2 className="font-display font-black text-3xl tracking-tight" style={{ color: C.text }}>
              {workout.routineName.toUpperCase()}
            </h2>
            <div className="flex items-center gap-3 font-mono text-xs mt-1" style={{ color: C.muted }}>
              <span className="flex items-center gap-1">
                <Clock size={13} /> {workout.duration} min
              </span>
              <span>·</span>
              <span>{totalSets} {t.sets.toLowerCase()}</span>
              <span>·</span>
              <span>Objętość: {totalTonnage.toLocaleString()} kg</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-sm p-1 cursor-pointer hover:opacity-75"
            style={{ color: C.muted }}
          >
            ✕
          </button>
        </div>

        {/* Notes */}
        {workout.notes && (
          <div
            className="p-3 font-mono text-xs italic"
            style={{ background: C.surface, borderLeft: `2px solid ${C.cyan}`, color: C.text }}
          >
            "{workout.notes}"
          </div>
        )}

        {/* Exercises & sets breakdown */}
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {workout.exercises.map((e, idx) => (
            <div
              key={idx}
              className="p-3.5"
              style={{ background: C.surface, borderLeft: `2px solid ${C.violet}` }}
            >
              <div className="font-display font-bold text-sm tracking-wide mb-2" style={{ color: C.text }}>
                {getExName(e.exerciseId)}
              </div>
              <div className="flex flex-wrap gap-2">
                {e.sets.map((s, sIdx) => (
                  <div
                    key={s.id || sIdx}
                    className="px-2.5 py-1 font-mono text-xs border"
                    style={{
                      background: s.done ? C.card : 'transparent',
                      borderColor: s.done ? C.orange : C.border,
                      color: s.done ? C.text : C.muted,
                    }}
                  >
                    <span style={{ color: C.muted }}>#{sIdx + 1}: </span>
                    <span className="font-bold">{s.weight} kg</span> × {s.reps}
                    {s.rpe !== null && (
                      <span style={{ color: C.cyan }} className="text-[10px]">
                        {' '}
                        @RPE{s.rpe}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: C.border }}>
          <Button
            small
            variant="outline"
            onClick={() => {
              onClose();
              onEdit(workout);
            }}
            C={C}
          >
            <Edit3 size={14} /> {t.edit} / {t.editWorkoutTitle}
          </Button>

          <Button variant="ghost" small onClick={onClose} C={C}>
            Zamknij
          </Button>
        </div>
      </div>
    </Modal>
  );
};
