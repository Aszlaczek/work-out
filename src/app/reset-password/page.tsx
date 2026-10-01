"use client";

import React, { useEffect, useState } from "react";
import { Theme, getColors, Colors } from "@/lib/theme";
import { Lang, T } from "@/lib/i18n";
import { repository } from "@/lib/repository";
import { getSupabaseClient, clearPendingPasswordReset } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { AmbientBlobs } from "@/components/layout/AmbientBlobs";

type Status = "checking" | "form" | "done" | "expired";

// Forced password reset: the e-mail link (or the demo link in local mode)
// brings the user here and no login is possible until a new password is set.
export default function ResetPasswordPage() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [lang, setLang] = useState<Lang>("pl");
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const C: Colors = getColors(theme);
  const t = T[lang];

  const goHome = () => {
    window.location.assign("/");
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("gp_theme") as Theme;
    if (savedTheme === "dark" || savedTheme === "light") setTheme(savedTheme);

    const savedLang = localStorage.getItem("gp_lang") as Lang;
    if (savedLang === "pl" || savedLang === "en") setLang(savedLang);

    (async () => {
      // detects the recovery link in the url and keeps the pending mark
      const pending = repository.hasPendingPasswordReset();
      if (!repository.isCloudConnected()) {
        setStatus(pending ? "form" : "expired");
        return;
      }
      const client = getSupabaseClient();
      const session = client ? (await client.auth.getSession()).data.session : null;
      setStatus(session || pending ? "form" : "expired");
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== passwordConfirm) {
      setError(t.passwordMismatch);
      return;
    }
    setLoading(true);
    try {
      const res = await repository.setNewPassword(password);
      if (res.success) {
        setStatus("done");
      } else if (res.code === "too_short") {
        setError(t.shortPassword);
      } else if (res.code === "invalid") {
        // the link can no longer be used - let the old password work again
        clearPendingPasswordReset();
        setStatus("expired");
      } else {
        setError(res.error || "Błąd.");
      }
    } catch (err: any) {
      setError(err?.message || "Błąd.");
    } finally {
      setLoading(false);
    }
  };

  const ErrorBox = () =>
    error ? (
      <div
        className="p-2.5 font-mono text-xs"
        style={{ background: C.danger + "18", color: C.danger, borderLeft: `2px solid ${C.danger}` }}
      >
        {error}
      </div>
    ) : null;

  return (
    <div
      className="min-h-full flex flex-col items-center justify-center px-6 py-12 relative flex-1"
      style={{ background: C.bg }}
    >
      <AmbientBlobs C={C} />

      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 z-20">
        <Toggle
          value={theme}
          onChange={(v) => setTheme(v as Theme)}
          optA={{ val: "dark", label: "☾" }}
          optB={{ val: "light", label: "☀" }}
          C={C}
        />
        <Toggle
          value={lang}
          onChange={(v) => setLang(v as Lang)}
          optA={{ val: "pl", label: "PL" }}
          optB={{ val: "en", label: "EN" }}
          C={C}
        />
      </div>

      <div className="relative w-full max-w-sm z-10">
        <div className="mb-8 text-left">
          <div
            className="font-display font-black text-5xl sm:text-6xl tracking-tight leading-none mb-2 select-none"
            style={{ color: C.text }}
          >
            GYM<br />
            <span style={{ color: C.orange }}>PROGRESS</span>
          </div>
        </div>

        <div
          className="p-6 slide-up"
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderTop: `3px solid ${C.orange}`,
          }}
        >
          {status === "checking" && (
            <p className="font-mono text-sm" style={{ color: C.muted }}>
              ...
            </p>
          )}

          {status === "form" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="font-display font-black text-2xl tracking-tight" style={{ color: C.text }}>
                {t.resetPasswordTitle}
              </h2>
              <p className="font-mono text-xs leading-relaxed" style={{ color: C.muted }}>
                {t.resetPasswordIntro}
              </p>

              <Field
                label={t.newPassword}
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

              <ErrorBox />

              <Button
                type="submit"
                disabled={loading || !password || !passwordConfirm}
                C={C}
                fullWidth
              >
                {loading ? "..." : t.resetPasswordBtn}
              </Button>
            </form>
          )}

          {status === "done" && (
            <div className="space-y-4 slide-up">
              <h2 className="font-display font-black text-2xl tracking-tight" style={{ color: C.text }}>
                {t.passwordResetTitle}
              </h2>
              <div
                className="p-2.5 font-mono text-xs"
                style={{ background: "#34d39918", color: "#34d399", borderLeft: "2px solid #34d399" }}
              >
                {t.passwordResetDone}
              </div>
              <Button onClick={goHome} C={C} fullWidth>
                {t.backToLogin}
              </Button>
            </div>
          )}

          {status === "expired" && (
            <div className="space-y-4 slide-up">
              <h2 className="font-display font-black text-2xl tracking-tight" style={{ color: C.text }}>
                {t.forgotTitle}
              </h2>
              <div
                className="p-2.5 font-mono text-xs"
                style={{ background: C.danger + "18", color: C.danger, borderLeft: `2px solid ${C.danger}` }}
              >
                {t.resetLinkInvalid}
              </div>
              <Button onClick={goHome} C={C} fullWidth>
                {t.backToLogin}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
