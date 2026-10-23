"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";
import type { NewsItem } from "@/lib/news";

// Scrolling strip of the latest topic headlines (not prices).
export function Ticker() {
  const [items, setItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/news`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { items: NewsItem[] }) => setItems(d.items.slice(0, 10)))
      .catch(() => {});
  }, []);

  if (!items.length) {
    return <div className="h-5 animate-pulse rounded bg-surface-2" />;
  }

  return (
    <div className="marquee flex w-max gap-10 whitespace-nowrap text-sm font-semibold">
      {[...items, ...items].map((n, i) => (
        <a
          key={i}
          href={n.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 hover:underline"
        >
          <span className="rounded-full bg-lemon px-2 py-0.5 text-[11px] font-bold text-on-lemon">
            {n.topic}
          </span>
          {n.title}
          <span className="size-1.5 rounded-full bg-lemon ring-1 ring-ink" />
        </a>
      ))}
    </div>
  );
}
