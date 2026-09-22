'use client';

import React, { useState, useMemo } from 'react';
import { Colors } from '@/lib/theme';
import { Translations } from '@/lib/i18n';
import { Workout, Exercise } from '@/lib/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

interface ProgressViewProps {
  workouts: Workout[];
  exercises: Exercise[];
  C: Colors;
  t: Translations;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  workouts,
  exercises,
  C,
  t,
}) => {
  const [selectedExId, setSelectedExId] = useState<string>('bench');

  // Exercises that have at least one logged set
  const exercisesWithData = useMemo(() => {
    const ids = new Set(
      workouts.flatMap((w) => w.exercises.map((e) => e.exerciseId))
    );
    const list = exercises.filter((e) => ids.has(e.id));
    return list.length > 0 ? list : exercises.slice(0, 5);
  }, [workouts, exercises]);

  // Chart data: date -> max load in that workout session
  const chartData = useMemo(() => {
    return workouts
      .filter((w) => w.exercises.some((e) => e.exerciseId === selectedExId))
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .map((w) => {
        const ex = w.exercises.find((e) => e.exerciseId === selectedExId)!;
        const max = Math.max(
          ...ex.sets
            .filter((s) => s.done)
            .map((s) => Number(s.weight) || 0),
          0
        );
        return {
          date: w.date.slice(5),
          fullDate: w.date,
          load: max,
        };
      });
  }, [workouts, selectedExId]);

  const pr = chartData.length > 0 ? Math.max(...chartData.map((d) => d.load)) : 0;
  const avg =
    chartData.length > 0
      ? Math.round(chartData.reduce((s, d) => s + d.load, 0) / chartData.length)
      : 0;
  const trend =
    chartData.length >= 2 ? chartData.at(-1)!.load - chartData[0].load : 0;

  const currentExName =
    exercises.find((e) => e.id === selectedExId)?.name || selectedExId;

  return (
    <div className="h-full overflow-y-auto pb-24 md:pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <span className="font-mono text-xs uppercase" style={{ color: C.orange }}>
            REKORDY I OBCIĄŻENIA
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tight" style={{ color: C.text }}>
            {t.progressTitle}
          </h1>
        </div>

        {/* Exercise selector buttons */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-6">
          {exercisesWithData.map((e) => {
            const isSelected = selectedExId === e.id;
            return (
              <button
                key={e.id}
                onClick={() => setSelectedExId(e.id)}
                className="font-display font-bold text-xs tracking-widest px-3 py-1.5 transition-all cursor-pointer select-none"
                style={{
                  background: isSelected ? C.orange : C.card,
                  color: isSelected ? '#ffffff' : C.muted,
                  border: `1px solid ${isSelected ? C.orange : C.border}`,
                }}
              >
                {e.name.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-6">
          {[
            { label: t.pr, val: pr > 0 ? `${pr} kg` : '—', color: C.text },
            { label: t.average, val: avg > 0 ? `${avg} kg` : '—', color: C.text },
            {
              label: t.trend,
              val: trend !== 0 ? `${trend > 0 ? '+' : ''}${trend} kg` : '—',
              color: trend > 0 ? C.cyan : trend < 0 ? C.danger : C.muted,
            },
          ].map(({ label, val, color }) => (
            <div
              key={label}
              className="p-3.5 sm:p-5"
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderTop: `3px solid ${C.orange}`,
              }}
            >
              <div className="font-display font-bold text-[10px] sm:text-xs tracking-widest mb-1" style={{ color: C.muted }}>
                {label}
              </div>
              <div className="font-mono font-bold text-xl sm:text-2xl" style={{ color }}>
                {val}
              </div>
            </div>
          ))}
        </div>

        {/* Recharts Progression Container */}
        <div
          className="p-5 sm:p-6"
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
          }}
        >
          <div className="font-display font-bold text-xs tracking-widest uppercase mb-6" style={{ color: C.muted }}>
            {currentExName.toUpperCase()} — {t.maxLoad}
          </div>

          {chartData.length >= 2 ? (
            <div className="w-full h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke={C.dim} strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: C.muted, fontFamily: 'JetBrains Mono', fontSize: 10 }}
                    axisLine={{ stroke: C.border }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: C.muted, fontFamily: 'JetBrains Mono', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  {pr > 0 && (
                    <ReferenceLine
                      y={pr}
                      stroke={C.violet}
                      strokeDasharray="4 4"
                      label={{
                        value: `PR ${pr}kg`,
                        fill: C.violet,
                        fontSize: 10,
                        fontFamily: 'JetBrains Mono',
                        position: 'right',
                      }}
                    />
                  )}
                  <Tooltip
                    contentStyle={{
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: 0,
                      fontFamily: 'JetBrains Mono',
                      fontSize: 11,
                      color: C.text,
                    }}
                    labelStyle={{ color: C.muted }}
                    cursor={{ stroke: C.dim }}
                    formatter={(value: any) => [`${value} kg`, 'Maksymalny ciężar']}
                  />
                  <Line
                    type="monotone"
                    dataKey="load"
                    stroke={C.orange}
                    strokeWidth={2.5}
                    dot={{ fill: C.orange, r: 4, strokeWidth: 0 }}
                    activeDot={{ fill: '#ff7730', r: 6, strokeWidth: 0 }}
                    name="kg"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center p-4">
              <p className="font-mono text-xs sm:text-sm mb-2" style={{ color: C.muted }}>
                {t.notEnoughData}
              </p>
              <p className="font-mono text-[11px]" style={{ color: C.muted }}>
                Zapisz treningi zawierające to ćwiczenie, aby zobaczyć krzywą progresu ciężaru.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
