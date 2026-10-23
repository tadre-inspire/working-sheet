"use client";

import { useState } from "react";
import { Icon } from "./Icon";

const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DatePicker() {
  const [month, setMonth] = useState({ y: 2026, m: 9 }); // October 2026
  const [start, setStart] = useState<number | null>(23);
  const [end, setEnd] = useState<number | null>(30);

  const first = new Date(month.y, month.m, 1).getDay();
  const days = new Date(month.y, month.m + 1, 0).getDate();
  const label = new Date(month.y, month.m, 1).toLocaleString("en", {
    month: "long",
    year: "numeric",
  });

  function pick(d: number) {
    if (start === null || (start !== null && end !== null)) {
      setStart(d);
      setEnd(null);
    } else if (d < start) {
      setStart(d);
    } else {
      setEnd(d);
    }
  }

  function shift(delta: number) {
    setMonth(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
    setStart(null);
    setEnd(null);
  }

  const cells = [
    ...Array.from({ length: first }, () => null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];

  return (
    <div className="rounded-3xl border border-line bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-display text-base font-bold">{label}</span>
        <div className="flex gap-1">
          <button
            aria-label="Previous month"
            onClick={() => shift(-1)}
            className="grid size-8 place-items-center rounded-full hover:bg-surface-2"
          >
            <Icon name="chevL" className="size-4" />
          </button>
          <button
            aria-label="Next month"
            onClick={() => shift(1)}
            className="grid size-8 place-items-center rounded-full hover:bg-surface-2"
          >
            <Icon name="chevR" className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-xs text-muted">
        {DOW.map((d) => (
          <span key={d} className="py-1.5">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((d, i) => {
          if (d === null) return <span key={i} />;
          const isStart = d === start;
          const isEnd = d === end;
          const inRange =
            start !== null && end !== null && d > start && d < end;
          return (
            <button
              key={i}
              onClick={() => pick(d)}
              aria-pressed={isStart || isEnd}
              className={`h-9 text-sm font-medium tabular-nums transition ${
                isStart || isEnd
                  ? "rounded-full bg-lemon font-bold text-on-lemon"
                  : inRange
                    ? "bg-lemon-soft text-ink"
                    : "rounded-full hover:bg-surface-2"
              } ${isStart && end ? "rounded-r-none" : ""} ${
                isEnd ? "rounded-l-none" : ""
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
        <span>
          {start ? `${start}` : "—"} → {end ? `${end}` : "—"} {label.split(" ")[0]}
        </span>
        <span className="rounded-full bg-surface-2 px-2.5 py-1 font-semibold text-ink">
          {start && end ? `${end - start + 1} days` : "Pick a range"}
        </span>
      </div>
    </div>
  );
}
