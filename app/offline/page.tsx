import Link from "next/link";

export const metadata = { title: "Offline — Working Sheet" };

// Shown by the service worker when a page can't be loaded without a connection.
export default function Offline() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-lemon font-display text-3xl font-extrabold text-on-lemon">
          W
        </span>
        <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight">You&rsquo;re offline</h1>
        <p className="mt-3 text-muted">
          This page isn&rsquo;t saved on your device yet. Pages you&rsquo;ve already opened still work, and your
          workspace changes are kept here and sync when you&rsquo;re back online.
        </p>
        <Link
          href="/workspace"
          className="mt-6 inline-flex h-12 items-center rounded-full bg-lemon px-6 font-bold text-on-lemon"
        >
          Open workspace
        </Link>
      </div>
    </main>
  );
}
