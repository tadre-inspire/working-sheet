import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PricingTracker } from "@/components/PricingTracker";
import { NewsFeed } from "@/components/NewsFeed";
import { Ticker } from "@/components/Ticker";
import { InstallApp } from "@/components/InstallApp";
import { DeadlinePanel } from "@/components/DeadlinePanel";
import { MyPages } from "@/components/MyPages";

const stats = [
  { n: 12, label: "Working sheets", cls: "bg-lemon text-on-lemon", rot: "-rotate-[2deg]" },
  { n: 25, label: "Briefs & notes", cls: "bg-ink text-bg", rot: "rotate-[1.5deg]" },
  { n: 7, label: "Price drops", cls: "bg-surface-2 text-ink", rot: "-rotate-[1deg]" },
  { n: 8, label: "Shot lists", cls: "bg-surface text-ink border border-line", rot: "rotate-[2deg]" },
  { n: 3, label: "Upcoming deadlines", cls: "bg-lemon-soft text-ink", rot: "-rotate-[1.5deg]" },
  { n: 9, label: "Portfolios", cls: "bg-[#0e0e0c] text-[#e4ff4a] ring-1 ring-line", rot: "rotate-[1deg]" },
];

export default function Dashboard() {
  return (
    <div className="mx-auto max-w-[1100px] space-y-10">
      {/* header */}
      <header className="rise flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-muted">
            <span className="size-2 animate-pulse rounded-full bg-lemon ring-2 ring-ink" />
            Market open · Fri 23 Oct
          </p>
          <h1 className="font-display text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-5xl">
            Welcome back, Tadre.
            <br />
            <span className="bg-lemon px-2 text-on-lemon [box-decoration-break:clone]">
              Here&rsquo;s your snapshot.
            </span>
          </h1>
          <p className="mt-3 text-muted">
            Stay focused, make it happen.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            aria-label="Notifications"
            className="relative grid size-12 place-items-center rounded-2xl border border-line bg-surface transition hover:bg-surface-2"
          >
            <Icon name="bell" />
            <span className="absolute right-3 top-3 size-2.5 rounded-full bg-lemon ring-2 ring-ink" />
          </button>
          <Link href="/workspace?new=1" className="flex h-12 items-center gap-2 rounded-2xl bg-ink px-5 text-sm font-bold text-bg transition hover:-translate-y-0.5 hover:bg-lemon hover:text-on-lemon">
            <Icon name="plus" className="size-4" strokeWidth={2.4} />
            New page
          </Link>
        </div>
      </header>

      {/* get the app: desktop, Android, iPhone */}
      <InstallApp variant="card" />

      {/* ticker */}
      <div
        className="rise overflow-hidden rounded-2xl border border-line bg-surface py-3"
        style={{ "--i": 1 } as React.CSSProperties}
      >
        <Ticker />
      </div>

      {/* stat cards */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map((s, i) => (
          <div
            key={s.label}
            style={{ "--i": i + 2 } as React.CSSProperties}
            className={`rise group relative aspect-[1.35] overflow-hidden rounded-[26px] p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:rotate-0 ${s.cls} ${s.rot}`}
          >
            <div className="font-display text-6xl font-extrabold leading-none tracking-tighter">
              {s.n}
            </div>
            <div className="mt-1 text-sm font-semibold opacity-80">
              {s.label}
            </div>
            <div className="absolute -bottom-6 -right-6 size-24 rounded-full border-[14px] border-current opacity-10 transition group-hover:scale-125" />
          </div>
        ))}
      </section>

      <button className="flex h-14 w-full max-w-sm items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/40 text-sm font-bold transition hover:border-ink hover:bg-lemon hover:text-on-lemon sm:w-auto sm:px-10">
        <Icon name="plus" className="size-4" strokeWidth={2.4} />
        Add new note
      </button>

      {/* pricing + news */}
      <PricingTracker />

      {/* On wide screens the news lives in the side rail; below that it drops here. */}
      <div className="xl:hidden">
        <NewsFeed variant="grid" limit={6} />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <DeadlinePanel />
        <section className="relative overflow-hidden rounded-[28px] bg-[#0e0e0c] p-7 text-[#f3f3ea]">
          <div className="absolute -right-10 -top-10 size-40 rounded-full bg-[#e4ff4a]" />
          <div className="absolute right-4 top-24 size-16 rounded-full border-2 border-[#e4ff4a]" />
          <p className="relative max-w-[200px] font-display text-2xl font-bold leading-tight">
            Ask Claude for a palette
          </p>
          <p className="relative mt-2 max-w-[240px] text-sm opacity-70">
            Drop a sheet, get colours, a shot list and prompts.
          </p>
          <button className="relative mt-6 rounded-full bg-[#e4ff4a] px-5 py-2.5 text-sm font-bold text-[#0e0e0c]">
            Try it
          </button>
        </section>
      </div>

      {/* working sheet preview */}
      <section className="overflow-hidden rounded-[28px] bg-ink p-5 text-bg sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-lemon">
              Pinned sheet
            </p>
            <h2 className="font-display text-3xl font-extrabold tracking-tight">
              Lagos night market
            </h2>
          </div>
          <Link
            href="/workspace"
            className="flex items-center gap-2 rounded-full bg-lemon px-5 py-2.5 text-sm font-bold text-on-lemon transition hover:-translate-y-0.5"
          >
            Open sheet <Icon name="arrow" className="size-4" />
          </Link>
        </div>
        <div className="mt-6 grid h-72 grid-cols-6 grid-rows-4 gap-3 sm:h-80">
          <div className="col-span-3 row-span-3 rounded-3xl bg-[linear-gradient(135deg,#dcff3a,#8aa600)] p-4 text-on-lemon">
            <span className="font-display text-xl font-bold">Neon & tarpaulin</span>
          </div>
          <div className="col-span-2 row-span-2 rounded-3xl bg-[#232320] p-4">
            <div className="flex gap-2">
              {["#dcff3a", "#f3f3ea", "#8f8f84", "#0e0e0c"].map((c) => (
                <span
                  key={c}
                  className="size-8 rounded-full ring-1 ring-white/20"
                  style={{ background: c }}
                />
              ))}
            </div>
            <p className="mt-3 text-xs opacity-60">Palette · 4 colours</p>
          </div>
          <div className="col-span-1 row-span-2 rounded-3xl bg-[repeating-linear-gradient(45deg,#dcff3a_0_8px,#0e0e0c_8px_16px)] ring-1 ring-white/10" />
          <div className="col-span-2 row-span-1 rounded-3xl bg-lemon-soft p-3 text-xs font-semibold text-[#0e0e0c]">
            “Warm bulbs, wet roads, loud colour.”
          </div>
          <div className="col-span-3 row-span-1 flex items-center gap-3 rounded-3xl border border-white/15 px-4 text-sm">
            <Icon name="film" className="size-5 text-lemon" />
            Shot 04 · low handheld, 35mm, sodium light
          </div>
          <div className="col-span-3 row-span-1 rounded-3xl bg-[radial-gradient(circle_at_30%_40%,#dcff3a,transparent_55%),#232320]" />
        </div>
      </section>

      <MyPages />
    </div>
  );
}
