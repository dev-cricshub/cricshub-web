// Coded, illustrative recreations of CricsHub app screens in the unified product language:
// dark token surfaces, display numerals, green for actions/selection, brand blue only for
// data (fours, home team), gold for highlights. All values are sample data, typed so a real
// API payload could replace them.

import { cn } from "@/app/components/ui";
import { ballTone, type BallKind } from "./demoMatch";

/* ---------------- sample data ---------------- */

interface SampleTeam { short: string; name: string; color: string }
interface SampleBatter { name: string; r: number; b: number; f: number; s: number; out?: string }
interface SampleTeamRow { team: SampleTeam; p: number; w: number; l: number; pts: number; nrr: string; q?: boolean }
interface SampleFixture { a: SampleTeam; b: SampleTeam; when: string; stage: "Final" | "League"; result?: string }
interface SamplePlayer { name: string; role: string; runs: number; avg: string; sr: string; tag?: "C" | "WK" }

// Team colours are genuine data (user-chosen team identity).
const TEAMS = {
  MUM: { short: "MUM", name: "Mumbai Strikers", color: "#1E88E5" },
  AND: { short: "AND", name: "Andheri Warriors", color: "#E2B94B" },
  THA: { short: "THA", name: "Thane Titans", color: "#8A9BA8" },
  BOR: { short: "BOR", name: "Borivali Blasters", color: "#C46B4E" },
} satisfies Record<string, SampleTeam>;

const THIS_OVER: { label: string; kind: BallKind }[] = [
  { label: "1", kind: "run" },
  { label: "4", kind: "four" },
  { label: "0", kind: "dot" },
  { label: "W", kind: "wicket" },
  { label: "6", kind: "six" },
];

const SCORECARD: SampleBatter[] = [
  { name: "R. Mehta", r: 58, b: 34, f: 6, s: 2, out: "c Shah b Khan" },
  { name: "A. Patil", r: 21, b: 18, f: 3, s: 0, out: "b Desai" },
  { name: "S. Iyer", r: 47, b: 29, f: 4, s: 2 },
  { name: "K. Rao", r: 12, b: 9, f: 1, s: 0 },
];

const STANDINGS: SampleTeamRow[] = [
  { team: TEAMS.MUM, p: 5, w: 4, l: 1, pts: 8, nrr: "+1.24", q: true },
  { team: TEAMS.AND, p: 5, w: 4, l: 1, pts: 8, nrr: "+0.87", q: true },
  { team: TEAMS.THA, p: 5, w: 2, l: 3, pts: 4, nrr: "-0.31" },
  { team: TEAMS.BOR, p: 5, w: 0, l: 5, pts: 0, nrr: "-1.76" },
];

const FIXTURES: SampleFixture[] = [
  { a: TEAMS.MUM, b: TEAMS.AND, when: "Sun · 9:00 AM", stage: "Final" },
  { a: TEAMS.THA, b: TEAMS.BOR, when: "Sat · 4:00 PM", stage: "League", result: "THA won by 6 wkts" },
];

const SQUAD: SamplePlayer[] = [
  { name: "R. Mehta", role: "Batter", runs: 412, avg: "41.2", sr: "148.2", tag: "C" },
  { name: "S. Iyer", role: "All-rounder", runs: 286, avg: "31.8", sr: "136.4" },
  { name: "K. Rao", role: "Wicket-keeper", runs: 198, avg: "24.7", sr: "121.5", tag: "WK" },
  { name: "A. Patil", role: "Bowler", runs: 64, avg: "12.8", sr: "104.9" },
];

/* ---------------- shared chrome ---------------- */

const card = "rounded-xl border border-line bg-surface";
const label = "text-[8.5px] font-semibold uppercase tracking-[0.14em] text-fg-subtle";

