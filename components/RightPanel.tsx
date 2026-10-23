import { NewsFeed } from "./NewsFeed";
import { ProfileCard } from "./ProfileCard";

// Side rail on the dashboard: who you are, then live creative news.
export function RightPanel() {
  return (
    <aside className="hidden w-[380px] shrink-0 border-l border-line bg-surface-2/60 xl:block">
      <div className="scroll-thin sticky top-0 h-screen overflow-y-auto p-6">
        <ProfileCard />
        <NewsFeed variant="rail" limit={12} />
      </div>
    </aside>
  );
}
