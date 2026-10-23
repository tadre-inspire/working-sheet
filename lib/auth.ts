"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useState, useSyncExternalStore } from "react";
import { supabase } from "./supabase";

export function useAuth() {
  const [state, setState] = useState<{ user: User | null; ready: boolean }>({
    user: null,
    ready: false,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setState({ user: data.session?.user ?? null, ready: true });
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, ready: true });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return state;
}

/** Name to show for a user: their chosen name, else the Google profile name, else the email prefix. */
export function displayName(user: User | null | undefined, fallback = "You"): string {
  const m = (user?.user_metadata ?? {}) as Record<string, string | undefined>;
  return m.display_name || m.full_name || m.name || user?.email?.split("@")[0] || fallback;
}

/** True only on the developer's own computer (localhost). False while rendering on the server. */
export function useIsLocalhost(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => ["localhost", "127.0.0.1"].includes(window.location.hostname),
    () => false,
  );
}
