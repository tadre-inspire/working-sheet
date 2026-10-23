"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./auth";
import { supabase } from "./supabase";

// Free accounts may start one new project per month; paid plans and the owner's
// email are unlimited. The database enforces it, this just lets the screens
// explain it before someone hits the wall.
export type MyPlan = { unlimited: boolean; used: number; limit: number };

export function useMyPlan() {
  const { user, ready } = useAuth();
  const [plan, setPlan] = useState<MyPlan | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setPlan(null);
      return null;
    }
    const { data, error } = await supabase.rpc("my_plan");
    if (error || !data) return null; // offline or not signed in: keep what we had
    const next = data as MyPlan;
    setPlan(next);
    return next;
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (ready) refresh();
  }, [ready, refresh]);

  return { plan, refresh };
}
