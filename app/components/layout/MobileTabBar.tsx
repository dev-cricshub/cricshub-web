"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/app/components/ui";

const TABS = [
  { href: "/dashboard", label: "Home", icon: "ri-home-5-line", activeIcon: "ri-home-5-fill" },
  { href: "/auctions", label: "Auctions", icon: "ri-auction-line", activeIcon: "ri-auction-fill" },
  { href: "/pricing", label: "Plans", icon: "ri-vip-crown-line", activeIcon: "ri-vip-crown-fill" },
  { href: "/profile", label: "Profile", icon: "ri-user-3-line", activeIcon: "ri-user-3-fill" },
];

/**
 * Native-style bottom navigation for signed-in app pages on phones (hidden from md up).
 * `data-tabbar` lets globals.css reserve space for it and lift other fixed bottom UI above it.
 */
export function MobileTabBar({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const tabs = signedIn
    ? TABS
    : [...TABS.slice(0, 3), { href: `/?login=true&redirect=${encodeURIComponent(pathname)}`, label: "Log in", icon: "ri-login-box-line", activeIcon: "ri-login-box-line" }];

  return (
    <nav
      data-tabbar
      aria-label="App"
      className="fixed inset-x-0 bottom-0 z-40 select-none border-t border-line bg-canvas/90 pb-safe backdrop-blur-xl [-webkit-touch-callout:none] supports-[backdrop-filter]:bg-canvas/75 md:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-4">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <li key={tab.label}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-[color,transform] duration-150 active:scale-90",
                  active ? "text-primary" : "text-fg-subtle",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                    active && "bg-primary-soft",
                  )}
                >
                  <i className={cn(active ? tab.activeIcon : tab.icon, "text-[1.3rem] leading-none")} aria-hidden />
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
