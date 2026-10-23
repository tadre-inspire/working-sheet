import { Sidebar } from "@/components/Sidebar";
import { RightPanel } from "@/components/RightPanel";
import { PagesSync } from "@/components/PagesSync";
import { OfflineBanner } from "@/components/OfflineBanner";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-screen md:pl-[92px]">
      <PagesSync />
      <OfflineBanner />
      <div className="flex">
        <main className="min-w-0 flex-1 px-5 pb-28 pt-8 sm:px-8 md:pb-12 lg:px-12">
          {children}
        </main>
        <RightPanel />
      </div>
      <Sidebar />
    </div>
  );
}
