"use client";

import { useEffect, useState } from "react";
import { cn } from "@/app/components/ui";
import {
  applyBall,
  ballTone,
  economy,
  initialMatch,
  oversText,
  requiredRate,
  runRate,
  strikeRate,
  type BallKind,
  type DemoAction,
  type MatchState,
} from "./demoMatch";
import { DemoTag, LandingHeading, Panel } from "./primitives";

const CONTROLS: { action: DemoAction; label: string; sub: string; tone: string }[] = [
  { action: "dot", label: "•", sub: "Dot", tone: "hover:border-line-strong" },
  { action: "1", label: "1", sub: "Single", tone: "hover:border-line-strong" },
  { action: "2", label: "2", sub: "Double", tone: "hover:border-line-strong" },
  { action: "4", label: "4", sub: "Four", tone: "hover:border-brand/70 hover:bg-brand/10" },
  { action: "6", label: "6", sub: "Six", tone: "hover:border-accent/70 hover:bg-accent/10" },
  { action: "wide", label: "Wd", sub: "Wide", tone: "hover:border-gold/70 hover:bg-gold/10" },
  { action: "wicket", label: "W", sub: "Wicket", tone: "hover:border-live/70 hover:bg-live/10" },
];

const BURST: Partial<Record<BallKind, { text: string; cls: string }>> = {
  four: { text: "Four", cls: "text-brand" },
  six: { text: "Six", cls: "text-accent" },
  wicket: { text: "Wicket", cls: "text-live" },
};

