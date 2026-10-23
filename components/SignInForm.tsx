"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useIsLocalhost } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Icon } from "./Icon";

type Mode = "signin" | "signup" | "recover" | "forgot";

const field =
  "h-14 w-full rounded-full border border-line bg-surface-2 px-6 outline-none transition placeholder:text-muted focus:border-ink focus:ring-4 focus:ring-lemon/60";

const COPY: Record<Mode, { title: string; button: string }> = {
  signin: { title: "Sign in", button: "Sign in" },
  signup: { title: "Create account", button: "Create account" },
  forgot: { title: "Reset password", button: "Send reset link" },
  recover: { title: "New password", button: "Save password" },
};

function friendly(msg: string): string {
  if (/database error saving new user|invite-only/i.test(msg)) {
    return "Sign-ups are invite-only right now. Ask Tadre for an invite.";
  }
  if (/provider is not enabled|unsupported provider/i.test(msg)) {
    return "Google sign-in isn't switched on yet. Use email for now.";
  }
  return msg || "Something went wrong. Try again.";
}

// Where to go after signing in. Only same-site paths are allowed.
function safeNext(): string {
  const n = new URLSearchParams(window.location.search).get("next");
  return n && n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") ? n : "/";
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#4285F4" d="M23 12.27c0-.8-.07-1.56-.2-2.3H12v4.35h6.17a5.27 5.27 0 0 1-2.29 3.46v2.87h3.7C21.74 18.65 23 15.7 23 12.27Z" />
      <path fill="#34A853" d="M12 23.5c3.1 0 5.7-1.03 7.6-2.8l-3.7-2.87c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.02-6.45-4.74H1.73v2.97A11.5 11.5 0 0 0 12 23.5Z" />
      <path fill="#FBBC05" d="M5.55 14.19a6.9 6.9 0 0 1 0-4.38V6.84H1.73a11.5 11.5 0 0 0 0 10.32l3.82-2.97Z" />
      <path fill="#EA4335" d="M12 5.07c1.69 0 3.2.58 4.4 1.72l3.28-3.28A11.04 11.04 0 0 0 12 .5 11.5 11.5 0 0 0 1.73 6.84l3.82 2.97C6.46 7.09 9 5.07 12 5.07Z" />
    </svg>
  );
}

