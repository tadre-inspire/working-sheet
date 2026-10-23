import type { MetadataRoute } from "next";

// Makes Working Sheet installable on desktop (Chrome, Edge) and on phones
// (Android Chrome, iOS Safari via Add to Home Screen).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Working Sheet",
    short_name: "Working Sheet",
    description: "Plan, price and publish creative work: working sheets, pages, news and portfolios.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0b0b0a",
    theme_color: "#0b0b0a",
    categories: ["productivity", "design", "business"],
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/maskable-192", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/pwa-icon/maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "New page", short_name: "New page", url: "/workspace?new=1", icons: [{ src: "/pwa-icon/192", sizes: "192x192" }] },
      { name: "Creative news", short_name: "News", url: "/news", icons: [{ src: "/pwa-icon/192", sizes: "192x192" }] },
    ],
  };
}
