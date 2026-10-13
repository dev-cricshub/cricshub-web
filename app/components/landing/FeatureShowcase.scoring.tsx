"use client";

import { useMemo, useState } from "react";
import { cn } from "@/app/components/ui";
import { DemoTag } from "./primitives";
import { ballTone, oversText, runRate, type BallKind } from "./demoMatch";

// Compact scoring-pad demo. All state is local; every figure is derived from the
// list of deliveries, so undo is just "drop the last delivery".

type Extra = "wd" | "nb" | "b" | "lb";
type Delivery = { kind: "bat"; runs: number } | { kind: Extra; runs: number } | { kind: "wicket" };

interface Ball {
  label: string;
  tone: BallKind;
  runs: number;
  legal: boolean;
}

const DEMO_OVERS = 5;
const MAX_BALLS = DEMO_OVERS * 6;
const RUN_VALUES = [0, 1, 2, 3, 4, 6] as const;

const EXTRAS: { key: Extra; short: string; name: string; hint: string }[] = [
  { key: "wd", short: "Wd", name: "Wide", hint: "Wide: +1 run, ball re-bowled. Tap runs taken (0 = just the wide)." },
  { key: "nb", short: "Nb", name: "No-ball", hint: "No-ball: +1 run, ball re-bowled. Tap runs off the bat." },
  { key: "b", short: "B", name: "Byes", hint: "Byes: legal ball, runs to extras. Tap runs taken." },
  { key: "lb", short: "LB", name: "Leg byes", hint: "Leg byes: legal ball, runs to extras. Tap runs taken." },
];

/** Seed: a full first over plus two balls of the second, so the pad opens mid-innings. */
const SEED: Delivery[] = [
  { kind: "bat", runs: 1 },
  { kind: "bat", runs: 4 },
  { kind: "bat", runs: 0 },
  { kind: "wd", runs: 0 },
  { kind: "bat", runs: 2 },
  { kind: "bat", runs: 6 },
  { kind: "lb", runs: 1 },
  { kind: "bat", runs: 0 },
  { kind: "bat", runs: 1 },
];

