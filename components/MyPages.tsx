"use client";

import Link from "next/link";
import { usePages } from "@/lib/pages";
import { Icon } from "./Icon";

export function MyPages() {
  const { pages, ready } = usePages();
  const recent = [...pages].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);

  return (
    <section id="portfolios">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold tracking-tight">My pages</h2>
        <Link
          href="/workspace"
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-bg transition hover:bg-lemon hover:text-on-lemon"
        >
          Open workspace
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {!ready &&
          Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl bg-surface-2" />
          ))}
        {recent.map((p) => (
          <Link
            key={p.id}
            href={`/workspace?p=${p.id}`}
            className="group overflow-hidden rounded-3xl border border-line bg-surface transition hover:-translate-y-1 hover:shadow-card"
          >
            <div className="grid h-24 place-items-center bg-lemon-soft text-4xl transition group-hover:bg-lemon">
              {p.icon}
            </div>
            <div className="p-4">
              <p className="truncate font-semibold">{p.title || "Untitled"}</p>
              <p className="text-xs text-muted">Open page</p>
            </div>
          </Link>
        ))}
        <Link
          href="/workspace?new=1"
          className="grid min-h-36 place-items-center rounded-3xl border-2 border-dashed border-line text-sm font-semibold text-muted transition hover:border-ink hover:text-ink"
        >
          <span className="flex items-center gap-1.5">
            <Icon name="plus" className="size-4" strokeWidth={2.4} /> New page
          </span>
        </Link>
      </div>
    </section>
  );
}
