"use client";

import { Icon, type IconName } from "../../Icon";
import { colorOf, type Tool } from "./types";

const TOOLS: { id: Tool; icon: IconName; label: string; key: string }[] = [
  { id: "select", icon: "cursor", label: "Select and move", key: "V" },
  { id: "hand", icon: "hand", label: "Hand: pan the canvas", key: "H" },
  { id: "pen", icon: "pen", label: "Pen", key: "P" },
  { id: "brush", icon: "brush", label: "Brush (soft marker)", key: "B" },
  { id: "eraser", icon: "eraser", label: "Eraser (ink)", key: "E" },
  { id: "shape", icon: "shapes", label: "Shapes", key: "R" },
  { id: "text", icon: "text", label: "Text", key: "T" },
  { id: "crop", icon: "crop", label: "Crop an image", key: "C" },
  { id: "comment", icon: "chat", label: "Comment", key: "M" },
];

// Left rail on desktop, scrolling row on phones. All tools work with mouse,
// finger and stylus.
export function Rail({
  tool,
  setTool,
  stroke,
  fill,
  onPick,
  canUndo,
  onUndo,
  onRedo,
}: {
  tool: Tool;
  setTool: (t: Tool) => void;
  stroke: string;
  fill: string | null;
  onPick: (which: "stroke" | "fill", rect: DOMRect) => void;
  canUndo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}) {
  const btn = (on: boolean) =>
    `relative grid size-10 shrink-0 md:size-9 place-items-center rounded-xl transition ${
      on ? "bg-ink text-bg" : "text-muted hover:bg-surface-2 hover:text-ink"
    }`;

  return (
    <div
      role="toolbar"
      aria-label="Canvas tools"
      className="scroll-thin flex shrink-0 items-center gap-1 overflow-x-auto border-b border-line bg-surface p-1.5 md:w-[52px] md:flex-col md:overflow-y-auto md:overflow-x-hidden md:border-b-0 md:border-r md:p-2"
    >
      {TOOLS.map((t) => (
        <button
          key={t.id}
          onClick={() => setTool(t.id)}
          aria-pressed={tool === t.id}
          aria-label={`${t.label} (${t.key})`}
          title={`${t.label} (${t.key})`}
          className={btn(tool === t.id)}
        >
          <Icon name={t.icon} className="size-[18px]" />
        </button>
      ))}

      <span className="mx-1 h-6 w-px shrink-0 bg-line md:mx-0 md:my-1 md:h-px md:w-6" />

      <button
        onClick={(e) => onPick("stroke", e.currentTarget.getBoundingClientRect())}
        aria-label="Stroke colour"
        title="Stroke colour"
        className="grid size-10 shrink-0 place-items-center rounded-xl hover:bg-surface-2 md:size-9"
      >
        <span style={{ background: colorOf(stroke) }} className="size-6 rounded-full border-2 border-line" />
      </button>
      <button
        onClick={(e) => onPick("fill", e.currentTarget.getBoundingClientRect())}
        aria-label="Fill colour"
        title="Fill colour"
        className="grid size-10 shrink-0 place-items-center rounded-xl hover:bg-surface-2 md:size-9"
      >
        <span
          style={{ background: fill ? colorOf(fill) : undefined }}
          className="relative size-6 overflow-hidden rounded-md border-2 border-line bg-surface"
        >
          {!fill && <span className="absolute left-1/2 top-[-2px] h-[130%] w-0.5 -translate-x-1/2 rotate-45 bg-[#ff5a36]" />}
        </span>
      </button>

      <span className="mx-1 h-6 w-px shrink-0 bg-line md:mx-0 md:my-1 md:h-px md:w-6" />

      <button onClick={onUndo} disabled={!canUndo} aria-label="Undo" title="Undo (Ctrl+Z)" className={`${btn(false)} disabled:opacity-40`}>
        <Icon name="undo" className="size-[18px]" />
      </button>
      <button onClick={onRedo} aria-label="Redo" title="Redo (Ctrl+Shift+Z)" className={btn(false)}>
        <Icon name="redo" className="size-[18px]" />
      </button>
    </div>
  );
}
