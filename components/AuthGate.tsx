"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth, useIsLocalhost } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase";

// The app needs an account. Visitors on the live site are sent to sign in first.
// The exception is the developer's own computer (localhost), where the app can
// be used without an account, and a copy running with no Supabase keys at all.
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const path = usePathname();
  const local = useIsLocalhost();
  const guestOk = local || !supabaseConfigured;

  useEffect(() => {
    if (ready && !user && !guestOk) router.replace(`/signin?next=${encodeURIComponent(path)}`);
  }, [ready, user, guestOk, path, router]);

  if (user || guestOk) return <>{children}</>;
  return (
    <div className="grid min-h-screen place-items-center text-sm font-semibold text-muted">
      {ready ? "Opening sign-in…" : "Loading…"}
    </div>
  );
}
