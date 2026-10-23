"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "../../Icon";
import { clamp, colorOf } from "./types";

const PRESETS = ["ink", "#0e0e0c", "#f3f3ea", "#8f8f84", "#dcff3a", "#ff5a36", "#ff9f1c", "#2ec27e", "#3a8dff", "#7c5cff", "#ff4fa3", "#14b8a6"];
const RECENT_KEY = "marketcap.colors";

type EyeDropperCtor = new () => { open(): Promise<{ sRGBHex: string }> };

function hexToHsv(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  return [((h * 60) + 360) % 360, max ? d / max : 0, max];
}

function hsvToHex(h: number, s: number, v: number) {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  const to = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${to(f(5))}${to(f(3))}${to(f(1))}`;
}

const isHex = (v: string) => /^#[0-9a-f]{6}$/i.test(v);

function readRecent(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((c) => typeof c === "string" && isHex(c)).slice(0, 8) : [];
  } catch {
    return [];
  }
}

export function ColorPicker({
  value,
  allowNone,
  anchor,
  title,
  onChange,
  onClose,
}: {
  value: string | null;
  allowNone: boolean;
  anchor: DOMRect;
  title: string;
  onChange: (c: string | null) => void;
  onClose: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const start = value && isHex(value) ? value : "#dcff3a";
  const [hsv, setHsv] = useState<[number, number, number]>(() => hexToHsv(start));
  const [hex, setHex] = useState(start);
  const [recent, setRecent] = useState<string[]>(readRecent);
  const supportsDropper = typeof window !== "undefined" && "EyeDropper" in window;

  useEffect(() => {
    const down = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) onClose();
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("keydown", key);
    };
  }, [onClose]);

  function remember(c: string) {
    const next = [c, ...recent.filter((x) => x !== c)].slice(0, 8);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {}
  }

  function setFromHsv(next: [number, number, number], commit = true) {
    setHsv(next);
    const c = hsvToHex(...next);
    setHex(c);
    if (commit) onChange(c);
  }

  function setFromHex(c: string) {
    const h = c.startsWith("#") ? c : `#${c}`;
    setHex(h);
    if (isHex(h)) {
      setHsv(hexToHsv(h));
      onChange(h);
      remember(h);
    }
  }

  function dragArea(e: React.PointerEvent<HTMLDivElement>, apply: (x: number, y: number) => void) {
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const at = (ev: { clientX: number; clientY: number }) => {
      const r = el.getBoundingClientRect();
      apply(clamp((ev.clientX - r.left) / r.width, 0, 1), clamp((ev.clientY - r.top) / r.height, 0, 1));
    };
    at(e);
    const move = (ev: PointerEvent) => at(ev);
    const up = () => {
      el.removeEventListener("pointermove", move);
      remember(hsvToHex(...hsvRef.current));
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up, { once: true });
  }

  const hsvRef = useRef(hsv);
  useEffect(() => {
    hsvRef.current = hsv;
  });

  async function eyedrop() {
    try {
      const Ctor = (window as unknown as { EyeDropper: EyeDropperCtor }).EyeDropper;
      const r = await new Ctor().open();
      setFromHex(r.sRGBHex);
    } catch {
      /* cancelled */
    }
  }

  const W = 252;
  const small = typeof window !== "undefined" && window.innerWidth < 640;
  const left = small ? (window.innerWidth - W) / 2 : clamp(anchor.right + 10, 8, window.innerWidth - W - 8);
  const top = small ? undefined : clamp(anchor.top - 60, 8, window.innerHeight - 400);

  const swatch = (c: string) => (
    <button
      key={c}
      onClick={() => {
        if (isHex(c)) setFromHex(c);
        else onChange(c);
      }}
      aria-label={c === "ink" ? "Ink (follows theme)" : `Colour ${c}`}
      aria-pressed={value === c}
      style={{ background: colorOf(c) }}
      className={`size-6 rounded-full border-2 transition hover:scale-110 ${value === c ? "border-ink ring-2 ring-lemon" : "border-line"}`}
    />
  );

  return (
    <div
      ref={box}
      role="dialog"
      aria-label={title}
      style={{ position: "fixed", left, top, bottom: small ? 12 : undefined, width: W, zIndex: 120 }}
      className="rounded-3xl border border-line bg-surface p-3.5 shadow-card"
    >
      <div className="mb-2.5 flex items-center justify-between">
        <span className="font-display text-sm font-bold">{title}</span>
        <div className="flex items-center gap-1">
          {supportsDropper && (
            <button
              onClick={eyedrop}
              aria-label="Pick a colour from the screen"
              title="Eyedropper"
              className="grid size-8 place-items-center rounded-full border border-line hover:border-ink"
            >
              <Icon name="dropper" className="size-4" />
            </button>
          )}
          <button onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-full border border-line hover:border-ink">
            ×
          </button>
        </div>
      </div>

      <div
        onPointerDown={(e) => dragArea(e, (x, y) => setFromHsv([hsv[0], x, 1 - y]))}
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv[0]}, 100%, 50%))`,
          touchAction: "none",
        }}
        className="relative h-36 cursor-crosshair rounded-2xl"
      >
        <span
          style={{ left: `${hsv[1] * 100}%`, top: `${(1 - hsv[2]) * 100}%`, background: hex }}
          className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.4)]"
        />
      </div>

      <div
        onPointerDown={(e) => dragArea(e, (x) => setFromHsv([x * 360, hsv[1] || 0.01, hsv[2] || 0.01]))}
        style={{
          background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
          touchAction: "none",
        }}
        className="relative mt-3 h-4 cursor-ew-resize rounded-full"
      >
        <span
          style={{ left: `${(hsv[0] / 360) * 100}%` }}
          className="pointer-events-none absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-transparent shadow-[0_0_0_1px_rgb(0_0_0/0.4)]"
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span style={{ background: hex }} className="size-9 shrink-0 rounded-xl border border-line" />
        <input
          value={hex}
          onChange={(e) => setFromHex(e.target.value.trim())}
          maxLength={7}
          spellCheck={false}
          aria-label="Hex colour"
          className="h-9 w-full rounded-xl border border-line bg-surface-2 px-3 font-mono text-sm uppercase outline-none focus:border-ink"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {PRESETS.map((c) => swatch(c))}
        {allowNone && (
          <button
            onClick={() => onChange(null)}
            aria-label="No colour"
            aria-pressed={value === null}
            title="None"
            className={`relative size-6 overflow-hidden rounded-full border-2 bg-surface ${value === null ? "border-ink ring-2 ring-lemon" : "border-line"}`}
          >
            <span className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 rotate-45 bg-[#ff5a36]" />
          </button>
        )}
      </div>

      {recent.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">Recent</p>
          <div className="flex flex-wrap gap-1.5">
            {recent.map((c) => swatch(c))}
          </div>
        </div>
      )}
    </div>
  );
}
