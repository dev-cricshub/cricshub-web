import { Badge, MarketingHeading, Reveal, cn } from "@/app/components/ui";

const FEATURES = [
  {
    title: "Live match scoring",
    description:
      "Score ball-by-ball with automatic player stats, partnerships and commentary — built for club and professional matches alike.",
    icon: "ri-record-circle-line",
    span: "lg:col-span-2",
  },
  {
    title: "YouTube live streaming",
    description: "Go live with score overlays that sync every ball, in HD.",
    icon: "ri-youtube-line",
  },
  {
    title: "Tournament management",
    description: "Fixtures, points tables and knockout stages, all in one place.",
    icon: "ri-trophy-line",
  },
  {
    title: "Team & roster management",
    description: "Build squads, assign captains and invite players with a link.",
    icon: "ri-team-line",
  },
  {
    title: "Player insights",
    description: "Runs, averages and strike rates tracked automatically across every match.",
    icon: "ri-bar-chart-2-line",
  },
  {
    title: "Fantasy cricket",
    description: "Fantasy leagues linked to real local match data. Compete with friends.",
    icon: "ri-gamepad-line",
    soon: true,
  },
  {
    title: "Team analytics",
    description: "Trends, comparisons and match history for smarter selection.",
    icon: "ri-pie-chart-2-line",
    soon: true,
  },
];

export default function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-line bg-surface py-20 sm:py-28">
      <div className="container-page">
        <Reveal>
          <MarketingHeading
            eyebrow="Platform"
            title="Everything a match day needs"
            lead="From the first toss to the final over — score, organise and broadcast from one app instead of five."
          />
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 4) * 70} className={cn("h-full", f.span)}>
              <article
                className={cn(
                  "group relative flex h-full flex-col rounded-2xl border border-line bg-canvas p-6 transition-[border-color,box-shadow,transform] duration-200 ease-out",
                  "hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised",
                )}
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-lg text-primary-soft-fg transition-transform duration-300 ease-spring group-hover:scale-110">
                    <i className={f.icon} aria-hidden />
                  </span>
                  {f.soon && <Badge tone="neutral">Coming soon</Badge>}
                </div>
                <h3 className="mt-5 text-base font-semibold tracking-tight text-fg">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{f.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
