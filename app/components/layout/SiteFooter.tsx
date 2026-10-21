import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/app/components/ui";
import { EXPLORE_HREF, PLAY_STORE_URL, SOCIAL_LINKS, SUPPORT_EMAIL } from "@/lib/site";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Live scoring", href: "/#features" },
      { label: "Streaming & tournaments", href: "/#streaming" },
      { label: "Android app", href: "/#download" },
      { label: "Pricing", href: "/pricing" },
      { label: "Explore Stream Studio & Auctions", href: EXPLORE_HREF },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact us", href: "/contact-us" },
      { label: "Send feedback", href: "/feedback" },
      { label: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "/privacy-policy" },
      { label: "Terms of service", href: "/terms-of-service" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-fg-muted">
              The all-in-one cricket platform for live scoring, tournament management and
              broadcast-quality live streaming.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg transition-opacity hover:opacity-80"
              >
                <Image src="/images/play1.png" alt="Get it on Google Play" width={300} height={168} className="-my-2 h-14 w-auto" />
              </a>
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`CricsHub on ${s.name}`}
                  className="flex h-10 w-10 items-center justify-center rounded-control border border-line text-lg text-fg-muted transition-colors hover:border-fg-subtle hover:text-fg"
                >
                  <i className={s.icon} aria-hidden />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-semibold text-fg">{col.title}</h3>
                <ul className="mt-4 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="break-all text-sm text-fg-muted transition-colors hover:text-fg">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-sm text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} CricsHub. All rights reserved.</p>
          <p>Made for the cricket community.</p>
        </div>
      </div>
    </footer>
  );
}
