import { colorOf, type ShapeKind } from "./types";

// Draws one shape in an SVG exactly w x h pixels, so the stroke width is real
// pixels and the whole thing scales with canvas zoom.
export function ShapeSvg({
  shape,
  w,
  h,
  stroke,
  fill,
  sw,
  flip,
}: {
  shape: ShapeKind;
  w: number;
  h: number;
  stroke?: string;
  fill?: string | null;
  sw: number;
  flip?: boolean;
}) {
  const p = sw / 2;
  const common = {
    stroke: colorOf(stroke),
    strokeWidth: sw,
    fill: shape === "line" || shape === "arrow" ? "none" : colorOf(fill),
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
  };
  let el: React.ReactNode = null;

  if (shape === "rect") {
    el = <rect x={p} y={p} width={Math.max(0, w - sw)} height={Math.max(0, h - sw)} rx={Math.min(14, w / 6, h / 6)} {...common} />;
  } else if (shape === "ellipse") {
    el = <ellipse cx={w / 2} cy={h / 2} rx={Math.max(0, w / 2 - p)} ry={Math.max(0, h / 2 - p)} {...common} />;
  } else if (shape === "triangle") {
    el = <polygon points={`${w / 2},${p} ${w - p},${h - p} ${p},${h - p}`} {...common} />;
  } else if (shape === "diamond") {
    el = <polygon points={`${w / 2},${p} ${w - p},${h / 2} ${w / 2},${h - p} ${p},${h / 2}`} {...common} />;
  } else if (shape === "star") {
    const pts = Array.from({ length: 10 }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? 0.42 : 1;
      return `${w / 2 + Math.cos(a) * r * (w / 2 - p)},${h / 2 + Math.sin(a) * r * (h / 2 - p)}`;
    }).join(" ");
    el = <polygon points={pts} {...common} />;
  } else {
    let [x1, y1, x2, y2] = flip ? [p, h - p, w - p, p] : [p, p, w - p, h - p];
    // A perfectly horizontal or vertical line has a flat box: draw it through the middle.
    if (h < sw * 2) [y1, y2] = [h / 2, h / 2];
    if (w < sw * 2) [x1, x2] = [w / 2, w / 2];
    if (shape === "arrow") {
      const a = Math.atan2(y2 - y1, x2 - x1);
      const len = 10 + sw * 2.2;
      const hx = (t: number) => x2 - Math.cos(a + t) * len;
      const hy = (t: number) => y2 - Math.sin(a + t) * len;
      el = (
        <path d={`M${x1} ${y1} L${x2} ${y2} M${hx(0.5)} ${hy(0.5)} L${x2} ${y2} L${hx(-0.5)} ${hy(-0.5)}`} {...common} />
      );
    } else {
      el = <line x1={x1} y1={y1} x2={x2} y2={y2} {...common} />;
    }
  }

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible", display: "block" }} aria-hidden="true">
      {el}
    </svg>
  );
}

/** Small icons for the shape chooser. */
export function ShapeGlyph({ shape, className = "size-5" }: { shape: ShapeKind; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      {shape === "rect" && <rect x="4" y="5" width="16" height="14" rx="3" />}
      {shape === "ellipse" && <ellipse cx="12" cy="12" rx="8.5" ry="7" />}
      {shape === "triangle" && <polygon points="12,4 21,19 3,19" />}
      {shape === "diamond" && <polygon points="12,3 21,12 12,21 3,12" />}
      {shape === "star" && <polygon points="12,3 14.6,9 21,9.6 16.2,13.8 17.6,20 12,16.8 6.4,20 7.8,13.8 3,9.6 9.4,9" />}
      {shape === "line" && <path d="M5 19L19 5" />}
      {shape === "arrow" && <path d="M5 19L19 5M10 5h9v9" />}
    </svg>
  );
}
