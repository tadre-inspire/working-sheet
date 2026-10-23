"use client";

import { useOnline } from "@/lib/pwa";

export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div
      role="status"
      className="fixed left-1/2 top-3 z-[90] max-w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-full border border-ink bg-lemon px-4 py-2 text-center text-xs font-bold text-on-lemon shadow-card"
    >
      You&rsquo;re offline. Changes are saved on this device and sync when you&rsquo;re back.
    </div>
  );
}
