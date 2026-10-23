"use client";

import { Icon } from "../../Icon";
import { ShapeGlyph } from "./shapes";
import { TONES, WIDTHS, colorOf, type BoardItem, type ShapeKind, type Tool } from "./types";

const SHAPES: { id: ShapeKind; label: string }[] = [
  { id: "rect", label: "Rectangle" },
  { id: "ellipse", label: "Ellipse" },
  { id: "triangle", label: "Triangle" },
  { id: "diamond", label: "Diamond" },
  { id: "star", label: "Star" },
  { id: "line", label: "Line" },
  { id: "arrow", label: "Arrow" },
];

export type CropPreset = "1:1" | "4:3" | "16:9" | "3:4" | "reset";

type Props = {
  tool: Tool;
  item: BoardItem | null;
  shapeKind: ShapeKind;
  setShapeKind: (k: ShapeKind) => void;
  width: number;
  setWidth: (n: number) => void;
  textSize: number;
  setTextSize: (n: number) => void;
  bold: boolean;
  setBold: (b: boolean) => void;
  strokeValue: string | null;
  fillValue: string | null;
  onPick: (which: "stroke" | "fill", rect: DOMRect) => void;
  onPatch: (patch: Partial<BoardItem>) => void;
  onDuplicate: () => void;
  onFront: () => void;
  onDelete: () => void;
  onCropPreset: (p: CropPreset) => void;
  onStartCrop: () => void;
  showResolved: boolean;
  setShowResolved: (b: boolean) => void;
};

const pill = "flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition";
const icon = "grid size-8 place-items-center rounded-full transition hover:bg-surface-2";

function Chip({ label, value, onClick }: { label: string; value: string | null; onClick: (rect: DOMRect) => void }) {
  return (
    <button
      onClick={(e) => onClick(e.currentTarget.getBoundingClientRect())}
      aria-label={`${label} colour`}
      className="flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface pl-1.5 pr-3 text-xs font-bold hover:border-ink"
    >
      <span
        style={{ background: value ? colorOf(value) : undefined }}
        className="relative size-5 overflow-hidden rounded-full border border-line bg-surface"
      >
        {!value && <span className="absolute left-1/2 top-[-2px] h-[140%] w-0.5 -translate-x-1/2 rotate-45 bg-[#ff5a36]" />}
      </span>
      {label}
    </button>
  );
}

function Widths({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center" role="group" aria-label="Stroke width">
      {WIDTHS.map((w) => (
        <button
          key={w}
          onClick={() => onChange(w)}
          aria-pressed={value === w}
          aria-label={`Width ${w}`}
          className={`grid size-8 place-items-center rounded-full ${value === w ? "bg-ink/10" : "hover:bg-surface-2"}`}
        >
          <span className="rounded-full bg-ink" style={{ width: Math.min(w + 3, 16), height: Math.min(w + 3, 16) }} />
        </button>
      ))}
    </div>
  );
}

