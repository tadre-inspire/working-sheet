"use client";

import { useState } from "react";
import { week } from "@/lib/data";
import { Icon } from "./Icon";

export function DeadlinePanel() {
  const [sel, setSel] = useState(3);

  return (
    <section className="rounded-[28px] border border-line bg-surface p-5 shadow-card sm:p-7">
      <h2 className="font-display text-2xl font-bold tracking-tight">Next deadline</h2>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {week.map((w, i) => (
          <button
            key={w.n}
            onClick={() => setSel(i)}
            aria-pressed={sel === i}
            className={`rounded-2xl py-3 text-center transition ${
              sel === i ? "bg-lemon text-on-lemon shadow-card" : "bg-surface-2 text-muted hover:text-ink"
            }`}
          >
            <div className="text-[11px] font-medium">{w.d}</div>
            <div className="font-display text-lg font-bold">{w.n}</div>
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-3xl border border-line p-5">
        <div className="flex items-start justify-between text-xs text-muted">
          <span>Project › Eko Kitchen</span>
          <Icon name="up" className="size-4" />
        </div>
        <p className="mt-2 font-display text-lg font-bold leading-snug">Lock the brand working sheet</p>
        <div className="mt-4 flex items-center justify-between text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <Icon name="check" className="size-3.5" /> 3/5
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-ink">
            <Icon name="clock" className="size-3.5" /> Fri, 24 Oct
          </span>
        </div>
        <div className="mt-4 flex justify-between text-xs">
          <span className="text-muted">Progress</span>
          <span className="font-bold">64%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full w-[64%] rounded-full bg-lemon" />
        </div>
      </div>
    </section>
  );
}
