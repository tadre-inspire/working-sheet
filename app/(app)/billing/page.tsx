import { Suspense } from "react";
import { BillingPanel } from "@/components/BillingPanel";
import { InstallApp } from "@/components/InstallApp";

export const metadata = { title: "Account & plan — Working Sheet" };

export default function BillingPage() {
  return (
    <div className="mx-auto max-w-[900px] space-y-6">
      <header className="rise">
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Account &amp; plan</h1>
        <p className="mt-2 text-muted">Your profile, your plan, and how you pay.</p>
      </header>
      <InstallApp variant="card" />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-[28px] bg-surface-2" />}>
        <BillingPanel />
      </Suspense>
    </div>
  );
}
