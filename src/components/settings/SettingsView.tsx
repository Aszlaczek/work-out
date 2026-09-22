import React, { useState } from 'react';
import { Colors, Theme } from '@/lib/theme';
import { Translations, Lang } from '@/lib/i18n';
import { AppUser } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { repository } from '@/lib/repository';
import { ShieldAlert, Database, Palette, Globe, User } from 'lucide-react';

interface SettingsViewProps {
  user: AppUser | null;
  theme: Theme;
  setTheme: (t: Theme) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  onDeleteAccount: () => Promise<void>;
  onResetLocalData: () => void;
  C: Colors;
  t: Translations;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  theme,
  setTheme,
  lang,
  setLang,
  onDeleteAccount,
  onResetLocalData,
  C,
  t,
}) => {
  const [deleteInput, setDeleteInput] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isCloud = repository.isCloudConnected();

  const handleDelete = async () => {
    if (deleteInput !== 'DELETE') return;
    setDeleting(true);
    try {
      await onDeleteAccount();
    } finally {
      setDeleting(false);
    }
  };

  const Section = ({
    title,
    icon,
    children,
  }: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div
      className="p-5 sm:p-6 mb-4"
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${C.border}`,
      }}
    >
      <div className="flex items-center gap-2 font-display font-bold text-xs tracking-widest uppercase mb-4" style={{ color: C.muted }}>
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto pb-24 md:pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <span className="font-mono text-xs uppercase" style={{ color: C.orange }}>
            KONFIGURACJA
          </span>
          <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tight" style={{ color: C.text }}>
            {t.settingsTitle}
          </h1>
        </div>

        {/* Appearance */}
        <Section title={t.appearance} icon={<Palette size={15} />}>
          <div className="flex items-center justify-between gap-4">
            <span className="font-display font-bold text-sm tracking-wide" style={{ color: C.text }}>
              {t.theme}
            </span>
            <div className="w-48 max-w-[50%]">
              <Toggle
                value={theme}
                onChange={(v) => setTheme(v as Theme)}
                optA={{ val: 'dark', label: t.dark }}
                optB={{ val: 'light', label: t.light }}
                C={C}
              />
            </div>
          </div>
        </Section>

        {/* Language */}
        <Section title={t.language} icon={<Globe size={15} />}>
          <div className="flex items-center justify-between gap-4">
            <span className="font-display font-bold text-sm tracking-wide" style={{ color: C.text }}>
              {t.language}
            </span>
            <div className="w-48 max-w-[50%]">
              <Toggle
                value={lang}
                onChange={(v) => setLang(v as Lang)}
                optA={{ val: 'pl', label: 'POLSKI' }}
                optB={{ val: 'en', label: 'ENGLISH' }}
                C={C}
              />
            </div>
          </div>
        </Section>

        {/* Database Status */}
        <Section title={t.database} icon={<Database size={15} />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold" style={{ color: C.text }}>
                STATUS POŁĄCZENIA:
              </span>
              <div
                className="flex items-center gap-1.5 font-mono text-xs px-2.5 py-1"
                style={{
                  background: isCloud ? '#10b98120' : '#eab30820',
                  color: isCloud ? '#34d399' : '#facc15',
                  border: `1px solid ${isCloud ? '#10b98144' : '#eab30844'}`,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: isCloud ? '#34d399' : '#facc15' }}
                />
                {isCloud ? t.cloudConnected : t.offlineMode}
              </div>
            </div>

            <p className="font-mono text-xs leading-relaxed" style={{ color: C.muted }}>
              {isCloud
                ? 'Aplikacja jest podłączona bezpośrednio do Twojego klastra PostgreSQL w chmurze Supabase z aktywnym Row Level Security (RLS).'
                : 'Aplikacja działa w trybie lokalnym z zachowaniem pełnej persystencji danych. Aby podłączyć chmurę Supabase, dodaj zmienne środowiskowe w pliku .env.local.'}
            </p>
          </div>
        </Section>

        {/* Account Info */}
        <Section title={t.account} icon={<User size={15} />}>
          <div className="flex items-center justify-between">
            <span className="font-display font-bold text-xs tracking-widest" style={{ color: C.muted }}>
              {t.accountEmail}
            </span>
            <span className="font-mono text-xs sm:text-sm font-bold truncate max-w-[200px]" style={{ color: C.text }}>
              {user?.email || 'demo@gymapp.io'}
            </span>
          </div>
        </Section>

        {/* Danger Zone */}
        <div
          className="p-5 sm:p-6"
          style={{
            background: C.card,
            border: `1px solid ${C.danger}44`,
            borderLeft: `3px solid ${C.danger}`,
          }}
        >
          <div className="flex items-center gap-2 font-display font-bold text-xs tracking-widest uppercase mb-4" style={{ color: C.danger }}>
            <ShieldAlert size={15} />
            <span>{t.dangerZone}</span>
          </div>

          {!showDelete ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="danger"
                small
                onClick={() => setShowDelete(true)}
                C={C}
              >
                {t.deleteAccount}
              </Button>

              <Button
                variant="ghost"
                small
                onClick={onResetLocalData}
                C={C}
              >
                {t.resetLocalData}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 slide-up">
              <p className="font-mono text-xs" style={{ color: C.muted }}>
                {t.deleteConfirmText}
              </p>
              <input
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="DELETE"
                className="px-4 py-2 font-mono text-sm outline-none w-full"
                style={{
                  background: C.surface,
                  border: `1px solid ${C.danger}`,
                  color: C.text,
                }}
              />
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  small
                  disabled={deleteInput !== 'DELETE' || deleting}
                  onClick={handleDelete}
                  C={C}
                >
                  {deleting ? '...' : t.deleteConfirmBtn}
                </Button>
                <Button
                  variant="ghost"
                  small
                  onClick={() => {
                    setShowDelete(false);
                    setDeleteInput('');
                  }}
                  C={C}
                >
                  {t.deleteCancel}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
