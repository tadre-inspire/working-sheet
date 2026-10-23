"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { createPage, deletePage, updatePage, usePages, type Page } from "@/lib/pages";
import { useSyncStatus } from "@/lib/pages-sync";
import { TEMPLATES } from "@/lib/templates";
import { Icon } from "../Icon";
import { Editor } from "./Editor";

const EMOJI = ["📄", "🎨", "🎬", "🧩", "🧭", "💡", "📸", "✏️", "🚀", "🎞️", "🖼️", "🔥"];

function ago(ts: number) {
  const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
}

function TemplatePicker({
  onPick,
  onClose,
}: {
  onPick: (templateId: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-end bg-black/50 p-3 backdrop-blur-sm sm:place-items-center"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-label="New page"
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-[28px] border border-line bg-surface p-5 shadow-card sm:p-7"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Start a new project</h2>
            <p className="text-sm text-muted">Pick a template. You can change everything after.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full border border-line hover:border-ink"
          >
            ×
          </button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => onPick(t.id)}
              className="group flex items-start gap-3 rounded-2xl border border-line p-4 text-left transition hover:-translate-y-0.5 hover:border-ink hover:bg-lemon hover:text-on-lemon"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-2xl text-ink">
                {t.icon}
              </span>
              <span>
                <span className="block font-display font-bold">{t.name}</span>
                <span className="block text-sm opacity-70">{t.blurb}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Tree({
  pages,
  parentId,
  depth,
  selectedId,
  open,
  toggle,
  onSelect,
  onAddChild,
  onDelete,
}: {
  pages: Page[];
  parentId: string | null;
  depth: number;
  selectedId: string | null;
  open: Set<string>;
  toggle: (id: string) => void;
  onSelect: (id: string) => void;
  onAddChild: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const rows = pages.filter((p) => p.parentId === parentId);
  return (
    <ul>
      {rows.map((p) => {
        const kids = pages.some((c) => c.parentId === p.id);
        const expanded = open.has(p.id);
        return (
          <li key={p.id}>
            <div
              style={{ paddingLeft: 6 + depth * 14 }}
              className={`group flex items-center gap-1 rounded-xl py-1 pr-1 transition ${
                p.id === selectedId ? "bg-lemon text-on-lemon" : "hover:bg-surface-2"
              }`}
            >
              <button
                onClick={() => toggle(p.id)}
                aria-label={expanded ? "Collapse" : "Expand"}
                className={`grid size-6 shrink-0 place-items-center rounded-md ${kids ? "" : "invisible"} hover:bg-black/10`}
              >
                <Icon name="chevR" className={`size-3.5 transition ${expanded ? "rotate-90" : ""}`} strokeWidth={2.2} />
              </button>
              <button
                onClick={() => onSelect(p.id)}
                className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left text-sm font-semibold"
              >
                <span className="text-base">{p.icon}</span>
                <span className="truncate">{p.title || "Untitled"}</span>
              </button>
              <button
                onClick={() => onAddChild(p.id)}
                aria-label={`Add a page inside ${p.title}`}
                className="grid size-6 place-items-center rounded-md opacity-0 transition hover:bg-black/10 focus:opacity-100 group-hover:opacity-100"
              >
                <Icon name="plus" className="size-3.5" strokeWidth={2.4} />
              </button>
              <button
                onClick={() => onDelete(p.id)}
                aria-label={`Delete ${p.title}`}
                className="grid size-6 place-items-center rounded-md opacity-0 transition hover:bg-black/10 focus:opacity-100 group-hover:opacity-100"
              >
                <Icon name="trash" className="size-3.5" />
              </button>
            </div>
            {kids && expanded && (
              <Tree
                pages={pages}
                parentId={p.id}
                depth={depth + 1}
                selectedId={selectedId}
                open={open}
                toggle={toggle}
                onSelect={onSelect}
                onAddChild={onAddChild}
                onDelete={onDelete}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function Workspace() {
  const { pages, ready, saveError } = usePages();
  const { user } = useAuth();
  const sync = useSyncStatus();
  const router = useRouter();
  const params = useSearchParams();
  const wantNew = params.get("new") === "1";
  const wantPage = params.get("p");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [picker, setPicker] = useState<{ parentId: string | null } | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [showTree, setShowTree] = useState(false);
  const [iconOpen, setIconOpen] = useState(false);

  // Pick the page from ?p=, else the last one used, else the first.
  useEffect(() => {
    if (!ready) return;
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("marketcap.page.sel");
    } catch {}
    const id = [wantPage, saved].find((x) => x && pages.some((p) => p.id === x)) ?? pages.find((p) => !p.parentId)?.id ?? null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedId((cur) => (cur && pages.some((p) => p.id === cur) && !wantPage ? cur : id));
  }, [ready, pages, wantPage]);

  // ?new=1 opens the template picker once, not on every page change.
  const openedFromUrl = useRef(false);
  useEffect(() => {
    if (ready && wantNew && !openedFromUrl.current) {
      openedFromUrl.current = true;
      setPicker({ parentId: null });
    }
  }, [ready, wantNew]);

  const page = useMemo(() => pages.find((p) => p.id === selectedId) ?? null, [pages, selectedId]);

  const trail = useMemo(() => {
    const out: Page[] = [];
    let cur = page;
    while (cur) {
      out.unshift(cur);
      const pid: string | null = cur.parentId;
      cur = pid ? (pages.find((p) => p.id === pid) ?? null) : null;
    }
    return out;
  }, [page, pages]);

  function select(id: string) {
    setSelectedId(id);
    setShowTree(false);
    setIconOpen(false);
    try {
      localStorage.setItem("marketcap.page.sel", id);
    } catch {}
    if (wantPage || wantNew) router.replace("/workspace");
  }

  function closePicker() {
    setPicker(null);
    if (wantNew) router.replace("/workspace");
  }

  function create(templateId: string) {
    const t = TEMPLATES.find((x) => x.id === templateId)!;
    const parentId = picker?.parentId ?? null;
    const id = createPage({ parentId, title: t.title, icon: t.icon, content: t.content });
    if (parentId) setOpen((o) => new Set(o).add(parentId));
    setPicker(null);
    select(id);
  }

  function remove(id: string) {
    const p = pages.find((x) => x.id === id);
    const kids = pages.some((c) => c.parentId === id);
    const msg = kids
      ? `Delete "${p?.title}" and the pages inside it? This can't be undone.`
      : `Delete "${p?.title}"? This can't be undone.`;
    if (!window.confirm(msg)) return;
    deletePage(id);
  }

  function toggle(id: string) {
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  if (!ready) {
    return <div className="mx-auto h-[70vh] max-w-[1280px] animate-pulse rounded-[28px] bg-surface-2" />;
  }

  const treePanel = (
    <aside
      className={`${showTree ? "block" : "hidden"} rounded-[28px] border border-line bg-surface p-3 shadow-card lg:sticky lg:top-6 lg:block lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto`}
    >
      <div className="flex items-center justify-between px-2 pb-2 pt-1">
        <h2 className="font-display text-lg font-bold">Pages</h2>
        <button
          onClick={() => setPicker({ parentId: null })}
          className="flex h-8 items-center gap-1 rounded-full bg-ink px-3 text-xs font-bold text-bg transition hover:bg-lemon hover:text-on-lemon"
        >
          <Icon name="plus" className="size-3.5" strokeWidth={2.4} /> New
        </button>
      </div>
      <Tree
        pages={pages}
        parentId={null}
        depth={0}
        selectedId={selectedId}
        open={open}
        toggle={toggle}
        onSelect={select}
        onAddChild={(id) => setPicker({ parentId: id })}
        onDelete={remove}
      />
      <p className="px-2 pt-3 text-[11px] leading-snug text-muted">
        {user ? (
          sync === "error"
            ? "Couldn't sync. Changes are kept on this device and retried."
            : sync === "syncing"
              ? "Syncing to your account…"
              : "Synced to your account."
        ) : (
          <>
            Saved on this device only.{" "}
            <Link href="/signin" className="font-semibold text-ink underline decoration-lemon decoration-2 underline-offset-2">
              Sign in
            </Link>{" "}
            to sync across devices.
          </>
        )}
      </p>
    </aside>
  );

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="mb-4 flex items-center justify-between lg:hidden">
        <button
          onClick={() => setShowTree((s) => !s)}
          className="flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-bold"
        >
          <Icon name="doc" className="size-4" /> Pages
          <Icon name="chevD" className={`size-4 transition ${showTree ? "rotate-180" : ""}`} />
        </button>
        <button
          onClick={() => setPicker({ parentId: null })}
          className="flex h-10 items-center gap-1.5 rounded-full bg-lemon px-4 text-sm font-bold text-on-lemon"
        >
          <Icon name="plus" className="size-4" strokeWidth={2.4} /> New page
        </button>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
        {treePanel}

        <article className="min-w-0 rounded-[28px] border border-line bg-surface shadow-card">
          {page ? (
            <div key={page.id} className="mx-auto max-w-[820px] px-5 pb-24 pt-7 sm:px-10 sm:pt-10">
              <nav className="flex flex-wrap items-center gap-1 text-xs text-muted" aria-label="Breadcrumb">
                {trail.map((t, i) => (
                  <span key={t.id} className="flex items-center gap-1">
                    {i > 0 && <Icon name="chevR" className="size-3" />}
                    <button
                      onClick={() => select(t.id)}
                      className={`rounded px-1 hover:bg-surface-2 ${i === trail.length - 1 ? "font-semibold text-ink" : ""}`}
                    >
                      {t.icon} {t.title || "Untitled"}
                    </button>
                  </span>
                ))}
                <span className="ml-auto">Edited {ago(page.updatedAt)}</span>
              </nav>

              {saveError && (
                <p className="mt-3 rounded-xl border border-ink bg-lemon px-3 py-2 text-sm font-semibold text-on-lemon">
                  Storage is full, so recent changes aren&rsquo;t saved. Remove a few large images from your working sheets.
                </p>
              )}

              <div className="relative mt-6">
                <button
                  onClick={() => setIconOpen((o) => !o)}
                  aria-label="Change icon"
                  className="grid size-16 place-items-center rounded-2xl bg-surface-2 text-4xl transition hover:bg-lemon"
                >
                  {page.icon}
                </button>
                {iconOpen && (
                  <div className="absolute left-0 top-[72px] z-30 grid grid-cols-6 gap-1 rounded-2xl border border-line bg-surface p-2 shadow-card">
                    {EMOJI.map((e) => (
                      <button
                        key={e}
                        onClick={() => {
                          updatePage(page.id, { icon: e });
                          setIconOpen(false);
                        }}
                        className="grid size-10 place-items-center rounded-xl text-xl hover:bg-lemon"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                value={page.title}
                onChange={(e) => updatePage(page.id, { title: e.target.value })}
                placeholder="Untitled"
                aria-label="Page title"
                className="mt-3 w-full bg-transparent font-display text-4xl font-extrabold tracking-tight outline-none placeholder:text-muted/50 sm:text-5xl"
              />

              <div className="mt-6">
                <Editor content={page.content} onChange={(json) => updatePage(page.id, { content: json })} />
              </div>
            </div>
          ) : (
            <div className="grid min-h-[50vh] place-items-center p-10 text-center">
              <div>
                <p className="font-display text-2xl font-bold">No page selected</p>
                <button
                  onClick={() => setPicker({ parentId: null })}
                  className="mt-4 rounded-full bg-lemon px-5 py-2.5 text-sm font-bold text-on-lemon"
                >
                  Start a project
                </button>
              </div>
            </div>
          )}
        </article>
      </div>

      {picker && <TemplatePicker onPick={create} onClose={closePicker} />}
    </div>
  );
}
