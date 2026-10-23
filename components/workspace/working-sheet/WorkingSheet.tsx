"use client";

import type { Editor } from "@tiptap/core";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Icon } from "../../Icon";
import { CommentPins, ThreadPanel, newMsg, newThread, type Thread } from "./comments";
import { ColorPicker } from "./ColorPicker";
import { prepareImage, storeImage } from "./images";
import { OptionsBar, type CropPreset } from "./OptionsBar";
import { Rail } from "./Rail";
import { ShapeSvg } from "./shapes";
import {
  TONES,
  WIDTHS,
  WORLD_W as W,
  ZOOM_MAX,
  ZOOM_MIN,
  clamp,
  colorOf,
  isLine,
  uid,
  type BoardItem,
  type Crop,
  type ShapeKind,
  type Stroke,
  type Tool,
  type View,
} from "./types";

type Patch = Partial<{ items: BoardItem[]; strokes: Stroke[]; threads: Thread[]; height: number }>;
type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
type Rect = { x: number; y: number; w: number; h: number };

const rectOf = (it: BoardItem): Rect => ({ x: it.x * W, y: it.y, w: it.w * W, h: it.h });

function distToSeg(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = dx * dx + dy * dy;
  const t = len ? clamp(((px - x1) * dx + (py - y1) * dy) / len, 0, 1) : 0;
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function pathD(p: [number, number][]) {
  if (!p.length) return "";
  const pts = p.map(([x, y]) => [x * W, y]);
  if (pts.length === 1) return `M${pts[0][0]} ${pts[0][1]} l0.01 0`;
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    d += ` Q${pts[i][0]} ${pts[i][1]} ${(pts[i][0] + pts[i + 1][0]) / 2} ${(pts[i][1] + pts[i + 1][1]) / 2}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L${last[0]} ${last[1]}`;
}

function applyResize(it: BoardItem, h: Handle, dx: number, dy: number): BoardItem {
  const r = rectOf(it);
  const MIN = isLine(it) ? 1 : 16;
  let { x: nx, y: ny, w: nw, h: nh } = r;
  if (h.includes("e")) nw = Math.max(MIN, r.w + dx);
  if (h.includes("w")) {
    nw = Math.max(MIN, r.w - dx);
    nx = r.x + r.w - nw;
  }
  if (h.includes("s")) nh = Math.max(MIN, r.h + dy);
  if (h.includes("n")) {
    nh = Math.max(MIN, r.h - dy);
    ny = r.y + r.h - nh;
  }
  if (it.type === "image" && h.length === 2) {
    const ar = r.w / r.h;
    const s = Math.max(nw / r.w, nh / r.h);
    nw = r.w * s;
    nh = nw / ar;
    nx = h.includes("w") ? r.x + r.w - nw : r.x;
    ny = h.includes("n") ? r.y + r.h - nh : r.y;
  }
  return { ...it, x: nx / W, y: ny, w: nw / W, h: nh };
}

// Cropping keeps the picture's scale fixed and moves the frame edges inward
// (or back outward, up to the original picture).
function applyCrop(it: BoardItem, h: Handle, dx: number, dy: number): BoardItem {
  const c = { ...(it.crop as Crop) };
  const r = rectOf(it);
  const sx = r.w / c.w;
  const sy = r.h / c.h;
  let { x, y, w, h: hh } = r;
  if (h.includes("w")) {
    const d = clamp(dx, -c.x * sx, w - 16);
    x += d;
    w -= d;
    c.x += d / sx;
    c.w -= d / sx;
  }
  if (h.includes("e")) {
    const d = clamp(dx, -(w - 16), (1 - c.x - c.w) * sx);
    w += d;
    c.w += d / sx;
  }
  if (h.includes("n")) {
    const d = clamp(dy, -c.y * sy, hh - 16);
    y += d;
    hh -= d;
    c.y += d / sy;
    c.h -= d / sy;
  }
  if (h.includes("s")) {
    const d = clamp(dy, -(hh - 16), (1 - c.y - c.h) * sy);
    hh += d;
    c.h += d / sy;
  }
  return { ...it, x: x / W, y, w: w / W, h: hh, crop: c };
}

const CURSORS: Record<Tool, string> = {
  select: "default",
  hand: "grab",
  pen: "crosshair",
  brush: "crosshair",
  eraser: "cell",
  shape: "crosshair",
  text: "text",
  crop: "crosshair",
  comment: "crosshair",
};

export function WorkingSheet({
  items,
  strokes,
  threads,
  height,
  editor,
  update,
  onDelete,
}: {
  items: BoardItem[];
  strokes: Stroke[];
  threads: Thread[];
  height: number;
  editor: Editor;
  update: (patch: Patch) => void;
  onDelete: () => void;
}) {
  const { user } = useAuth();
  const me = (user?.user_metadata?.display_name as string | undefined) ?? user?.email?.split("@")[0] ?? "You";

  const rootRef = useRef<HTMLDivElement>(null);
  const vpRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [vp, setVp] = useState({ w: 800, h: height });
  const [view, setView] = useState<View>({ z: 1, x: 0, y: 0 });
  const [tool, setToolState] = useState<Tool>("select");
  const [sel, setSel] = useState<string | null>(null);
  const [live, setLive] = useState<BoardItem | null>(null);
  const [draft, setDraft] = useState<BoardItem | null>(null);
  const [liveStroke, setLiveStroke] = useState<Stroke | null>(null);
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [shapeKind, setShapeKind] = useState<ShapeKind>("rect");
  const [stroke, setStroke] = useState("ink");
  const [fill, setFill] = useState<string | null>(null);
  const [width, setWidth] = useState<number>(WIDTHS[1]);
  const [textSize, setTextSize] = useState(24);
  const [bold, setBold] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [picker, setPicker] = useState<{ which: "stroke" | "fill"; rect: DOMRect } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [space, setSpace] = useState(false);
  const [showResolved, setShowResolved] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  // Latest values for gesture handlers that outlive a render.
  const L = useRef({ items, strokes, threads, view, tool });
  useEffect(() => {
    L.current = { items, strokes, threads, view, tool };
  });
  const draftRef = useRef<BoardItem | null>(null);
  const fitted = useRef(false);
  const penSeen = useRef(false);
  const touches = useRef(new Map<number, [number, number]>());
  const gesture = useRef<{ cancel: () => void } | null>(null);
  const lastTap = useRef<{ id: string; t: number; x: number; y: number } | null>(null);
  const ratios = useRef(new Map<string, number>());

  // --- viewport size, first fit, wheel zoom, touch bookkeeping -------------
  useEffect(() => {
    const el = vpRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w) return;
      setVp({ w, h });
      if (!fitted.current) {
        fitted.current = true;
        setView({ z: clamp(w / W, ZOOM_MIN, 2), x: 0, y: 0 });
      }
    });
    ro.observe(el);

    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return; // plain scroll still scrolls the page
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });

    const lift = (e: PointerEvent) => touches.current.delete(e.pointerId);
    window.addEventListener("pointerup", lift);
    window.addEventListener("pointercancel", lift);
    return () => {
      ro.disconnect();
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointerup", lift);
      window.removeEventListener("pointercancel", lift);
    };
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [expanded]);

  // --- coordinates and view ------------------------------------------------
  function toWorld(cx: number, cy: number): [number, number] {
    const r = vpRef.current!.getBoundingClientRect();
    const v = L.current.view;
    return [(cx - r.left - v.x) / v.z, (cy - r.top - v.y) / v.z];
  }

  function zoomAt(factor: number, cx: number, cy: number) {
    setView((v) => {
      const z = clamp(v.z * factor, ZOOM_MIN, ZOOM_MAX);
      const k = z / v.z;
      return { z, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k };
    });
  }

  function bounds(): Rect | null {
    const rs: Rect[] = items.map(rectOf);
    for (const s of strokes) {
      const xs = s.p.map((p) => p[0] * W);
      const ys = s.p.map((p) => p[1]);
      rs.push({ x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) });
    }
    if (!rs.length) return null;
    const x1 = Math.min(...rs.map((r) => r.x));
    const y1 = Math.min(...rs.map((r) => r.y));
    const x2 = Math.max(...rs.map((r) => r.x + r.w));
    const y2 = Math.max(...rs.map((r) => r.y + r.h));
    return { x: x1, y: y1, w: Math.max(1, x2 - x1), h: Math.max(1, y2 - y1) };
  }

  function fit() {
    const b = bounds();
    if (!b) return setView({ z: clamp(vp.w / W, ZOOM_MIN, 2), x: 0, y: 0 });
    const pad = 40;
    const z = clamp(Math.min((vp.w - pad * 2) / b.w, (vp.h - pad * 2) / b.h), ZOOM_MIN, 2);
    setView({ z, x: (vp.w - b.w * z) / 2 - b.x * z, y: (vp.h - b.h * z) / 2 - b.y * z });
  }

  const centerWorld = (): [number, number] => [(vp.w / 2 - view.x) / view.z, (vp.h / 2 - view.y) / view.z];
  const setTool = (t: Tool) => {
    setToolState(t);
    setPicker(null);
    setEditing(null);
  };

  // --- items ---------------------------------------------------------------
  const nextZ = () => Math.max(0, ...items.map((i) => i.z)) + 1;
  const setItems = (next: BoardItem[]) => update({ items: next });
  const patchItem = (id: string, p: Partial<BoardItem>) =>
    setItems(L.current.items.map((i) => (i.id === id ? { ...i, ...p } : i)));
  const shown = (it: BoardItem) => (live && live.id === it.id ? live : it);
  const selItem = sel ? (items.map(shown).find((i) => i.id === sel) ?? null) : null;

  function removeSel() {
    if (!sel) return;
    setItems(items.filter((i) => i.id !== sel));
    setSel(null);
    setEditing(null);
  }

  function duplicate() {
    const it = items.find((i) => i.id === sel);
    if (!it) return;
    const copy = { ...it, id: uid(), x: it.x + 16 / W, y: it.y + 16, z: nextZ() };
    setItems([...items, copy]);
    setSel(copy.id);
  }

  function toFront() {
    if (sel) patchItem(sel, { z: nextZ() });
  }

  function addNote() {
    const [cx, cy] = centerWorld();
    const n = items.length;
    const it: BoardItem = { id: uid(), type: "note", x: (cx - 96) / W + (n % 5) * 0.015, y: cy - 60 + (n % 5) * 12, w: 0.24, h: 120, z: nextZ(), text: "", tone: n % TONES.length };
    setItems([...items, it]);
    setSel(it.id);
    setTool("select");
    setEditing(it.id);
  }

  function addSwatch() {
    const [cx, cy] = centerWorld();
    const color = /^#/.test(stroke) ? stroke : "#dcff3a";
    const it: BoardItem = { id: uid(), type: "swatch", x: (cx - 56) / W, y: cy - 55, w: 0.14, h: 110, z: nextZ(), color };
    setItems([...items, it]);
    setSel(it.id);
    setTool("select");
  }

  async function addFiles(files: FileList | File[], at?: [number, number]) {
    const [cx, cy] = at ?? centerWorld();
    let z = nextZ();
    const added: BoardItem[] = [];
    for (const f of Array.from(files)) {
      const r = await prepareImage(f);
      if (!r) continue;
      const src = await storeImage(r);
      const w = 0.28;
      const h = clamp((w * W) / r.ratio, 70, 600);
      const n = added.length;
      added.push({ id: uid(), type: "image", src, ratio: r.ratio, w, h, x: (cx - (w * W) / 2) / W + n * 0.03, y: cy - h / 2 + n * 24, z: z++ });
    }
    if (added.length) {
      update({ items: [...L.current.items, ...added] });
      setSel(added[added.length - 1].id);
      setTool("select");
    }
  }

  // --- colour --------------------------------------------------------------
  const sItem = tool === "select" && selItem ? selItem : null;
  const activeStroke =
    sItem?.type === "shape" ? (sItem.stroke ?? null) : sItem && (sItem.type === "text" || sItem.type === "swatch") ? (sItem.color ?? "ink") : stroke;
  const activeFill = sItem?.type === "shape" ? (sItem.fill ?? null) : fill;

  function applyColor(which: "stroke" | "fill", c: string | null) {
    if (sItem) {
      if (which === "stroke" && sItem.type === "shape") patchItem(sItem.id, { stroke: c ?? "ink" });
      else if (which === "stroke" && (sItem.type === "text" || sItem.type === "swatch")) patchItem(sItem.id, { color: c ?? "ink" });
      else if (which === "fill" && sItem.type === "shape") patchItem(sItem.id, { fill: c });
      return;
    }
    if (which === "stroke") setStroke(c ?? "ink");
    else setFill(c);
  }

  // --- crop ----------------------------------------------------------------
  const naturalRatio = (it: BoardItem) => it.ratio ?? ratios.current.get(it.id) ?? (it.w * W) / it.h;

  function withCrop(it: BoardItem): BoardItem {
    if (it.crop) return it;
    const r = naturalRatio(it);
    const b = (it.w * W) / it.h;
    const crop: Crop = b > r ? { x: 0, w: 1, h: r / b, y: (1 - r / b) / 2 } : { y: 0, h: 1, w: b / r, x: (1 - b / r) / 2 };
    return { ...it, crop };
  }

  function cropPreset(p: CropPreset) {
    const it = items.find((i) => i.id === sel);
    if (!it || it.type !== "image") return;
    const base = withCrop(it);
    const c = base.crop as Crop;
    const r0 = rectOf(base);
    if (p === "reset") {
      const nw = r0.w / c.w;
      const nh = r0.h / c.h;
      patchItem(it.id, { x: (r0.x - c.x * nw) / W, y: r0.y - c.y * nh, w: nw / W, h: nh, crop: { x: 0, y: 0, w: 1, h: 1 } });
      return;
    }
    const [a, b] = p.split(":").map(Number);
    const target = a / b;
    const r = naturalRatio(it);
    const nc = { ...c };
    if ((c.w * r) / c.h > target) {
      nc.w = (c.h * target) / r;
      nc.x = c.x + (c.w - nc.w) / 2;
    } else {
      nc.h = (c.w * r) / target;
      nc.y = c.y + (c.h - nc.h) / 2;
    }
    const nw = (r0.w * nc.w) / c.w;
    const nh = (r0.h * nc.h) / c.h;
    patchItem(it.id, { x: (r0.x + (r0.w - nw) / 2) / W, y: r0.y + (r0.h - nh) / 2, w: nw / W, h: nh, crop: nc });
  }

  // --- gestures ------------------------------------------------------------
  function track(onMove: (e: PointerEvent) => void, onEnd: (e: PointerEvent | null) => void) {
    const cleanup = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      gesture.current = null;
    };
    const end = (e: PointerEvent) => {
      cleanup();
      onEnd(e);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    gesture.current = {
      cancel: () => {
        cleanup();
        onEnd(null);
      },
    };
  }

  function startPan(e: React.PointerEvent) {
    const v0 = L.current.view;
    const sx = e.clientX;
    const sy = e.clientY;
    track(
      (ev) => setView({ ...v0, x: v0.x + ev.clientX - sx, y: v0.y + ev.clientY - sy }),
      () => {},
    );
  }

  function startPinch() {
    gesture.current?.cancel();
    const pts = () => [...touches.current.values()];
    const [a, b] = pts();
    const d0 = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1;
    const c0: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const v0 = L.current.view;
    const r = vpRef.current!.getBoundingClientRect();
    const move = (e: PointerEvent) => {
      if (touches.current.has(e.pointerId)) touches.current.set(e.pointerId, [e.clientX, e.clientY]);
      const p = pts();
      if (p.length < 2) return;
      const d = Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]);
      const c: [number, number] = [(p[0][0] + p[1][0]) / 2, (p[0][1] + p[1][1]) / 2];
      const z = clamp(v0.z * (d / d0), ZOOM_MIN, ZOOM_MAX);
      const k = z / v0.z;
      setView({ z, x: c[0] - r.left - (c0[0] - r.left - v0.x) * k, y: c[1] - r.top - (c0[1] - r.top - v0.y) * k });
    };
    const end = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      gesture.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    gesture.current = { cancel: end };
  }

  function hit(wx: number, wy: number): BoardItem | null {
    const z = L.current.view.z;
    const pad = 6 / z;
    for (const it of [...L.current.items].sort((a, b) => b.z - a.z)) {
      const r = rectOf(it);
      if (isLine(it)) {
        const [x1, y1, x2, y2] = it.flip ? [r.x, r.y + r.h, r.x + r.w, r.y] : [r.x, r.y, r.x + r.w, r.y + r.h];
        if (distToSeg(wx, wy, x1, y1, x2, y2) <= Math.max(10 / z, (it.sw ?? 4) / 2 + 4 / z)) return it;
        continue;
      }
      const inside = wx >= r.x - pad && wx <= r.x + r.w + pad && wy >= r.y - pad && wy <= r.y + r.h + pad;
      if (!inside) continue;
      // An unfilled shape only catches clicks near its outline.
      if (it.type === "shape" && !it.fill) {
        const band = Math.max(12 / z, (it.sw ?? 4) + 4 / z);
        const deep = wx > r.x + band && wx < r.x + r.w - band && wy > r.y + band && wy < r.y + r.h - band;
        if (deep) continue;
      }
      return it;
    }
    return null;
  }

  function startMove(e: React.PointerEvent, it: BoardItem) {
    const sx = e.clientX;
    const sy = e.clientY;
    const z = L.current.view.z;
    const z0 = Math.max(0, ...L.current.items.map((i) => i.z)) + 1;
    let moved = false;
    let cur: BoardItem = { ...it, z: z0 };
    track(
      (ev) => {
        const dx = (ev.clientX - sx) / z;
        const dy = (ev.clientY - sy) / z;
        if (!moved && Math.hypot(dx, dy) * z < 3) return;
        moved = true;
        cur = { ...it, z: z0, x: it.x + dx / W, y: it.y + dy };
        setLive(cur);
      },
      (ev) => {
        setLive(null);
        if (ev && moved) update({ items: L.current.items.map((i) => (i.id === it.id ? cur : i)) });
      },
    );
  }

  function startStroke(wx: number, wy: number, kind: "pen" | "brush") {
    let s: Stroke = { id: uid(), c: stroke, w: kind === "brush" ? width * 3 : width, k: kind, p: [[wx / W, wy]] };
    setLiveStroke(s);
    track(
      (ev) => {
        const z = L.current.view.z;
        const evs = ev.getCoalescedEvents?.() ?? [];
        for (const pe of evs.length ? evs : [ev]) {
          const [x, y] = toWorld(pe.clientX, pe.clientY);
          const last = s.p[s.p.length - 1];
          if (Math.hypot((x / W - last[0]) * W, y - last[1]) * z >= 1.5) s = { ...s, p: [...s.p, [x / W, y]] };
        }
        setLiveStroke(s);
      },
      (ev) => {
        setLiveStroke(null);
        if (!ev) return;
        const tidy: Stroke = { ...s, p: s.p.map(([x, y]) => [Math.round(x * 10000) / 10000, Math.round(y * 10) / 10] as [number, number]) };
        update({ strokes: [...L.current.strokes, tidy] });
      },
    );
  }

  function startErase(e: React.PointerEvent) {
    const ids = new Set<string>();
    const at = (cx: number, cy: number) => {
      const [x, y] = toWorld(cx, cy);
      const reach = 12 / L.current.view.z;
      for (const s of L.current.strokes) {
        if (!ids.has(s.id) && s.p.some(([px, py]) => Math.hypot(px * W - x, py - y) < reach + s.w / 2)) ids.add(s.id);
      }
      setGone(new Set(ids));
    };
    at(e.clientX, e.clientY);
    track(
      (ev) => at(ev.clientX, ev.clientY),
      (ev) => {
        setGone(new Set());
        if (ev && ids.size) update({ strokes: L.current.strokes.filter((s) => !ids.has(s.id)) });
      },
    );
  }

  function startShape(wx: number, wy: number) {
    const kind = shapeKind;
    const line = kind === "line" || kind === "arrow";
    const z0 = Math.max(0, ...L.current.items.map((i) => i.z)) + 1;
    const make = (dx: number, dy: number): BoardItem => ({
      id: "draft",
      type: "shape",
      shape: kind,
      stroke,
      fill: line ? null : fill,
      sw: width,
      z: z0,
      x: Math.min(wx, wx + dx) / W,
      y: Math.min(wy, wy + dy),
      w: Math.abs(dx) / W,
      h: Math.abs(dy),
      flip: line ? dx < 0 !== dy < 0 : undefined,
    });
    const id = uid();
    draftRef.current = { ...make(0, 0), id };
    track(
      (ev) => {
        const [x, y] = toWorld(ev.clientX, ev.clientY);
        let dx = x - wx;
        let dy = y - wy;
        if (ev.shiftKey) {
          if (line) {
            const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
            const d = Math.hypot(dx, dy);
            dx = Math.cos(a) * d;
            dy = Math.sin(a) * d;
          } else {
            const m = Math.max(Math.abs(dx), Math.abs(dy));
            dx = (dx < 0 ? -1 : 1) * m;
            dy = (dy < 0 ? -1 : 1) * m;
          }
        }
        draftRef.current = { ...make(dx, dy), id };
        setDraft(draftRef.current);
      },
      (ev) => {
        const d = draftRef.current;
        draftRef.current = null;
        setDraft(null);
        if (!ev) return;
        let item = d;
        if (!item || (item.w * W < 6 && item.h < 6)) {
          // A plain click drops a default-size shape.
          const w = line ? 160 : 140;
          const h = line ? 0 : 100;
          item = { ...make(0, 0), id, x: wx / W, y: wy, w: w / W, h, flip: false };
        }
        update({ items: [...L.current.items, item] });
        setSel(id);
        setToolState("select");
      },
    );
  }

  function startHandle(e: React.PointerEvent, handle: Handle) {
    e.preventDefault();
    e.stopPropagation();
    const found = L.current.items.find((i) => i.id === sel);
    if (!found) return;
    const crop = L.current.tool === "crop" && found.type === "image";
    const base = crop ? withCrop(found) : found;
    const sx = e.clientX;
    const sy = e.clientY;
    const z = L.current.view.z;
    let cur = base;
    track(
      (ev) => {
        const dx = (ev.clientX - sx) / z;
        const dy = (ev.clientY - sy) / z;
        cur = crop ? applyCrop(base, handle, dx, dy) : applyResize(base, handle, dx, dy);
        setLive(cur);
      },
      (ev) => {
        setLive(null);
        if (ev) update({ items: L.current.items.map((i) => (i.id === base.id ? cur : i)) });
      },
    );
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    rootRef.current?.focus({ preventScroll: true });
    e.preventDefault(); // stops the editor from treating this as a text click
    setPicker(null);
    if (e.pointerType === "pen") penSeen.current = true;
    if (e.pointerType === "touch") {
      touches.current.set(e.pointerId, [e.clientX, e.clientY]);
      if (touches.current.size >= 2) return startPinch();
      if (penSeen.current && ["pen", "brush", "eraser", "shape"].includes(tool)) return; // palm rejection
    }
    if (e.pointerType === "mouse" && e.button === 2) return;
    if (e.button === 1 || space || tool === "hand") return startPan(e);

    const [wx, wy] = toWorld(e.clientX, e.clientY);

    if (tool === "select") {
      const it = hit(wx, wy);
      if (!it) {
        setSel(null);
        setEditing(null);
        return startPan(e); // dragging empty canvas moves it
      }
      setSel(it.id);
      const now = Date.now();
      const lt = lastTap.current;
      if (lt && lt.id === it.id && now - lt.t < 350 && Math.hypot(e.clientX - lt.x, e.clientY - lt.y) < 8 && (it.type === "note" || it.type === "text")) {
        lastTap.current = null;
        setEditing(it.id);
        return;
      }
      lastTap.current = { id: it.id, t: now, x: e.clientX, y: e.clientY };
      return startMove(e, it);
    }
    if (tool === "pen" || tool === "brush") return startStroke(wx, wy, tool);
    if (tool === "eraser") return startErase(e);
    if (tool === "shape") return startShape(wx, wy);
    if (tool === "crop") {
      const it = hit(wx, wy);
      setSel(it?.type === "image" ? it.id : null);
      return;
    }
    if (tool === "text") {
      const it: BoardItem = { id: uid(), type: "text", x: wx / W, y: wy - textSize * 0.65, w: 0.3, h: Math.round(textSize * 1.4), z: nextZ(), text: "", size: textSize, bold, color: stroke };
      setItems([...items, it]);
      setSel(it.id);
      setToolState("select");
      setEditing(it.id);
      return;
    }
    if (tool === "comment") {
      const t = newThread(wx / W, wy);
      update({ threads: [...threads.filter((th) => th.msgs.length > 0), t] });
      setOpenId(t.id);
    }
  }

  function finishEdit(id: string, value: string, scrollH: number, zoom: number) {
    setEditing(null);
    const it = L.current.items.find((i) => i.id === id);
    if (!it) return;
    if (it.type === "text" && !value.trim()) {
      setItems(L.current.items.filter((i) => i.id !== id));
      setSel(null);
      return;
    }
    patchItem(id, it.type === "text" ? { text: value, h: Math.max((it.size ?? 24) * 1.3, scrollH / zoom) } : { text: value });
  }

  // --- keyboard ------------------------------------------------------------
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const el = e.target as HTMLElement;
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") return;
    const mod = e.metaKey || e.ctrlKey;
    const key = e.key.toLowerCase();
    if (e.key === " " && el.tagName !== "BUTTON") {
      e.preventDefault();
      setSpace(true);
      return;
    }
    if (mod && key === "z") {
      e.preventDefault();
      if (e.shiftKey) editor.commands.redo();
      else editor.commands.undo();
      return;
    }
    if (mod && key === "d") {
      e.preventDefault();
      duplicate();
      return;
    }
    if (mod) return;
    const tools: Record<string, Tool> = { v: "select", h: "hand", p: "pen", b: "brush", e: "eraser", r: "shape", t: "text", c: "crop", m: "comment" };
    if (tools[key]) return setTool(tools[key]);
    if (key === "o") {
      setShapeKind("ellipse");
      return setTool("shape");
    }
    if (key === "l") {
      setShapeKind("line");
      return setTool("shape");
    }
    if (key === "delete" || key === "backspace") {
      if (sel) {
        e.preventDefault();
        removeSel();
      }
      return;
    }
    if (key === "escape") {
      setPicker(null);
      setSel(null);
      setToolState("select");
      setExpanded(false);
      return;
    }
    if (key === "+" || key === "=") return zoomAt(1.2, vp.w / 2, vp.h / 2);
    if (key === "-") return zoomAt(1 / 1.2, vp.w / 2, vp.h / 2);
    if (key === "0") return fit();
    if (sel && key.startsWith("arrow")) {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const it = items.find((i) => i.id === sel);
      if (!it) return;
      patchItem(sel, {
        x: it.x + ((key === "arrowright" ? step : key === "arrowleft" ? -step : 0) / W),
        y: it.y + (key === "arrowdown" ? step : key === "arrowup" ? -step : 0),
      });
    }
  }

  // --- render --------------------------------------------------------------
  const z = view.z;
  const all = [...items.map(shown), ...(draft ? [draft] : [])];
  const inkStrokes = [...strokes.filter((s) => !gone.has(s.id)), ...(liveStroke ? [liveStroke] : [])];
  const listed = threads.filter((t) => t.msgs.length > 0 || t.id === openId);
  const selThread = threads.find((t) => t.id === openId) ?? null;
  const openCount = threads.filter((t) => t.msgs.length > 0 && !t.resolved).length;

  function selectThread(id: string | null) {
    setOpenId(id);
    if (threads.some((t) => t.msgs.length === 0 && t.id !== id)) {
      update({ threads: threads.filter((t) => t.msgs.length > 0 || t.id === id) });
    }
  }

  const selRect = selItem
    ? { left: selItem.x * W * z + view.x, top: selItem.y * z + view.y, width: selItem.w * W * z, height: selItem.h * z }
    : null;
  const cropping = tool === "crop" && selItem?.type === "image";
  const handles: Handle[] = !selItem
    ? []
    : cropping || (selItem.type !== "image" && !isLine(selItem))
      ? ["nw", "n", "ne", "e", "se", "s", "sw", "w"]
      : ["nw", "ne", "se", "sw"];
  const handlePos = (h: Handle): React.CSSProperties => ({
    left: h.includes("w") ? 0 : h.includes("e") ? "100%" : "50%",
    top: h.includes("n") ? 0 : h.includes("s") ? "100%" : "50%",
  });
  const handleCursor: Record<Handle, string> = {
    nw: "nwse-resize", se: "nwse-resize", ne: "nesw-resize", sw: "nesw-resize", n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize",
  };

  const headBtn =
    "flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-xs font-bold transition hover:border-ink hover:bg-lemon hover:text-on-lemon";

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onKeyUp={(e) => e.key === " " && setSpace(false)}
      className={`sheet-root flex flex-col bg-surface outline-none ${
        expanded ? "fixed inset-0 z-[80]" : "relative overflow-hidden rounded-3xl border border-line focus-visible:border-ink"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5">
        <span className="mr-1 flex items-center gap-1.5 font-display text-sm font-bold">
          <Icon name="board" className="size-4" /> Working sheet
        </span>
        <button className={headBtn} onClick={() => fileRef.current?.click()}>
          <Icon name="image" className="size-3.5" /> Image
        </button>
        <button className={headBtn} onClick={addNote}>
          <Icon name="doc" className="size-3.5" /> Note
        </button>
        <button className={headBtn} onClick={addSwatch}>
          <Icon name="plus" className="size-3.5" strokeWidth={2.4} /> Swatch
        </button>
        {openCount > 0 && (
          <span className="rounded-full bg-lemon px-2.5 py-1 text-[11px] font-bold text-on-lemon">
            {openCount} open comment{openCount === 1 ? "" : "s"}
          </span>
        )}
        <span className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => setExpanded((x) => !x)}
            aria-label={expanded ? "Exit full screen" : "Full screen"}
            title={expanded ? "Exit full screen (Esc)" : "Full screen"}
            className="grid size-8 place-items-center rounded-full border border-line bg-surface hover:border-ink"
          >
            <Icon name={expanded ? "shrink" : "expand"} className="size-4" />
          </button>
          <button
            onClick={() => window.confirm("Delete this whole working sheet?") && onDelete()}
            aria-label="Delete working sheet"
            title="Delete working sheet"
            className="grid size-8 place-items-center rounded-full border border-line bg-surface hover:border-ink"
          >
            <Icon name="trash" className="size-4" />
          </button>
        </span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div className={`flex min-h-0 flex-col md:flex-row ${expanded ? "flex-1" : ""}`} style={expanded ? undefined : { height }}>
        <Rail
          tool={tool}
          setTool={setTool}
          stroke={activeStroke ?? "ink"}
          fill={activeFill}
          onPick={(which, rect) => setPicker({ which, rect })}
          canUndo
          onUndo={() => editor.commands.undo()}
          onRedo={() => editor.commands.redo()}
        />

        <div className="relative min-h-0 min-w-0 flex-1">
          <div
            ref={vpRef}
            onPointerDown={onPointerDown}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files, toWorld(e.clientX, e.clientY));
            }}
            style={{
              cursor: space ? "grab" : CURSORS[tool],
              touchAction: "none",
              backgroundImage: "radial-gradient(var(--line) 1px, transparent 1px)",
              backgroundSize: `${20 * z}px ${20 * z}px`,
              backgroundPosition: `${view.x}px ${view.y}px`,
            }}
            className="absolute inset-0 select-none overflow-hidden bg-surface-2"
          >
            <div
              style={{ width: W, transform: `translate(${view.x}px, ${view.y}px) scale(${z})`, transformOrigin: "0 0" }}
              className="pointer-events-none absolute left-0 top-0"
            >
              {all.map((it) => (
                <div
                  key={it.id}
                  data-item={it.id}
                  style={{ left: it.x * W, top: it.y, width: it.w * W, height: it.h, zIndex: it.z }}
                  className="absolute"
                >
                  {it.type === "image" && (
                    <div className="relative size-full overflow-hidden rounded-2xl shadow-card">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={it.src}
                        alt=""
                        draggable={false}
                        onLoad={(e) => ratios.current.set(it.id, e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
                        style={
                          it.crop
                            ? {
                                position: "absolute",
                                maxWidth: "none",
                                width: `${100 / it.crop.w}%`,
                                height: `${100 / it.crop.h}%`,
                                left: `${(-it.crop.x / it.crop.w) * 100}%`,
                                top: `${(-it.crop.y / it.crop.h) * 100}%`,
                              }
                            : undefined
                        }
                        className={it.crop ? "select-none" : "size-full select-none object-cover"}
                      />
                    </div>
                  )}

                  {it.type === "swatch" && (
                    <div style={{ background: colorOf(it.color) }} className="flex size-full flex-col justify-end rounded-2xl border border-black/10 p-2 shadow-card">
                      <span className="block max-w-full truncate rounded-full bg-black/70 px-2 py-0.5 text-center text-[10px] font-bold uppercase text-white">
                        {it.color}
                      </span>
                    </div>
                  )}

                  {it.type === "note" && (
                    <div className={`size-full overflow-hidden rounded-2xl shadow-card ${TONES[(it.tone ?? 0) % TONES.length]}`}>
                      {editing === it.id ? (
                        <textarea
                          autoFocus
                          defaultValue={it.text}
                          onBlur={(e) => finishEdit(it.id, e.target.value, e.target.scrollHeight, z)}
                          onKeyDown={(e) => e.key === "Escape" && e.currentTarget.blur()}
                          onPointerDown={(e) => e.stopPropagation()}
                          aria-label="Note"
                          className="pointer-events-auto size-full resize-none bg-transparent p-3 text-sm font-medium outline-none"
                        />
                      ) : (
                        <p className="whitespace-pre-wrap break-words p-3 text-sm font-medium">
                          {it.text || <span className="opacity-50">Double-click to write…</span>}
                        </p>
                      )}
                    </div>
                  )}

                  {it.type === "text" &&
                    (editing === it.id ? (
                      <textarea
                        autoFocus
                        defaultValue={it.text}
                        onBlur={(e) => finishEdit(it.id, e.target.value, e.target.scrollHeight, z)}
                        onKeyDown={(e) => e.key === "Escape" && e.currentTarget.blur()}
                        onPointerDown={(e) => e.stopPropagation()}
                        onInput={(e) => {
                          e.currentTarget.style.height = "auto";
                          e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                        }}
                        aria-label="Text"
                        style={{ fontSize: it.size ?? 24, fontWeight: it.bold ? 700 : 500, color: colorOf(it.color), lineHeight: 1.25 }}
                        className="pointer-events-auto block w-full resize-none overflow-hidden bg-transparent outline-none"
                      />
                    ) : (
                      <p
                        style={{ fontSize: it.size ?? 24, fontWeight: it.bold ? 700 : 500, color: colorOf(it.color), lineHeight: 1.25 }}
                        className="whitespace-pre-wrap break-words font-display"
                      >
                        {it.text}
                      </p>
                    ))}

                  {it.type === "shape" && it.shape && (
                    <ShapeSvg shape={it.shape} w={it.w * W} h={it.h} stroke={it.stroke} fill={it.fill} sw={it.sw ?? 4} flip={it.flip} />
                  )}
                </div>
              ))}

              <svg width={1} height={1} style={{ overflow: "visible", position: "absolute", left: 0, top: 0, zIndex: 100000 }} aria-hidden="true">
                {inkStrokes.map((s) => (
                  <path
                    key={s.id}
                    d={pathD(s.p)}
                    fill="none"
                    stroke={colorOf(s.c)}
                    strokeWidth={s.w}
                    strokeOpacity={s.k === "brush" ? 0.55 : 1}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </svg>
            </div>

            {all.length === 0 && inkStrokes.length === 0 && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted">
                <div>
                  <p className="font-display text-lg font-bold text-ink">Start your working sheet</p>
                  <p className="mt-1">Drop images, or pick a tool on the left: draw, add shapes, text and notes.</p>
                </div>
              </div>
            )}
          </div>

          {/* Selection frame and handles, drawn at screen size so they stay easy to grab. */}
          {selRect && (tool === "select" || cropping) && (
            <div
              style={{ left: selRect.left, top: selRect.top, width: selRect.width, height: selRect.height }}
              className={`pointer-events-none absolute z-[50] border-2 ${cropping ? "border-dashed border-lemon" : "border-ink"}`}
            >
              {editing !== sel &&
                handles.map((h) => (
                  <span
                    key={h}
                    onPointerDown={(e) => startHandle(e, h)}
                    style={{ ...handlePos(h), cursor: handleCursor[h], touchAction: "none" }}
                    className="pointer-events-auto absolute grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center"
                  >
                    <span className={`size-3 rounded-sm border-2 border-ink ${cropping ? "bg-lemon" : "bg-surface"}`} />
                  </span>
                ))}
            </div>
          )}

          <CommentPins
            threads={threads}
            selectedId={openId}
            showResolved={showResolved}
            project={(t) => ({ left: t.x * W * z + view.x, top: t.y * z + view.y })}
            onSelect={selectThread}
          />

          <OptionsBar
            tool={tool}
            item={tool === "select" || tool === "crop" ? selItem : null}
            shapeKind={shapeKind}
            setShapeKind={setShapeKind}
            width={width}
            setWidth={setWidth}
            textSize={textSize}
            setTextSize={setTextSize}
            bold={bold}
            setBold={setBold}
            strokeValue={activeStroke}
            fillValue={activeFill}
            onPick={(which, rect) => setPicker({ which, rect })}
            onPatch={(p) => sel && patchItem(sel, p)}
            onDuplicate={duplicate}
            onFront={toFront}
            onDelete={removeSel}
            onCropPreset={cropPreset}
            onStartCrop={() => setTool("crop")}
            showResolved={showResolved}
            setShowResolved={setShowResolved}
          />

          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute bottom-3 right-3 z-[60] flex items-center rounded-full border border-line bg-surface p-0.5 shadow-card"
          >
            <button onClick={() => zoomAt(1 / 1.25, vp.w / 2, vp.h / 2)} aria-label="Zoom out" title="Zoom out (-)" className="grid size-8 place-items-center rounded-full hover:bg-surface-2">
              <Icon name="zoomOut" className="size-4" />
            </button>
            <button
              onClick={() => setView({ z: 1, x: view.x, y: view.y })}
              aria-label="Reset zoom to 100%"
              title="Reset zoom"
              className="min-w-12 rounded-full px-1 text-xs font-bold tabular-nums hover:bg-surface-2"
            >
              {Math.round(z * 100)}%
            </button>
            <button onClick={() => zoomAt(1.25, vp.w / 2, vp.h / 2)} aria-label="Zoom in" title="Zoom in (+)" className="grid size-8 place-items-center rounded-full hover:bg-surface-2">
              <Icon name="zoomIn" className="size-4" />
            </button>
            <button onClick={fit} aria-label="Fit to content" title="Fit to content (0)" className="grid size-8 place-items-center rounded-full hover:bg-surface-2">
              <Icon name="fit" className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {selThread && (
        <ThreadPanel
          thread={selThread}
          number={listed.findIndex((t) => t.id === selThread.id) + 1}
          me={me}
          onSend={(text) => update({ threads: threads.map((t) => (t.id === selThread.id ? { ...t, msgs: [...t.msgs, newMsg(me, text)] } : t)) })}
          onResolve={() => update({ threads: threads.map((t) => (t.id === selThread.id ? { ...t, resolved: !t.resolved } : t)) })}
          onDelete={() => {
            update({ threads: threads.filter((t) => t.id !== selThread.id) });
            setOpenId(null);
          }}
          onClose={() => selectThread(null)}
        />
      )}

      {!expanded && (
        <div
          onPointerDown={(e) => {
            e.preventDefault();
            const startY = e.clientY;
            const start = height;
            const move = (ev: PointerEvent) => update({ height: clamp(start + ev.clientY - startY, 260, 1400) });
            const up = () => window.removeEventListener("pointermove", move);
            window.addEventListener("pointermove", move);
            window.addEventListener("pointerup", up, { once: true });
          }}
          style={{ touchAction: "none" }}
          className="grid h-4 cursor-ns-resize place-items-center border-t border-line text-muted hover:text-ink"
          title="Drag to change the sheet height"
        >
          <span className="h-1 w-10 rounded-full bg-current opacity-50" />
        </div>
      )}

      {picker && (
        <ColorPicker
          title={picker.which === "stroke" ? (sItem?.type === "shape" || (!sItem && (tool === "shape")) ? "Stroke colour" : "Colour") : "Fill colour"}
          value={picker.which === "stroke" ? (activeStroke ?? "ink") : activeFill}
          allowNone={picker.which === "fill"}
          anchor={picker.rect}
          onChange={(c) => applyColor(picker.which, c)}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
