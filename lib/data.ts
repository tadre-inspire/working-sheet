// Sample data for the front-end prototype. Prices and news are placeholders,
// to be replaced by the curated tool-pricing table and a free news API.

export const USD_TO_NGN = 1550; // placeholder rate

export type Tool = {
  name: string;
  kind: string;
  plan: string;
  usd: number;
  change: number; // 30d %
  series: number[];
  tint: string;
};

export const tools: Tool[] = [
  { name: "Higgsfield", kind: "Video", plan: "Creator", usd: 29, change: -8.4, series: [38, 36, 37, 33, 31, 30, 29], tint: "#dcff3a" },
  { name: "Midjourney", kind: "Image", plan: "Standard", usd: 30, change: 0, series: [30, 30, 30, 30, 30, 30, 30], tint: "#ffffff" },
  { name: "Cursor", kind: "Code", plan: "Pro", usd: 20, change: 5.2, series: [18, 18, 19, 19, 20, 20, 20], tint: "#b9b9ad" },
  { name: "Runway", kind: "Video", plan: "Standard", usd: 15, change: -3.1, series: [17, 17, 16, 16, 15, 15, 15], tint: "#dcff3a" },
  { name: "ElevenLabs", kind: "Voice", plan: "Creator", usd: 22, change: 12.6, series: [16, 17, 18, 19, 20, 21, 22], tint: "#b9b9ad" },
  { name: "Figma Make", kind: "Design", plan: "Full seat", usd: 16, change: 0, series: [16, 16, 16, 16, 16, 16, 16], tint: "#ffffff" },
];

export const pages = [
  { title: "Brand Working Sheet", icon: "image" as const, sub: "Updated today" },
  { title: "Film Shot List", icon: "film" as const, sub: "3 days ago" },
  { title: "Web Build Plan", icon: "code" as const, sub: "Last week" },
  { title: "Client Briefs", icon: "doc" as const, sub: "Last week" },
];

export const week = [
  { d: "Mon", n: 20 },
  { d: "Tue", n: 21 },
  { d: "Wed", n: 22 },
  { d: "Thu", n: 23 },
  { d: "Fri", n: 24 },
];

export const columns = [
  {
    name: "Ideas",
    tone: "bg-surface-2 text-ink",
    cards: [
      { title: "Lagos night market ad", tags: ["Mood", "Film"], done: 2, total: 5, swatch: ["#dcff3a", "#0e0e0c", "#8f8f84"] },
      { title: "Fintech landing page", tags: ["Web"], done: 1, total: 4, swatch: ["#f3f3ea", "#0e0e0c", "#dcff3a"] },
    ],
  },
  {
    name: "Planning",
    tone: "bg-lemon text-on-lemon",
    cards: [
      { title: "Brand identity: Eko Kitchen", tags: ["Brand"], done: 4, total: 8, swatch: ["#0e0e0c", "#dcff3a", "#b9b9ad"] },
      { title: "AI ad sprint: 5 videos", tags: ["Ads", "Video"], done: 3, total: 6, swatch: ["#dcff3a", "#6c6c63", "#0e0e0c"] },
      { title: "Portfolio refresh", tags: ["Portfolio"], done: 0, total: 3, swatch: ["#f3f3ea", "#dcff3a", "#0e0e0c"] },
    ],
  },
  {
    name: "In production",
    tone: "bg-ink text-bg",
    cards: [
      { title: "Studio reel 2026", tags: ["Motion"], done: 7, total: 9, swatch: ["#0e0e0c", "#dcff3a", "#f3f3ea"] },
    ],
  },
];
