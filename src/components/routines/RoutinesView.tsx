import React, { useState } from 'react';
import { Colors } from '@/lib/theme';
import { Translations } from '@/lib/i18n';
import { Routine, Exercise, Workout } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { RoutineModal } from './RoutineModal';
import { ExerciseDetailModal } from '@/components/exercises/ExerciseDetailModal';
import { Plus, Play, Edit3, Trash2, Info } from 'lucide-react';

interface RoutinesViewProps {
  routines: Routine[];
  hiddenRoutines?: Routine[];
  exercises: Exercise[];
  workouts?: Workout[];
  hasActiveWorkout: boolean;
  onStartWorkout: (r: Routine) => void;
  onSaveRoutine: (r: Routine) => Promise<Routine>;
  onDeleteRoutine: (id: string) => Promise<void>;
  onRestoreRoutine?: (id: string) => Promise<void>;
  onSaveExerciseNote?: (exerciseId: string, notes: string) => Promise<void>;
  C: Colors;
  t: Translations;
}

export const RoutinesView: React.FC<RoutinesViewProps> = ({
  routines,
  hiddenRoutines = [],
  exercises,
  workouts = [],
  hasActiveWorkout,
  onStartWorkout,
  onSaveRoutine,
  onDeleteRoutine,
  onRestoreRoutine,
  onSaveExerciseNote,
  C,
  t,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(routines[0]?.id || null);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [selectedExForDetail, setSelectedExForDetail] = useState<Exercise | null>(null);

  const activeRoutine = routines.find((r) => r.id === selectedId) || routines[0] || null;
  const routineToDelete = routines.find((r) => r.id === confirmDeleteId) || null;

  const getEx = (id: string) => {
    return exercises.find((e) => e.id === id);
  };

  return (
    <div className="h-full overflow-y-auto pb-24 md:pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-3">
          <div>
            <span className="font-mono text-xs uppercase" style={{ color: C.orange }}>
              PLANOWANIE I STRUKTURA
            </span>
            <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tight" style={{ color: C.text }}>
              {t.routinesTitle}
            </h1>
          </div>
          <Button C={C} small onClick={() => setIsNewOpen(true)}>
            <Plus size={16} /> {t.newRoutine}
          </Button>
        </div>

        {/* Responsive layout: List on left/top, Details on right/bottom */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Routines selector tabs / cards */}
          <div className="md:col-span-4 space-y-2">
            <span className="block font-display font-bold text-xs tracking-widest uppercase mb-2" style={{ color: C.muted }}>
              {t.availableRoutines} ({routines.length})
            </span>
            {routines.map((r) => {
              const isSelected = activeRoutine?.id === r.id;
              const totalSets = r.exercises.reduce((s, e) => s + e.targetSets, 0);
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className="w-full text-left p-3.5 transition-all cursor-pointer flex flex-col justify-between"
                  style={{
                    background: isSelected ? C.surface : C.card,
                    border: `1px solid ${isSelected ? C.orange : C.border}`,
                    borderLeft: `4px solid ${isSelected ? C.orange : 'transparent'}`,
                  }}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="font-display font-bold text-base tracking-wide"
                      style={{ color: isSelected ? C.orange : C.text }}
                    >
                      {r.name.toUpperCase()}
                    </span>
                    <span
                      className="font-mono text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider"
                      style={
                        r.isPredefined
                          ? { background: C.orange + '18', color: C.orange }
                          : { background: C.violet + '22', color: C.violet }
                      }
                    >
                      {r.isPredefined ? t.predefinedBadge : t.ownBadge}
                    </span>
                  </div>
                  <div className="font-mono text-xs mt-1" style={{ color: C.muted }}>
                    {r.exercises.length} {t.exercise.toLowerCase()} · {totalSets} {t.setsLabel.toLowerCase()}
                  </div>
                </button>
              );
            })}

            {routines.length === 0 && (
              <div
                className="p-6 text-center border border-dashed"
                style={{ borderColor: C.border, color: C.muted }}
              >
                <p className="font-mono text-xs mb-3">{t.noRoutines}</p>
                <Button small C={C} onClick={() => setIsNewOpen(true)}>
                  {t.newRoutine}
                </Button>
              </div>
            )}

            {/* Predefined plans hidden by this user - they can be restored */}
            {hiddenRoutines.length > 0 && (
              <div className="pt-3 mt-1 border-t" style={{ borderColor: C.border }}>
                <button
                  type="button"
                  onClick={() => setShowHidden((v) => !v)}
                  className="font-display font-bold text-xs tracking-widest uppercase cursor-pointer"
                  style={{ color: C.muted }}
                >
                  {t.hiddenRoutines} ({hiddenRoutines.length}) {showHidden ? '▾' : '▸'}
                </button>

                {showHidden && (
                  <div className="space-y-2 mt-2">
                    {hiddenRoutines.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between gap-2 p-2.5"
                        style={{ background: C.card, border: `1px solid ${C.border}` }}
                      >
                        <span
                          className="font-display font-bold text-sm truncate"
                          style={{ color: C.muted }}
                        >
                          {r.name.toUpperCase()}
                        </span>
                        {onRestoreRoutine && (
                          <Button
                            small
                            variant="outline"
                            onClick={() => onRestoreRoutine(r.id)}
                            C={C}
                          >
                            {t.restore}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Routine detail card */}
          {activeRoutine && (
            <div
              className="md:col-span-8 p-5 sm:p-6 slide-up"
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderTop: `3px solid ${C.orange}`,
              }}
            >
              <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
                <div>
                  <h2 className="font-display font-black text-2xl sm:text-3xl tracking-tight" style={{ color: C.text }}>
                    {activeRoutine.name.toUpperCase()}
                  </h2>
                  <p className="font-mono text-xs mt-0.5" style={{ color: C.muted }}>
                    {activeRoutine.exercises.length} ćwiczeń w planie
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    C={C}
                    small
                    variant="outline"
                    onClick={() => setEditingRoutine(activeRoutine)}
                  >
                    <Edit3 size={13} /> {t.edit}
                  </Button>

                  <Button
                    C={C}
                    small
                    onClick={() => onStartWorkout(activeRoutine)}
                    disabled={hasActiveWorkout}
                  >
                    <Play size={13} /> {t.start}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(activeRoutine.id)}
                    className="font-mono text-xs p-2 hover:text-red-500 cursor-pointer transition-colors"
                    style={{ color: C.muted }}
                    title={t.delete}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Exercises table */}
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-sm">
                  <thead>
                    <tr
                      className="font-display font-bold text-xs tracking-widest border-b"
                      style={{ color: C.muted, borderColor: C.border }}
                    >
                      <th className="w-auto text-left pb-2.5 pr-3 uppercase">{t.exercise}</th>
                      <th className="w-[34%] hidden sm:table-cell text-left pb-2.5 pr-3 uppercase">{t.muscle}</th>
                      <th className="w-14 sm:w-16 text-right pb-2.5 pr-3 uppercase">{t.series}</th>
                      <th className="w-14 sm:w-16 text-right pb-2.5 uppercase">{t.reps}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRoutine.exercises.map((e, i) => {
                      const exObj = getEx(e.exerciseId);
                      return (
                        <tr
                          key={i}
                          className="border-b transition-colors"
                          style={{ borderColor: C.dim }}
                        >
                          <td className="py-3 pr-3 break-words" style={{ color: C.text }}>
                            <button
                              type="button"
                              onClick={() => exObj && setSelectedExForDetail(exObj)}
                              className="hover:underline hover:text-gym-orange text-left font-bold cursor-pointer inline-flex items-start gap-1.5 min-w-0"
                              title="Kliknij, aby zobaczyć opis i wskazówki techniczne"
                            >
                              <span className="min-w-0 break-words">{exObj?.name || e.exerciseId}</span>
                              <Info size={13} className="text-gray-400 opacity-60 hover:opacity-100 shrink-0 mt-0.5" />
                            </button>
                          </td>
                          <td className="py-3 pr-3 font-mono text-xs hidden sm:table-cell break-words" style={{ color: C.muted }}>
                            {exObj?.muscle || '—'}
                          </td>
                          <td className="py-3 pr-3 text-right font-mono font-bold text-base whitespace-nowrap" style={{ color: C.orange }}>
                            {e.targetSets}
                          </td>
                          <td className="py-3 text-right font-mono text-xs whitespace-nowrap" style={{ color: C.muted }}>
                            {e.targetReps}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Routine Create / Edit Modal */}
        {(isNewOpen || editingRoutine) && (
          <RoutineModal
            routine={editingRoutine}
            allExercises={exercises}
            onSave={onSaveRoutine}
            onClose={(saved) => {
              setIsNewOpen(false);
              setEditingRoutine(null);
              if (saved?.id) setSelectedId(saved.id);
            }}
            C={C}
            t={t}
          />
        )}

        {/* Exercise Detail & Description Modal */}
        {selectedExForDetail && (
          <ExerciseDetailModal
            exercise={selectedExForDetail}
            workouts={workouts}
            onSaveNote={async (exId, notes) => {
              if (onSaveExerciseNote) {
                await onSaveExerciseNote(exId, notes);
              }
              setSelectedExForDetail((prev) => (prev ? { ...prev, notes } : null));
            }}
            onClose={() => setSelectedExForDetail(null)}
            C={C}
            t={t}
          />
        )}

        {/* Confirm Delete Routine Modal */}
        {confirmDeleteId && (
          <Modal onClose={() => setConfirmDeleteId(null)} C={C}>
            <h3 className="font-display font-bold text-lg tracking-tight mb-2" style={{ color: C.text }}>
              {t.confirmDelete}
            </h3>
            <p className="font-mono text-xs mb-5" style={{ color: C.muted }}>
              {routineToDelete?.isPredefined
                ? t.deletePredefinedRoutineInfo
                : t.deleteOwnRoutineInfo}
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" small onClick={() => setConfirmDeleteId(null)} C={C}>
                {t.cancel}
              </Button>
              <Button
                variant="danger"
                small
                onClick={async () => {
                  await onDeleteRoutine(confirmDeleteId);
                  setConfirmDeleteId(null);
                  setSelectedId(routines.find((r) => r.id !== confirmDeleteId)?.id || null);
                }}
                C={C}
              >
                {t.delete}
              </Button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};
