import React, { useState } from 'react';
import { Colors } from '@/lib/theme';
import { Translations } from '@/lib/i18n';
import { Exercise, ExerciseCategory, Workout } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { Plus, Trash2, Search, FileText, ChevronRight } from 'lucide-react';
import { mkId } from '@/lib/repository';

interface ExercisesViewProps {
  exercises: Exercise[];
  workouts: Workout[];
  onAddExercise: (ex: Exercise) => Promise<void>;
  onUpdateExercise: (ex: Exercise) => Promise<void>;
  onSaveExerciseNote: (exerciseId: string, notes: string) => Promise<void>;
  onDeleteExercise: (id: string) => Promise<void>;
  onViewProgress?: (exerciseId: string) => void;
  C: Colors;
  t: Translations;
}

export const ExercisesView: React.FC<ExercisesViewProps> = ({
  exercises,
  workouts,
  onAddExercise,
  onUpdateExercise,
  onSaveExerciseNote,
  onDeleteExercise,
  onViewProgress,
  C,
  t,
}) => {
  const [filter, setFilter] = useState<'all' | 'custom'>('all');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [cat, setCat] = useState<ExerciseCategory>('push');
  const [muscle, setMuscle] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const categories: { val: string; label: string }[] = [
    { val: 'all', label: t.allEx },
    { val: 'push', label: t.push.toUpperCase() },
    { val: 'pull', label: t.pull.toUpperCase() },
    { val: 'legs', label: t.legs.toUpperCase() },
    { val: 'core', label: t.core.toUpperCase() },
  ];

  const visible = exercises.filter((e) => {
    if (filter === 'custom' && !e.isCustom) return false;
    if (catFilter !== 'all' && e.category !== catFilter) return false;
    if (search.trim() && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const id = 'custom-' + name.toLowerCase().replace(/\s+/g, '-') + '-' + mkId();
      const ex: Exercise = {
        id,
        name: name.trim(),
        category: cat,
        muscle: muscle.trim() || cat,
        isCustom: true,
      };
      await onAddExercise(ex);
      setName('');
      setMuscle('');
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNoteModal = async (exerciseId: string, notes: string) => {
    await onSaveExerciseNote(exerciseId, notes);
    if (selectedExercise && selectedExercise.id === exerciseId) {
      setSelectedExercise({ ...selectedExercise, notes });
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-24 md:pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-3">
          <div>
            <span className="font-mono text-xs uppercase" style={{ color: C.orange }}>
              KATALOG RUCHÓW & OPISY
            </span>
            <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tight" style={{ color: C.text }}>
              {t.exercisesTitle}
            </h1>
          </div>
          <Button C={C} small onClick={() => setShowForm((v) => !v)}>
            <Plus size={15} /> {t.newExercise}
          </Button>
        </div>

        {/* Add Exercise Modal / Form */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="p-5 mb-6 slide-up"
            style={{ background: C.card, border: `1px solid ${C.border}`, borderTop: `3px solid ${C.orange}` }}
          >
            <h2 className="font-display font-black text-lg tracking-tight mb-3" style={{ color: C.text }}>
              DODAJ WŁASNE ĆWICZENIE
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <Field
                label={t.exName}
                value={name}
                onChange={setName}
                placeholder="np. Wyciskanie sztangielek"
                required
                C={C}
              />
              <div>
                <label className="block font-display font-bold text-xs tracking-widest mb-1.5" style={{ color: C.muted }}>
                  {t.category}
                </label>
                <select
                  value={cat}
                  onChange={(e) => setCat(e.target.value as ExerciseCategory)}
                  className="w-full px-4 py-3 font-mono text-sm outline-none rounded-none"
                  style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}
                >
                  <option value="push">{t.push}</option>
                  <option value="pull">{t.pull}</option>
                  <option value="legs">{t.legs}</option>
                  <option value="core">{t.core}</option>
                </select>
              </div>
              <Field
                label={t.muscleGroup}
                value={muscle}
                onChange={setMuscle}
                placeholder="np. Klatka piersiowa"
                C={C}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" small onClick={() => setShowForm(false)} C={C}>
                {t.cancel}
              </Button>
              <Button type="submit" small disabled={saving || !name.trim()} C={C}>
                {saving ? '...' : t.save}
              </Button>
            </div>
          </form>
        )}

        {/* Search bar */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder={t.searchExercise}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 font-mono text-xs outline-none transition-all"
            style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}
          />
          <Search size={16} className="absolute left-3.5 top-3" style={{ color: C.muted }} />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-6">
          {categories.map((c) => (
            <button
              key={c.val}
              onClick={() => setCatFilter(c.val)}
              className="font-display font-bold text-xs tracking-widest px-3 py-1.5 transition-all cursor-pointer select-none"
              style={{
                background: catFilter === c.val ? C.orange : C.card,
                color: catFilter === c.val ? '#ffffff' : C.muted,
                border: `1px solid ${catFilter === c.val ? C.orange : C.border}`,
              }}
            >
              {c.label}
            </button>
          ))}

          <button
            onClick={() => setFilter(filter === 'all' ? 'custom' : 'all')}
            className="font-display font-bold text-xs tracking-widest px-3 py-1.5 ml-auto transition-all cursor-pointer select-none"
            style={{
              background: filter === 'custom' ? C.violet : C.card,
              color: filter === 'custom' ? '#ffffff' : C.muted,
              border: `1px solid ${filter === 'custom' ? C.violet : C.border}`,
            }}
          >
            {t.customOnly}
          </button>
        </div>

        {/* Exercises List - Clicking any item opens its description/details */}
        <div className="space-y-2">
          {visible.map((e) => (
            <div
              key={e.id}
              onClick={() => setSelectedExercise(e)}
              className="p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-all cursor-pointer group"
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${e.isCustom ? C.violet : C.dim}`,
              }}
              onMouseEnter={(x) => {
                x.currentTarget.style.borderColor = C.orange;
              }}
              onMouseLeave={(x) => {
                x.currentTarget.style.borderColor = C.border;
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-display font-bold text-base sm:text-lg group-hover:text-gym-orange transition-colors truncate" style={{ color: C.text }}>
                    {e.name}
                  </span>
                  {e.isCustom && (
                    <span
                      className="font-mono text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider"
                      style={{ background: C.violet + '22', color: C.violet }}
                    >
                      CUSTOM
                    </span>
                  )}
                  {e.notes && (
                    <span
                      className="font-mono text-[10px] px-1.5 py-0.5 flex items-center gap-1"
                      style={{ background: C.orange + '18', color: C.orange }}
                      title="Posiada własny opis / wskazówki"
                    >
                      <FileText size={11} /> OPIS
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 font-mono text-xs" style={{ color: C.muted }}>
                  <span>{e.muscle}</span>
                  <span>·</span>
                  <span className="uppercase">{e.category}</span>
                </div>

                {e.notes && (
                  <p className="font-mono text-[11px] mt-1.5 truncate text-gray-400 italic">
                    "{e.notes}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-xs hidden sm:inline-block" style={{ color: C.muted }}>
                  Szczegóły / Opis
                </span>
                <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}

          {visible.length === 0 && (
            <div
              className="p-8 text-center border border-dashed"
              style={{ borderColor: C.border, color: C.muted }}
            >
              <p className="font-mono text-xs">Brak ćwiczeń spełniających kryteria.</p>
            </div>
          )}
        </div>

        {/* Exercise Detail & Description Modal */}
        {selectedExercise && (
          <ExerciseDetailModal
            exercise={selectedExercise}
            workouts={workouts}
            onSaveNote={handleSaveNoteModal}
            onUpdateCustomExercise={onUpdateExercise}
            onDeleteExercise={onDeleteExercise}
            onViewProgress={onViewProgress}
            onClose={() => setSelectedExercise(null)}
            C={C}
            t={t}
          />
        )}
      </div>
    </div>
  );
};
