import { Suspense } from "react";
import { Workspace } from "@/components/workspace/Workspace";

export const metadata = { title: "Workspace — Marketcap" };

export default function WorkspacePage() {
  return (
    <Suspense fallback={<div className="mx-auto h-[70vh] max-w-[1280px] animate-pulse rounded-[28px] bg-surface-2" />}>
      <Workspace />
    </Suspense>
  );
}
