"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/lib/billing";
import {
  PLAN_INFO,
  chargeFor,
  planLabel,
  type Currency,
  type Interval,
  type PaidPlan,
  type PlanId,
} from "@/lib/pricing";
import { accessToken, supabase } from "@/lib/supabase";
import { Icon } from "./Icon";

type Row = { plan: PaidPlan; interval: Interval; currency: Currency; amount: number };

const money = (cur: Currency, n: number) =>
  cur === "NGN"
    ? `₦${Math.round(n).toLocaleString("en-NG")}`
    : `$${(Math.round(n * 100) / 100).toLocaleString("en-US")}`;

async function api(path: string, body?: unknown) {
  const token = await accessToken();
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body ?? {}),
  });
  const json = (await res.json().catch(() => ({}))) as { url?: string; status?: string; error?: string };
  if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
  return json;
}

// Features marked soon aren't built yet; they're what each plan is meant to unlock.
type Feature = { text: string; soon?: boolean };
const FREE_FEATURES: Feature[] = [
  { text: "Workspace, templates and working sheets" },
  { text: "Draw and comment on sheets" },
  { text: "Creative news and your topics" },
  { text: "Sync across your devices" },
];
const PRO_FEATURES: Feature[] = [
  { text: "Everything in Free" },
  { text: "Publish portfolio pages", soon: true },
  { text: "AI palette and shot-list helper", soon: true },
  { text: "More image storage", soon: true },
];
const BUSINESS_FEATURES: Feature[] = [
  { text: "Everything in Pro" },
  { text: "Shared workspaces for your team", soon: true },
  { text: "Client review links", soon: true },
  { text: "Priority support" },
];

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex rounded-full border border-line bg-surface-2 p-1 text-sm font-bold">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`rounded-full px-4 py-1.5 transition ${value === o.value ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Features({ items }: { items: Feature[] }) {
  return (
    <ul className="mt-5 space-y-2.5 text-sm">
      {items.map((f) => (
        <li key={f.text} className="flex gap-2.5">
          <Icon name="check" className="mt-0.5 size-4 shrink-0" strokeWidth={2.4} />
          <span>
            {f.text}
            {f.soon && (
              <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                Soon
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function BillingPanel() {
  const router = useRouter();
  const params = useSearchParams();
  const reference = params.get("reference") ?? params.get("trxref");
  const { user, ready } = useAuth();
  const { sub, isPaid, loaded, refresh } = useSubscription();

  const [rows, setRows] = useState<Row[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [currency, setCurrency] = useState<Currency>("USD");
  const [interval, setInterval] = useState<Interval>("year");
  const [team, setTeam] = useState<"small" | "large">("small");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const confirmed = useRef<string | null>(null);

  useEffect(() => {
    fetch("/api/billing/plans")
      .then((r) => r.json())
      .then((p: { configured: boolean; rows: Row[] }) => {
        setRows(p.rows ?? []);
        setConfigured(p.configured);
        // Nigerian visitors see naira first; everyone else sees dollars.
        if (Intl.DateTimeFormat().resolvedOptions().timeZone === "Africa/Lagos") setCurrency("NGN");
      })
      .catch(() => setConfigured(false));
  }, []);

  // Back from Paystack: ask the server to verify the payment.
  useEffect(() => {
    if (!reference || !user || confirmed.current === reference) return;
    confirmed.current = reference;
    setMessage({ tone: "ok", text: "Confirming your payment…" });
    api("/api/billing/confirm", { reference })
      .then(async (r) => {
        await refresh();
        setMessage(
          r.status === "success"
            ? { tone: "ok", text: "Your plan is active. Thank you!" }
            : { tone: "err", text: "That payment didn't go through, so you haven't been charged." },
        );
      })
      .catch((e: Error) => setMessage({ tone: "err", text: e.message }))
      .finally(() => router.replace("/billing"));
  }, [reference, user, refresh, router]);

  // Price for one billing cycle. Falls back to the dollar list price before
  // billing is set up, so the page can still show the offer.
  const cycleAmount = (plan: PaidPlan, i: Interval, c: Currency): number | null => {
    const row = rows.find((r) => r.plan === plan && r.interval === i && r.currency === c);
    if (row) return row.amount;
    return c === "USD" ? chargeFor(plan, i, "USD", 0) : null;
  };

  const businessPlan: PaidPlan = team === "small" ? "business" : "business_large";
  const currentFamily: PlanId | "business_any" =
    sub.plan === "business" || sub.plan === "business_large" ? "business_any" : sub.plan;
  const renews = sub.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  async function go(kind: "checkout" | "portal", plan?: PaidPlan) {
    setBusy(kind === "checkout" ? plan! : "portal");
    setMessage(null);
    try {
      const r = await api(
        kind === "checkout" ? "/api/billing/checkout" : "/api/billing/portal",
        kind === "checkout" ? { plan, interval, currency } : {},
      );
      if (r.url) window.location.assign(r.url);
    } catch (e) {
      setMessage({ tone: "err", text: (e as Error).message });
      setBusy(null);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/signin");
  }

  const name = useMemo(
    () => (user ? ((user.user_metadata?.display_name as string | undefined) ?? user.email?.split("@")[0] ?? "You") : ""),
    [user],
  );

  if (!ready) return <div className="h-64 animate-pulse rounded-[28px] bg-surface-2" />;

  const priceBlock = (plan: PaidPlan) => {
    const amount = cycleAmount(plan, interval, currency);
    if (amount === null) {
      return (
        <p className="mt-3 font-display text-4xl font-extrabold">
          —<span className="block text-xs font-semibold opacity-60">Naira price appears after billing sync</span>
        </p>
      );
    }
    const perMonth = interval === "year" ? amount / 12 : amount;
    return (
      <div className="mt-3">
        <p className="font-display text-4xl font-extrabold">
          {money(currency, perMonth)}
          <span className="text-base font-semibold opacity-70"> / month</span>
        </p>
        <p className="mt-1 h-4 text-xs font-semibold opacity-70">
          {interval === "year" ? `Billed ${money(currency, amount)} yearly` : "Billed monthly"}
        </p>
      </div>
    );
  };

  const action = (plan: PaidPlan, family: "pro" | "business_any") => {
    if (!user) {
      return (
        <Link
          href="/signin"
          className="flex h-12 w-full items-center justify-center rounded-full bg-lemon font-bold text-on-lemon"
        >
          Sign in to upgrade
        </Link>
      );
    }
    if (isPaid && currentFamily === family) {
      return (
        <div className="space-y-2">
          {renews && (
            <p className="text-sm font-semibold">
              {sub.status === "non-renewing" ? "Active until" : "Renews on"} {renews}
            </p>
          )}
          <button
            onClick={() => go("portal")}
            disabled={busy !== null}
            className="h-12 w-full rounded-full bg-[#0e0e0c] font-bold text-[#e4ff4a] disabled:opacity-60"
          >
            {busy === "portal" ? "Opening…" : "Manage subscription"}
          </button>
        </div>
      );
    }
    if (isPaid) {
      return (
        <button disabled className="h-12 w-full rounded-full border border-line text-sm font-bold opacity-60">
          Cancel your current plan to switch
        </button>
      );
    }
    const unavailable = !configured || cycleAmount(plan, interval, currency) === null || !rows.some((r) => r.plan === plan);
    return (
      <button
        onClick={() => go("checkout", plan)}
        disabled={busy !== null || unavailable || !loaded}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-lemon font-bold text-on-lemon transition hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {busy === plan ? "Opening checkout…" : `Choose ${PLAN_INFO[plan].name}`}
        {busy === null && <Icon name="arrow" className="size-5" />}
      </button>
    );
  };

  const cardBase = "flex flex-col rounded-[28px] border p-6 shadow-card sm:p-7";
  const currentCard = (on: boolean) => (on ? "border-ink" : "border-line");

  return (
    <div className="space-y-6">
      {user && (
        <section className="flex flex-wrap items-center gap-4 rounded-[28px] border border-line bg-surface p-5 shadow-card sm:p-7">
          <span className="grid size-14 place-items-center rounded-full bg-lemon font-display text-xl font-extrabold text-on-lemon">
            {name[0]?.toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-xl font-bold">{name}</p>
            <p className="truncate text-sm text-muted">
              {user.email} · {isPaid ? `${planLabel(sub.plan)} plan` : "Free plan"}
            </p>
          </div>
          <button onClick={signOut} className="h-11 rounded-full border border-line px-5 text-sm font-bold transition hover:border-ink">
            Sign out
          </button>
        </section>
      )}

      {message && (
        <p
          role="status"
          className={`rounded-2xl px-4 py-3 text-sm font-semibold ${message.tone === "ok" ? "bg-lemon text-on-lemon" : "border border-ink bg-surface-2"}`}
        >
          {message.text}
        </p>
      )}
      {sub.status === "attention" && (
        <p className="rounded-2xl border border-ink bg-surface-2 px-4 py-3 text-sm font-semibold">
          Your last payment failed. Update your card to keep your plan.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Billing period"
          value={interval}
          onChange={setInterval}
          options={[
            { value: "month", label: "Monthly" },
            { value: "year", label: "Yearly · save 15%" },
          ]}
        />
        <Segmented
          label="Currency"
          value={currency}
          onChange={setCurrency}
          options={[
            { value: "NGN", label: "₦ Naira" },
            { value: "USD", label: "$ USD" },
          ]}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className={`${cardBase} bg-surface ${currentCard(!isPaid)}`}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Free</h2>
            {!isPaid && user && <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-bg">Current plan</span>}
          </div>
          <div className="mt-3">
            <p className="font-display text-4xl font-extrabold">{currency === "NGN" ? "₦0" : "$0"}</p>
            <p className="mt-1 h-4 text-xs font-semibold opacity-70">For one person</p>
          </div>
          <Features items={FREE_FEATURES} />
        </section>

        <section className={`${cardBase} ${currentFamily === "pro" && isPaid ? "bg-lemon text-on-lemon" : "bg-surface"} ${currentCard(currentFamily === "pro" && isPaid)}`}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Pro</h2>
            {currentFamily === "pro" && isPaid && (
              <span className="rounded-full bg-[#0e0e0c] px-3 py-1 text-xs font-bold text-[#e4ff4a]">Current plan</span>
            )}
          </div>
          {priceBlock("pro")}
          <Features items={PRO_FEATURES} />
          <div className="mt-auto pt-6">
            {action("pro", "pro")}
          </div>
        </section>

        <section className={`${cardBase} ${currentFamily === "business_any" && isPaid ? "bg-lemon text-on-lemon" : "bg-surface"} ${currentCard(currentFamily === "business_any" && isPaid)}`}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Business</h2>
            {currentFamily === "business_any" && isPaid && (
              <span className="rounded-full bg-[#0e0e0c] px-3 py-1 text-xs font-bold text-[#e4ff4a]">Current plan</span>
            )}
          </div>
          <div className="mt-3 flex rounded-full border border-line bg-surface-2 p-1 text-xs font-bold text-ink" role="group" aria-label="Team size">
            {(["small", "large"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTeam(t)}
                aria-pressed={team === t}
                className={`flex-1 rounded-full px-3 py-1.5 ${team === t ? "bg-ink text-bg" : "text-muted"}`}
              >
                {t === "small" ? "Up to 5 users" : "6+ users"}
              </button>
            ))}
          </div>
          {priceBlock(businessPlan)}
          <Features items={BUSINESS_FEATURES} />
          <div className="mt-auto pt-6">
            {action(businessPlan, "business_any")}
          </div>
        </section>
      </div>

      {configured === false && (
        <p className="text-xs text-muted">
          Checkout isn&rsquo;t switched on yet. Run the billing sync with your Paystack keys to enable it. Dollar prices
          above are the list prices; naira prices are set when you sync.
        </p>
      )}
      <p className="text-xs text-muted">Paid securely by Paystack. Cancel any time from Manage subscription.</p>
    </div>
  );
}
