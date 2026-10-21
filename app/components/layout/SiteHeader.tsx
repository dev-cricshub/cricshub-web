"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonLink, Logo, cn } from "@/app/components/ui";
import { EXPLORE_HREF, PLAY_STORE_URL } from "@/lib/site";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact-us", label: "Contact" },
];

// Landing page: in-page anchors for the sections that live there.
const CINEMATIC_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
  { href: "/contact-us", label: "Contact" },
];

/**
 * Public/marketing header. It knows nothing about the session: its only way into the product is
 * Explore, which goes through /login when needed (see middleware.ts).
 */
export default function SiteHeader({
  variant = "default",
}: {
  /** "cinematic" = landing page: landing palette and logo artwork, Play Store link beside Explore */
  variant?: "default" | "cinematic";
}) {
  const cinematic = variant === "cinematic";
  const links = cinematic ? CINEMATIC_LINKS : LINKS;
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile panel on navigation and on Escape
  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-40 h-16">
        {/* Full-width transparent bar at the top; condenses into a floating pill once scrolled. */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 mx-auto flex h-16 w-full items-center gap-6 border border-transparent bg-transparent px-4 transition-all duration-[400ms] ease-out motion-reduce:transition-none sm:px-6 lg:px-8",
            scrolled || mobileOpen
              ? "max-md:max-w-none max-md:border-x-0 max-md:border-t-0 max-md:border-b-line max-md:bg-canvas/85 max-md:backdrop-blur-xl"
              : "max-w-7xl",
            scrolled &&
              !mobileOpen &&
              "md:top-4 md:h-14 md:max-w-[min(72rem,calc(100%-2.5rem))] md:rounded-full md:border-line md:bg-canvas/90 md:px-6 md:shadow-[inset_0_0_42px_rgb(var(--brand-blue)/0.14),0_12px_32px_rgb(var(--shadow)/0.45)] md:backdrop-blur-xl",
          )}
        >
          {cinematic ? (
            <Link href="/" className="shrink-0 transition-opacity hover:opacity-80">
              {/* The artwork is dark-on-transparent; invert + hue-rotate gives white "CRICS" and keeps "HUB" blue. */}
              <Image
                src="/images/textLogo.png"
                alt="CricsHub"
                width={1234}
                height={202}
                priority
                className="h-7 w-auto [filter:invert(1)_hue-rotate(180deg)_brightness(1.3)]"
              />
            </Link>
          ) : (
            <Logo />
          )}

          <nav aria-label="Primary" className={cn("hidden items-center lg:flex", cinematic ? "flex-1 justify-center gap-7" : "gap-1")}>
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={pathname === l.href ? "page" : undefined}
                className={cn(
                  cinematic
                    ? "text-sm font-semibold text-[#C9D3E2] transition-colors hover:text-white"
                    : "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  !cinematic &&
                    (pathname === l.href ? "bg-primary-soft text-primary-soft-fg" : "text-fg-muted hover:bg-surface-2/70 hover:text-fg"),
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {cinematic && (
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden rounded-full px-4 py-[11px] text-sm font-bold text-[#E8EDF5] transition-colors hover:bg-white/5 sm:inline-flex"
              >
                Get the app
              </a>
            )}
            {cinematic ? (
              <Link
                href={EXPLORE_HREF}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-[18px] py-[11px] text-sm font-bold text-white shadow-[0_6px_18px_rgba(47,109,184,0.4)] transition-colors hover:bg-primary-hover"
              >
                Explore
                <i className="ri-arrow-right-line" aria-hidden />
              </Link>
            ) : (
              <ButtonLink href={EXPLORE_HREF} size="sm" variant="primary" trailingIcon="ri-arrow-right-line">
                Explore
              </ButtonLink>
            )}
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className={cn(
                "flex h-9 w-9 items-center justify-center text-fg transition-colors hover:bg-surface-2 lg:hidden",
                cinematic ? "rounded-full" : "rounded-lg",
              )}
            >
              <i className={cn("text-xl", mobileOpen ? "ri-close-line" : "ri-menu-line")} aria-hidden />
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav
            id="mobile-nav"
            aria-label="Mobile"
            className={cn(
              "absolute z-30 shadow-frame lg:hidden animate-fade-in",
              cinematic
                ? "inset-x-3 top-[calc(100%+8px)] overflow-hidden rounded-3xl border border-accent-soft/15 bg-surface-2 sm:inset-x-6"
                : "inset-x-0 top-16 border-t border-line bg-canvas",
            )}
          >
            <div className="container-page flex flex-col py-3">
              {links.map((l, i) => (
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
              <Link
                href={EXPLORE_HREF}
                onClick={() => setMobileOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-3 text-base font-medium text-primary-fg"
              >
                Explore Stream Studio &amp; Auctions
                <i className="ri-arrow-right-line" aria-hidden />
              </Link>
            </div>
          </nav>
        )}
    </header>
  );
}