const BAT_LINES: Record<number, string> = {
  0: "No run — defended back down the pitch.",
  1: "1 run — worked into the leg side.",
  2: "2 runs — driven into the gap, back for the second.",
  3: "3 runs — chased down just inside the rope.",
  4: "FOUR — punched through the covers.",
  6: "SIX — launched over long-on!",
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function commentary(d: Delivery): string {
  switch (d.kind) {
    case "bat":
      return BAT_LINES[d.runs] ?? plural(d.runs, "run");
    case "wicket":
      return "OUT — edged and taken at slip.";
    case "wd":
      return d.runs ? `Wide down the leg side, ${plural(d.runs, "run")} taken as well.` : "Wide — drifting down the leg side.";
    case "nb":
      return d.runs ? `No-ball, and ${plural(d.runs, "run")} off the bat.` : "No-ball — overstepped. Free hit next.";
    case "b":
      return `${plural(d.runs, "bye")} — beats the keeper.`;
    case "lb":
      return `${plural(d.runs, "leg bye")} — off the pad.`;
  }
}

const isLegal = (d: Delivery) => d.kind !== "wd" && d.kind !== "nb";

function describe(d: Delivery): Omit<Ball, "legal"> {
  switch (d.kind) {
    case "wicket":
      return { label: "W", tone: "wicket", runs: 0 };
    case "bat":
      return {
        label: d.runs === 0 ? "•" : String(d.runs),
        tone: d.runs === 0 ? "dot" : d.runs === 4 ? "four" : d.runs === 6 ? "six" : "run",
        runs: d.runs,
      };
    case "wd":
      return { label: d.runs ? `${d.runs + 1}wd` : "Wd", tone: "wide", runs: d.runs + 1 };
    case "nb":
      return { label: d.runs ? `Nb+${d.runs}` : "Nb", tone: "wide", runs: d.runs + 1 };
    case "b":
      return { label: `${d.runs}b`, tone: "wide", runs: d.runs };
    case "lb":
      return { label: `${d.runs}lb`, tone: "wide", runs: d.runs };
  }
}

function derive(deliveries: Delivery[]) {
  let runs = 0;
  let wickets = 0;
  let legal = 0;
  const extras: Record<Extra, number> = { wd: 0, nb: 0, b: 0, lb: 0 };
  const overs: Ball[][] = [];
  const feed: { id: number; over: string; ball: Ball; text: string }[] = [];
  for (const [i, d] of deliveries.entries()) {
    const ball: Ball = { ...describe(d), legal: isLegal(d) };
    feed.push({ id: i, over: `${Math.floor(legal / 6)}.${(legal % 6) + 1}`, ball, text: commentary(d) });
    const overIdx = Math.floor(legal / 6);
    (overs[overIdx] ??= []).push(ball);
    runs += ball.runs;
    if (d.kind === "wicket") wickets += 1;
    if (d.kind === "wd") extras.wd += d.runs + 1;
    if (d.kind === "nb") extras.nb += 1;
    if (d.kind === "b") extras.b += d.runs;
    if (d.kind === "lb") extras.lb += d.runs;
    if (isLegal(d)) legal += 1;
  }
  const currentOver = Math.max(0, overs.length - 1);
  const overTotals = overs.map((o) => o.reduce((s, b) => s + b.runs, 0));
  const complete = wickets >= 10 || legal >= MAX_BALLS;
  return {
    runs,
    wickets,
    legal,
    extras,
    extrasTotal: extras.wd + extras.nb + extras.b + extras.lb,
    overs,
    currentOver,
    overTotals,
    complete,
    feed: feed.slice(-4).reverse(),
  };
}

export default function ScoringPreview() {
  const [deliveries, setDeliveries] = useState<Delivery[]>(SEED);
  const [armed, setArmed] = useState<Extra | null>(null);
  const s = useMemo(() => derive(deliveries), [deliveries]);

  const thisOver = s.overs[s.currentOver] ?? [];
  const legalInOver = thisOver.filter((b) => b.legal).length;
  const armedInfo = EXTRAS.find((e) => e.key === armed);

  const record = (d: Delivery) => {
    if (s.complete) return;
    setDeliveries((prev) => [...prev, d]);
    setArmed(null);
  };
  const tapRuns = (r: number) => record(armed ? { kind: armed, runs: r } : { kind: "bat", runs: r });
  const runDisabled = (r: number) =>
    s.complete || (r === 6 && (armed === "wd" || armed === "b" || armed === "lb")) || (r === 0 && (armed === "b" || armed === "lb"));

  const padBtn =
    "flex h-11 items-center justify-center rounded-xl border font-display text-lg font-bold tabular-nums transition-[background-color,border-color,transform,opacity] duration-150 ease-out active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <span className="flex min-w-0 items-center gap-2 truncate text-2xs font-semibold uppercase tracking-[0.18em] text-fg-subtle">
          <i className="ri-edit-circle-line text-sm text-accent" aria-hidden />
          Scoring pad<span className="hidden sm:inline"> · {DEMO_OVERS}-over demo innings</span>
        </span>
        <DemoTag label="Interactive demo" className="shrink-0 whitespace-nowrap" />
      </div>

      <div className="grid flex-1 gap-5 p-4 sm:p-5 md:grid-cols-[1fr_1.05fr]">
        {/* Scoreboard readout */}
        <div className="flex min-w-0 flex-col gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-brand px-2 py-0.5 font-display text-sm font-bold tracking-wide text-fg">MUM</span>
              <span className="text-sm text-fg-muted">Mumbai Strikers · batting</span>
            </div>
            <p className="mt-2 flex items-baseline gap-3" aria-live="polite" aria-atomic="true">
              <span className="font-display text-6xl font-bold leading-none tabular-nums text-fg">
                {s.runs}/{s.wickets}
              </span>
              <span className="font-mono text-sm tabular-nums text-fg-subtle">
                <span className="sr-only">after </span>
                {oversText(s.legal)}
                <span className="text-fg-subtle"> / {DEMO_OVERS} ov</span>
              </span>
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-surface-3 text-center font-mono text-xs tabular-nums">
            <div className="bg-surface px-2 py-2.5">
              <dt className="text-fg-subtle">CRR</dt>
              <dd className="mt-0.5 text-sm text-fg">{runRate(s.runs, s.legal)}</dd>
            </div>
            <div className="bg-surface px-2 py-2.5">
              <dt className="text-fg-subtle">Extras</dt>
              <dd className="mt-0.5 text-sm text-gold">{s.extrasTotal}</dd>
            </div>
            <div className="bg-surface px-2 py-2.5">
              <dt className="text-fg-subtle">Balls left</dt>
              <dd className="mt-0.5 text-sm text-fg">{MAX_BALLS - s.legal}</dd>
            </div>
          </dl>

          <p className="font-mono text-xs tabular-nums text-fg-subtle">
            wd {s.extras.wd} · nb {s.extras.nb} · b {s.extras.b} · lb {s.extras.lb}
          </p>

          <div>
            <div className="mb-2 flex items-center justify-between text-2xs font-semibold uppercase tracking-[0.16em] text-fg-subtle">
              <span>
                Over {s.currentOver + 1} · {legalInOver}/6 legal
              </span>
              <span className="font-mono normal-case tracking-normal tabular-nums text-fg-muted">
                {s.overTotals[s.currentOver] ?? 0} runs
              </span>
            </div>
            <ol className="flex min-h-9 flex-wrap items-center gap-1.5" aria-label={`Over ${s.currentOver + 1}, ball by ball`}>
              {thisOver.map((b, i) => (
                <li
                  key={`${s.currentOver}-${i}-${b.label}`}
                  className={cn(
                    "flex h-8 min-w-[2rem] items-center justify-center rounded-full px-1.5 font-display text-xs font-bold",
                    ballTone[b.tone],
                    i === thisOver.length - 1 && "motion-safe:animate-pop",
                  )}
                >
                  {b.label}
                </li>
              ))}
              {Array.from({ length: Math.max(0, 6 - legalInOver) }).map((_, i) => (
                <li key={`e${i}`} className="h-8 w-8 rounded-full border border-dashed border-line" aria-hidden />
              ))}
            </ol>
            {s.currentOver > 0 && (
              <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-2xs tabular-nums text-fg-subtle">
                {s.overTotals.slice(0, s.currentOver).map((t, i) => (
                  <span key={i}>
                    Ov {i + 1}: <span className="text-fg-muted">{t}</span>
                  </span>
                ))}
              </p>
            )}
          </div>

          <div className="flex-1 border-t border-line pt-3">
            <p className="mb-2 text-2xs font-semibold uppercase tracking-[0.16em] text-fg-subtle">Commentary</p>
            {s.feed.length === 0 ? (
              <p className="text-sm text-fg-subtle">First ball coming up…</p>
            ) : (
              <ul className="space-y-2">
                {s.feed.map((c, i) => (
                  <li
                    key={c.id}
                    className={cn(
                      "flex gap-3 text-sm leading-snug",
                      i === 0 ? "text-fg motion-safe:animate-fade-in" : "text-fg-subtle",
                    )}
                  >
                    <span className="w-8 shrink-0 font-mono text-xs tabular-nums text-fg-subtle">{c.over}</span>
                    <span>{c.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Pad */}
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-canvas/50 p-3 sm:p-4">
          <p className="min-h-10 text-xs leading-snug text-fg-subtle" aria-live="polite">
            {s.complete
              ? s.wickets >= 10
                ? "All out — innings complete. Undo or reset to keep scoring."
                : "Innings complete. Undo or reset to keep scoring."
              : armedInfo
                ? armedInfo.hint
                : "Tap runs off the bat, or pick an extra first."}
          </p>

          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Runs">
            {RUN_VALUES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => tapRuns(r)}
                disabled={runDisabled(r)}
                aria-label={`${r} run${r === 1 ? "" : "s"}${armedInfo ? ` (${armedInfo.name.toLowerCase()})` : ""}`}
                className={cn(
                  padBtn,
                  r === 4
                    ? "border-brand/40 bg-brand/15 text-fg hover:bg-brand/30"
                    : r === 6
                      ? "border-primary/40 bg-primary/15 text-accent hover:bg-primary/25"
                      : "border-line bg-surface-2 text-fg hover:bg-surface-3",
                )}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2" role="group" aria-label="Extras">
            {EXTRAS.map((e) => (
              <button
                key={e.key}
                type="button"
                aria-pressed={armed === e.key}
                aria-label={e.name}
                title={e.name}
                disabled={s.complete}
                onClick={() => setArmed((a) => (a === e.key ? null : e.key))}
                className={cn(
                  padBtn,
                  "h-10 text-sm",
                  armed === e.key
                    ? "border-gold bg-gold text-canvas"
                    : "border-gold/30 bg-gold/10 text-gold hover:bg-gold/20",
                )}
              >
                {e.short}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => record({ kind: "wicket" })}
            disabled={s.complete || armed !== null}
            className={cn(padBtn, "h-10 gap-2 border-live/50 bg-live/15 text-sm uppercase tracking-wider text-fg hover:bg-live/30")}
          >
            <i className="ri-close-circle-line text-base" aria-hidden />
            Wicket
          </button>

          <div className="mt-auto grid grid-cols-2 gap-2 border-t border-line pt-3">
            <button
              type="button"
              onClick={() => {
                setDeliveries((p) => p.slice(0, -1));
                setArmed(null);
              }}
              disabled={deliveries.length === 0}
              className="flex h-9 items-center justify-center gap-1.5 rounded-lg text-sm text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <i className="ri-arrow-go-back-line" aria-hidden />
              Undo
            </button>
            <button
              type="button"
              onClick={() => {
                setDeliveries([]);
                setArmed(null);
              }}
              disabled={deliveries.length === 0}
              className="flex h-9 items-center justify-center gap-1.5 rounded-lg text-sm text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <i className="ri-restart-line" aria-hidden />
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
