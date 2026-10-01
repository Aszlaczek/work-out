import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return (
    !!supabaseUrl &&
    supabaseUrl.startsWith("http") &&
    !supabaseUrl.includes("your-project") &&
    !!supabaseAnonKey &&
    supabaseAnonKey !== "your-anon-key-here" &&
    supabaseAnonKey.length > 20
  );
};

// Password reset started from the "forgot password" link. While this flag is
// set the application refuses to let the user in - a new password has to be
// set first (value = e-mail in local mode, marker in cloud mode).
const PENDING_PASSWORD_RESET_KEY = "gp_password_reset_pending";

export const markPendingPasswordReset = (email?: string): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PENDING_PASSWORD_RESET_KEY, email || "1");
  } catch (e) {
    console.error("LocalStorage write error:", e);
  }
};

export const clearPendingPasswordReset = (): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PENDING_PASSWORD_RESET_KEY);
  } catch (e) {
    console.error("LocalStorage write error:", e);
  }
};

export const readPendingPasswordReset = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(PENDING_PASSWORD_RESET_KEY);
  } catch {
    return null;
  }
};

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!clientInstance && supabaseUrl && supabaseAnonKey) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey);
    // The recovery link opens the application with a temporary session.
    // Remember it so the app keeps asking for a new password until it is set.
    clientInstance.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        markPendingPasswordReset();
      } else if (event === "SIGNED_OUT") {
        clearPendingPasswordReset();
      }
    });
  }
  return clientInstance;
};
