"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

  // Arriving from a password-reset email.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("recover");
    });
    return () => data.subscription.unsubscribe();
  }, []);

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
        router.push("/");
      } else if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name.trim() || undefined },
            emailRedirectTo: `${window.location.origin}/signin`,
          },
        });
        if (err) throw err;
        if (data.session) router.push("/");
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
        router.push("/");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      // The database refuses sign-ups from emails that aren't on the invite list.
      setError(
        /database error saving new user|invite-only/i.test(msg)
          ? "Sign-ups are invite-only right now. Ask Tadre for an invite."
          : msg || "Something went wrong. Try again.",
      );
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

      <form onSubmit={submit} className="mt-8 space-y-4">
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
        <Link href="/" className="block text-center text-sm font-semibold text-muted hover:text-ink">
          Continue without an account
        </Link>
      </form>
    </>
  );
}