export function StatusBar() {
  return (
    <div className="flex h-8 shrink-0 items-center justify-between bg-canvas px-6 pt-1 text-[10px] font-semibold text-fg">
      <span className="tabular-nums">12:17</span>
      <span className="flex items-center gap-1 text-[11px]" aria-hidden>
        <i className="ri-signal-wifi-fill" />
        <i className="ri-battery-2-line" />
      </span>
    </div>
  );
}

function AppBar({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3.5 pb-2.5 pt-1.5">
      <i className="ri-arrow-left-line text-[15px] text-fg-muted" aria-hidden />
      <span className="min-w-0 flex-1 truncate font-display text-[15px] font-bold uppercase tracking-wide text-fg">{title}</span>
      {action}
    </div>
  );
}

function TeamBar({ team, className }: { team: SampleTeam; className?: string }) {
  return <span className={cn("w-[3px] shrink-0 rounded-full", className)} style={{ background: team.color }} aria-hidden />;
}

function Initials({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-surface-3 font-semibold text-fg-muted", className)}>
      {name
        .split(" ")
        .map((s) => s[0])
        .join("")}
    </span>
  );
}

/* ---------------- screens ---------------- */

export function ScoringScreen() {
  const pad = ["0", "1", "2", "3", "4", "6"];
  const extras = ["Wd", "Nb", "B", "Lb"];
  return (
    <div className="flex h-full flex-col bg-canvas">
      <AppBar
        title="Score match"
        action={
          <span className="flex items-center gap-1 rounded-full bg-live/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-live">
            <span className="h-1 w-1 rounded-full bg-live" /> Live
          </span>
        }
      />

      <div className={cn(card, "mx-3 p-3")}>
        <div className="flex items-center justify-between">
          <span className={label}>MUM vs AND · T20</span>
          <span className="font-mono text-[9px] tabular-nums text-fg-subtle">CRR 8.69</span>
        </div>
        <div className="mt-2 flex items-end gap-2">
          <TeamBar team={TEAMS.MUM} className="h-7 self-center" />
          <span className="font-display text-[34px] font-bold leading-[0.85] tabular-nums text-fg">142/4</span>
          <span className="pb-0.5 font-mono text-[10px] tabular-nums text-fg-subtle">16.2 ov</span>
        </div>
        <p className="mt-2 text-[9.5px] text-fg-muted">
          Need <span className="font-semibold tabular-nums text-accent">36</span> off{" "}
          <span className="font-semibold tabular-nums text-fg">22</span> balls
        </p>
      </div>

      <div className={cn(card, "mx-3 mt-2 divide-y divide-line text-[10px]")}>
        {[
          { n: "S. Iyer*", v: "47 (29)", on: true },
          { n: "K. Rao", v: "12 (9)" },
          { n: "V. Khan · bowl", v: "2-28 (3.2)" },
        ].map((r) => (
          <div key={r.n} className="flex justify-between px-3 py-1.5">
            <span className={r.on ? "font-semibold text-fg" : "text-fg-muted"}>{r.n}</span>
            <span className={cn("font-mono tabular-nums", r.on ? "text-fg" : "text-fg-subtle")}>{r.v}</span>
          </div>
        ))}
      </div>

      <div className="mx-3 mt-2.5 flex items-center gap-1">
        <span className={cn(label, "mr-1")}>This over</span>
        {THIS_OVER.map((b, i) => (
          <span key={i} className={cn("flex h-5 w-5 items-center justify-center rounded-full font-display text-[10px] font-bold", ballTone[b.kind])}>
            {b.label}
          </span>
        ))}
        <span className="h-5 w-5 rounded-full border border-dashed border-line-strong" />
      </div>

      <div className="mt-auto border-t border-line bg-surface p-3">
        <div className="grid grid-cols-3 gap-1.5">
          {pad.map((p) => (
            <span
              key={p}
              className={cn(
                "flex h-9 items-center justify-center rounded-lg border font-display text-[16px] font-bold tabular-nums",
                p === "4"
                  ? "border-brand/40 bg-brand/15 text-brand"
                  : p === "6"
                    ? "border-primary/40 bg-primary-soft text-primary-soft-fg"
                    : p === "1"
                      ? "border-primary bg-surface-2 text-fg ring-1 ring-primary"
                      : "border-line bg-surface-2 text-fg",
              )}
            >
              {p}
            </span>
          ))}
        </div>
        <div className="mt-1.5 grid grid-cols-4 gap-1.5">
          {extras.map((e) => (
            <span key={e} className="flex h-7 items-center justify-center rounded-lg border border-gold/30 bg-gold/10 font-display text-[11px] font-bold text-gold">
              {e}
            </span>
          ))}
        </div>
        <div className="mt-1.5 grid grid-cols-[1fr_1.4fr] gap-1.5">
          <span className="flex h-7 items-center justify-center gap-1 rounded-lg border border-line text-[9px] font-semibold text-fg-muted">
            <i className="ri-arrow-go-back-line" aria-hidden /> Undo
          </span>
          <span className="flex h-7 items-center justify-center gap-1 rounded-lg border border-live/40 bg-live/15 text-[9px] font-bold uppercase tracking-wider text-live">
            Wicket
          </span>
        </div>
      </div>
    </div>
  );
}

