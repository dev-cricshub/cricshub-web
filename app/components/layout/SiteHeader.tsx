"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LoginModal from "@/app/components/LoginModal";
import { Button, ButtonLink, Logo, ThemeToggle, cn } from "@/app/components/ui";
import { getStoredUser, safeRedirect, type StoredUser } from "@/lib/session";
import { UserMenu } from "./UserMenu";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#streaming", label: "Streaming" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact-us", label: "Contact" },
];

/**
 * Public/marketing header. Owns the login modal: opens on `?login=true`
 * (set by middleware.ts redirects) and on the `openLoginModal` window event.
 */
export default function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setUser(getStoredUser());
    setReady(true);

    if (new URLSearchParams(window.location.search).get("login") === "true") {
      setLoginOpen(true);
    }

    const handleOpenModal = (e: Event) => {
      const redirect = (e as CustomEvent).detail?.redirect as string | undefined;
      // Only allow relative paths — blocks open redirect injection
      if (redirect && safeRedirect(redirect, "") === redirect) {
        window.history.replaceState({}, "", `/?redirect=${encodeURIComponent(redirect)}`);
      }
      setLoginOpen(true);
    };
    window.addEventListener("openLoginModal", handleOpenModal);
    return () => window.removeEventListener("openLoginModal", handleOpenModal);
  }, []);

  // Close the mobile panel on navigation and on Escape
  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const onLoginSuccess = () => {
    setLoginOpen(false);
    setUser(getStoredUser());
    const redirect = new URLSearchParams(window.location.search).get("redirect");
    window.location.href = safeRedirect(redirect);
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-300",
          scrolled || mobileOpen
            ? "border-line bg-canvas/85 shadow-xs backdrop-blur-xl supports-[backdrop-filter]:bg-canvas/70"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="container-page flex h-16 items-center gap-6">
          <Logo />

          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={pathname === l.href ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  pathname === l.href ? "text-fg" : "text-fg-muted hover:text-fg",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            {!ready ? (
              <span className="skeleton h-9 w-20 rounded-lg" aria-hidden />
            ) : user ? (
              <>
                <ButtonLink href="/dashboard" size="sm" variant="primary" icon="ri-dashboard-line" className="hidden sm:inline-flex">
                  Dashboard
                </ButtonLink>
                <UserMenu name={user.name} hasSubscription={user.hasSubscription} />
              </>
            ) : (
              <>
                <Button size="sm" variant="ghost" onClick={() => setLoginOpen(true)} className="hidden sm:inline-flex">
                  Log in
                </Button>
                <Button size="sm" variant="primary" onClick={() => setLoginOpen(true)}>
                  Get started
                </Button>
              </>
            )}
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-fg transition-colors hover:bg-surface-2 md:hidden"
            >
              <i className={cn("text-xl", mobileOpen ? "ri-close-line" : "ri-menu-line")} aria-hidden />
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav id="mobile-nav" aria-label="Mobile" className="border-t border-line bg-canvas md:hidden animate-fade-in">
            <div className="container-page flex flex-col py-3">
              {LINKS.map((l, i) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-3 text-base font-medium text-fg transition-colors hover:bg-surface-2 animate-fade-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {l.label}
                  <i className="ri-arrow-right-s-line text-fg-subtle" aria-hidden />
                </Link>
              ))}
              {user && (
                <Link
                  href="/dashboard"
                  className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-3 text-base font-medium text-primary-fg"
                >
                  <i className="ri-dashboard-line" aria-hidden />
                  Go to dashboard
                </Link>
              )}
            </div>
          </nav>
        )}
      </header>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={onLoginSuccess} />
    </>
  );
}
