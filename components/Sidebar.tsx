"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Icon, type IconName } from "./Icon";
import { InstallApp } from "./InstallApp";
import { ThemeToggle } from "./ThemeToggle";

const groups: { label: string; icon: IconName; href: string }[][] = [
  [
    { label: "Home", icon: "home", href: "/" },
    { label: "Search", icon: "search", href: "/#search" },
    { label: "Inbox", icon: "inbox", href: "/#inbox" },
  ],
  [
    { label: "Workspace", icon: "doc", href: "/workspace" },
    { label: "Boards", icon: "board", href: "/board" },
    { label: "Pricing", icon: "chart", href: "/#pricing" },
    { label: "News", icon: "news", href: "/news" },
    { label: "Portfolios", icon: "folder", href: "/#portfolios" },
  ],
  [
    { label: "Favorites", icon: "heart", href: "/#favorites" },
    { label: "Trash", icon: "trash", href: "/#trash" },
  ],
];

export function Sidebar() {
  const path = usePathname();
  const { user } = useAuth();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[92px] flex-col items-center border-r border-line bg-surface py-5 md:flex">
        <Link
          href="/"
          aria-label="Working Sheet home"
          className="grid size-11 place-items-center rounded-2xl bg-lemon font-display text-lg font-extrabold text-on-lemon"
        >
          W
        </Link>

        <nav className="mt-8 flex flex-1 flex-col items-center gap-1">
          {groups.map((g, gi) => (
            <div
              key={gi}
              className={`flex flex-col items-center gap-1 ${
                gi > 0 ? "mt-3 border-t border-line pt-4" : ""
              }`}
            >
              {g.map((item) => {
                const active =
                  item.href === "/" ? path === "/" : path === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    title={item.label}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    className={`group relative grid size-12 place-items-center rounded-2xl transition ${
                      active
                        ? "bg-lemon text-on-lemon"
                        : "text-muted hover:bg-surface-2 hover:text-ink"
                    }`}
                  >
                    <Icon name={item.icon} className="size-[22px]" />
                    <span className="pointer-events-none absolute left-14 z-10 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 text-xs font-medium text-bg opacity-0 transition group-hover:opacity-100">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="flex flex-col items-center gap-3">
          <InstallApp variant="icon" />
          <Link
            href={user ? "/billing" : "/signin"}
            title={user ? "Account and plan" : "Sign in"}
            aria-label={user ? "Account and plan" : "Sign in"}
            className={`grid size-12 place-items-center rounded-2xl transition hover:bg-surface-2 hover:text-ink ${
              path === "/billing" ? "bg-lemon text-on-lemon hover:bg-lemon" : "text-muted"
            }`}
          >
            <Icon name="settings" className="size-[22px]" />
          </Link>
          <ThemeToggle compact />
        </div>
      </aside>

      {/* phone: bottom bar */}
      <nav className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex items-center justify-around rounded-3xl border border-line bg-surface/90 p-2 shadow-card backdrop-blur md:hidden">
        {[groups[0][0], groups[1][0], groups[1][1], groups[1][2]].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            aria-label={item.label}
            className={`grid size-12 place-items-center rounded-2xl ${
              path === item.href ? "bg-lemon text-on-lemon" : "text-muted"
            }`}
          >
            <Icon name={item.icon} />
          </Link>
        ))}
        <ThemeToggle />
      </nav>
    </>
  );
}
