const paths = {
  home: "M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 4.5 4.5",
  inbox: "M3.5 13.5 6 5h12l2.5 8.5v5h-17v-5Zm0 0H9a3 3 0 0 0 6 0h5.5",
  board: "M4 4h7v9H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 15h7v5H4z",
  doc: "M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  chart: "M4 19V5M4 19h16M8 15l3-4 3 2 5-6",
  tag: "M3.5 12.5V4h8.5l8.5 8.5-8.5 8.5zM8 8h.01",
  news: "M5 4h11v16H5zM16 8h3v10a2 2 0 0 1-2 2M8 8h5M8 12h5M8 16h3",
  folder: "M3.5 6.5h6l2 2h9v10h-17z",
  heart: "M12 20s-7.5-4.5-7.5-10A4.2 4.2 0 0 1 12 7.5 4.2 4.2 0 0 1 19.5 10C19.5 15.5 12 20 12 20Z",
  trash: "M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v6M14 11v6",
  bell: "M6 17V11a6 6 0 1 1 12 0v6l1.5 2h-15zM10 21h4",
  plus: "M12 5v14M5 12h14",
  sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  moon: "M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-2.5.1-1-.1-1 2-1.5-2-3.5-2.3 1a7 7 0 0 0-1.7-1L15 3.5h-4l-.4 2.5a7 7 0 0 0-1.7 1l-2.3-1-2 3.5 2 1.5-.1 1 .1 1-2 1.5 2 3.5 2.3-1a7 7 0 0 0 1.7 1l.4 2.5h4l.4-2.5a7 7 0 0 0 1.7-1l2.3 1 2-3.5z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2",
  arrow: "M5 12h14M13 6l6 6-6 6",
  up: "M7 17 17 7M9 7h8v8",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  eyeOff: "M3 3l18 18M10.6 6a9 9 0 0 1 1.4-.1c6 0 9.5 6.1 9.5 6.1a16 16 0 0 1-3 3.8M6.3 7.4A16 16 0 0 0 2.5 12S6 18.5 12 18.5c1.5 0 2.8-.4 4-.9",
  spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  chevL: "M15 6l-6 6 6 6",
  chevR: "M9 6l6 6-6 6",
  chevD: "M6 9l6 6 6-6",
  panel: "M4 5h16v14H4zM14 5v14",
  check: "M5 12.5 10 17.5 19 7",
  image: "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9h.01",
  film: "M4 4h16v16H4zM8 4v16M16 4v16M4 8h4M4 12h4M4 16h4M16 8h4M16 12h4M16 16h4",
  code: "M9 8l-4 4 4 4M15 8l4 4-4 4M13.5 5l-3 14",
  star: "M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8-4.3-4.1 5.9-.8z",
  pen: "M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19zM14 7l3 3",
  eraser: "M7 21h11M4.5 14.5l8-8a2 2 0 0 1 2.8 0l3.2 3.2a2 2 0 0 1 0 2.8L11 20H8z",
  undo: "M9 14 4 9l5-5M4 9h9a6 6 0 0 1 0 12h-3",
  chat: "M4 5h16v11H9.5L5 20v-4H4z",
  cursor: "M5 3l14 7-6.2 2.2L10.5 19z",
  hand: "M8 13V6a1.5 1.5 0 0 1 3 0v5m0-6.5a1.5 1.5 0 0 1 3 0V11m0-4.5a1.5 1.5 0 0 1 3 0V13m0-3a1.5 1.5 0 0 1 3 0v5a7 7 0 0 1-7 7h-1a6 6 0 0 1-5.2-3L3.5 13.5a1.5 1.5 0 0 1 2.4-1.7L8 14",
  brush: "M18 3l3 3-9.5 9.5-3-3zM8.5 12.5C5.5 12.5 4.5 14.5 4.5 16.5c0 1.8-.8 2.8-2 3.5 3.5 1.3 8.5.3 8.5-3.5",
  shapes: "M3 3h9v9H3zM16.5 21a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z",
  text: "M5 7V4.5h14V7M12 4.5v15M9 19.5h6",
  crop: "M6 2v14a2 2 0 0 0 2 2h14M2 6h14a2 2 0 0 1 2 2v14",
  zoomIn: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM16 16l4.5 4.5M11 8v6M8 11h6",
  zoomOut: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM16 16l4.5 4.5M8 11h6",
  fit: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  expand: "M4 14v6h6M20 10V4h-6M4 20l7-7M20 4l-7 7",
  shrink: "M10 20v-6H4M14 4v6h6M4 20l6-6M20 4l-6 6",
  redo: "M15 14l5-5-5-5M20 9h-9a6 6 0 0 0 0 12h3",
  copy: "M8 8h12v12H8zM4 16V4h12",
  front: "M4 4h10v10H4zM10 10h10v10H10z",
  dropper: "M14.5 4.5l5 5-2.5 2.5-5-5zM11.5 7.5L4 15v5h5l7.5-7.5",
  bold: "M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z",
  download: "M12 4v11M7 11l5 5 5-5M5 20h14",
  mail: "M3.5 6h17v12h-17zM3.5 7l8.5 6.5L20.5 7",
} as const;

export type IconName = keyof typeof paths;

export function Icon({
  name,
  className = "size-5",
  strokeWidth = 1.7,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
