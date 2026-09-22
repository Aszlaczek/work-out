import React, { useState, useMemo } from 'react';
import { Colors } from '@/lib/theme';
import { Translations } from '@/lib/i18n';
import { Workout, Routine } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Edit3, Eye, ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react';

interface CalendarViewProps {
  workouts: Workout[];
  routines: Routine[];
  onViewWorkout: (w: Workout) => void;
  onEditWorkout: (w: Workout) => void;
  onStartWorkout: (r: Routine) => void;
  C: Colors;
  t: Translations;
  lang: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  workouts,
  routines,
  onViewWorkout,
  onEditWorkout,
  onStartWorkout,
  C,
  t,
  lang,
}) => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(
    today.toISOString().slice(0, 10)
  );

  const locale = lang === 'pl' ? 'pl-PL' : 'en-GB';

  const workoutMap = useMemo(() => {
    const map: Record<string, Workout[]> = {};
    workouts.forEach((w) => {
      if (!map[w.date]) map[w.date] = [];
      map[w.date].push(w);
    });
    return map;
  }, [workouts]);

  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from(
    { length: offset + daysInMonth },
    (_, i) => (i < offset ? null : i - offset + 1)
  );

  const monthLabel = new Date(year, month)
    .toLocaleDateString(locale, { month: 'long', year: 'numeric' })
    .toUpperCase();

  const isoDate = (d: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const selectedWorkouts = workoutMap[selectedDate] || [];
  const selectedFormatted = new Date(selectedDate).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).toUpperCase();

  return (
    <div className="h-full overflow-y-auto pb-24 md:pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-4">
          <div>
            <span className="font-mono text-xs uppercase" style={{ color: C.orange }}>
              HISTORIA I HARMONOGRAM
            </span>
            <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tight" style={{ color: C.text }}>
              {t.calendarTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="font-mono text-sm p-2 transition-all cursor-pointer flex items-center justify-center border"
              style={{ background: C.card, color: C.text, borderColor: C.border }}
              title="Poprzedni miesiąc"
            >
              <ChevronLeft size={16} />
            </button>
            <span
              className="font-display font-bold text-sm tracking-widest min-w-[140px] text-center uppercase"
              style={{ color: C.text }}
            >
              {monthLabel}
            </span>
            <button
              onClick={nextMonth}
              className="font-mono text-sm p-2 transition-all cursor-pointer flex items-center justify-center border"
              style={{ background: C.card, color: C.text, borderColor: C.border }}
              title="Następny miesiąc"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 mb-1 gap-1">
          {t.weekdays.map((d) => (
            <div
              key={d}
              className="font-display font-bold text-xs tracking-widest text-center py-2 uppercase select-none"
              style={{ color: C.muted }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-6">
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={i} className="aspect-square opacity-0" />;
            }
            const iso = isoDate(day);
            const ws = workoutMap[iso] || [];
            const isToday = iso === today.toISOString().slice(0, 10);
            const isSelected = iso === selectedDate;

            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedDate(iso)}
                className="aspect-square flex flex-col items-center justify-center transition-all cursor-pointer relative"
                style={{
                  background: isSelected
                    ? C.surface
                    : ws.length > 0
                    ? C.card
                    : 'transparent',
                  border: isSelected
                    ? `2px solid ${C.orange}`
                    : isToday
                    ? `1px solid ${C.cyan}`
                    : `1px solid ${ws.length > 0 ? C.border : 'transparent'}`,
                }}
              >
                <span
                  className="font-mono text-xs sm:text-sm font-bold"
                  style={{
                    color: isSelected
                      ? C.orange
                      : isToday
                      ? C.cyan
                      : ws.length > 0
                      ? C.text
                      : C.muted,
                  }}
                >
                  {day}
                </span>

                {ws.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {ws.slice(0, 3).map((_, j) => (
                      <span
                        key={j}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: C.orange }}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected date drawer / workouts list */}
        <div
          className="p-5 slide-up"
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderTop: `3px solid ${C.orange}`,
          }}
        >
          <div className="flex items-center justify-between mb-4 border-b pb-3" style={{ borderColor: C.border }}>
            <div>
              <span className="font-mono text-xs tracking-wider" style={{ color: C.muted }}>
                WYBRANY DZIEŃ
              </span>
              <h2 className="font-display font-black text-xl tracking-tight" style={{ color: C.text }}>
                {selectedFormatted}
              </h2>
            </div>
            <span className="font-mono text-xs" style={{ color: C.orange }}>
              {selectedWorkouts.length} {selectedWorkouts.length === 1 ? 'trening' : 'treningi'}
            </span>
          </div>

          {selectedWorkouts.length > 0 ? (
            <div className="space-y-3">
              {selectedWorkouts.map((w) => {
                const totalSets = w.exercises.reduce(
                  (s, e) => s + e.sets.filter((x) => x.done).length,
                  0
                );
                return (
                  <div
                    key={w.id}
                    className="p-3.5 flex items-center justify-between gap-3 border"
                    style={{ background: C.surface, borderColor: C.border, borderLeft: `3px solid ${C.violet}` }}
                  >
                    <div>
                      <div className="font-display font-bold text-base tracking-wide" style={{ color: C.text }}>
                        {w.routineName}
                      </div>
                      <div className="font-mono text-xs mt-0.5" style={{ color: C.muted }}>
                        {w.duration} min · {totalSets} {t.sets.toLowerCase()} ukończonych
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        small
                        variant="ghost"
                        onClick={() => onViewWorkout(w)}
                        C={C}
                      >
                        <Eye size={13} /> {t.viewOrEdit}
                      </Button>
                      <Button
                        small
                        variant="outline"
                        onClick={() => onEditWorkout(w)}
                        C={C}
                      >
                        <Edit3 size={13} /> {t.edit}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="font-mono text-xs mb-4" style={{ color: C.muted }}>
                {t.noWorkoutsOnDay}
              </p>
              {routines.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {routines.slice(0, 3).map((r) => (
                    <Button
                      key={r.id}
                      small
                      variant="ghost"
                      onClick={() => onStartWorkout(r)}
                      C={C}
                    >
                      <Plus size={13} /> Rozpocznij: {r.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