export function ScorecardScreen() {
  return (
    <div className="flex h-full flex-col bg-canvas">
      <AppBar title="MUM vs AND" />
      <div className={cn(card, "mx-3 space-y-1.5 px-3 py-2.5")}>
        {[
          { t: TEAMS.MUM, s: "142/4", o: "16.2", on: true },
          { t: TEAMS.AND, s: "177/6", o: "20.0" },
        ].map((r) => (
          <div key={r.t.short} className="flex items-center gap-2">
            <TeamBar team={r.t} className="h-4" />
            <span className={cn("flex-1 truncate text-[10px]", r.on ? "font-semibold text-fg" : "text-fg-muted")}>{r.t.name}</span>
            <span className={cn("font-display font-bold tabular-nums", r.on ? "text-[20px] text-fg" : "text-[14px] text-fg-subtle")}>{r.s}</span>
            <span className="w-6 text-right font-mono text-[8.5px] tabular-nums text-fg-subtle">{r.o}</span>
          </div>
        ))}
      </div>

      <div className="mx-3 mt-2 flex border-b border-line text-[9.5px] font-semibold">
        {["Summary", "Scorecard", "Commentary"].map((t) => (
          <span
            key={t}
            className={cn("-mb-px flex-1 border-b-2 py-1.5 text-center", t === "Scorecard" ? "border-primary text-fg" : "border-transparent text-fg-subtle")}
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mx-3 mt-2 text-[9.5px]">
        <div className="grid grid-cols-[1fr_22px_22px_18px_18px_28px] gap-x-1 pb-1 font-semibold text-fg-subtle">
          <span>Batter</span>
          <span className="text-right">R</span>
          <span className="text-right">B</span>
          <span className="text-right">4s</span>
          <span className="text-right">6s</span>
          <span className="text-right">SR</span>
        </div>
        {SCORECARD.map((b) => (
          <div key={b.name} className="grid grid-cols-[1fr_22px_22px_18px_18px_28px] items-center gap-x-1 border-t border-line py-1.5 font-mono tabular-nums">
            <span className="min-w-0 font-sans">
              <span className="block truncate font-semibold text-fg">
                {b.name}
                {!b.out && <span className="text-accent">*</span>}
              </span>
              <span className="block truncate text-[8px] text-fg-subtle">{b.out ?? "not out"}</span>
            </span>
            <span className="text-right font-bold text-fg">{b.r}</span>
            <span className="text-right text-fg-subtle">{b.b}</span>
            <span className="text-right text-brand">{b.f}</span>
            <span className="text-right text-accent">{b.s}</span>
            <span className="text-right text-fg-subtle">{((b.r / b.b) * 100).toFixed(0)}</span>
          </div>
        ))}
        <p className="flex justify-between border-t border-line pt-1.5 text-fg-muted">
          <span>Extras</span>
          <span className="font-mono tabular-nums">4 (wd 3, nb 1)</span>
        </p>
      </div>

      <div className={cn(card, "mx-3 mt-2.5 p-2.5 text-[9.5px]")}>
        <p className={label}>Fall of wickets</p>
        <p className="mt-1 font-mono text-[9px] tabular-nums text-fg-muted">1-38 (5.1) · 2-91 (10.4) · 3-104 (12.2) · 4-128 (14.6)</p>
      </div>

      <div className={cn(card, "mx-3 mt-2 flex gap-2 p-2.5 text-[9.5px]")}>
        <span className="font-mono font-semibold tabular-nums text-fg-subtle">16.2</span>
        <p className="leading-snug text-fg-muted">
          Khan to Iyer, <span className="font-bold text-accent">SIX!</span> Lofted cleanly over long-on.
        </p>
      </div>
    </div>
  );
}

export function TournamentScreen() {
  return (
    <div className="flex h-full flex-col bg-canvas">
      <AppBar
        title="Tournament"
        action={
          <span className="flex items-center gap-0.5 rounded-full bg-primary px-2 py-1 text-[8.5px] font-semibold text-primary-fg">
            <i className="ri-add-line" aria-hidden /> Fixture
          </span>
        }
      />
      <div className={cn(card, "mx-3 flex items-center gap-2.5 p-3")}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-[15px] text-gold">
          <i className="ri-trophy-fill" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11.5px] font-semibold text-fg">City Premier League</p>
          <p className="text-[9px] text-fg-subtle">8 teams · T20 · League + Knockouts</p>
        </div>
      </div>

      <p className={cn(label, "mx-3 mt-3")}>Fixtures</p>
      <div className="mx-3 mt-1.5 space-y-1.5">
        {FIXTURES.map((f) => (
          <div key={f.a.short + f.b.short} className={cn(card, "px-3 py-2 text-[10px]", f.stage === "Final" && "border-gold/40")}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-display text-[13px] font-bold tracking-wide text-fg">
                <TeamBar team={f.a} className="h-3" />
                {f.a.short} <span className="font-sans text-[9px] font-medium text-fg-subtle">vs</span> {f.b.short}
                <TeamBar team={f.b} className="h-3" />
              </span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-px text-[7.5px] font-bold uppercase tracking-wider",
                  f.stage === "Final" ? "bg-gold/15 text-gold" : "bg-surface-3 text-fg-muted",
                )}
              >
                {f.stage}
              </span>
            </div>
            <p className={cn("mt-0.5 text-[9px]", f.result ? "text-accent" : "text-fg-subtle")}>{f.result ?? f.when}</p>
          </div>
        ))}
      </div>

      <p className={cn(label, "mx-3 mt-3")}>Points table · Group A</p>
      <div className={cn(card, "mx-3 mt-1.5 overflow-hidden text-[9.5px]")}>
        <div className="grid grid-cols-[1fr_14px_14px_14px_20px_32px] gap-x-1 bg-surface-2 px-2 py-1 font-semibold text-fg-subtle">
          <span>Team</span>
          <span className="text-center">P</span>
          <span className="text-center">W</span>
          <span className="text-center">L</span>
          <span className="text-center">Pts</span>
          <span className="text-right">NRR</span>
        </div>
        {STANDINGS.map((t, i) => (
          <div
            key={t.team.short}
            className={cn("grid grid-cols-[1fr_14px_14px_14px_20px_32px] items-center gap-x-1 border-t border-line px-2 py-1.5 tabular-nums", t.q && "bg-primary-soft/40")}
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="w-2 font-mono text-fg-subtle">{i + 1}</span>
              <TeamBar team={t.team} className="h-3" />
              <span className="truncate font-semibold text-fg">{t.team.name}</span>
            </span>
            <span className="text-center font-mono text-fg-subtle">{t.p}</span>
            <span className="text-center font-mono text-fg-subtle">{t.w}</span>
            <span className="text-center font-mono text-fg-subtle">{t.l}</span>
            <span className="text-center font-display text-[11px] font-bold text-fg">{t.pts}</span>
            <span className={cn("text-right font-mono", t.nrr.startsWith("+") ? "text-accent" : "text-fg-subtle")}>{t.nrr}</span>
          </div>
        ))}
      </div>
      <p className="mx-3 mt-1.5 flex items-center gap-1.5 text-[8.5px] text-fg-subtle">
        <span className="h-2 w-2 rounded-sm bg-primary-soft ring-1 ring-primary/50" /> Qualified for knockouts
      </p>
    </div>
  );
}

