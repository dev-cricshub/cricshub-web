import Image from "next/image";
import { ButtonLink, MarketingHeading, Reveal } from "@/app/components/ui";
import { PLAY_STORE_URL, SOCIAL_LINKS } from "@/lib/site";

const POINTS = [
  { icon: "ri-flashlight-line", title: "Real-time match setup", body: "Create a match and start scoring in under a minute." },
  { icon: "ri-group-line", title: "Teams that travel with you", body: "Rosters, captains and invite links shared with players." },
  { icon: "ri-trophy-line", title: "Tournaments, handled", body: "Fixtures and points tables that update themselves." },
];

export default function AppShowcase() {
  return (
    <section className="border-t border-line bg-surface py-20 sm:py-28">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal className="order-2 lg:order-1">
          {/* Device art has a white background, so it sits on a fixed light panel in both themes */}
          <div className="relative mx-auto max-w-md overflow-hidden rounded-3xl border border-line bg-white px-8 pt-10 shadow-raised">
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-brand-50 to-white" aria-hidden />
            <Image
              src="/images/phone.png"
              alt="CricsHub app home screen with Start a Match, Host a Tournament, Create a Team and Stream Match"
              width={667}
              height={953}
              sizes="(min-width: 1024px) 380px, 80vw"
              className="relative mx-auto h-auto w-full max-w-[340px]"
            />
          </div>
        </Reveal>

        <div className="order-1 lg:order-2">
          <Reveal>
            <MarketingHeading
              align="left"
              eyebrow="The app"
              title="Run the whole match from your phone"
              lead="Score from the boundary, manage your squad and push live updates to fans — the Android app is the scorer's toolkit."
            />
          </Reveal>
          <ul className="mt-8 space-y-5">
            {POINTS.map((p, i) => (
              <Reveal as="li" key={p.title} delay={i * 80} className="flex gap-4">
                <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-soft-fg">
                  <i className={p.icon} aria-hidden />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-fg">{p.title}</h3>
                  <p className="mt-0.5 text-sm text-fg-muted">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={200} className="mt-9 flex flex-wrap items-center gap-3">
            <ButtonLink href={PLAY_STORE_URL} external size="lg" variant="inverse" icon="ri-google-play-fill">
              Download on Google Play
            </ButtonLink>
            {SOCIAL_LINKS.map((s) => (
              <ButtonLink
                key={s.name}
                href={s.href}
                external
                size="lg"
                variant="outline"
                iconOnly
                icon={s.icon}
                aria-label={`CricsHub on ${s.name}`}
              />
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