// One floating strip that shows the options for the active tool, or for the
// selected item. Wraps on phones so nothing is cut off.
export function OptionsBar(p: Props) {
  const it = p.item;
  let body: React.ReactNode = null;

  if (p.tool === "shape") {
    body = (
      <>
        <div className="flex items-center" role="group" aria-label="Shape">
          {SHAPES.map((s) => (
            <button
              key={s.id}
              onClick={() => p.setShapeKind(s.id)}
              aria-pressed={p.shapeKind === s.id}
              aria-label={s.label}
              title={s.label}
              className={`${icon} ${p.shapeKind === s.id ? "bg-ink text-bg hover:bg-ink" : ""}`}
            >
              <ShapeGlyph shape={s.id} className="size-4" />
            </button>
          ))}
        </div>
        <Widths value={p.width} onChange={p.setWidth} />
        <Chip label="Stroke" value={p.strokeValue} onClick={(r) => p.onPick("stroke", r)} />
        {p.shapeKind !== "line" && p.shapeKind !== "arrow" && <Chip label="Fill" value={p.fillValue} onClick={(r) => p.onPick("fill", r)} />}
        <span className="text-xs text-muted">Drag on the canvas. Shift keeps it even.</span>
      </>
    );
  } else if (p.tool === "pen" || p.tool === "brush") {
    body = (
      <>
        <Widths value={p.width} onChange={p.setWidth} />
        <Chip label="Colour" value={p.strokeValue} onClick={(r) => p.onPick("stroke", r)} />
        <span className="text-xs text-muted">{p.tool === "brush" ? "Soft, wide marker strokes." : "Fine, solid lines."}</span>
      </>
    );
  } else if (p.tool === "eraser") {
    body = <span className="px-1 text-xs font-semibold">Drag over a drawing to erase it.</span>;
  } else if (p.tool === "hand") {
    body = <span className="px-1 text-xs font-semibold">Drag to move around. Pinch or Ctrl + scroll to zoom.</span>;
  } else if (p.tool === "text") {
    body = (
      <>
        <div className="flex items-center" role="group" aria-label="Text size">
          {[16, 24, 36, 56].map((n) => (
            <button
              key={n}
              onClick={() => p.setTextSize(n)}
              aria-pressed={p.textSize === n}
              className={`${pill} ${p.textSize === n ? "bg-ink text-bg" : "hover:bg-surface-2"}`}
            >
              {n}
            </button>
          ))}
        </div>
        <button
          onClick={() => p.setBold(!p.bold)}
          aria-pressed={p.bold}
          aria-label="Bold"
          className={`${icon} ${p.bold ? "bg-ink text-bg hover:bg-ink" : ""}`}
        >
          <Icon name="bold" className="size-4" />
        </button>
        <Chip label="Colour" value={p.strokeValue} onClick={(r) => p.onPick("stroke", r)} />
        <span className="text-xs text-muted">Click the canvas to type.</span>
      </>
    );
  } else if (p.tool === "crop") {
    body =
      it?.type === "image" ? (
        <>
          <span className="px-1 text-xs font-semibold">Drag the handles to crop.</span>
          {(["1:1", "4:3", "16:9", "3:4"] as const).map((r) => (
            <button key={r} onClick={() => p.onCropPreset(r)} className={`${pill} border border-line bg-surface hover:border-ink`}>
              {r}
            </button>
          ))}
          <button onClick={() => p.onCropPreset("reset")} className={`${pill} border border-line bg-surface hover:border-ink`}>
            Reset
          </button>
        </>
      ) : (
        <span className="px-1 text-xs font-semibold">Click an image to crop it.</span>
      );
  } else if (p.tool === "comment") {
    body = (
      <>
        <span className="px-1 text-xs font-semibold">Tap or click the canvas to leave a comment.</span>
        <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold">
          <input
            type="checkbox"
            checked={p.showResolved}
            onChange={(e) => p.setShowResolved(e.target.checked)}
            className="size-4 accent-[var(--ink)]"
          />
          Show resolved
        </label>
      </>
    );
  } else if (it) {
    // Select tool with something selected.
    body = (
      <>
        {it.type === "shape" && (
          <>
            <Widths value={it.sw ?? 4} onChange={(n) => p.onPatch({ sw: n })} />
            <Chip label="Stroke" value={it.stroke ?? null} onClick={(r) => p.onPick("stroke", r)} />
            {it.shape !== "line" && it.shape !== "arrow" && <Chip label="Fill" value={it.fill ?? null} onClick={(r) => p.onPick("fill", r)} />}
          </>
        )}
        {it.type === "text" && (
          <>
            <div className="flex items-center" role="group" aria-label="Text size">
              {[16, 24, 36, 56].map((n) => (
                <button
                  key={n}
                  onClick={() => p.onPatch({ size: n })}
                  aria-pressed={(it.size ?? 24) === n}
                  className={`${pill} ${(it.size ?? 24) === n ? "bg-ink text-bg" : "hover:bg-surface-2"}`}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              onClick={() => p.onPatch({ bold: !it.bold })}
              aria-pressed={!!it.bold}
              aria-label="Bold"
              className={`${icon} ${it.bold ? "bg-ink text-bg hover:bg-ink" : ""}`}
            >
              <Icon name="bold" className="size-4" />
            </button>
            <Chip label="Colour" value={it.color ?? "ink"} onClick={(r) => p.onPick("stroke", r)} />
          </>
        )}
        {it.type === "swatch" && <Chip label="Colour" value={it.color ?? null} onClick={(r) => p.onPick("stroke", r)} />}
        {it.type === "note" && (
          <div className="flex items-center gap-1" role="group" aria-label="Note colour">
            {TONES.map((t, i) => (
              <button
                key={t}
                onClick={() => p.onPatch({ tone: i })}
                aria-pressed={(it.tone ?? 0) === i}
                aria-label={`Note colour ${i + 1}`}
                className={`size-6 rounded-full border-2 ${t.split(" ").slice(0, 1).join(" ")} ${(it.tone ?? 0) === i ? "border-ink" : "border-line"}`}
              />
            ))}
          </div>
        )}
        {it.type === "image" && (
          <button onClick={p.onStartCrop} className={`${pill} border border-line bg-surface hover:border-ink`}>
            <Icon name="crop" className="size-3.5" /> Crop
          </button>
        )}
        <span className="mx-0.5 hidden h-5 w-px bg-line sm:block" />
        <button onClick={p.onDuplicate} aria-label="Duplicate" title="Duplicate (Ctrl+D)" className={icon}>
          <Icon name="copy" className="size-4" />
        </button>
        <button onClick={p.onFront} aria-label="Bring to front" title="Bring to front" className={icon}>
          <Icon name="front" className="size-4" />
        </button>
        <button onClick={p.onDelete} aria-label="Delete" title="Delete (Del)" className={icon}>
          <Icon name="trash" className="size-4" />
        </button>
      </>
    );
  }

  if (!body) return null;
  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute left-1/2 top-3 z-[60] flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-3xl border border-line bg-surface px-2.5 py-1.5 shadow-card"
    >
      {body}
    </div>
  );
}
