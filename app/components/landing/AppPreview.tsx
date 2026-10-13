import { cn } from "@/app/components/ui";
import { PLAY_STORE_URL } from "@/lib/site";
import { CtaArrow, DemoTag, LandingHeading, ctaPrimary } from "./primitives";
import { ScorecardScreen, ScoringScreen, StatusBar, TeamScreen, TournamentScreen } from "./AppPreview.screens";

interface AppScreen {
  key: string;
  label: string;
  icon: string;
  blurb: string;
  Screen: () => React.JSX.Element;
}

const SCREENS: AppScreen[] = [
  {
    key: "scoring",
    label: "Match scoring",
    icon: "ri-edit-box-line",
    blurb: "Tap-to-score every ball: runs, extras, wickets and undo, with the score updating instantly.",
    Screen: ScoringScreen,
  },
  {
    key: "scorecard",
    label: "Live scorecard",
    icon: "ri-file-list-3-line",
    blurb: "Full batting and bowling cards, fall of wickets and ball-by-ball commentary, updated as you score.",
    Screen: ScorecardScreen,
  },
  {
    key: "tournament",
    label: "Fixtures & standings",
    icon: "ri-trophy-line",
    blurb: "Run a whole tournament: fixtures, points tables with NRR, and knockout stages through to the final.",
    Screen: TournamentScreen,
  },
  {
    key: "team",
    label: "Teams & players",
    icon: "ri-team-line",
    blurb: "Build squads, assign captains, invite players with a link and track runs, averages and strike rates.",
    Screen: TeamScreen,
  },
];

/** Transform for a phone given its distance from the active one in the fan. */
function slot(offset: number, n: number) {
  // offset: 0 = front, 1 = right, n-1 = left, others = back
  if (offset === 0) return { x: 0, y: 0, r: 0, s: 1, z: 40, o: 1 };
  if (offset === 1) return { x: 46, y: 4, r: 7, s: 0.86, z: 30, o: 0.85 };
  if (offset === n - 1) return { x: -46, y: 4, r: -7, s: 0.86, z: 30, o: 0.85 };
  return { x: 0, y: -5, r: 0, s: 0.76, z: 10, o: 0.4 };
}

export default function AppPreview() {
  const n = SCREENS.length;

  return (
    <section
      id="app"
      aria-labelledby="app-title"
      className="relative scroll-mt-20 overflow-hidden py-section"
    >
      <div className="container-page grid items-center gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-10">
        <div>
          <LandingHeading
            id="app-title"
            eyebrow="The CricsHub app"
            title={
              <>
                Your club, <br className="hidden sm:block" />in your pocket.
              </>
            }
            lead="Score from the boundary rope, run tournaments from the pavilion and keep every player's numbers in one place — on Android, free."
          />

          <ul className="mt-10 space-y-5">
            {SCREENS.map((s) => (
              <li key={s.key} className="flex items-start gap-3">
                <i className={cn(s.icon, "mt-0.5 text-lg text-accent")} aria-hidden />
                <span>
                  <span className="block font-display text-xl font-semibold uppercase tracking-wide text-fg">{s.label}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-fg-muted">{s.blurb}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className={ctaPrimary}>
              <i className="ri-google-play-fill text-lg" aria-hidden />
              Get CricsHub on Google Play
              <CtaArrow />
            </a>
            <span className="text-sm text-fg-subtle">Free · Android</span>
          </div>
        </div>

        {/* Device stage */}
        <div className="relative">
          <div className="mx-auto h-[560px] max-w-[520px] sm:h-[600px]">
            {/* isolate: phone z-indexes only order the fan, never compete with the sticky header */}
            <div className="relative isolate h-full w-full">
              {SCREENS.map((s, i) => {
                const t = slot(i, n);
                return (
                  <div
                    key={s.key}
                    aria-hidden={i === 0 ? undefined : true}
                    className="absolute left-1/2 top-1/2"
                    style={{
                      zIndex: t.z,
                      opacity: t.o,
                      filter: i === 0 ? "none" : "saturate(0.8) brightness(0.75)",
                      transform: `translate(-50%, -50%) translate(${t.x}%, ${t.y}%) rotate(${t.r}deg) scale(${t.s})`,
                    }}
                  >
                    <Phone>
                      <s.Screen />
                    </Phone>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="mt-4 flex flex-wrap items-center justify-center gap-2 text-center text-xs text-fg-subtle">
            <DemoTag label="Illustrative" />
            Screens shown with sample data
          </p>
        </div>
      </div>
    </section>
  );
}

/** Pure-CSS Android-style device frame, coloured from tokens. */
function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-[248px] rounded-[2.6rem] border border-line-strong bg-[linear-gradient(145deg,rgb(var(--surface-3)),rgb(var(--canvas))_45%,rgb(var(--surface-2)))] p-[8px] shadow-overlay sm:w-[262px]">
      {/* side buttons */}
      <span aria-hidden className="absolute -right-[3px] top-28 h-14 w-[3px] rounded-r bg-surface-3" />
      <span aria-hidden className="absolute -right-[3px] top-48 h-8 w-[3px] rounded-r bg-surface-3" />
      <div className="relative h-[500px] overflow-hidden rounded-[2.1rem] bg-canvas ring-1 ring-line sm:h-[530px]">
        {/* punch-hole camera */}
        <span aria-hidden className="absolute left-1/2 top-2 z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-surface-2 ring-1 ring-line-strong" />
        <div className="flex h-full flex-col">
          <StatusBar />
          <div className="min-h-0 flex-1">{children}</div>
          {/* gesture bar */}
          <div className="flex h-5 shrink-0 items-center justify-center bg-canvas">
            <span className="h-1 w-24 rounded-full bg-fg/40" />
          </div>
        </div>
        {/* glass reflection */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgb(var(--fg)/0.05)_0%,transparent_30%)]"
        />
      </div>
    </div>
  );
}
