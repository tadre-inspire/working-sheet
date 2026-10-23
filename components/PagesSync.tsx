"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { startSync, stopSync } from "@/lib/pages-sync";

// Mounted once in the app shell: starts syncing on sign-in, clears on sign-out.
export function PagesSync() {
  const { user, ready } = useAuth();
  const current = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    const id = user?.id ?? null;
    if (id === current.current) return;
    const was = current.current;
    current.current = id;
    if (id) startSync().catch((e) => console.warn("initial sync failed", e));
    else if (was) stopSync();
  }, [user, ready]);

  return null;
}
