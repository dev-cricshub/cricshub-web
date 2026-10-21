"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonLink, Logo, cn } from "@/app/components/ui";
import { getStoredUser, loginHref, type StoredUser } from "@/lib/session";
import { MobileTabBar } from "./MobileTabBar";
import { UserMenu } from "./UserMenu";

export const APP_NAV = [
  { href: "/dashboard", label: "Home", icon: "ri-home-5-line" },
  { href: "/stream", label: "Stream Studio", icon: "ri-broadcast-line" },
  { href: "/auctions", label: "Auctions", icon: "ri-auction-line" },
  { href: "/pricing", label: "Plans", icon: "ri-vip-crown-line" },
];

/**
 * Header for app pages (home, stream studio, auctions, profile, pricing).
 * `leading` renders before the logo (e.g. a sidebar toggle); `trailing` before the user menu.
 * With `showNav`, phones get a bottom tab bar instead of the inline nav.
 */
export function AppHeader({
  leading,
  trailing,
  context,
  showNav = true,
  user: userProp,
  maxWidth = "max-w-7xl",
  badges,
}: {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  /** Small text shown after the logo, e.g. current match */
  context?: React.ReactNode;
  showNav?: boolean;
  /** Override the user read from localStorage (e.g. after subscription verification) */
  user?: StoredUser | null;
  maxWidth?: string;
  /** Small status shown inside a nav item, keyed by its href (e.g. LIVE on Stream Studio). */
  badges?: Partial<Record<string, React.ReactNode>>;
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
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b pt-[env(safe-area-inset-top)] bg-canvas/85 backdrop-blur-xl transition-[border-color,box-shadow] duration-200 supports-[backdrop-filter]:bg-canvas/70",
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
            <nav
              aria-label="Primary"
              className="ml-2 hidden items-center gap-0.5 rounded-[13px] border border-line bg-well p-1 md:flex"
            >
              {APP_NAV.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-9 items-center gap-1.5 whitespace-nowrap rounded-[10px] px-3 text-[13px] transition-colors",
                      active
                        ? "bg-raised font-semibold text-white ring-1 ring-inset ring-line-accent"
                        : "font-medium text-fg-muted hover:bg-surface-2 hover:text-fg",
                    )}
                  >
                    <i className={cn(item.icon, "text-[15px]", active ? "text-accent-soft" : "text-fg-subtle")} aria-hidden />
                    {item.label}
                    {badges?.[item.href]}
                  </Link>
                );
              })}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {trailing}
            {user ? (
              <UserMenu name={user.name} hasSubscription={user.hasSubscription} />
            ) : ready ? (
              <ButtonLink href={loginHref(pathname)} size="sm" icon="ri-login-box-line">
                Log in
              </ButtonLink>
            ) : (
              <span className="skeleton h-8 w-8 rounded-full" aria-hidden />
            )}
          </div>
        </div>
      </header>
      {showNav && <MobileTabBar signedIn={!ready || !!user} />}
    </>
  );
}
