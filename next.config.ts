import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A new id per build: the service worker uses it to refresh its caches on deploy.
  env: { NEXT_PUBLIC_BUILD_ID: Date.now().toString(36) },
  async headers() {
    return [
      {
        // The worker file must never be cached, or updates would not be noticed.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
