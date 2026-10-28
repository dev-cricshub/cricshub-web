import Image from "next/image";
import Link from "next/link";
import { Logo, cn } from "@/app/components/ui";
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

export default function SiteFooter({
  variant = "default",
}: {
  /** "glass" = landing page: translucent over the page's colour orbs */
  variant?: "default" | "glass";
}) {
  const glass = variant === "glass";
  return (
    <footer className={cn("border-t", glass ? "relative mt-[120px] border-white/10 bg-[rgba(6,10,20,0.6)]" : "border-line bg-surface")}>
      <div className={cn("py-14 sm:py-16", glass ? "mx-auto max-w-[1200px] px-6" : "container-page")}>
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]" data-anim-stagger="90">
          <div className="max-w-sm" data-anim="up">
            <Logo />
            <p className={cn("mt-4 text-sm leading-relaxed", glass ? "text-[#C3CEE0]" : "text-fg-muted")}>
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
                  className={cn(
                    "flex items-center justify-center border text-lg transition-colors",
                    glass
                      ? "ch-gl h-11 w-11 rounded-xl border-white/[0.14] bg-white/[0.08] text-white hover:bg-white/[0.14]"
                      : "h-10 w-10 rounded-control border-line text-fg-muted hover:border-fg-subtle hover:text-fg",
                  )}
                >
                  <i className={s.icon} aria-hidden />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-3">
            {COLUMNS.map((col) => (
              <div key={col.title} data-anim="up">
                <h3 className={cn("text-sm font-semibold", glass ? "text-white" : "text-fg")}>{col.title}</h3>
                <ul className="mt-4 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className={cn("break-all text-sm transition-colors", glass ? "text-[#D6E2F5] hover:text-white" : "text-fg-muted hover:text-fg")}
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div
          className={cn(
            "mt-12 flex flex-col gap-2 border-t pt-6 text-sm sm:flex-row sm:items-center sm:justify-between",
            glass ? "border-white/[0.08] text-[#C3CEE0]" : "border-line text-fg-subtle",
          )}
        >
          <p>© {new Date().getFullYear()} CricsHub. All rights reserved.</p>
          <p>Made for the cricket community.</p>
        </div>
      </div>
    </footer>
  );
}
