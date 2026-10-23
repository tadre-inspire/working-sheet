"use client";

import { usePwaInstall } from "@/lib/pwa";
import { Icon } from "./Icon";

const STEPS = [
  {
    id: "desktop",
    title: "Desktop",
    note: "Chrome or Edge on Windows, Mac or Linux",
    steps: "Click Install app, or the install icon at the right of the address bar.",
  },
  {
    id: "android",
    title: "Android",
    note: "Chrome",
    steps: "Open the menu (⋮), then Install app. It lands on your home screen.",
  },
  {
    id: "ios",
    title: "iPhone and iPad",
    note: "Safari",
    steps: "Tap the Share button, then Add to Home Screen.",
  },
] as const;

// "icon": small sidebar button, only shown when the browser offers install.
// "card": the home-page and account-page panel with a button and steps per device.
export function InstallApp({ variant }: { variant: "icon" | "card" }) {
  const { canInstall, standalone, ios, android, install } = usePwaInstall();

  if (variant === "icon") {
    if (!canInstall || standalone) return null;
    return (
      <button
        onClick={install}
        title="Install Working Sheet"
        aria-label="Install Working Sheet as an app"
        className="grid size-12 place-items-center rounded-2xl text-muted transition hover:bg-surface-2 hover:text-ink"
      >
        <Icon name="download" className="size-[22px]" />
      </button>
    );
  }

  if (standalone) return null; // already running as an installed app

  const mine = ios ? "ios" : android ? "android" : "desktop";

  return (
    <section
      id="download"
      className="rise overflow-hidden rounded-[28px] border border-line bg-surface p-5 shadow-card sm:p-7"
    >
      <div className="flex flex-wrap items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-lemon font-display text-2xl font-extrabold text-on-lemon">
          W
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">Get Working Sheet on your devices</h2>
          <p className="text-sm text-muted">
            One app for desktop, Android and iPhone. Opens like any app and keeps working offline.
          </p>
        </div>
        {canInstall && (
          <button
            onClick={install}
            className="flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-bold text-bg transition hover:-translate-y-0.5 hover:bg-lemon hover:text-on-lemon"
          >
            <Icon name="download" className="size-4" strokeWidth={2.2} /> Install app
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={`rounded-2xl border p-4 ${s.id === mine ? "border-ink bg-lemon-soft" : "border-line bg-surface-2"}`}
          >
            <p className="flex items-center gap-2 font-display font-bold">
              {s.title}
              {s.id === mine && (
                <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-bg">
                  This device
                </span>
              )}
            </p>
            <p className="text-xs text-muted">{s.note}</p>
            <p className="mt-2 text-sm">{s.steps}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">
        Installing works on the live https site. App Store and Google Play versions are planned.
      </p>
    </section>
  );
}
