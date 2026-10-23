"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "../../Icon";

// Pin-style comments on a working sheet. Each pin holds a thread of messages and
// can be resolved. Threads live in the sheet's data, so they save with the page.

export type Msg = { id: string; at: number; by: string; text: string };
export type Thread = { id: string; x: number; y: number; resolved: boolean; msgs: Msg[] };

const uid = () => Math.random().toString(36).slice(2, 9);
export const newThread = (x: number, y: number): Thread => ({ id: uid(), x, y, resolved: false, msgs: [] });
export const newMsg = (by: string, text: string): Msg => ({ id: uid(), at: Date.now(), by, text: text.trim().slice(0, 1000) });

function ago(ts: number) {
  const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
}

export function CommentPins({
  threads,
  selectedId,
  showResolved,
  project,
  onSelect,
}: {
  threads: Thread[];
  selectedId: string | null;
  showResolved: boolean;
  /** Where a thread's pin sits on screen (follows canvas pan and zoom). */
  project: (t: Thread) => { left: number; top: number };
  onSelect: (id: string | null) => void;
}) {
  const numbered = threads.filter((t) => t.msgs.length > 0 || t.id === selectedId);

  return (
    <div className="pointer-events-none absolute inset-0 z-[55] overflow-hidden">
      {numbered.map((t, i) => {
        if (t.resolved && !showResolved && t.id !== selectedId) return null;
        const open = t.id === selectedId;
        const pos = project(t);
        return (
          <button
            key={t.id}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(open ? null : t.id);
            }}
            aria-label={`Comment ${i + 1}${t.resolved ? " (resolved)" : ""}`}
            aria-pressed={open}
            style={{ left: pos.left, top: pos.top }}
            className={`pointer-events-auto absolute grid size-8 -translate-x-1/2 -translate-y-full place-items-center rounded-full rounded-bl-none border-2 text-xs font-extrabold shadow-card transition hover:scale-110 ${
              t.resolved
                ? "border-line bg-surface-2 text-muted"
                : open
                  ? "border-ink bg-ink text-bg"
                  : "border-ink bg-lemon text-on-lemon"
            }`}
          >
            {t.resolved ? <Icon name="check" className="size-4" strokeWidth={2.6} /> : i + 1}
          </button>
        );
      })}
    </div>
  );
}

export function ThreadPanel({
  thread,
  number,
  me,
  onSend,
  onResolve,
  onDelete,
  onClose,
}: {
  thread: Thread;
  number: number;
  me: string;
  onSend: (text: string) => void;
  onResolve: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [thread.id]);

  function send() {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  }

  return (
    <div className="border-t border-line bg-surface p-3 sm:p-4" role="region" aria-label={`Comment thread ${number}`}>
      <div className="flex items-center gap-2">
        <span className="grid size-6 place-items-center rounded-full bg-lemon text-[11px] font-extrabold text-on-lemon">
          {number}
        </span>
        <span className="font-display text-sm font-bold">
          {thread.msgs.length === 0 ? "New comment" : thread.resolved ? "Resolved thread" : "Thread"}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          {thread.msgs.length > 0 && (
            <button
              onClick={onResolve}
              className="flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-bold transition hover:border-ink"
            >
              <Icon name="check" className="size-3.5" strokeWidth={2.4} />
              {thread.resolved ? "Reopen" : "Resolve"}
            </button>
          )}
          <button
            onClick={onDelete}
            aria-label="Delete thread"
            className="grid size-8 place-items-center rounded-full border border-line transition hover:border-ink"
          >
            <Icon name="trash" className="size-3.5" />
          </button>
          <button
            onClick={onClose}
            aria-label="Close thread"
            className="grid size-8 place-items-center rounded-full border border-line transition hover:border-ink"
          >
            ×
          </button>
        </div>
      </div>

      {thread.msgs.length > 0 && (
        <ul className="scroll-thin mt-3 max-h-48 space-y-3 overflow-y-auto pr-1">
          {thread.msgs.map((m) => (
            <li key={m.id} className="flex gap-2.5">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-bold">
                {m.by[0]?.toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-xs">
                  <span className="font-bold">{m.by}</span> <span className="text-muted">{ago(m.at)}</span>
                </p>
                <p className="whitespace-pre-wrap break-words text-sm">{m.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex items-end gap-2">
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
            if (e.key === "Escape") onClose();
          }}
          rows={2}
          maxLength={1000}
          placeholder={thread.msgs.length ? `Reply as ${me}…` : `Comment as ${me}…`}
          aria-label="Write a comment"
          className="min-h-[44px] flex-1 resize-none rounded-2xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm outline-none focus:border-ink focus:ring-4 focus:ring-lemon/60"
        />
        <button
          onClick={send}
          disabled={!text.trim()}
          className="h-11 rounded-full bg-lemon px-5 text-sm font-bold text-on-lemon disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
