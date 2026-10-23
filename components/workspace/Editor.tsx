"use client";

import { Extension, type Editor as TipTapEditor, type JSONContent, type Range } from "@tiptap/core";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Suggestion from "@tiptap/suggestion";
import { useEffect, useRef, useState } from "react";
import { WorkingSheetNode } from "./working-sheet/extension";

type SlashItem = {
  title: string;
  hint: string;
  glyph: string;
  keys: string;
  run: (editor: TipTapEditor, range: Range) => void;
};

const chain = (editor: TipTapEditor, range: Range) => editor.chain().focus().deleteRange(range);

const SLASH_ITEMS: SlashItem[] = [
  { title: "Text", hint: "Plain paragraph", glyph: "¶", keys: "text paragraph", run: (e, r) => chain(e, r).setParagraph().run() },
  { title: "Heading 1", hint: "Big section title", glyph: "H1", keys: "h1 heading title", run: (e, r) => chain(e, r).setHeading({ level: 1 }).run() },
  { title: "Heading 2", hint: "Medium heading", glyph: "H2", keys: "h2 heading", run: (e, r) => chain(e, r).setHeading({ level: 2 }).run() },
  { title: "Heading 3", hint: "Small heading", glyph: "H3", keys: "h3 heading", run: (e, r) => chain(e, r).setHeading({ level: 3 }).run() },
  { title: "To-do list", hint: "Track tasks", glyph: "☑", keys: "todo task checklist check", run: (e, r) => chain(e, r).toggleTaskList().run() },
  { title: "Bulleted list", hint: "Simple list", glyph: "•", keys: "bullet list ul", run: (e, r) => chain(e, r).toggleBulletList().run() },
  { title: "Numbered list", hint: "Ordered steps", glyph: "1.", keys: "number ordered list ol", run: (e, r) => chain(e, r).toggleOrderedList().run() },
  { title: "Quote", hint: "Pull a line out", glyph: "”", keys: "quote blockquote", run: (e, r) => chain(e, r).toggleBlockquote().run() },
  { title: "Code", hint: "Code block", glyph: "</>", keys: "code snippet", run: (e, r) => chain(e, r).toggleCodeBlock().run() },
  { title: "Divider", hint: "Horizontal line", glyph: "—", keys: "divider hr line rule", run: (e, r) => chain(e, r).setHorizontalRule().run() },
  {
    title: "Working sheet",
    hint: "Canvas for images, notes, drawing, shapes",
    glyph: "▦",
    keys: "working sheet worksheet mood board moodboard canvas images board sheet",
    run: (e, r) => chain(e, r).insertContent([{ type: "workingSheet", attrs: { items: [], height: 520 } }, { type: "paragraph" }]).run(),
  },
];

type SlashState = {
  items: SlashItem[];
  index: number;
  rect: DOMRect | null;
  command: (item: SlashItem) => void;
};

type Bridge = { state: SlashState | null; publish: (s: SlashState | null) => void };

function slashExtension(bridge: Bridge) {
  const set = (s: SlashState | null) => {
    bridge.state = s;
    bridge.publish(s);
  };
  return Extension.create({
    name: "slashCommand",
    addProseMirrorPlugins() {
      return [
        Suggestion<SlashItem, SlashItem>({
          editor: this.editor,
          char: "/",
          allowSpaces: false,
          items: ({ query }) => {
            const q = query.toLowerCase().trim();
            return SLASH_ITEMS.filter((i) => !q || `${i.title} ${i.keys}`.toLowerCase().includes(q));
          },
          command: ({ editor, range, props }) => props.run(editor, range),
          render: () => ({
            onStart: (p) =>
              set({ items: p.items, index: 0, rect: p.clientRect?.() ?? null, command: (i) => p.command(i) }),
            onUpdate: (p) =>
              set({
                items: p.items,
                index: Math.min(bridge.state?.index ?? 0, Math.max(0, p.items.length - 1)),
                rect: p.clientRect?.() ?? null,
                command: (i) => p.command(i),
              }),
            onKeyDown: ({ event }) => {
              const s = bridge.state;
              if (!s || !s.items.length) return false;
              if (event.key === "ArrowDown") {
                set({ ...s, index: (s.index + 1) % s.items.length });
                return true;
              }
              if (event.key === "ArrowUp") {
                set({ ...s, index: (s.index - 1 + s.items.length) % s.items.length });
                return true;
              }
              if (event.key === "Enter") {
                s.command(s.items[s.index]);
                return true;
              }
              if (event.key === "Escape") {
                set(null);
                return true;
              }
              return false;
            },
            onExit: () => set(null),
          }),
        }),
      ];
    },
  });
}

