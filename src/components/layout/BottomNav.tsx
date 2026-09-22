import React from 'react';
import { Colors } from '@/lib/theme';
import { Translations } from '@/lib/i18n';
import { ViewType } from './Header';
import {
  LayoutDashboard,
  ClipboardList,
  Dumbbell,
  CalendarDays,
  TrendingUp,
  Settings,
  Flame,
} from 'lucide-react';

interface BottomNavProps {
  view: ViewType;
  setView: (v: ViewType) => void;
  hasActive: boolean;
  activeRoutineName?: string;
  C: Colors;
  t: Translations;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  view,
  setView,
  hasActive,
  activeRoutineName,
  C,
  t,
}) => {
  const items: { label: string; v: ViewType; icon: React.ReactNode }[] = [
    { label: t.dashboard, v: 'dashboard', icon: <LayoutDashboard size={18} /> },
    { label: t.routines, v: 'routines', icon: <ClipboardList size={18} /> },
    { label: t.exercises, v: 'exercises', icon: <Dumbbell size={18} /> },
    { label: t.calendar, v: 'calendar', icon: <CalendarDays size={18} /> },
    { label: t.progress, v: 'progress', icon: <TrendingUp size={18} /> },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
      {/* Active workout quick action banner */}
      {hasActive && view !== 'workout' && (
        <button
          onClick={() => setView('workout')}
          className="w-full px-4 py-2.5 flex items-center justify-between border-t transition-all active:brightness-110"
          style={{
            background: C.surface,
            borderColor: C.cyan,
            color: C.cyan,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full pulse-dot" style={{ background: C.cyan }} />
            <span className="font-display font-black text-xs tracking-widest uppercase">
              {t.activeWorkout}: {activeRoutineName}
            </span>
          </div>
          <span className="font-mono text-xs underline font-bold">WRÓĆ DO TRENINGU →</span>
        </button>
      )}

      {/* Main bottom navigation bar */}
      <nav
        className="flex items-center justify-around h-16 border-t px-1 pb-safe"
        style={{
          background: C.surface,
          borderColor: C.border,
        }}
      >
        {items.map(({ label, v, icon }) => {
          const isActive = view === v;
          return (
            <button
              key={v}
              onClick={() => setView(v)}
              className="flex-1 flex flex-col items-center justify-center py-1 gap-1 transition-all active:scale-95"
              style={{
                color: isActive ? C.orange : C.muted,
              }}
            >
              <div
                className="transition-transform"
                style={{
                  transform: isActive ? 'translateY(-1px)' : 'none',
                }}
              >
                {icon}
              </div>
              <span className="font-display font-bold text-[10px] tracking-wider uppercase leading-none">
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export const MobileHeader: React.FC<{
  view: ViewType;
  setView: (v: ViewType) => void;
  hasActive: boolean;
  onLogout: () => void;
  isCloudConnected: boolean;
  C: Colors;
  t: Translations;
}> = ({ view, setView, hasActive, onLogout, isCloudConnected, C, t }) => {
  return (
    <header
      className="md:hidden flex items-center justify-between px-4 h-12 shrink-0 border-b z-30 sticky top-0"
      style={{
        background: C.surface,
        borderColor: C.border,
      }}
    >
      <button
        onClick={() => setView('dashboard')}
        className="flex items-center gap-2 focus:outline-none"
      >
        <span className="font-display font-black text-xl tracking-widest" style={{ color: C.orange }}>
          GP
        </span>
        <span className="font-display font-bold text-xs tracking-widest" style={{ color: C.text }}>
          GYM<span style={{ color: C.orange }}>PROGRESS</span>
        </span>
      </button>

      <div className="flex items-center gap-2">
        {hasActive && (
          <button
            onClick={() => setView('workout')}
            className="flex items-center gap-1 font-display font-bold text-[11px] tracking-wider px-2 py-1"
            style={{ background: C.cyan + '22', color: C.cyan, border: `1px solid ${C.cyan}66` }}
          >
            <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: C.cyan }} />
            {t.workout}
          </button>
        )}

        <button
          onClick={() => setView('settings')}
          className="p-1.5 text-xs font-mono"
          style={{ color: view === 'settings' ? C.orange : C.muted }}
          aria-label={t.settings}
        >
          <Settings size={18} />
        </button>

        <button
          onClick={onLogout}
          className="font-mono text-xs px-2 py-1"
          style={{ color: C.muted }}
          title={t.logout}
        >
          {t.logout}
        </button>
      </div>
    </header>
  );
};
