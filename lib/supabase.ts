import { createClient } from "@supabase/supabase-js";

// Browser client. The session lives in local storage, which works the same
// in the web app, a desktop shell (Tauri) and a mobile shell (Capacitor).
//
// If the keys are missing (a fresh clone, or a deploy before the environment
// variables are added) we use inert placeholders so the app still builds and
// runs in local-only mode: pages save in the browser, sign-in just fails.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "missing-publishable-key";

export const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export async function accessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
