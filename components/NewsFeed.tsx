"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { loadRemoteTopics, saveRemoteTopics } from "@/lib/topics-sync";
import { DEFAULT_TOPICS } from "@/lib/topics";
import type { NewsItem } from "@/lib/news";
import { Icon } from "./Icon";

const KEY = "marketcap.topics.v2";

function ago(iso: string) {
  const m = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.round(m / 60)}h`;
  return `${Math.round(m / 1440)}d`;
}

function loadList(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (Array.isArray(v) && v.every((x) => typeof x === "string") && v.length) return v;
  } catch {}
  return DEFAULT_TOPICS;
}

const fallbacks = [
  "bg-[linear-gradient(135deg,var(--lemon),#8aa600)] text-[#0e0e0c]",
  "bg-[#1d1d1a] text-[#e4ff4a]",
  "bg-[repeating-linear-gradient(45deg,var(--lemon)_0_10px,#0e0e0c_10px_20px)] text-[#0e0e0c]",
  "bg-[radial-gradient(circle_at_30%_40%,var(--lemon),#232320_70%)] text-[#0e0e0c]",
];

function Thumb({ item, className }: { item: NewsItem; className: string }) {
  const [broken, setBroken] = useState(false);
  const fb = fallbacks[item.title.length % fallbacks.length];
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {item.image && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
          className="size-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className={`grid size-full place-items-center font-display text-4xl font-extrabold ${fb}`}>
          {item.source[0]}
        </div>
      )}
      {item.video && (
        <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-[#0e0e0c]/85 py-1 pl-1.5 pr-2.5 text-[10px] font-bold text-[#e4ff4a] backdrop-blur">
          <span className="grid size-4 place-items-center rounded-full bg-[#e4ff4a] text-[#0e0e0c]">
            <svg viewBox="0 0 10 10" className="ml-px size-2" aria-hidden="true">
              <path d="M2 1l7 4-7 4z" fill="currentColor" />
            </svg>
          </span>
          Video
        </span>
      )}
    </div>
  );
}

export function NewsFeed({
  variant = "grid",
  limit = 6,
  showAll = true,
}: {
  variant?: "rail" | "grid";
  limit?: number;
  showAll?: boolean;
}) {
  const rail = variant === "rail";
  const { user } = useAuth();
  const uid = user?.id;
  const [topics, setTopics] = useState<string[]>(DEFAULT_TOPICS);
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("All");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTopics(loadList());
    setReady(true);
  }, []);

  // Signed in: your followed topics follow you across devices.
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    loadRemoteTopics().then((remote) => {
      if (cancelled) return;
      if (remote) {
        setTopics(remote);
        try {
          localStorage.setItem(KEY, JSON.stringify(remote));
        } catch {}
      } else {
        saveRemoteTopics(uid, loadList());
      }
    });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const load = useCallback(async (list: string[]) => {
    setError(false);
    setItems(null);
    try {
      const qs = encodeURIComponent(list.join(","));
      const res = await fetch(`${API_BASE}/api/news?topics=${qs}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { items: NewsItem[] };
      if (!data.items.length) throw new Error("empty");
      setItems(data.items);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (ready) load(topics);
  }, [ready, topics, load]);

  function save(next: string[]) {
    setTopics(next);
    if (uid) saveRemoteTopics(uid, next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }

  function add() {
    const name = draft.trim();
    setDraft("");
    setAdding(false);
    if (name.length < 2 || topics.some((p) => p.toLowerCase() === name.toLowerCase())) return;
    save([...topics, name]);
    setFilter(name);
  }

  function remove(name: string) {
    const next = topics.filter((p) => p !== name);
    save(next.length ? next : DEFAULT_TOPICS);
    if (filter === name) setFilter("All");
  }

  const shown = (items ?? [])
    .filter((n) => filter === "All" || n.topic === filter)
    .slice(0, limit);

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight">
          Creative news
        </h2>
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <span className="size-1.5 animate-pulse rounded-full bg-lemon ring-1 ring-ink" />
          Film, motion and design · live
        </p>
      </div>
      {showAll && (
        <Link
          href="/news"
          className="flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"
        >
          All <Icon name="arrow" className="size-4" />
        </Link>
      )}
    </div>
  );

  const chips = (
    <div className="scroll-thin mt-4 flex items-center gap-1.5 overflow-x-auto pb-1">
      {["All", ...topics].map((p) => (
        <span key={p} className="relative shrink-0">
          <button
            onClick={() => setFilter(p)}
            aria-pressed={filter === p}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              filter === p ? "bg-ink text-bg" : "bg-surface-2 text-muted hover:text-ink"
            }`}
          >
            {p}
          </button>
          {p !== "All" && filter === p && (
            <button
              onClick={() => remove(p)}
              aria-label={`Stop following ${p}`}
              className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-lemon text-[10px] font-extrabold text-on-lemon ring-1 ring-ink"
            >
              ×
            </button>
          )}
        </span>
      ))}

      {adding ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
          className="flex shrink-0 items-center gap-1"
        >
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => !draft && setAdding(false)}
            maxLength={40}
            placeholder="e.g. Typography"
            aria-label="Topic to follow"
            className="h-7 w-32 rounded-full border border-ink bg-surface px-3 text-xs outline-none focus:ring-2 focus:ring-lemon"
          />
          <button type="submit" className="h-7 rounded-full bg-lemon px-3 text-xs font-bold text-on-lemon">
            Add
          </button>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-ink/40 px-3 py-1 text-xs font-bold hover:border-ink hover:bg-lemon hover:text-on-lemon"
        >
          <Icon name="plus" className="size-3" strokeWidth={2.4} /> Topic
        </button>
      )}
    </div>
  );

  const list = (
    <ul className={`mt-4 ${rail ? "space-y-4" : "grid gap-4 sm:grid-cols-2"}`}>
      {items === null && !error &&
        Array.from({ length: rail ? 4 : 6 }, (_, i) => (
          <li
            key={i}
            className={`animate-pulse rounded-2xl bg-surface-2 ${rail ? "h-56" : "h-64"}`}
          />
        ))}

      {error && (
        <li className="rounded-2xl border border-dashed border-line p-5 text-sm sm:col-span-2">
          <p className="font-semibold">Couldn&rsquo;t load the news.</p>
          <p className="mt-1 text-muted">The sources may be down, or you&rsquo;re offline.</p>
          <button
            onClick={() => load(topics)}
            className="mt-3 rounded-full bg-lemon px-4 py-1.5 text-xs font-bold text-on-lemon"
          >
            Try again
          </button>
        </li>
      )}

      {shown.map((n) => (
        <li key={`${n.topic}-${n.id}`}>
          <a
            href={n.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-0.5 hover:border-ink hover:shadow-card"
          >
            <Thumb item={n} className={rail ? "aspect-[16/9]" : "aspect-[16/10]"} />
            <div className="p-3.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-full bg-lemon px-2 py-0.5 font-bold text-on-lemon">
                  {n.topic}
                </span>
                <span className="truncate text-muted">
                  {n.source} · {ago(n.published)}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 font-semibold leading-snug">{n.title}</p>
              {!rail && n.summary && (
                <p className="mt-1 line-clamp-2 text-sm text-muted">{n.summary}</p>
              )}
            </div>
          </a>
        </li>
      ))}

      {items && shown.length === 0 && (
        <li className="rounded-2xl border border-dashed border-line p-5 text-sm text-muted sm:col-span-2">
          No recent stories for {filter}. Custom topics match words in
          headlines, so try a broader word.
        </li>
      )}
    </ul>
  );

  if (rail) {
    return (
      <section id="news">
        {header}
        {chips}
        {list}
      </section>
    );
  }

  return (
    <section
      id="news"
      className="rounded-[28px] border border-line bg-surface p-5 shadow-card sm:p-7"
    >
      {header}
      {chips}
      {list}
    </section>
  );
}
