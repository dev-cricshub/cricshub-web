"use client";

import Image from "next/image";
import { cn } from "@/app/components/ui";
import { DemoTag } from "./primitives";
import { ballTone, type BallKind } from "./demoMatch";

// ---------------------------------------------------------------------------
// Demo data for the "How it works" story. One continuous (simulated) match that
// progresses step by step. Typed constants so a real match API could replace them.
// ---------------------------------------------------------------------------

export interface StoryTeam {
  name: string;
  short: string;
  color: string;
  ink: string;
  players: { name: string; tag?: "C" | "WK" }[];
}

export interface StoryScore {
  runs: number;
  wickets: number;
  overs: string;
}

const HOME: StoryTeam = {
  name: "Mumbai Strikers",
  short: "MUM",
  color: "#1E88E5",
  ink: "#ffffff",
  players: [
    { name: "R. Sharma", tag: "C" },
    { name: "A. Rao", tag: "WK" },
    { name: "S. Yadav" },
    { name: "V. Iyer" },
    { name: "K. Patil" },
  ],
};

const AWAY: StoryTeam = {
  name: "Andheri Warriors",
  short: "AND",
  color: "#E2B94B",
  ink: "#1a1305",
  players: [
    { name: "D. Mehta", tag: "C" },
    { name: "P. Naik", tag: "WK" },
    { name: "Z. Khan" },
    { name: "R. Desai" },
    { name: "S. Thakur" },
  ],
};

const FIRST_INNINGS: StoryScore = { runs: 177, wickets: 6, overs: "20.0" };

/** Chase progress per step (null = innings not started). */
const CHASE: (StoryScore | null)[] = [
  null,
  null,
  { runs: 142, wickets: 3, overs: "16.2" },
  { runs: 171, wickets: 4, overs: "19.1" },
  { runs: 178, wickets: 5, overs: "19.4" },
];

const STATUS: { label: string; tone: "muted" | "pitch" | "live" | "gold" }[] = [
  { label: "Scheduled", tone: "muted" },
  { label: "Lineups set", tone: "pitch" },
  { label: "Live", tone: "live" },
  { label: "On air", tone: "live" },
  { label: "Result", tone: "gold" },
];

const CRUMBS = ["Matches / New match", "Match 18 / Squads", "Match 18 / Live scoring", "Overlay / Browser source", "City Premier League / Points table"];

interface StandingRow {
  short: string;
  name: string;
  color: string;
  p: number;
  w: number;
  l: number;
  pts: number;
  nrr: string;
  move?: "up" | "down";
}

const STANDINGS: StandingRow[] = [
  { short: "MUM", name: "Mumbai Strikers", color: HOME.color, p: 6, w: 5, l: 1, pts: 10, nrr: "+1.214", move: "up" },
  { short: "AND", name: "Andheri Warriors", color: AWAY.color, p: 6, w: 4, l: 2, pts: 8, nrr: "+0.642", move: "down" },
  { short: "BAN", name: "Bandra Blasters", color: "#4FB286", p: 6, w: 3, l: 3, pts: 6, nrr: "-0.105" },
  { short: "THA", name: "Thane Titans", color: "#8A9BA8", p: 6, w: 2, l: 4, pts: 4, nrr: "-0.388" },
  { short: "POW", name: "Powai Panthers", color: "#C46B4E", p: 6, w: 1, l: 5, pts: 2, nrr: "-1.271" },
];

// ---------------------------------------------------------------------------

function TeamChip({ team, className }: { team: StoryTeam; className?: string }) {
  return (
    <span
      className={cn("inline-flex h-6 items-center rounded-md px-2 font-display text-sm font-bold tracking-wide", className)}
      style={{ background: team.color, color: team.ink }}
    >
      {team.short}
    </span>
  );
}

