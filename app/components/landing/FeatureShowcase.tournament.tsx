import { cn } from "@/app/components/ui";

const TEAMS = [
  { short: "MUM", name: "Mumbai Strikers", color: "#1E88E5", p: 5, w: 4, l: 1, pts: 8, nrr: "+1.24", q: true },
  { short: "AND", name: "Andheri Warriors", color: "#E2B94B", p: 5, w: 4, l: 1, pts: 8, nrr: "+0.87", q: true },
  { short: "THA", name: "Thane Titans", color: "#8A9BA8", p: 5, w: 2, l: 3, pts: 4, nrr: "−0.31", q: false },
  { short: "BOR", name: "Borivali Blasters", color: "#C46B4E", p: 5, w: 0, l: 5, pts: 0, nrr: "−1.76", q: false },
];

const FIXTURES = [
  { a: "MUM", b: "AND", meta: "Final · Sun 9:00 AM", tone: "next" as const },
  { a: "THA", b: "BOR", meta: "THA won by 6 wickets", tone: "done" as const },
  { a: "MUM", b: "THA", meta: "MUM won by 21 runs", tone: "done" as const },
  { a: "AND", b: "BOR", meta: "AND won by 4 wickets", tone: "done" as const },
];

function Mark({ short, color }: { short: string; color: string }) {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-display text-xs font-bold text-white"
      style={{ background: color }}
    >
      {short}
    </span>
  );
}

/** Tournament screen, drawn at reading size in the same language as the app. */
export default function TournamentPreview() {
  return (
    <div className="flex h-full flex-col bg-canvas text-fg">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
        <i className="ri-arrow-left-line text-fg-muted" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-bold uppercase tracking-wide">City Premier League</p>
          <p className="text-xs text-fg-subtle">8 teams · T20 · League, then knockouts</p>
        </div>
        <span className="hidden items-center gap-1 rounded-control bg-primary px-3 py-1.5 text-xs font-semibold text-primary-fg sm:inline-flex">
          <i className="ri-add-line" aria-hidden />
          Fixture
        </span>
      </div>

      <div className="grid flex-1 md:grid-cols-2">
        <div className="border-b border-line p-4 sm:p-5 md:border-b-0 md:border-r">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-fg-subtle">Fixtures</p>
          <ul className="mt-3 space-y-2">
            {FIXTURES.map((f) => {
              const home = TEAMS.find((t) => t.short === f.a)!;
              const away = TEAMS.find((t) => t.short === f.b)!;
              return (
                <li
                  key={f.a + f.b}
                  className={cn(
                    "flex items-center gap-3 rounded-card border px-3 py-2.5",
                    f.tone === "next" ? "border-gold/40 bg-gold/[0.06]" : "border-line bg-surface",
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <Mark short={home.short} color={home.color} />
                    <span className="font-display text-sm font-bold tracking-wide text-fg-subtle">vs</span>
                    <Mark short={away.short} color={away.color} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-base font-bold uppercase tracking-wide">
                      {home.short} <span className="text-fg-subtle">/</span> {away.short}
                    </span>
                    <span className={cn("block truncate text-xs", f.tone === "next" ? "text-gold" : "text-fg-muted")}>{f.meta}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-fg-subtle">Points · Group A</p>
          <div className="mt-3 overflow-hidden rounded-card border border-line">
            <div className="grid grid-cols-[1fr_28px_28px_28px_36px_52px] gap-x-1 bg-surface-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
              <span>Team</span>
              <span className="text-center">P</span>
              <span className="text-center">W</span>
              <span className="text-center">L</span>
              <span className="text-center">Pts</span>
              <span className="text-right">NRR</span>
            </div>
            {TEAMS.map((t, i) => (
              <div
                key={t.short}
                className={cn(
                  "grid grid-cols-[1fr_28px_28px_28px_36px_52px] items-center gap-x-1 border-t border-line px-3 py-2.5 text-sm tabular-nums",
                  t.q && "bg-primary-soft/50",
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="w-3 font-mono text-xs text-fg-subtle">{i + 1}</span>
                  <span className="h-4 w-[3px] shrink-0 rounded-full" style={{ background: t.color }} />
                  <span className="truncate font-semibold">{t.name}</span>
                </span>
                <span className="text-center font-mono text-xs text-fg-muted">{t.p}</span>
                <span className="text-center font-mono text-xs text-fg-muted">{t.w}</span>
                <span className="text-center font-mono text-xs text-fg-muted">{t.l}</span>
                <span className="text-center font-display text-base font-bold">{t.pts}</span>
                <span className={cn("text-right font-mono text-xs", t.nrr.startsWith("+") ? "text-accent" : "text-fg-subtle")}>{t.nrr}</span>
              </div>
            ))}
          </div>
          <p className="mt-2.5 flex items-center gap-2 text-xs text-fg-subtle">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary-soft ring-1 ring-primary/40" />
            Top two go through
          </p>
        </div>
      </div>
    </div>
  );
}
