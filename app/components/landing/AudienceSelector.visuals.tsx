"use client";

import Image from "next/image";
import { cn } from "@/app/components/ui";
import { ballTone, type BallKind } from "./demoMatch";

export type AudienceId = "players" | "scorers" | "organizers" | "fans";

// Demo data for the audience vignettes (typed so real API data can replace it).
const PLAYER = {
  initials: "RS",
  name: "R. Sharma",
  team: "Mumbai Strikers",
  role: "Right-hand bat · Captain",
  stats: [
    { label: "Matches", value: "34" },
    { label: "Runs", value: "1,128" },
    { label: "Average", value: "41.8" },
    { label: "Strike rt", value: "148.2" },
  ],
  recent: [
    { runs: 47, out: true },
    { runs: 9, out: true },
    { runs: 34, out: true },
    { runs: 81, out: false },
    { runs: 12, out: true },
    { runs: 58, out: false },
  ],
};

const FIXTURES = [
  { when: "Sat · 4:00 PM", home: "BAN", away: "POW", status: "Result", note: "BAN won by 22 runs" },
  { when: "Sun · 7:30 PM", home: "MUM", away: "AND", status: "Live", note: "MUM 171/4 (19.1)" },
  { when: "Tue · 6:00 PM", home: "THA", away: "BAN", status: "Upcoming", note: "Oval Maidan" },
] as const;

const COMMENTARY: { over: string; kind: BallKind; text: string }[] = [
  { over: "19.1", kind: "six", text: "SIX — Sharma down the track, lofted over long-on!" },
  { over: "18.6", kind: "run", text: "1 run — worked to deep midwicket, keeps strike." },
  { over: "18.5", kind: "wicket", text: "OUT — Yadav top-edges, taken at short fine leg." },
];

const team = (s: string) =>
  ({ MUM: "#1E88E5", AND: "#E2B94B", BAN: "#4FB286", POW: "#C46B4E", THA: "#8A9BA8" })[s] ?? "#8A9BA8";

const card =
  "rounded-2xl border border-line bg-surface/90 shadow-overlay backdrop-blur-md";

/** Staggered entrance helper for vignette parts. */
const rise = (active: boolean, delay: number, extra?: string) => ({
  className: cn(
    "transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none",
    active ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
    extra,
  ),
  style: { transitionDelay: active ? `${delay}ms` : "0ms" },
});

export function AudienceVisual({ id, active }: { id: AudienceId; active: boolean }) {
  return (
    <div className="relative isolate flex h-[460px] items-center justify-center overflow-hidden rounded-2xl border border-line px-4 pb-4 pt-12 sm:h-[480px] sm:p-8">
      <Image
        src="/images/matchStalkImage.jpg"
        alt=""
        fill
        sizes="(min-width: 1024px) 640px, 100vw"
        className={cn(
          "-z-20 object-cover transition-transform duration-[1400ms] ease-out motion-reduce:transition-none",
          active ? "scale-105" : "scale-110",
        )}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(80%_70%_at_50%_45%,rgb(var(--canvas)/0.55),rgb(var(--canvas)/0.92)),linear-gradient(180deg,rgb(var(--canvas)/0.3),rgb(var(--canvas)/0.85))]"
      />
      {id === "players" && <PlayerVignette active={active} />}
      {id === "scorers" && <ScorerVignette active={active} />}
      {id === "organizers" && <OrganizerVignette active={active} />}
      {id === "fans" && <FanVignette active={active} />}
    </div>
  );
}