function statusClass(tone: (typeof STATUS)[number]["tone"]) {
  switch (tone) {
    case "live":
      return "border-live/40 bg-live/15 text-fg";
    case "pitch":
      return "border-primary/40 bg-primary/10 text-accent";
    case "gold":
      return "border-gold/40 bg-gold/10 text-gold";
    default:
      return "border-line bg-surface-2 text-fg-muted";
  }
}

const fmt = (s: StoryScore | null) => (s ? `${s.runs}/${s.wickets}` : "—");

/**
 * Product window whose content evolves with the story step.
 * mode="live": all scenes stacked and crossfaded (sticky desktop preview).
 * mode="static": only the given step is rendered (mobile inline previews).
 */
export function StoryPreview({ step, mode = "static", className }: { step: number; mode?: "live" | "static"; className?: string }) {
  const status = STATUS[step];
  const chase = CHASE[step];
  const scenes = [SceneCreate, SceneTeams, SceneScoring, SceneOverlay, SceneStandings];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-frame border border-line bg-surface shadow-frame",
        className,
      )}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-3 border-b border-line bg-surface-2 px-4 py-2.5">
        <Image src="/images/iconLogoTransparent.png" alt="" width={20} height={20} sizes="20px" className="h-5 w-5 shrink-0" />
        <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-fg-subtle">
          <span className="text-fg-muted">CricsHub</span> / {CRUMBS[step]}
        </span>
        <DemoTag label="Demo" />
      </div>

      {/* Persistent match strip: carries state across every step */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <TeamChip team={AWAY} />
            <span className="hidden truncate text-xs text-fg-subtle min-[420px]:inline">{AWAY.name}</span>
            <span className="font-mono text-xs tabular-nums text-fg-muted">
              {step >= 2 ? `${fmt(FIRST_INNINGS)} (${FIRST_INNINGS.overs})` : "—"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TeamChip team={HOME} />
            <span className="hidden truncate text-xs text-fg-subtle min-[420px]:inline">{HOME.name}</span>
            <span key={step} className="font-mono text-xs font-semibold tabular-nums text-fg motion-safe:animate-fade-in">
              {chase ? `${fmt(chase)} (${chase.overs})` : "Yet to bat"}
            </span>
          </div>
        </div>
        <span
          key={status.label}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-semibold uppercase tracking-[0.14em] motion-safe:animate-fade-in",
            statusClass(status.tone),
          )}
        >
          {status.tone === "live" && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-live motion-safe:animate-live-ping" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-live" />
            </span>
          )}
          {status.label}
        </span>
      </div>

      {/* Scene stage */}
      <div className="relative h-[360px] sm:h-[340px]">
        {mode === "static"
          ? (() => {
              const Scene = scenes[step];
              return (
                <div className="absolute inset-0">
                  <Scene active />
                </div>
              );
            })()
          : scenes.map((Scene, i) => (
              <div
                key={i}
                aria-hidden={i !== step}
                className={cn(
                  "absolute inset-0 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none",
                  i === step ? "opacity-100" : "pointer-events-none opacity-0",
                  i < step && "-translate-y-3 motion-reduce:translate-y-0",
                  i > step && "translate-y-3 motion-reduce:translate-y-0",
                )}
              >
                <Scene active={i === step} />
              </div>
            ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scenes. `active` drives small entrance transitions inside a scene.
// ---------------------------------------------------------------------------

const enter = (active: boolean, delay = 0, extra?: string) => ({
  className: cn(
    "transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none",
    active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
    extra,
  ),
  style: { transitionDelay: active ? `${delay}ms` : "0ms" },
});

function Field({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="min-w-0">
      <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-fg-subtle">{label}</p>
      <p className="mt-1 flex items-center gap-2 truncate rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-fg">
        <i className={cn(icon, "text-fg-subtle")} aria-hidden />
        <span className="truncate">{value}</span>
      </p>
    </div>
  );
}

function SceneCreate({ active }: { active: boolean }) {
  return (
    <div className="flex h-full flex-col p-4 sm:p-5">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Tournament", value: "City Premier League", icon: "ri-trophy-line" },
          { label: "Match", value: "League · Match 18", icon: "ri-hashtag" },
          { label: "Format", value: "T20 · 20 overs", icon: "ri-timer-line" },
          { label: "Venue", value: "Oval Maidan", icon: "ri-map-pin-line" },
        ].map((f, i) => (
          <div key={f.label} {...enter(active, 80 + i * 70)}>
            <Field {...f} />
          </div>
        ))}
      </div>
      <div {...enter(active, 380)}>
        <div className="mt-3 flex items-center justify-between rounded-lg border border-line bg-surface-2 px-3 py-2.5">
          <span className="flex items-center gap-2 text-sm text-fg">
            <i className="ri-youtube-fill text-live" aria-hidden />
            Stream on YouTube
          </span>
          <span className="relative h-5 w-9 rounded-full bg-primary">
            <span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-primary-fg" />
          </span>
        </div>
      </div>
      <div {...enter(active, 480, "mt-auto")}>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-accent">
            <i className="ri-checkbox-circle-fill text-lg" aria-hidden />
            Match created
          </span>
          <span className="font-mono text-xs text-fg-subtle">Sun · 7:30 PM</span>
        </div>
      </div>
    </div>
  );
}

function SquadList({ team, active, delay }: { team: StoryTeam; active: boolean; delay: number }) {
  return (
    <div className="min-w-0 rounded-xl border border-line bg-surface-2">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <TeamChip team={team} />
        <span className="truncate text-xs text-fg-muted">{team.name}</span>
      </div>
      <ul className="space-y-0.5 p-2">
        {team.players.map((p, i) => (
          <li key={p.name} {...enter(active, delay + i * 60)}>
            <span className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-[13px] text-fg">
              <span className="truncate">{p.name}</span>
              {p.tag && (
                <span className="rounded bg-surface-3 px-1.5 py-px font-mono text-[10px] font-semibold text-fg-muted">{p.tag}</span>
              )}
            </span>
          </li>
        ))}
        <li className="px-1.5 pt-1 text-2xs text-fg-subtle">+6 more · 11/11</li>
      </ul>
    </div>
  );
}

function SceneTeams({ active }: { active: boolean }) {
  return (
    <div className="flex h-full flex-col p-4 sm:p-5">
      <div className="grid grid-cols-2 gap-3">
        <SquadList team={AWAY} active={active} delay={60} />
        <SquadList team={HOME} active={active} delay={160} />
      </div>
      <div {...enter(active, 520, "mt-auto flex flex-wrap items-center gap-2 pt-3")}>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs text-fg-muted">
          <i className="ri-link" aria-hidden /> Invite link shared · 4 joined
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs text-gold">
          <i className="ri-coin-line" aria-hidden /> AND won the toss · bat first
        </span>
      </div>
    </div>
  );
}

const PAD: { label: string; kind: BallKind }[] = [
  { label: "0", kind: "dot" },
  { label: "1", kind: "run" },
  { label: "2", kind: "run" },
  { label: "4", kind: "four" },
  { label: "6", kind: "six" },
  { label: "Wd", kind: "wide" },
  { label: "Nb", kind: "wide" },
  { label: "W", kind: "wicket" },
];

function SceneScoring({ active }: { active: boolean }) {
  const over: { label: string; kind: BallKind }[] = [
    { label: "1", kind: "run" },
    { label: "4", kind: "four" },
  ];
  return (
    <div className="flex h-full flex-col gap-3 p-4 sm:p-5">
      <div {...enter(active, 60, "grid grid-cols-[1fr_auto] items-start gap-3")}>
        <div className="space-y-1 text-[13px]">
          <p className="flex justify-between gap-2">
            <span className="text-fg">
              R. Sharma<span className="text-accent">*</span>
            </span>
            <span className="font-mono tabular-nums text-fg-muted">58 (37)</span>
          </p>
          <p className="flex justify-between gap-2">
            <span className="text-fg-muted">S. Yadav</span>
            <span className="font-mono tabular-nums text-fg-muted">21 (14)</span>
          </p>
          <p className="flex justify-between gap-2 border-t border-line pt-1">
            <span className="text-fg-muted">R. Desai</span>
            <span className="font-mono tabular-nums text-fg-muted">1-33 (3.4)</span>
          </p>
        </div>
        <dl className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-right font-mono text-xs tabular-nums">
          <dt className="text-fg-subtle">Need</dt>
          <dd className="text-accent">36 off 22</dd>
          <dt className="mt-1 text-fg-subtle">CRR</dt>
          <dd className="text-fg">8.69</dd>
        </dl>
      </div>

      <div {...enter(active, 140, "flex items-center gap-1.5")}>
        <span className="mr-1 text-2xs font-semibold uppercase tracking-[0.14em] text-fg-subtle">This over</span>
        {over.map((b, i) => (
          <span key={i} className={cn("flex h-6 w-6 items-center justify-center rounded-full font-display text-xs font-bold", ballTone[b.kind])}>
            {b.label}
          </span>
        ))}
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className="h-6 w-6 rounded-full border border-dashed border-line" />
        ))}
      </div>

      <div {...enter(active, 220, "grid grid-cols-4 gap-2")}>
        {PAD.map((k) => (
          <span
            key={k.label}
            className={cn(
              "flex h-10 items-center justify-center rounded-lg border font-display text-lg font-bold",
              k.label === "4"
                ? "border-brand bg-brand text-fg shadow-[0_0_0_4px_rgb(var(--brand)/0.25)]"
                : k.kind === "wicket"
                  ? "border-live/40 bg-live/15 text-fg"
                  : "border-line bg-surface-2 text-fg",
            )}
          >
            {k.label}
          </span>
        ))}
      </div>

      <p {...enter(active, 320, "mt-auto truncate rounded-lg bg-surface-2 px-3 py-2 text-xs text-fg-muted")}>
        <span className="mr-2 font-mono text-fg-subtle">16.2</span>
        Desai to Sharma, <strong className="font-semibold text-brand">FOUR</strong> — slapped through cover point.
      </p>
    </div>
  );
}

