import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/app/components/layout/SiteHeader";
import SiteFooter from "@/app/components/layout/SiteFooter";
import { ButtonLink } from "@/app/components/ui";

export const metadata: Metadata = {
  title: "Page not found | CricsHub",
};

const LINKS = [
  { href: "/pricing", label: "Pricing", icon: "ri-price-tag-3-line" },
  { href: "/contact-us", label: "Contact", icon: "ri-mail-line" },
  { href: "/feedback", label: "Report a broken link", icon: "ri-feedback-line" },
];

// Root-level 404 renders outside the (site) layout, so it provides its own app shell.
export default function NotFound() {
  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="container-page flex flex-1 items-center justify-center py-16 sm:py-24">
        <div className="flex max-w-lg flex-col items-center text-center animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 font-mono text-xs font-medium tabular-nums text-fg-muted shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden />
            Error 404
          </p>
          <h1 className="mt-6 font-display text-[2.6rem] font-bold uppercase leading-[0.92] tracking-[-0.01em] text-fg sm:text-6xl">
            That one&apos;s gone for a wide
          </h1>
          <p className="mt-6 text-base leading-relaxed text-fg-muted sm:text-lg">
            We couldn&apos;t find the page you were looking for. It may have been moved, renamed, or never
            existed. Let&apos;s get you back in the game.
          </p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <ButtonLink href="/" size="lg" icon="ri-home-5-line">
              Back to home
            </ButtonLink>
            <ButtonLink href="/dashboard" size="lg" variant="secondary" icon="ri-dashboard-line">
              Go to dashboard
            </ButtonLink>
          </div>
          <nav aria-label="Helpful links" className="mt-10 border-t border-line pt-6">
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-flex items-center gap-1.5 rounded text-fg-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <i className={l.icon} aria-hidden />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