function PlayerVignette({ active }: { active: boolean }) {
  const max = Math.max(...PLAYER.recent.map((r) => r.runs));
  return (
    <div className="w-full max-w-sm">
      <div {...rise(active, 80, cn(card, "p-5"))}>
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand font-display text-2xl font-bold text-fg">
            {PLAYER.initials}
          </span>
          <div className="min-w-0">
            <p className="font-display text-2xl font-bold uppercase leading-none text-fg">{PLAYER.name}</p>
            <p className="mt-1 truncate text-xs text-fg-subtle">
              {PLAYER.team} · {PLAYER.role}
            </p>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-4 gap-2 border-y border-line py-4 text-center">
          {PLAYER.stats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse">
              <dt className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-fg-subtle">{s.label}</dt>
              <dd className="font-display text-xl font-bold tabular-nums text-fg">{s.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-2xs font-semibold uppercase tracking-[0.14em] text-fg-subtle">Last 6 innings</p>
        <div className="mt-2 flex h-20 items-end gap-2">
          {PLAYER.recent.map((r, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span className="font-mono text-[10px] tabular-nums text-fg-muted">
                {r.runs}
                {!r.out && "*"}
              </span>
              <span
                className={cn(
                  "w-full origin-bottom rounded-t-sm transition-transform duration-700 ease-out motion-reduce:transition-none",
                  r.runs >= 50 ? "bg-primary" : "bg-fg/20",
                  active ? "scale-y-100" : "scale-y-0",
                )}
                style={{ height: `${Math.max(8, (r.runs / max) * 52)}px`, transitionDelay: active ? `${250 + i * 60}ms` : "0ms" }}
              />
            </div>
          ))}
        </div>
      </div>
      <div {...rise(active, 300, cn(card, "mt-3 flex items-center gap-3 px-4 py-3"))}>
        <i className="ri-user-add-line text-lg text-accent" aria-hidden />
        <p className="min-w-0 flex-1 truncate text-sm text-fg">
          <span className="font-semibold text-fg">Andheri Warriors</span> invited you to their squad
        </p>
        <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-fg">Join</span>
      </div>
    </div>
  );
}

const SCORER_KEYS: { label: string; tone: string }[] = [
  ...["0", "1", "2", "3"].map((label) => ({ label, tone: "border-line bg-surface-2 text-fg" })),
  { label: "4", tone: "border-brand bg-brand text-fg" },
  { label: "6", tone: "border-accent bg-accent text-fg-inverse" },
  { label: "OUT", tone: "border-live/50 bg-live/20 text-fg" },
  { label: "Undo", tone: "border-line bg-transparent text-fg-subtle" },
  ...["Wd", "Nb", "B", "Lb"].map((label) => ({ label, tone: "border-gold/30 bg-gold/10 text-gold" })),
];

function ScorerVignette({ active }: { active: boolean }) {
  return (
    <div className="relative w-full max-w-[340px]">
      <div {...rise(active, 80, cn(card, "overflow-hidden"))}>
        <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
          <span className="flex items-center gap-2">
            <span className="rounded bg-brand px-1.5 font-display text-sm font-bold text-fg">MUM</span>
            <span className="font-display text-3xl font-bold tabular-nums text-fg">142/3</span>
          </span>
          <span className="font-mono text-xs tabular-nums text-fg-subtle">16.2 ov · CRR 8.69</span>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5 text-[13px]">
          <span className="text-fg">
            R. Sharma<span className="text-accent">*</span> <span className="font-mono text-fg-muted">58 (37)</span>
          </span>
          <span className="flex gap-1">
            {(["run", "four"] as BallKind[]).map((k, i) => (
              <span key={i} className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold", ballTone[k])}>
                {k === "four" ? 4 : 1}
              </span>
            ))}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 p-3 pt-1">
          {SCORER_KEYS.map((k) => (
            <span
              key={k.label}
              className={cn(
                "flex h-12 items-center justify-center rounded-xl border font-display text-lg font-bold transition-shadow duration-500",
                k.tone,
                k.label === "4" && active && "shadow-[0_0_0_4px_rgb(var(--brand)/0.3)]",
              )}
            >
              {k.label}
            </span>
          ))}
        </div>
      </div>
      <div
        {...rise(
          active,
          380,
          "absolute -bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-primary/40 bg-surface px-3 py-1.5 text-xs font-semibold text-accent shadow-pop",
        )}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inset-0 rounded-full bg-accent motion-safe:animate-live-ping" />
          <span className="relative h-2 w-2 rounded-full bg-accent" />
        </span>
        Synced to live page &amp; overlay
      </div>
    </div>
  );
}

function OrganizerVignette({ active }: { active: boolean }) {
  return (
    <div className="w-full max-w-md space-y-3">
      <div {...rise(active, 80, cn(card, "overflow-hidden"))}>
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="text-2xs font-semibold uppercase tracking-[0.16em] text-fg-subtle">City Premier League · Fixtures</span>
          <i className="ri-calendar-schedule-line text-fg-subtle" aria-hidden />
        </div>
        <ul className="divide-y divide-line">
          {FIXTURES.map((f, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-[86px] shrink-0 font-mono text-[11px] text-fg-subtle">{f.when}</span>
              <span className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-semibold text-fg">
                <span className="h-3 w-1 rounded-full" style={{ background: team(f.home) }} />
                {f.home}
                <span className="text-fg-subtle">v</span>
                <span className="h-3 w-1 rounded-full" style={{ background: team(f.away) }} />
                {f.away}
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]",
                  f.status === "Live" ? "bg-live text-fg" : f.status === "Result" ? "bg-surface-3 text-fg-muted" : "border border-line text-fg-subtle",
                )}
              >
                {f.status}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-3 sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div {...rise(active, 220, cn(card, "p-3"))}>
          <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-fg-subtle">Knockouts</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 space-y-1.5">
              {[
                ["MUM", "THA"],
                ["AND", "BAN"],
              ].map(([a, b], i) => (
                <div key={i} className="whitespace-nowrap rounded-md border border-line bg-surface-2 px-2 py-1 font-mono text-[11px] text-fg-muted">
                  <span className="hidden text-fg-subtle min-[480px]:inline">SF{i + 1} </span>
                  {a} v {b}
                </div>
              ))}
            </div>
            <span className="h-10 w-3 rounded-r-md border border-l-0 border-line-strong" aria-hidden />
            <div className="rounded-md border border-gold/40 bg-gold/10 shrink-0 whitespace-nowrap px-2 py-1 text-center font-mono text-[11px] text-gold">
              <i className="ri-trophy-line" aria-hidden /> Final
            </div>
          </div>
        </div>
        <div {...rise(active, 320, cn(card, "flex flex-col justify-between p-3"))}>
          <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-[0.14em] text-fg-subtle">
            <i className="ri-youtube-fill text-live" aria-hidden /> Stream
          </p>
          <p className="mt-2 text-sm font-semibold leading-snug text-fg">Overlay bundle</p>
          <p className="font-mono text-xs text-accent">from ₹49 / match</p>
        </div>
      </div>
    </div>
  );
}

function FanVignette({ active }: { active: boolean }) {
  return (
    <div className="w-full max-w-sm space-y-3">
      <div {...rise(active, 80, cn(card, "overflow-hidden"))}>
        <div className="relative h-28 overflow-hidden">
          <Image src="/images/matchStalkImage.jpg" alt="" fill sizes="384px" className="object-cover" />
          <div className="absolute inset-0 bg-canvas/40" />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded bg-live px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-fg">
            <i className="ri-youtube-fill" aria-hidden /> Live
          </span>
          <span className="absolute inset-0 m-auto flex h-10 w-10 items-center justify-center rounded-full bg-canvas/70 text-xl text-fg backdrop-blur">
            <i className="ri-play-fill" aria-hidden />
          </span>
          <div className="absolute inset-x-2 bottom-2 flex items-center justify-between rounded bg-canvas/85 px-2 py-1 font-display text-sm font-bold tabular-nums text-fg">
            <span>
              <span className="mr-1.5 rounded-sm bg-brand px-1">MUM</span>171/4 <span className="text-fg-subtle">19.1</span>
            </span>
            <span className="text-xs uppercase text-accent">Need 7 off 5</span>
          </div>
        </div>
        <ul className="divide-y divide-line">
          {COMMENTARY.map((c, i) => (
            <li
              key={c.over}
              className={cn(
                "flex items-start gap-3 px-4 py-2.5 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none",
                active ? "translate-x-0 opacity-100" : "translate-x-3 opacity-0",
              )}
              style={{ transitionDelay: active ? `${260 + i * 90}ms` : "0ms" }}
            >
              <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-display text-[11px] font-bold", ballTone[c.kind])}>
                {c.kind === "six" ? 6 : c.kind === "wicket" ? "W" : 1}
              </span>
              <p className="min-w-0 text-[13px] leading-snug text-fg-muted">
                <span className="mr-1.5 font-mono text-fg-subtle">{c.over}</span>
                {c.text}
              </p>
            </li>
          ))}
        </ul>
      </div>
      <div {...rise(active, 480, cn(card, "flex items-center gap-3 px-4 py-3"))}>
        <i className="ri-gamepad-line text-lg text-fg-subtle" aria-hidden />
        <p className="min-w-0 flex-1 text-sm text-fg-muted">Fantasy cricket for local matches</p>
        <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold">
          Coming soon
        </span>
      </div>
    </div>
  );
}
