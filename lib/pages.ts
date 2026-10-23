"use client";

import type { JSONContent } from "@tiptap/core";
import { useSyncExternalStore } from "react";
import { TEMPLATES, WELCOME } from "./templates";

// Local-first page store. Pages always live in localStorage so the app works
// offline and signed out. When signed in, lib/pages-sync.ts mirrors every
// change to the Supabase `pages` table (same shape: id, parent_id, content).

export type Page = {
  id: string;
  title: string;
  icon: string;
  parentId: string | null;
  content: JSONContent | null;
  updatedAt: number;
  seed?: boolean; // starter page the user never touched
};

export type RemoteHooks = {
  upsert: (page: Page) => void;
  remove: (ids: string[]) => void;
};

const KEY = "marketcap.pages.v1";

// The mood board block was renamed "working sheet". Pages saved before that
// still say "moodBoard", so rewrite them when they are loaded.
function migrateNode(n: JSONContent): JSONContent {
  return {
    ...n,
    ...(n.type === "moodBoard" ? { type: "workingSheet" } : {}),
    ...(n.content ? { content: n.content.map(migrateNode) } : {}),
  };
}
export const migrateContent = (c: JSONContent | null): JSONContent | null => (c ? migrateNode(c) : c);
const EMPTY: Page[] = [];

let cache: Page[] | null = null;
let saveError = false;
let remote: RemoteHooks | null = null;
const listeners = new Set<() => void>();

const uid = () => crypto.randomUUID();

function seed(): Page[] {
  const now = Date.now();
  const welcome: Page = {
    id: uid(), title: "Welcome", icon: "👋", parentId: null, content: WELCOME, updatedAt: now, seed: true,
  };
  const mood = TEMPLATES.find((t) => t.id === "working-sheet")!;
  const board: Page = {
    id: uid(), title: "Lagos night market", icon: mood.icon, parentId: null,
    content: mood.content, updatedAt: now - 1000, seed: true,
  };
  return [welcome, board];
}

function persist(next: Page[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    saveError = false;
  } catch {
    saveError = true; // usually: storage full because of big images
  }
}

function read(): Page[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length) {
      cache = (parsed as Page[]).map((p) => ({ ...p, content: migrateContent(p.content) }));
      if (JSON.stringify(cache) !== raw) localStorage.setItem(KEY, JSON.stringify(cache));
    } else {
      // First visit: save the starter pages so their ids stay stable.
      cache = seed();
      localStorage.setItem(KEY, JSON.stringify(cache));
    }
  } catch {
    cache = cache ?? seed();
  }
  return cache!;
}

function commit(next: Page[]) {
  cache = next;
  persist(next);
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

// --- hooks used by the sync module ---------------------------------------
export const getAllPages = () => read();
export const setRemote = (r: RemoteHooks | null) => {
  remote = r;
};
/** Replace everything (after a sync merge, or on sign-out). */
export function replacePages(next: Page[]) {
  commit(next.length ? next : seed());
}
/** Forget this device's pages (sign-out) and start fresh with the starter pages. */
export function resetPages() {
  commit(seed());
}

// --- public API ----------------------------------------------------------
export function createPage(
  opts: { parentId?: string | null; title?: string; icon?: string; content?: JSONContent } = {},
): string {
  const id = uid();
  const page: Page = {
    id,
    title: opts.title ?? "Untitled",
    icon: opts.icon ?? "📄",
    parentId: opts.parentId ?? null,
    content: opts.content ?? { type: "doc", content: [{ type: "paragraph" }] },
    updatedAt: Date.now(),
  };
  commit([page, ...read()]);
  remote?.upsert(page);
  return id;
}

export function updatePage(id: string, patch: Partial<Omit<Page, "id">>) {
  let updated: Page | null = null;
  commit(
    read().map((p) => {
      if (p.id !== id) return p;
      updated = { ...p, ...patch, seed: false, updatedAt: Date.now() };
      return updated;
    }),
  );
  if (updated) remote?.upsert(updated);
}

export function deletePage(id: string) {
  const all = read();
  const doomed = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const p of all)
      if (p.parentId && doomed.has(p.parentId) && !doomed.has(p.id)) {
        doomed.add(p.id);
        grew = true;
      }
  }
  const rest = all.filter((p) => !doomed.has(p.id));
  commit(rest.length ? rest : seed());
  remote?.remove([...doomed]);
}

export function usePages() {
  const pages = useSyncExternalStore(subscribe, read, () => EMPTY);
  const failed = useSyncExternalStore(subscribe, () => saveError, () => false);
  return { pages, ready: pages !== EMPTY, saveError: failed };
}
