import { NewsFeed } from "@/components/NewsFeed";

export const metadata = { title: "Creative news — Marketcap" };

export default function NewsPage() {
  return (
    <div className="mx-auto max-w-[820px] space-y-6">
      <header className="rise">
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Film, motion &amp; design news
        </h1>
        <p className="mt-2 text-muted">
          Stories from No Film School, Motionographer, Cartoon Brew, Dezeen and
          more. Add your own topic with the + chip. Free feeds, no keys.
        </p>
      </header>
      <NewsFeed limit={60} showAll={false} />
    </div>
  );
}
