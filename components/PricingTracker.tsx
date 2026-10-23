"use client";

import { useState } from "react";
import { tools, USD_TO_NGN } from "@/lib/data";
import { Sparkline } from "./Sparkline";
import { Icon } from "./Icon";

export function PricingTracker() {
  const [cur, setCur] = useState<"USD" | "NGN">("USD");

  const fmt = (usd: number) =>
    cur === "USD"
      ? `$${usd}`
      : `₦${Math.round(usd * USD_TO_NGN).toLocaleString("en-NG")}`;

  return (
    <section
      id="pricing"
      className="rounded-[28px] border border-line bg-surface p-5 shadow-card sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">
            AI tool pricing
          </h2>
          <p className="text-sm text-muted">
            Monthly plan cost, 30-day movement. Sample data.
          </p>
        </div>
        <div className="flex rounded-full border border-line bg-surface-2 p-1 text-sm font-semibold">
          {(["USD", "NGN"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCur(c)}
              aria-pressed={cur === c}
              className={`rounded-full px-4 py-1.5 transition ${
                cur === c ? "bg-ink text-bg" : "text-muted hover:text-ink"
              }`}
            >
              {c === "USD" ? "$ USD" : "₦ NGN"}
            </button>
          ))}
        </div>
      </div>

      <div className="scroll-thin mt-5 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="pb-3 font-medium">Tool</th>
              <th className="pb-3 font-medium">Plan</th>
              <th className="pb-3 text-right font-medium">Price / mo</th>
              <th className="pb-3 pl-6 font-medium">30d</th>
              <th className="pb-3 text-right font-medium">Move</th>
            </tr>
          </thead>
          <tbody>
            {tools.map((t) => (
              <tr
                key={t.name}
                className="group border-t border-line transition hover:bg-surface-2"
              >
                <td className="py-3.5 pr-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid size-9 place-items-center rounded-xl border border-line font-display text-sm font-bold text-[#0e0e0c]"
                      style={{ background: t.tint }}
                    >
                      {t.name[0]}
                    </span>
                    <div>
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-xs text-muted">{t.kind}</div>
                    </div>
                  </div>
                </td>
                <td className="text-muted">{t.plan}</td>
                <td className="text-right font-display text-base font-semibold tabular-nums">
                  {fmt(t.usd)}
                </td>
                <td className="pl-6">
                  <Sparkline data={t.series} up={t.change >= 0} />
                </td>
                <td className="text-right">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${
                      t.change < 0
                        ? "bg-lemon text-on-lemon"
                        : t.change > 0
                          ? "bg-ink text-bg"
                          : "bg-surface-2 text-muted"
                    }`}
                  >
                    {t.change !== 0 && (
                      <Icon
                        name="up"
                        className={`size-3 ${t.change < 0 ? "rotate-90" : ""}`}
                        strokeWidth={2.4}
                      />
                    )}
                    {t.change === 0 ? "flat" : `${Math.abs(t.change)}%`}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-muted">
        Price drops are lemon, rises are black. ₦ at a placeholder ₦
        {USD_TO_NGN}/$.
      </p>
    </section>
  );
}
