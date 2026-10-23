import { DatePicker } from "@/components/DatePicker";
import { Icon } from "@/components/Icon";
import { columns } from "@/lib/data";

export default function BoardPage() {
  return (
    <div className="mx-auto max-w-[1200px] space-y-8">
      <header className="rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm text-muted">
            Studio <Icon name="chevR" className="size-3.5" /> Planning
          </p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Planning board
          </h1>
          <p className="mt-2 max-w-md text-muted">
            Working sheets, shot lists and web plans, arranged your way.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm font-semibold">
          <button className="flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4">
            Board view <Icon name="chevD" className="size-4" />
          </button>
          <button className="flex h-11 items-center gap-2 rounded-full bg-lemon px-5 font-bold text-on-lemon">
            New <Icon name="plus" className="size-4" strokeWidth={2.4} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="scroll-thin flex gap-5 overflow-x-auto pb-3">
          {columns.map((col, ci) => (
            <section
              key={col.name}
              style={{ "--i": ci } as React.CSSProperties}
              className="rise w-[290px] shrink-0"
            >
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${col.tone}`}
                >
                  {col.name}
                </span>
                <span className="text-xs font-semibold text-muted">
                  {col.cards.length}
                </span>
              </div>
              <div className="space-y-3">
                {col.cards.map((c) => (
                  <article
                    key={c.title}
                    className="group cursor-grab rounded-3xl border border-line bg-surface p-4 shadow-card transition hover:-translate-y-1 hover:border-ink"
                  >
                    <div className="flex h-14 overflow-hidden rounded-2xl">
                      {c.swatch.map((s) => (
                        <span
                          key={s}
                          className="flex-1 transition-[flex] group-hover:first:flex-[2]"
                          style={{ background: s }}
                        />
                      ))}
                    </div>
                    <h3 className="mt-3 font-display text-lg font-bold leading-snug">
                      {c.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {c.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-semibold"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full bg-lemon"
                          style={{ width: `${(c.done / c.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold tabular-nums text-muted">
                        {c.done}/{c.total}
                      </span>
                    </div>
                  </article>
                ))}
                <button className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-surface-2 hover:text-ink">
                  <Icon name="plus" className="size-4" /> New card
                </button>
              </div>
            </section>
          ))}
        </div>

        <aside className="space-y-4">
          <h2 className="font-display text-xl font-bold">Schedule</h2>
          <DatePicker />
          <div className="space-y-2 rounded-3xl border border-line bg-surface p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">Remind</span>
              <span className="font-semibold">1 day before</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">End date</span>
              <span className="relative h-6 w-11 rounded-full bg-lemon">
                <span className="absolute right-0.5 top-0.5 size-5 rounded-full bg-ink" />
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