function SceneOverlay({ active }: { active: boolean }) {
  return (
    <div className="relative h-full overflow-hidden">
      <Image
        src="/images/matchStalkImage.jpg"
        alt=""
        fill
        sizes="(min-width: 1024px) 560px, 100vw"
        className={cn("object-cover transition-transform duration-[1200ms] ease-out motion-reduce:transition-none", active ? "scale-100" : "scale-105")}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(var(--canvas)/0.55)_0%,rgb(var(--canvas)/0.15)_40%,rgb(var(--canvas)/0.85)_100%)]" />

      <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded bg-live px-2 py-0.5 text-2xs font-bold uppercase tracking-[0.14em] text-fg">
          <i className="ri-youtube-fill" aria-hidden /> Live
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-canvas/70 px-2.5 py-1 text-2xs font-semibold text-fg backdrop-blur">
          <i className="ri-refresh-line text-accent" aria-hidden /> Synced · ball 19.1
        </span>
      </div>

      {/* Broadcast lower third */}
      <div
        className={cn(
          "absolute inset-x-3 bottom-3 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none",
          active ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
        )}
        style={{ transitionDelay: active ? "180ms" : "0ms" }}
      >
        <div className="overflow-hidden rounded-lg border border-line bg-canvas/90 shadow-2xl backdrop-blur">
          <div className="flex items-stretch">
            <div className="flex items-center gap-2 px-3 py-2" style={{ background: HOME.color }}>
              <span className="font-display text-lg font-bold text-fg">{HOME.short}</span>
            </div>
            <div className="flex flex-1 items-center justify-between gap-3 px-3 py-2">
              <span className="font-display text-2xl font-bold tabular-nums text-fg">
                171/4 <span className="text-sm font-semibold text-fg-subtle">19.1</span>
              </span>
              <span className="text-right font-display text-sm font-semibold uppercase tracking-wide text-accent">
                Need 7 off 5
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-1.5 font-mono text-[11px] tabular-nums text-fg-muted">
            <span className="truncate">
              Sharma 81* (48) · Pandya 2 (2)
            </span>
            <span className="shrink-0 text-fg-subtle">v {AWAY.short} 177/6</span>
          </div>
        </div>
        <p className="mt-2 text-center text-2xs uppercase tracking-[0.16em] text-fg-subtle">OBS / vMix browser source</p>
      </div>
    </div>
  );
}