export function SignInForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const local = useIsLocalhost();

  // Arriving from a password-reset email.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("recover");
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Coming back from Google: show why if it didn't work (usually: not on the invite list).
  useEffect(() => {
    const raw = window.location.hash.slice(1) || window.location.search.slice(1);
    const reason = new URLSearchParams(raw).get("error_description");
    if (!reason) return;
    window.history.replaceState(null, "", window.location.pathname + window.location.search.replace(/[?&]error[^&]*/g, ""));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(friendly(reason));
  }, []);

  async function google() {
    setError(null);
    setInfo(null);
    setGoogleError(null);
    setBusy(true);
    // Ask Supabase first: if Google isn't switched on, say so instead of landing on a raw error page.
    const settings = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "" },
    })
      .then((r) => r.json() as Promise<{ external?: { google?: boolean } }>)
      .catch(() => null);
    if (settings?.external && settings.external.google === false) {
      setGoogleError(friendly("provider is not enabled"));
      setBusy(false);
      return;
    }
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${safeNext()}` },
    });
    if (err) {
      setGoogleError(friendly(err.message));
      setBusy(false);
    } // on success the browser leaves for Google
  }

  function switchTo(next: Mode) {
    setMode(next);
    setError(null);
    setInfo(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (mode !== "forgot" && password.length < 8 && mode !== "signin") {
      setError("Use at least 8 characters for the password.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        router.push(safeNext());
      } else if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name.trim() || undefined },
            emailRedirectTo: `${window.location.origin}${safeNext()}`,
          },
        });
        if (err) throw err;
        if (data.session) router.push(safeNext());
        else setInfo("Check your email to confirm your account, then sign in.");
      } else if (mode === "forgot") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/signin`,
        });
        if (err) throw err;
        setInfo("If that email has an account, a reset link is on its way.");
      } else {
        const { error: err } = await supabase.auth.updateUser({ password });
        if (err) throw err;
        router.push(safeNext());
      }
    } catch (err) {
      setError(friendly(err instanceof Error ? err.message : ""));
    } finally {
      setBusy(false);
    }
  }

  const showEmail = mode !== "recover";
  const showPassword = mode !== "forgot";

  return (
    <>
      <h2 className="font-display text-5xl font-bold tracking-tight">{COPY[mode].title}</h2>
      <p className="mt-2 text-muted">
        {mode === "signin" && (
          <>
            No account?{" "}
            <button onClick={() => switchTo("signup")} className="font-semibold text-ink underline decoration-lemon decoration-2 underline-offset-4">
              Create one
            </button>
          </>
        )}
        {mode === "signup" && (
          <>
            Already have one?{" "}
            <button onClick={() => switchTo("signin")} className="font-semibold text-ink underline decoration-lemon decoration-2 underline-offset-4">
              Sign in
            </button>
          </>
        )}
        {mode === "forgot" && (
          <button onClick={() => switchTo("signin")} className="font-semibold text-ink underline decoration-lemon decoration-2 underline-offset-4">
            Back to sign in
          </button>
        )}
        {mode === "recover" && "Choose a new password for your account."}
      </p>

      {(mode === "signin" || mode === "signup") && (
        <div className="mt-8">
          <button
            type="button"
            onClick={google}
            disabled={busy}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-line bg-surface text-base font-bold transition hover:-translate-y-0.5 hover:border-ink hover:shadow-card disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <GoogleMark /> Continue with Google
          </button>
          {googleError && (
            <p role="alert" className="mt-3 rounded-2xl border border-ink bg-surface-2 px-4 py-3 text-sm font-semibold">
              {googleError}
            </p>
          )}
          <div className="my-5 flex items-center gap-3 text-xs font-semibold text-muted">
            <span className="h-px flex-1 bg-line" /> or use email <span className="h-px flex-1 bg-line" />
          </div>
        </div>
      )}

      <form onSubmit={submit} className={`${mode === "signin" || mode === "signup" ? "" : "mt-8 "}space-y-4`}>
        {mode === "signup" && (
          <label className="block">
            <span className="sr-only">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name or studio"
              autoComplete="name"
              maxLength={60}
              className={field}
            />
          </label>
        )}
        {showEmail && (
          <label className="block">
            <span className="sr-only">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className={field}
            />
          </label>
        )}
        {showPassword && (
          <label className="relative block">
            <span className="sr-only">Password</span>
            <input
              type={show ? "text" : "password"}
              required
              minLength={mode === "signin" ? 1 : 8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signin" ? "Password" : "Password (8+ characters)"}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className={`${field} pr-14`}
            />
            <button
              type="button"
              aria-label={show ? "Hide password" : "Show password"}
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-muted hover:text-ink"
            >
              <Icon name={show ? "eyeOff" : "eye"} />
            </button>
          </label>
        )}

        {mode === "signin" && (
          <button
            type="button"
            onClick={() => switchTo("forgot")}
            className="inline-block text-sm font-semibold underline decoration-lemon decoration-2 underline-offset-4"
          >
            Forgot password?
          </button>
        )}

        {error && (
          <p role="alert" className="rounded-2xl border border-ink bg-surface-2 px-4 py-3 text-sm font-semibold">
            {error}
          </p>
        )}
        {info && (
          <p role="status" className="rounded-2xl bg-lemon px-4 py-3 text-sm font-semibold text-on-lemon">
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-lemon text-base font-bold text-on-lemon transition hover:-translate-y-0.5 hover:shadow-card disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {busy ? "One moment…" : COPY[mode].button}
          {!busy && <Icon name="arrow" className="size-5" />}
        </button>
        {local && (
          <Link href="/" className="block text-center text-sm font-semibold text-muted hover:text-ink">
            Continue without an account (this computer only)
          </Link>
        )}
      </form>
    </>
  );
}
