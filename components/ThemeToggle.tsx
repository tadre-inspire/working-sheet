"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "./Icon";

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => obs.disconnect();
}

const getDark = () => document.documentElement.classList.contains("dark");

export function ThemeToggle({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const dark = useSyncExternalStore(subscribe, getDark, () => false);

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        title={dark ? "Light mode" : "Dark mode"}
        className={`grid size-12 place-items-center rounded-2xl bg-lemon text-on-lemon transition hover:rotate-12 ${className}`}
      >
        <Icon name={dark ? "sun" : "moon"} className="size-[22px]" />
      </button>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      onClick={toggle}
      className={`relative flex h-10 w-[72px] shrink-0 items-center rounded-full border border-line bg-surface-2 p-1 transition-colors ${className}`}
    >
      <span
        className={`absolute top-1 grid size-8 place-items-center rounded-full bg-lemon text-on-lemon shadow-sm transition-transform duration-300 ease-[cubic-bezier(.3,1.4,.5,1)] ${
          dark ? "translate-x-[32px]" : "translate-x-0"
        }`}
      >
        <Icon name={dark ? "moon" : "sun"} className="size-4" />
      </span>
      <span className="flex w-full justify-between px-2.5 text-muted">
        <Icon name="sun" className="size-4" />
        <Icon name="moon" className="size-4" />
      </span>
    </button>
  );
}
