"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/lib/billing";
import { planLabel } from "@/lib/pricing";
import { Icon } from "./Icon";

export function ProfileCard() {
  const { user, ready } = useAuth();
  const { sub, isPaid } = useSubscription();

  const name =
    (user?.user_metadata?.display_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Guest";

  return (
    <div className="mb-6 flex items-center gap-3 rounded-3xl bg-surface p-3 shadow-card">
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-lemon font-display text-lg font-extrabold text-on-lemon">
        {name[0]?.toUpperCase() ?? "G"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display font-bold">{ready ? name : "…"}</p>
        <p className="text-xs text-muted">
          {user ? (isPaid ? `${planLabel(sub.plan)} plan` : "Free plan") : "Not signed in"}
        </p>
      </div>
      <Link
        href={user ? "/billing" : "/signin"}
        aria-label={user ? "Account and plan" : "Sign in"}
        className="grid size-9 place-items-center rounded-full border border-line text-muted transition hover:border-ink hover:text-ink"
      >
        <Icon name={user ? "settings" : "arrow"} className="size-4" />
      </Link>
    </div>
  );
}