export function TeamScreen() {
  const team = TEAMS.MUM;
  return (
    <div className="flex h-full flex-col bg-canvas">
      <AppBar title="My team" />
      <div className={cn(card, "mx-3 p-3")}>
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-[13px] font-bold text-white"
            style={{ background: team.color }}
          >
            {team.name.split(" ").map((w) => w[0]).join("")}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-fg">{team.name}</p>
            <p className="text-[9px] text-fg-subtle">15 players · Captain: Rohan Mehta</p>
          </div>
        </div>
        <div className="mt-2.5 flex gap-1.5">
          <span className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-1.5 text-[9px] font-semibold text-primary-fg">
            <i className="ri-link" aria-hidden /> Invite link
          </span>
          <span className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-line-strong py-1.5 text-[9px] font-semibold text-fg">
            <i className="ri-user-add-line" aria-hidden /> Add player
          </span>
        </div>
      </div>

      <div className="mx-3 mt-3 flex items-center justify-between">
        <p className={label}>Squad</p>
        <p className="text-[8.5px] font-medium text-fg-subtle">Season stats</p>
      </div>
      <div className={cn(card, "mx-3 mt-1.5 divide-y divide-line")}>
        {SQUAD.map((p) => (
          <div key={p.name} className="flex items-center gap-2 px-2.5 py-2">
            <Initials name={p.name} className="h-7 w-7 text-[9px]" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-[10px] font-semibold text-fg">
                <span className="truncate">{p.name}</span>
                {p.tag && (
                  <span
                    className={cn(
                      "rounded px-1 text-[7px] font-bold",
                      p.tag === "C" ? "bg-gold/15 text-gold" : "bg-surface-3 text-fg-muted",
                    )}
                  >
                    {p.tag}
                  </span>
                )}
              </p>
              <p className="text-[8.5px] text-fg-subtle">{p.role}</p>
            </div>
            <div className="grid grid-cols-[26px_24px_30px] gap-x-1.5 text-right">
              <span>
                <span className="block font-display text-[13px] font-bold leading-none tabular-nums text-fg">{p.runs}</span>
                <span className="block text-[7px] uppercase tracking-wider text-fg-subtle">Runs</span>
              </span>
              <span>
                <span className="block font-mono text-[9px] leading-[13px] tabular-nums text-fg-muted">{p.avg}</span>
                <span className="block text-[7px] uppercase tracking-wider text-fg-subtle">Avg</span>
              </span>
              <span>
                <span className="block font-mono text-[9px] leading-[13px] tabular-nums text-fg-muted">{p.sr}</span>
                <span className="block text-[7px] uppercase tracking-wider text-fg-subtle">SR</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className={cn(card, "mx-3 mt-2.5 flex items-center gap-2.5 px-3 py-2.5")}>
        <i className="ri-calendar-event-line text-[14px] text-fg-subtle" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className={label}>Next match</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold text-fg">
            vs <TeamBar team={TEAMS.AND} className="h-3" /> {TEAMS.AND.name}
          </p>
        </div>
        <span className="font-mono text-[9px] tabular-nums text-fg-subtle">Sun 9:00</span>
      </div>
    </div>
  );
}
