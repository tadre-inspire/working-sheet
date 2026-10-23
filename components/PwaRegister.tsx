"use client";

import { useEffect, useState } from "react";
import "@/lib/pwa"; // starts listening for the install prompt right away

// Registers the service worker (production only, so dev never serves stale
// files) and offers a one-tap update when a new version has been deployed.
export function PwaRegister() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    const hadController = !!navigator.serviceWorker.controller;
    let reloading = false;
    const onControllerChange = () => {
      // The very first install also "changes" the controller; don't reload for that.
      if (!hadController || reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const version = process.env.NEXT_PUBLIC_BUILD_ID ?? "1";
    navigator.serviceWorker
      .register(`/sw.js?v=${version}`, { scope: "/" })
      .then((reg) => {
        const offerUpdate = (w: ServiceWorker | null) => {
          if (w && navigator.serviceWorker.controller) setWaiting(w);
        };
        offerUpdate(reg.waiting);
        reg.addEventListener("updatefound", () => {
          const w = reg.installing;
          w?.addEventListener("statechange", () => w.state === "installed" && offerUpdate(w));
        });
      })
      .catch(() => {});

    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);

  if (!waiting) return null;
  return (
    <div
      role="status"
      className="fixed bottom-24 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-3 rounded-full border border-ink bg-surface px-4 py-2.5 text-sm font-semibold shadow-card md:bottom-6"
    >
      A new version is ready.
      <button
        onClick={() => waiting.postMessage({ type: "SKIP_WAITING" })}
        className="rounded-full bg-lemon px-4 py-1.5 text-xs font-bold text-on-lemon"
      >
        Reload
      </button>
    </div>
  );
}