function SlashMenu({ state }: { state: SlashState }) {
  if (!state.items.length || !state.rect) return null;
  const width = 300;
  const left = Math.min(Math.max(8, state.rect.left), window.innerWidth - width - 8);
  const below = state.rect.bottom + 8;
  const flip = below + 340 > window.innerHeight && state.rect.top > 340;
  return (
    <div
      role="listbox"
      style={{
        position: "fixed",
        left,
        width,
        ...(flip ? { bottom: window.innerHeight - state.rect.top + 8 } : { top: below }),
      }}
      className="scroll-thin z-[60] max-h-[320px] overflow-y-auto rounded-2xl border border-line bg-surface p-1.5 shadow-card"
    >
      <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
        Add a block
      </p>
      {state.items.map((it, i) => (
        <button
          key={it.title}
          role="option"
          aria-selected={i === state.index}
          onMouseDown={(e) => {
            e.preventDefault();
            state.command(it);
          }}
          className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition ${
            i === state.index ? "bg-lemon text-on-lemon" : "hover:bg-surface-2"
          }`}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-black/10 bg-surface-2 font-display text-sm font-bold text-ink">
            {it.glyph}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold">{it.title}</span>
            <span className="block truncate text-xs opacity-70">{it.hint}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function Toolbar({ editor }: { editor: TipTapEditor }) {
  const b = (label: string, glyph: React.ReactNode, active: boolean, run: () => void, extra = "") => (
    <button
      key={label}
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={run}
      className={`grid h-9 min-w-9 place-items-center rounded-xl px-2 text-sm font-bold transition ${extra} ${
        active ? "bg-lemon text-on-lemon" : "text-muted hover:bg-surface-2 hover:text-ink"
      }`}
    >
      {glyph}
    </button>
  );
  const c = () => editor.chain().focus();
  const sep = (k: string) => <span key={k} className="mx-1 h-5 w-px bg-line" />;

  return (
    <div className="scroll-thin sticky top-2 z-20 mb-6 flex items-center gap-0.5 overflow-x-auto rounded-2xl border border-line bg-surface/90 p-1.5 shadow-card backdrop-blur">
      {b("Bold", "B", editor.isActive("bold"), () => c().toggleBold().run())}
      {b("Italic", <i>I</i>, editor.isActive("italic"), () => c().toggleItalic().run())}
      {b("Strike", <s>S</s>, editor.isActive("strike"), () => c().toggleStrike().run())}
      {b("Highlight", "▮", editor.isActive("highlight"), () => c().toggleHighlight().run())}
      {sep("1")}
      {b("Heading 1", "H1", editor.isActive("heading", { level: 1 }), () => c().toggleHeading({ level: 1 }).run())}
      {b("Heading 2", "H2", editor.isActive("heading", { level: 2 }), () => c().toggleHeading({ level: 2 }).run())}
      {b("Heading 3", "H3", editor.isActive("heading", { level: 3 }), () => c().toggleHeading({ level: 3 }).run())}
      {sep("2")}
      {b("To-do list", "☑", editor.isActive("taskList"), () => c().toggleTaskList().run())}
      {b("Bulleted list", "•", editor.isActive("bulletList"), () => c().toggleBulletList().run())}
      {b("Numbered list", "1.", editor.isActive("orderedList"), () => c().toggleOrderedList().run())}
      {b("Quote", "”", editor.isActive("blockquote"), () => c().toggleBlockquote().run())}
      {b("Code", "</>", editor.isActive("codeBlock"), () => c().toggleCodeBlock().run())}
      {sep("3")}
      {b("Add working sheet", "▦ Sheet", false, () =>
        c().insertContent([{ type: "workingSheet", attrs: { items: [], height: 520 } }, { type: "paragraph" }]).run(), "whitespace-nowrap",
      )}
    </div>
  );
}

export function Editor({
  content,
  onChange,
}: {
  content: JSONContent | null;
  onChange: (json: JSONContent) => void;
}) {
  const [slash, setSlash] = useState<SlashState | null>(null);
  const [bridge] = useState<Bridge>(() => ({ state: null, publish: setSlash }));
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latest = useRef<JSONContent | null>(null);
  const changeRef = useRef(onChange);

  useEffect(() => {
    changeRef.current = onChange;
  });

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    content: content ?? undefined,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight,
      WorkingSheetNode,
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === "heading" ? "Heading" : "Type '/' for blocks, or just write…",
      }),
      slashExtension(bridge),
    ],
    editorProps: { attributes: { class: "tiptap", spellcheck: "true" } },
    onUpdate: ({ editor }) => {
      latest.current = editor.getJSON();
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        if (latest.current) changeRef.current(latest.current);
        latest.current = null;
      }, 350);
    },
  });

  // Flush a pending save when switching pages or leaving.
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (latest.current) changeRef.current(latest.current);
    },
    [],
  );

  if (!editor) return <div className="h-64 animate-pulse rounded-2xl bg-surface-2" />;

  return (
    <div>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      {slash && <SlashMenu state={slash} />}
    </div>
  );
}