export default function LiveScoreboard() {
  const [history, setHistory] = useState<MatchState[]>(() => [initialMatch()]);
  const [burst, setBurst] = useState<{ kind: BallKind; id: number } | null>(null);
  const [announce, setAnnounce] = useState("");
  const m = history[history.length - 1];

  const play = (action: DemoAction) => {
    if (m.result) return;
    const next = applyBall(m, action);
    const line = next.commentary[0];
    setHistory((h) => [...h, next].slice(-60));
    setAnnounce(`${line.over}: ${line.text} Score ${next.runs} for ${next.wickets}.`);
    if (BURST[line.kind]) setBurst({ kind: line.kind, id: next.seq });
  };

  const undo = () => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
  const reset = () => {
    setHistory([initialMatch()]);
    setBurst(null);
    setAnnounce("Demo reset to the starting position.");
  };

  useEffect(() => {
    if (!burst) return;
    const t = setTimeout(() => setBurst(null), 1100);
    return () => clearTimeout(t);
  }, [burst]);

  const striker = m.batters[m.striker];
  const nonStriker = m.batters[m.nonStriker];
  const bowler = m.bowlers[m.bowler];
  const need = Math.max(0, m.target - m.runs);
  const left = m.maxBalls - m.balls;

  return (
    <section id="scoreboard" aria-labelledby="scoreboard-title" className="relative scroll-mt-20 py-section">
      <div className="container-page relative">
        <div>
          <LandingHeading
            id="scoreboard-title"
            eyebrow="Try the scorer"
            title={
              <>
                Don&apos;t read about it.
                <br />
                Score it.
              </>
            }
            lead="This is the scoreboard CricsHub builds from every tap the scorer makes. Bowl a few deliveries below — runs, strike rotation, overs and the chase all update the way they do in a real match."
          />
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-[1fr_300px]">
          {/* ── Board ── */}
          <Panel className="relative overflow-hidden">
            {/* Event burst */}
            {burst && BURST[burst.kind] && (
              <div
                key={burst.id}
                aria-hidden
                className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-[2px] animate-[burst-bg_1.1s_ease-out_forwards]"
              >
                <span
                  className={cn(
                    "font-display text-7xl font-extrabold uppercase tracking-tight sm:text-9xl animate-[burst-text_1.1s_cubic-bezier(0.2,0.8,0.2,1)_forwards]",
                    BURST[burst.kind]!.cls,
                  )}
                >
                  {BURST[burst.kind]!.text}
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-fg-subtle">{m.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-fg-subtle">2nd innings · T20</span>
                <DemoTag label="Simulated" />
              </div>
            </div>

            {/* Score header */}
            <div className="grid gap-6 px-5 py-6 sm:grid-cols-[1fr_auto] sm:items-end sm:px-6">
              <div className="space-y-3">
                <TeamLine team={m.batting} batting score={`${m.runs}/${m.wickets}`} overs={oversText(m.balls)} />
                <TeamLine team={m.bowling} score={`${m.firstInnings.runs}/${m.firstInnings.wickets}`} overs={m.firstInnings.overs} />
              </div>
              <dl className="grid grid-cols-3 gap-5 font-mono text-sm tabular-nums sm:text-right">
                <Stat label="CRR" value={runRate(m.runs, m.balls)} />
                <Stat label="RRR" value={requiredRate(m)} accent />
                <Stat label="Target" value={String(m.target)} />
              </dl>
            </div>

            <div
              className={cn(
                "mx-5 rounded-control px-4 py-2.5 text-sm transition-colors duration-300 sm:mx-6",
                m.result ? "bg-gold/15 text-gold" : "bg-primary/10 text-accent",
              )}
              aria-live="polite"
            >
              {m.result ? (
                <span className="font-semibold">
                  <i className="ri-trophy-line mr-1.5" aria-hidden />
                  {m.result}
                </span>
              ) : (
                <>
                  {m.batting.name} need <strong className="tabular-nums">{need}</strong> runs from{" "}
                  <strong className="tabular-nums">{left}</strong> balls
                </>
              )}
            </div>

            {/* Chase progress */}
            <div className="mx-5 mt-3 h-1 overflow-hidden rounded-full bg-surface-3 sm:mx-6" aria-hidden>
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                style={{ width: `${Math.min(100, (m.runs / m.target) * 100)}%` }}
              />
            </div>

            {/* Batters + bowler */}
            <div className="mt-6 grid border-y border-line sm:grid-cols-[1.4fr_1fr]">
              <table className="w-full text-sm">
                <caption className="sr-only">Batters at the crease</caption>
                <thead>
                  <tr className="text-left text-2xs uppercase tracking-wider text-fg-subtle">
                    <th className="px-5 py-2 font-medium sm:px-6">Batter</th>
                    <th className="px-2 py-2 text-right font-medium">R</th>
                    <th className="px-2 py-2 text-right font-medium">B</th>
                    <th className="hidden px-2 py-2 text-right font-medium min-[420px]:table-cell">4s</th>
                    <th className="hidden px-2 py-2 text-right font-medium min-[420px]:table-cell">6s</th>
                    <th className="px-5 py-2 text-right font-medium sm:pr-6">SR</th>
                  </tr>
                </thead>
                <tbody className="font-mono tabular-nums">
                  {[striker, nonStriker].map((b, i) => (
                    <tr key={b.name} className={cn("transition-colors", i === 0 ? "text-fg" : "text-fg-muted")}>
                      <td className="px-5 py-1.5 font-sans sm:px-6">
                        {b.name}
                        {i === 0 && <span className="ml-0.5 text-accent" aria-label="on strike">*</span>}
                      </td>
                      <td className="px-2 py-1.5 text-right font-semibold">{b.runs}</td>
                      <td className="px-2 py-1.5 text-right">{b.balls}</td>
                      <td className="hidden px-2 py-1.5 text-right min-[420px]:table-cell">{b.fours}</td>
                      <td className="hidden px-2 py-1.5 text-right min-[420px]:table-cell">{b.sixes}</td>
                      <td className="px-5 py-1.5 text-right sm:pr-6">{strikeRate(b)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-line px-5 py-2 text-sm sm:border-l sm:border-t-0 sm:px-6">
                <p className="text-2xs uppercase tracking-wider text-fg-subtle">Bowling</p>
                <p className="mt-2 text-fg">{bowler.name}</p>
                <p className="mt-1 font-mono tabular-nums text-fg-muted">
                  {oversText(bowler.balls)} ov · {bowler.runs} r · <span className="text-fg">{bowler.wickets} w</span> · Econ {economy(bowler)}
                </p>
              </div>
            </div>

            {/* This over */}
            <div className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6">
              <span className="text-2xs font-medium uppercase tracking-wider text-fg-subtle">This over</span>
              <ol className="flex flex-wrap gap-1.5" aria-label="Deliveries this over">
                {m.thisOver.map((b, i) => (
                  <li
                    key={`${m.seq}-${i}`}
                    className={cn(
                      "flex h-8 min-w-8 items-center justify-center rounded-full px-1.5 font-display text-base font-bold",
                      ballTone[b.kind],
                      i === m.thisOver.length - 1 && history.length > 1 && "animate-pop",
                    )}
                  >
                    {b.label}
                  </li>
                ))}
                {Array.from({ length: Math.max(0, 6 - m.thisOver.filter((b) => b.kind !== "wide").length) }).map((_, i) => (
                  <li key={`empty-${i}`} className="h-8 w-8 rounded-full border border-dashed border-line" aria-hidden />
                ))}
              </ol>
            </div>

            <div className="max-h-[340px] overflow-y-auto border-t border-line px-5 py-5 sm:px-6">
              <Scorecard m={m} />
            </div>
          </Panel>

          {/* ── Demo controls ── */}
          <div className="sticky bottom-3 z-30 lg:bottom-auto lg:top-24 lg:self-start">
            <Panel className="p-3 sm:p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold uppercase tracking-wide text-fg sm:text-xl">Bowl a ball</h3>
                <DemoTag label="Demo" />
              </div>
              <p className="mt-1.5 hidden text-sm text-fg-subtle sm:block">
                Each tap is one delivery, exactly like the scorer&apos;s pad in the app.
              </p>
              <div className="mt-3 grid grid-cols-7 gap-1.5 sm:mt-5 sm:gap-2 lg:grid-cols-3">
                {CONTROLS.map((c) => (
                  <button
                    key={c.action}
                    type="button"
                    onClick={() => play(c.action)}
                    disabled={!!m.result}
                    aria-label={`${c.sub}${c.action === "wide" ? " (one extra run, ball re-bowled)" : ""}`}
                    className={cn(
                      "group flex aspect-square flex-col items-center justify-center rounded-control border border-line bg-surface-2 transition-[transform,background-color,border-color] duration-150 ease-out",
                      "active:scale-[0.94] disabled:cursor-not-allowed disabled:opacity-35",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      c.tone,
                      c.action === "wicket" && "lg:col-span-3 lg:aspect-auto lg:h-14 lg:flex-row lg:gap-2",
                    )}
                  >
                    <span className="font-display text-xl font-bold text-fg sm:text-2xl">{c.label}</span>
                    <span className="hidden text-2xs text-fg-subtle sm:block">{c.sub}</span>
                  </button>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-4">
                <button
                  type="button"
                  onClick={undo}
                  disabled={history.length < 2}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border sm:h-10 border-line text-sm text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <i className="ri-arrow-go-back-line" aria-hidden />
                  Undo
                </button>
                <button
                  type="button"
                  onClick={reset}
                  disabled={history.length < 2}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border sm:h-10 border-line text-sm text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <i className="ri-restart-line" aria-hidden />
                  Reset
                </button>
              </div>
              {m.result && (
                <p className="mt-2 rounded-lg bg-gold/10 px-3 py-2 text-sm sm:mt-4 text-gold animate-fade-in">
                  Match finished — reset to play again.
                </p>
              )}
              <p className="sr-only" aria-live="polite">
                {announce}
              </p>
            </Panel>
            <p className="mt-4 hidden px-1 text-xs leading-relaxed text-fg-subtle lg:block">
              In the real app, the scorer&apos;s taps sync to this scoreboard, the commentary feed and your stream
              overlays within a second.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes burst-bg { 0% { opacity: 0 } 15% { opacity: 1 } 75% { opacity: 1 } 100% { opacity: 0 } }
        @keyframes burst-text { 0% { transform: scale(0.6); opacity: 0; letter-spacing: 0.2em } 20% { transform: scale(1.05); opacity: 1; letter-spacing: 0 } 75% { transform: scale(1); opacity: 1 } 100% { transform: scale(1.1); opacity: 0 } }
      `}</style>
    </section>
  );
}

function TeamLine({
  team,
  score,
  overs,
  batting,
}: {
  team: { name: string; short: string; color: string };
  score: string;
  overs: string;
  batting?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-12 items-center justify-center rounded-md font-display text-base font-bold tracking-wide"
        style={{ background: team.color, color: batting ? "#fff" : "#1a1305" }}
      >
        {team.short}
      </span>
      <span className={cn("min-w-0 flex-1 truncate text-sm sm:text-base", batting ? "text-fg" : "text-fg-subtle")}>
        {team.name}
        {batting && <i className="ri-circle-fill ml-2 align-middle text-[6px] text-accent" aria-label="batting" />}
      </span>
      <span
        key={score}
        className={cn(
          "font-display font-bold tabular-nums",
          batting ? "text-4xl text-fg sm:text-5xl animate-fade-in" : "text-2xl text-fg-subtle",
        )}
      >
        {score}
      </span>
      <span className={cn("w-12 font-mono text-sm tabular-nums", batting ? "text-fg-muted" : "text-fg-subtle")}>{overs}</span>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <dt className="text-2xs uppercase tracking-wider text-fg-subtle">{label}</dt>
      <dd className={cn("mt-1 text-lg", accent ? "text-accent" : "text-fg")}>{value}</dd>
    </div>
  );
}

function Scorecard({ m }: { m: MatchState }) {
  const atCrease = new Set([m.striker, m.nonStriker]);
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div>
        <h4 className="text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
          {m.batting.name} batting
        </h4>
        <ul className="mt-2 divide-y divide-line text-sm">
          {m.batters.map((b, i) => (
            <li key={b.name} className="flex items-baseline justify-between gap-3 py-1.5">
              <span className="min-w-0">
                <span className={atCrease.has(i) ? "text-fg" : "text-fg-muted"}>{b.name}</span>
                <span className="ml-2 text-xs text-fg-subtle">{b.dismissal ?? (atCrease.has(i) ? "not out" : "")}</span>
              </span>
              <span className="font-mono tabular-nums text-fg">
                {b.runs} <span className="text-fg-subtle">({b.balls})</span>
              </span>
            </li>
          ))}
          <li className="flex justify-between py-1.5 text-fg-subtle">
            <span>Extras</span>
            <span className="font-mono tabular-nums">{m.extras}</span>
          </li>
          <li className="flex justify-between py-1.5 font-semibold text-fg">
            <span>Total</span>
            <span className="font-mono tabular-nums">
              {m.runs}/{m.wickets} ({oversText(m.balls)})
            </span>
          </li>
        </ul>
        {m.lineup.length > 0 && (
          <p className="mt-2 text-xs text-fg-subtle">Yet to bat: {m.lineup.join(", ")}</p>
        )}
      </div>
      <div>
        <h4 className="text-2xs font-semibold uppercase tracking-wider text-fg-subtle">{m.bowling.name} bowling</h4>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="text-left text-2xs text-fg-subtle">
              <th className="py-1 font-medium">Bowler</th>
              <th className="py-1 text-right font-medium">O</th>
              <th className="py-1 text-right font-medium">R</th>
              <th className="py-1 text-right font-medium">W</th>
              <th className="py-1 text-right font-medium">Econ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line font-mono tabular-nums">
            {m.bowlers.map((b, i) => (
              <tr key={b.name} className={i === m.bowler ? "text-fg" : "text-fg-muted"}>
                <td className="py-1.5 font-sans">
                  {b.name}
                  {i === m.bowler && <span className="ml-1 text-accent">*</span>}
                </td>
                <td className="py-1.5 text-right">{oversText(b.balls)}</td>
                <td className="py-1.5 text-right">{b.runs}</td>
                <td className="py-1.5 text-right">{b.wickets}</td>
                <td className="py-1.5 text-right">{economy(b)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const KIND_BADGE: Record<BallKind, string> = {
  dot: "•",
  run: "",
  four: "4",
  six: "6",
  wicket: "W",
  wide: "Wd",
};

function Commentary({ m }: { m: MatchState }) {
  return (
    <ol className="space-y-3">
      {m.commentary.map((c, i) => (
        <li key={c.id} className={cn("flex gap-3", i === 0 && "animate-fade-up")}>
          <span className="w-10 flex-shrink-0 pt-0.5 font-mono text-xs tabular-nums text-fg-subtle">{c.over}</span>
          <span
            className={cn(
              "flex h-6 min-w-6 flex-shrink-0 items-center justify-center rounded-full px-1 font-display text-xs font-bold",
              ballTone[c.kind],
            )}
            aria-hidden
          >
            {KIND_BADGE[c.kind] || c.runs}
          </span>
          <p className={cn("text-sm leading-relaxed", c.kind === "wicket" ? "text-fg" : "text-fg-muted")}>{c.text}</p>
        </li>
      ))}
    </ol>
  );
}

function Summary({ m }: { m: MatchState }) {
  const fours = m.batters.reduce((s, b) => s + b.fours, 0);
  const sixes = m.batters.reduce((s, b) => s + b.sixes, 0);
  const top = [...m.batters].sort((a, b) => b.runs - a.runs)[0];
  const best = [...m.bowlers].sort((a, b) => b.wickets - a.wickets || a.runs - b.runs)[0];
  const items = [
    { label: "1st innings", value: `${m.bowling.short} ${m.firstInnings.runs}/${m.firstInnings.wickets} (${m.firstInnings.overs})` },
    { label: "2nd innings", value: `${m.batting.short} ${m.runs}/${m.wickets} (${oversText(m.balls)})` },
    { label: "Top scorer", value: `${top.name} ${top.runs} (${top.balls})` },
    { label: "Best bowling", value: `${best.name} ${best.wickets}/${best.runs}` },
    { label: "Boundaries", value: `${fours} fours · ${sixes} sixes` },
    { label: "Extras conceded", value: String(m.extras) },
  ];
  return (
    <div>
      <p className="text-sm text-fg-muted">
        {m.result ??
          `${m.batting.name} are ${m.runs}/${m.wickets} chasing ${m.target}, needing ${requiredRate(m)} an over.`}
      </p>
      <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {items.map((it) => (
          <div key={it.label} className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
            <dt className="text-xs uppercase tracking-wider text-fg-subtle">{it.label}</dt>
            <dd className="text-right font-mono text-sm tabular-nums text-fg">{it.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
