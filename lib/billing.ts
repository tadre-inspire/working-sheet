"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./auth";
import type { Interval, PlanId } from "./pricing";
import { supabase } from "./supabase";

export type Subscription = {
  plan: PlanId;
  status: "inactive" | "active" | "non-renewing" | "attention" | "cancelled";
  currency: "NGN" | "USD" | null;
  interval: Interval | null;
  current_period_end: string | null;
};

const FREE: Subscription = { plan: "free", status: "inactive", currency: null, interval: null, current_period_end: null };

// Reads your own subscription row. Only the server (Paystack webhook) writes it.
export function useSubscription() {
  const { user, ready } = useAuth();
  const [sub, setSub] = useState<Subscription>(FREE);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setSub(FREE);
      setLoaded(true);
      return FREE;
    }
    const { data } = await supabase
      .from("subscriptions")
      .select("plan,status,currency,interval,current_period_end")
      .eq("user_id", user.id)
      .maybeSingle();
    const next = (data as Subscription | null) ?? FREE;
    setSub(next);
    setLoaded(true);
    return next;
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (ready) refresh();
  }, [ready, refresh]);

  const isPaid = sub.plan !== "free" && (sub.status === "active" || sub.status === "non-renewing" || sub.status === "attention");
  return { sub, isPaid, isPro: isPaid, loaded, refresh };
}
