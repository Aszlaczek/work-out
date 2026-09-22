import React from 'react';
import { Colors } from '@/lib/theme';
import { Translations } from '@/lib/i18n';

export type ViewType = 'dashboard' | 'routines' | 'exercises' | 'calendar' | 'workout' | 'progress' | 'settings';

interface HeaderProps {
  view: ViewType;
  setView: (v: ViewType) => void;
  hasActive: boolean;
  onLogout: () => void;
  isCloudConnected: boolean;
  C: Colors;
  t: Translations;
}

export const Header: React.FC<HeaderProps> = ({
  view,
  setView,
  hasActive,
  onLogout,
  isCloudConnected,
  C,
  t,
}) => {
  const links: { label: string; v: ViewType }[] = [
    { label: t.dashboard, v: 'dashboard' },
    { label: t.routines, v: 'routines' },
    { label: t.exercises, v: 'exercises' },
    { label: t.calendar, v: 'calendar' },
    { label: t.progress, v: 'progress' },
  ];

  return (
    <header
      className="hidden md:flex items-center px-6 h-14 shrink-0 gap-1 z-30 sticky top-0"
      style={{
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      {/* Brand logo */}
      <button
        onClick={() => setView('dashboard')}
        className="flex items-center gap-2 mr-6 shrink-0 group focus:outline-none"
      >
        <span
          className="font-display font-black text-2xl tracking-widest leading-none select-none transition-transform group-hover:scale-105"
          style={{ color: C.orange }}
        >
          GP
        </span>
        <span className="font-display font-black text-xs tracking-widest text-left hidden lg:block" style={{ color: C.text }}>
          GYM<span style={{ color: C.orange }}>PROGRESS</span>
        </span>
      </button>

      {/* Nav links */}
      <nav className="flex items-center gap-1 overflow-x-auto">
        {links.map(({ label, v }) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="font-display font-bold text-xs tracking-widest px-3.5 py-2 shrink-0 transition-all cursor-pointer"
            style={{
              color: view === v ? C.orange : C.muted,
              borderBottom: view === v ? `2px solid ${C.orange}` : '2px solid transparent',
            }}
          >
            {label}
          </button>
        ))}

        {hasActive && (
          <button
            onClick={() => setView('workout')}
            className="flex items-center gap-1.5 font-display font-bold text-xs tracking-widest px-3.5 py-2 shrink-0 transition-all cursor-pointer ml-2"
            style={{
              color: view === 'workout' ? C.cyan : C.cyan,
              background: C.cyan + '18',
              borderBottom: view === 'workout' ? `2px solid ${C.cyan}` : `1px solid ${C.cyan}44`,
            }}
          >
            <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: C.cyan }} />
            {t.workout}
          </button>
        )}
      </nav>

      {/* Right actions: Supabase status indicator + Settings + Logout */}
      <div className="ml-auto flex items-center gap-3 shrink-0">
        <div
          className="hidden xl:flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1"
          style={{
            background: isCloudConnected ? '#10b98118' : '#eab30818',
            color: isCloudConnected ? '#34d399' : '#facc15',
            border: `1px solid ${isCloudConnected ? '#10b98144' : '#eab30844'}`,
          }}
          title={isCloudConnected ? 'Baza danych Supabase podłączona' : 'Tryb lokalny (dane zapisywane w przeglądarce)'}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: isCloudConnected ? '#34d399' : '#facc15' }}
          />
          {isCloudConnected ? 'SUPABASE CLOUD' : 'LOCAL DEMO'}
        </div>

        <button
          onClick={() => setView('settings')}
          className="font-display font-bold text-xs tracking-widest px-3 py-2 transition-all cursor-pointer"
          style={{
            color: view === 'settings' ? C.orange : C.muted,
            borderBottom: view === 'settings' ? `2px solid ${C.orange}` : '2px solid transparent',
          }}
        >
          ⚙ {t.settings}
        </button>

        <button
          onClick={onLogout}
          className="font-mono text-xs px-2.5 py-1.5 transition-all cursor-pointer hover:underline"
          style={{ color: C.muted }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.danger)}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
        >
          {t.logout}
        </button>
      </div>
    </header>
  );
};