function SceneStandings({ active }: { active: boolean }) {
  return (
    <div className="flex h-full flex-col gap-3 p-4 sm:p-5">
      <div {...enter(active, 60, "flex items-center justify-between gap-3 rounded-xl border border-gold/25 bg-gold/[0.07] px-3 py-2.5")}>
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-fg">
          <i className="ri-trophy-fill text-gold" aria-hidden />
          <span className="truncate">{HOME.name} won by 5 wkts</span>
        </span>
        <span className="shrink-0 font-mono text-xs tabular-nums text-fg-muted">178/5 (19.4)</span>
      </div>

      <table {...enter(active, 160, "w-full text-left text-[13px]")}>
        <thead>
          <tr className="text-2xs uppercase tracking-[0.12em] text-fg-subtle">
            <th className="py-1 pl-2 font-semibold">Team</th>
            <th className="py-1 text-center font-semibold">P</th>
            <th className="py-1 text-center font-semibold">W</th>
            <th className="py-1 text-center font-semibold">Pts</th>
            <th className="py-1 pr-2 text-right font-semibold">NRR</th>
          </tr>
        </thead>
        <tbody className="font-mono tabular-nums">
          {STANDINGS.map((r, i) => (
            <tr
              key={r.short}
              className={cn(
                "border-t border-line transition-colors duration-700",
                r.move === "up" && (active ? "bg-primary/10" : "bg-transparent"),
                i === 3 && "border-b border-dashed border-b-line-strong",
              )}
            >
              <td className="py-1.5 pl-2 font-sans">
                <span className="flex items-center gap-2">
                  <span className="w-3 text-fg-subtle">{i + 1}</span>
                  <span className="h-3 w-1 rounded-full" style={{ background: r.color }} />
                  <span className="text-fg">{r.short}</span>
                  {r.move === "up" && <i className="ri-arrow-up-s-fill text-accent" aria-label="moved up" />}
                  {r.move === "down" && <i className="ri-arrow-down-s-fill text-live" aria-label="moved down" />}
                </span>
              </td>
              <td className="py-1.5 text-center text-fg-muted">{r.p}</td>
              <td className="py-1.5 text-center text-fg-muted">{r.w}</td>
              <td className="py-1.5 text-center text-fg">
                {r.pts}
                {r.move === "up" && (
                  <span
                    className={cn(
                      "ml-1.5 inline-block rounded bg-primary px-1 font-sans text-[11px] font-bold leading-4 text-primary-fg transition-[opacity,transform] duration-500 motion-reduce:transition-none",
                      active ? "scale-100 opacity-100" : "scale-50 opacity-0",
                    )}
                    style={{ transitionDelay: active ? "600ms" : "0ms" }}
                  >
                    +2
                  </span>
                )}
              </td>
              <td className={cn("py-1.5 pr-2 text-right", r.nrr.startsWith("+") ? "text-accent" : "text-fg-subtle")}>{r.nrr}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-auto text-2xs uppercase tracking-[0.14em] text-fg-subtle">Top 4 qualify for the semi-finals</p>
    </div>
  );
}
