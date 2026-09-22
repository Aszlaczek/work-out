import React, { useState } from 'react';
import { Colors, Theme } from '@/lib/theme';
import { Translations, Lang, T } from '@/lib/i18n';
import { AppUser } from '@/lib/types';
import { repository } from '@/lib/repository';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Toggle } from '@/components/ui/Toggle';
import { AmbientBlobs } from '@/components/layout/AmbientBlobs';

interface AuthViewProps {
  onLoginSuccess: (user: AppUser) => void;
  C: Colors;
  theme: Theme;
  setTheme: (t: Theme) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
}

type AuthTab = 'login' | 'register' | 'forgot';

export const AuthView: React.FC<AuthViewProps> = ({
  onLoginSuccess,
  C,
  theme,
  setTheme,
  lang,
  setLang,
}) => {
  const [tab, setTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const t = T[lang];
  const isCloud = repository.isCloudConnected();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await repository.signIn(email.trim(), password);
      if (res.error) {
        setError(res.error);
      } else if (res.user) {
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setError(err?.message || 'Wystąpił błąd logowania.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError(t.shortPassword);
      return;
    }
    if (password !== passwordConfirm) {
      setError(t.passwordMismatch);
      return;
    }

    setLoading(true);
    try {
      const res = await repository.signUp(email.trim(), password);
      if (res.error) {
        setError(res.error);
      } else if (res.user) {
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setError(err?.message || 'Wystąpił błąd rejestracji.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setLoading(true);
    try {
      const res = await repository.resetPassword(email.trim());
      if (res.error) {
        setError(res.error);
      } else {
        setResetSent(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Błąd resetu hasła.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoQuickLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await repository.signIn('demo@gymapp.io', 'demo1234');
      if (res.user) {
        onLoginSuccess(res.user);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-full flex flex-col items-center justify-center px-6 py-12 relative flex-1"
      style={{ background: C.bg }}
    >
      <AmbientBlobs C={C} />

      {/* Top right language and theme switchers */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 z-20">
        <Toggle
          value={theme}
          onChange={(v) => setTheme(v as Theme)}
          optA={{ val: 'dark', label: '☾' }}
          optB={{ val: 'light', label: '☀' }}
          C={C}
        />
        <Toggle
          value={lang}
          onChange={(v) => setLang(v as Lang)}
          optA={{ val: 'pl', label: 'PL' }}
          optB={{ val: 'en', label: 'EN' }}
          C={C}
        />
      </div>

      <div className="relative w-full max-w-sm z-10">
        {/* Brand header */}
        <div className="mb-8 text-left">
          <div
            className="font-display font-black text-5xl sm:text-6xl tracking-tight leading-none mb-2 select-none"
            style={{ color: C.text }}
          >
            GYM<br />
            <span style={{ color: C.orange }}>PROGRESS</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: isCloud ? '#34d399' : '#facc15' }}
            />
            <p className="font-mono text-xs" style={{ color: C.muted }}>
              {isCloud ? 'Supabase Database Connected' : t.demoNote}
            </p>
          </div>
        </div>

        {/* Form container */}
        <div
          className="p-6 slide-up"
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderTop: `3px solid ${C.orange}`,
          }}
        >
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className="font-display font-black text-2xl tracking-tight" style={{ color: C.text }}>
                {t.loginTitle}
              </h2>

              <Field
                label={t.email}
                value={email}
                onChange={setEmail}
                type="email"
                required
                C={C}
              />
              <Field
                label={t.password}
                value={password}
                onChange={setPassword}
                type="password"
                required
                C={C}
              />

              {error && (
                <div
                  className="p-2.5 font-mono text-xs"
                  style={{ background: C.danger + '18', color: C.danger, borderLeft: `2px solid ${C.danger}` }}
                >
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !email || !password}
                C={C}
                fullWidth
              >
                {loading ? '...' : t.loginBtn}
              </Button>

              {!isCloud && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDemoQuickLogin}
                  disabled={loading}
                  C={C}
                  fullWidth
                  small
                >
                  ⚡ {t.demoLoginBtn}
                </Button>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setTab('forgot');
                  }}
                  className="font-mono text-xs hover:underline cursor-pointer"
                  style={{ color: C.muted }}
                >
                  {t.forgotLink}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setTab('register');
                  }}
                  className="font-mono text-xs hover:underline cursor-pointer font-bold"
                  style={{ color: C.orange }}
                >
                  {t.noAccount}
                </button>
              </div>
            </form>
          )}

          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <h2 className="font-display font-black text-2xl tracking-tight" style={{ color: C.text }}>
                {t.registerTitle}
              </h2>

              <Field
                label={t.email}
                value={email}
                onChange={setEmail}
                type="email"
                required
                C={C}
              />
              <Field
                label={t.password}
                value={password}
                onChange={setPassword}
                type="password"
                placeholder="Min. 6 znaków"
                required
                C={C}
              />
              <Field
                label={t.confirmPassword}
                value={passwordConfirm}
                onChange={setPasswordConfirm}
                type="password"
                required
                C={C}
              />

              {error && (
                <div
                  className="p-2.5 font-mono text-xs"
                  style={{ background: C.danger + '18', color: C.danger, borderLeft: `2px solid ${C.danger}` }}
                >
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !email || !password || !passwordConfirm}
                C={C}
                fullWidth
              >
                {loading ? '...' : t.registerBtn}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setTab('login');
                }}
                className="block font-mono text-xs mt-2 hover:underline cursor-pointer w-full text-center"
                style={{ color: C.muted }}
              >
                ← {t.backToLogin}
              </button>
            </form>
          )}

          {tab === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <h2 className="font-display font-black text-2xl tracking-tight" style={{ color: C.text }}>
                {t.forgotTitle}
              </h2>

              {resetSent ? (
                <div
                  className="p-4 font-mono text-sm space-y-2"
                  style={{
                    background: C.surface,
                    borderLeft: `3px solid ${C.orange}`,
                    color: C.text,
                  }}
                >
                  <p>{t.resetSent}</p>
                </div>
              ) : (
                <>
                  <Field
                    label={t.email}
                    value={email}
                    onChange={setEmail}
                    type="email"
                    required
                    C={C}
                  />

                  {error && (
                    <div
                      className="p-2.5 font-mono text-xs"
                      style={{ background: C.danger + '18', color: C.danger, borderLeft: `2px solid ${C.danger}` }}
                    >
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || !email}
                    C={C}
                    fullWidth
                  >
                    {loading ? '...' : t.sendResetBtn}
                  </Button>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setResetSent(false);
                  setTab('login');
                }}
                className="block font-mono text-xs mt-2 hover:underline cursor-pointer w-full text-center"
                style={{ color: C.muted }}
              >
                ← {t.backToLogin}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
