"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonLink, Logo, ThemeToggle, cn } from "@/app/components/ui";
import { getStoredUser, type StoredUser } from "@/lib/session";
import { UserMenu } from "./UserMenu";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "ri-dashboard-line" },
  { href: "/pricing", label: "Plans", icon: "ri-vip-crown-line" },
];

/**
 * Header for signed-in app pages (dashboard, profile, pricing, stream studio).
 * `leading` renders before the logo (e.g. a sidebar toggle); `trailing` before the user menu.
 */
export function AppHeader({
  leading,
  trailing,
  context,
  showNav = true,
  user: userProp,
  maxWidth = "max-w-7xl",
}: {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  /** Small text shown after the logo, e.g. current match */
  context?: React.ReactNode;
  showNav?: boolean;
  /** Override the user read from localStorage (e.g. after subscription verification) */
  user?: StoredUser | null;
  maxWidth?: string;
}) {
  const pathname = usePathname();
  const [stored, setStored] = useState<StoredUser | null>(null);
  const [ready, setReady] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setStored(getStoredUser());
    setReady(true);
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const user = userProp ?? stored;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-canvas/85 backdrop-blur-xl transition-[border-color,box-shadow] duration-200 supports-[backdrop-filter]:bg-canvas/70",
        scrolled ? "border-line shadow-xs" : "border-transparent",
      )}
    >
      <div className={cn("mx-auto flex h-14 w-full items-center gap-3 px-4 sm:h-16 sm:px-6 lg:px-8", maxWidth)}>
        {leading}
        <Logo size="sm" href="/dashboard" className="flex-shrink-0" />
        {context && (
          <>
            <span className="hidden h-5 w-px bg-line-strong sm:block" aria-hidden />
            <div className="hidden min-w-0 truncate text-sm text-fg-muted sm:block">{context}</div>
          </>
        )}

        {showNav && (
          <nav aria-label="Primary" className="ml-4 hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    active ? "text-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                  )}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-primary sm:-bottom-[17px]" aria-hidden />
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {trailing}
          {showNav && (
            <Link
              href="/pricing"
              aria-label="Plans"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg md:hidden"
            >
              <i className="ri-vip-crown-line text-lg" aria-hidden />
            </Link>
          )}
          <ThemeToggle />
          {user ? (
            <UserMenu name={user.name} hasSubscription={user.hasSubscription} />
          ) : ready ? (
            <ButtonLink href={`/?login=true&redirect=${encodeURIComponent(pathname)}`} size="sm">
              Log in
            </ButtonLink>
          ) : (
            <span className="skeleton h-8 w-8 rounded-full" aria-hidden />
          )}
        </div>
      </div>
    </header>
  );
}
