// Shared types and helpers for the working sheet canvas.
//
// World space: the sheet is a canvas WORLD_W px wide. Items store x and w as
// fractions of WORLD_W and y / h in px, so sheets made earlier still load.

export const WORLD_W = 800;
export const ZOOM_MIN = 0.2;
export const ZOOM_MAX = 4;

export type ShapeKind = "rect" | "ellipse" | "triangle" | "diamond" | "star" | "line" | "arrow";
export type Tool = "select" | "hand" | "pen" | "brush" | "eraser" | "shape" | "text" | "crop" | "comment";

/** Visible part of an image, as fractions of the source picture. */
export type Crop = { x: number; y: number; w: number; h: number };

export type BoardItem = {
  id: string;
  type: "image" | "note" | "swatch" | "shape" | "text";
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  // image
  src?: string;
  ratio?: number; // natural width / height
  crop?: Crop;
  // note / text
  text?: string;
  tone?: number;
  size?: number;
  bold?: boolean;
  // swatch, and text colour
  color?: string;
  // shape
  shape?: ShapeKind;
  stroke?: string;
  fill?: string | null;
  sw?: number;
  flip?: boolean;
};

export type Stroke = { id: string; c: string; w: number; p: [number, number][]; k?: "pen" | "brush" };
export type View = { z: number; x: number; y: number };

export const TONES = [
  "bg-lemon text-on-lemon",
  "bg-ink text-bg",
  "bg-surface text-ink border border-line",
  "bg-lemon-soft text-ink",
];

/** "ink" is a theme-aware token: dark in light mode, light in dark mode. */
export const colorOf = (c: string | null | undefined) => (!c ? "none" : c === "ink" ? "var(--ink)" : c);
export const clamp = (n: number, a: number, b: number) => Math.min(Math.max(n, a), Math.max(a, b));
export const uid = () => Math.random().toString(36).slice(2, 9);
export const isLine = (it: BoardItem) => it.type === "shape" && (it.shape === "line" || it.shape === "arrow");
export const WIDTHS = [2, 4, 8, 14] as const;
