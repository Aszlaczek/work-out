import React, { useState } from 'react';
import { Colors, Theme } from '@/lib/theme';
import { Translations, Lang } from '@/lib/i18n';
import { AppUser } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Toggle } from '@/components/ui/Toggle';
import { repository } from '@/lib/repository';
import { ShieldAlert, Database, Palette, Globe, User, Lock } from 'lucide-react';

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

const Section = ({
  title,
  icon,
  children,
  C,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  C: Colors;
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
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Change password
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwNotice, setPwNotice] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);

  const isCloud = repository.isCloudConnected();

  const handleChangePassword = async () => {
    if (changing || deleting) return;
    setPwError(null);
    setPwNotice(null);
    if (newPw !== newPw2) {
      setPwError(t.passwordMismatch);
      return;
    }
    if (newPw.length < 6) {
      setPwError(t.shortPassword);
      return;
    }
    setChanging(true);
    try {
      const res = await repository.changePassword(currentPw, newPw);
      if (!res.success) {
        if (res.code === 'wrong_current') setPwError(t.wrongCurrentPassword);
        else if (res.code === 'too_short') setPwError(t.shortPassword);
        else setPwError(res.error || 'Błąd zmiany hasła.');
      } else {
        setPwNotice(t.passwordChanged);
        setCurrentPw('');
        setNewPw('');
        setNewPw2('');
        setShowPasswordForm(false);
      }
    } catch (err: any) {
      setPwError(err?.message || 'Błąd zmiany hasła.');
    } finally {
      setChanging(false);
    }
  };

  const handleDelete = async () => {
    if (deleteInput !== 'DELETE' || deleting || changing) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await onDeleteAccount();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : (lang === 'pl' ? 'Nie udało się usunąć konta.' : 'Could not delete account.'));
    } finally {
      setDeleting(false);
    }
  };

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
        <Section C={C} title={t.appearance} icon={<Palette size={15} />}>
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
        <Section C={C} title={t.language} icon={<Globe size={15} />}>
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
        <Section C={C} title={t.database} icon={<Database size={15} />}>
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
        <Section C={C} title={t.account} icon={<User size={15} />}>
          <div className="flex items-center justify-between">
            <span className="font-display font-bold text-xs tracking-widest" style={{ color: C.muted }}>
              {t.accountEmail}
            </span>
            <span className="font-mono text-xs sm:text-sm font-bold truncate max-w-[200px]" style={{ color: C.text }}>
              {user?.email || 'demo@gymapp.io'}
            </span>
          </div>
        </Section>

        {/* Security - change password */}
        <Section C={C} title={t.security} icon={<Lock size={15} />}>
          <div className="space-y-3">
            {pwNotice && (
              <div
                role="status"
                className="p-2.5 font-mono text-xs"
                style={{ background: '#34d39918', color: '#34d399', borderLeft: '2px solid #34d399' }}
              >
                {pwNotice}
              </div>
            )}

            {!showPasswordForm ? (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="font-mono text-xs" style={{ color: C.muted }}>
                  {t.accountEmail}: {user?.email || 'demo@gymapp.io'}
                </span>
                <Button small onClick={() => { setShowPasswordForm(true); setPwError(null); setPwNotice(null); }} C={C}>
                  {t.changePasswordBtn}
                </Button>
              </div>
            ) : (
              <form className="space-y-3 slide-up" onSubmit={(event) => { event.preventDefault(); void handleChangePassword(); }}>
                <Field label={t.currentPassword} value={currentPw} onChange={setCurrentPw} type="password" autoComplete="current-password" disabled={changing || deleting} required C={C} />
                <Field label={t.newPassword} value={newPw} onChange={setNewPw} type="password" autoComplete="new-password" disabled={changing || deleting} placeholder="Min. 6 znaków" required C={C} />
                <Field label={t.confirmPassword} value={newPw2} onChange={setNewPw2} type="password" autoComplete="new-password" disabled={changing || deleting} required C={C} />

                {pwError && (
                  <div
                    role="alert"
                    className="p-2.5 font-mono text-xs"
                    style={{ background: C.danger + '18', color: C.danger, borderLeft: `2px solid ${C.danger}` }}
                  >
                    {pwError}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    small
                    disabled={changing || deleting || !currentPw || !newPw || !newPw2}
                    type="submit"
                    C={C}
                  >
                    {changing ? '...' : t.changePasswordBtn}
                  </Button>
                  <Button
                    variant="ghost"
                    small
                    onClick={() => {
                      setShowPasswordForm(false);
                      setCurrentPw('');
                      setNewPw('');
                      setNewPw2('');
                      setPwError(null);
                    }}
                    C={C}
                  >
                    {t.deleteCancel}
                  </Button>
                </div>
              </form>
            )}
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
              {deleteError && <p role="alert" className="font-mono text-xs" style={{ color: C.danger }}>{deleteError}</p>}
              <input
                aria-label={t.deleteConfirmText}
                disabled={deleting}
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
                  disabled={deleteInput !== 'DELETE' || deleting || changing}
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
