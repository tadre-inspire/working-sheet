"use client";

import { useSyncExternalStore } from "react";
import { getAllPages, migrateContent, replacePages, resetPages, setRemote, type Page } from "./pages";
import { supabase } from "./supabase";

// Mirrors the local page store to the Supabase `pages` table while signed in.
// Row Level Security guarantees you only ever read and write your own rows.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEBOUNCE_MS = 700;

type Status = "off" | "syncing" | "synced" | "error";
let status: Status = "off";
const listeners = new Set<() => void>();
const setStatus = (s: Status) => {
  status = s;
  listeners.forEach((l) => l());
};
export function useSyncStatus(): Status {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => void listeners.delete(cb);
    },
    () => status,
    () => "off" as Status,
  );
}

let chain: Promise<unknown> = Promise.resolve();
const queue = (fn: () => Promise<void>) => {
  chain = chain.then(fn).catch((e) => {
    console.warn("pages sync failed", e);
    setStatus("error");
  });
  return chain;
};

const known = new Set<string>(); // ids confirmed to exist in the database
const timers = new Map<string, ReturnType<typeof setTimeout>>();

const toRow = (p: Page) => ({
  id: p.id,
  parent_id: p.parentId,
  title: p.title.slice(0, 300),
  icon: p.icon,
  content: p.content,
});

async function push(id: string) {
  const all = getAllPages();
  const page = all.find((p) => p.id === id);
  if (!page) return;
  // A child needs its parent in the database first.
  if (page.parentId && !known.has(page.parentId)) await push(page.parentId);
  const { error } = await supabase.from("pages").upsert(toRow(page));
  if (error) throw error;
  known.add(id);
  setStatus("synced");
}

function schedule(page: Page) {
  clearTimeout(timers.get(page.id));
  setStatus("syncing");
  timers.set(
    page.id,
    setTimeout(() => {
      timers.delete(page.id);
      queue(() => push(page.id));
    }, DEBOUNCE_MS),
  );
}

async function flushAll() {
  for (const [id, t] of timers) {
    clearTimeout(t);
    timers.delete(id);
    queue(() => push(id));
  }
  await chain;
}

const depth = (p: Page, byId: Map<string, Page>) => {
  let d = 0;
  for (let cur: Page | undefined = p; cur?.parentId && d < 50; d++) cur = byId.get(cur.parentId);
  return d;
};

export async function startSync() {
  setStatus("syncing");
  const { data, error } = await supabase
    .from("pages")
    .select("id,parent_id,title,icon,content,updated_at");
  if (error) {
    setStatus("error");
    throw error;
  }

  const remotePages: Page[] = data.map((r) => ({
    id: r.id,
    parentId: r.parent_id,
    title: r.title,
    icon: r.icon,
    content: migrateContent(r.content),
    updatedAt: Date.parse(r.updated_at),
  }));
  known.clear();
  remotePages.forEach((p) => known.add(p.id));

  // A returning user shouldn't get this device's untouched starter pages.
  let local = getAllPages();
  if (remotePages.length) local = local.filter((p) => !p.seed);

  // Pages made before accounts existed have short ids; give them real UUIDs.
  const remap = new Map<string, string>();
  local.forEach((p) => {
    if (!UUID.test(p.id)) remap.set(p.id, crypto.randomUUID());
  });
  local = local.map((p) => ({
    ...p,
    id: remap.get(p.id) ?? p.id,
    parentId: p.parentId ? (remap.get(p.parentId) ?? p.parentId) : null,
    seed: p.seed,
  }));

  // Newest edit wins per page; anything only on this device gets pushed up.
  const merged = new Map(remotePages.map((p) => [p.id, p]));
  const toPush: Page[] = [];
  for (const p of local) {
    if (p.seed) {
      // Sample pages stay on this device; pushing them would use up the free project.
      if (!merged.has(p.id)) merged.set(p.id, p);
      continue;
    }
    const r = merged.get(p.id);
    if (!r || p.updatedAt > r.updatedAt + 2000) {
      merged.set(p.id, p);
      toPush.push(p);
    }
  }
  // Drop dangling parents.
  const all = [...merged.values()].map((p) =>
    p.parentId && !merged.has(p.parentId) ? { ...p, parentId: null } : p,
  );
  const byId = new Map(all.map((p) => [p.id, p]));
  replacePages(all);

  toPush.sort((a, b) => depth(a, byId) - depth(b, byId));
  for (const p of toPush) queue(() => push(p.id));

  setRemote({
    upsert: schedule,
    remove: (ids) => {
      ids.forEach((id) => {
        clearTimeout(timers.get(id));
        timers.delete(id);
      });
      setStatus("syncing");
      queue(async () => {
        const { error: delError } = await supabase.from("pages").delete().in("id", ids);
        if (delError) throw delError;
        ids.forEach((id) => known.delete(id));
        setStatus("synced");
      });
    },
  });
  await chain;
  if (status !== "error") setStatus("synced");
}

export async function stopSync() {
  await flushAll();
  setRemote(null);
  known.clear();
  setStatus("off");
  resetPages(); // don't leave one account's pages on the device for the next
}
