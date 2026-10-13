"use client";

import { useEffect, useState } from "react";
import { cn } from "@/app/components/ui";
import GroundMotif from "./GroundMotif";
import { LandingHeading } from "./primitives";
import { useInViewOnce } from "./hooks";

/** Verified site metrics — use exactly these. Swap for an API-backed source later. */
interface Metric {
  /** Exact final text that must always be rendered once settled. */
  display: string;
  /** Numeric target for the count-up. */
  value: number;
  label: string;
  detail: string;
  icon: string;
}

const METRICS: Metric[] = [
  {
    display: "1K+",
    value: 1000,
    label: "Live Matches Scored",
    detail: "Ball-by-ball scoring with player stats and commentary.",
    icon: "ri-live-line",
  },
  {
    display: "300+",
    value: 300,
    label: "YouTube Streams Managed",
    detail: "Broadcast with OBS & vMix overlays that sync every ball.",
    icon: "ri-youtube-line",
  },
  {
    display: "500+",
    value: 500,
    label: "Tournaments Organized",
    detail: "Fixtures, points tables and knockout stages.",
    icon: "ri-trophy-line",
  },
];

const COUNT_MS = 1600;
const STAGGER_MS = 220;

export default function StatsSection() {
  const [ref, inView] = useInViewOnce<HTMLElement>("0px 0px -20% 0px");
  // "armed" = client mounted, motion allowed, not yet revealed → show 0 and wait.
  // SSR / no-JS / reduced-motion never arm, so they always show the final values.
  const [armed, setArmed] = useState(false);
  const [progress, setProgress] = useState<number[]>(() => METRICS.map(() => 1));

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    // Already past the section (e.g. reload mid-page)? Keep final values.
    if (el && el.getBoundingClientRect().bottom < 0) return;
    setArmed(true);
    setProgress(METRICS.map(() => 0));
  }, [ref]);

  useEffect(() => {
    if (!armed || !inView) return;
    let raf = 0;
    const start = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 4);
    const tick = (now: number) => {
      const next = METRICS.map((_, i) => {
        const t = Math.min(1, Math.max(0, (now - start - i * STAGGER_MS) / COUNT_MS));
        return ease(t);
      });
      setProgress(next);
      if (next.some((p) => p < 1)) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [armed, inView]);

  const revealed = !armed || inView;

  return (
    <section
      ref={ref}
      aria-labelledby="stats-title"
      className="relative isolate overflow-hidden py-24 sm:py-32"
    >
      {/* Scoreboard-grid texture over an aerial ground on the horizon — echoes the hero, no beams */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(50% 45% at 15% 10%, rgb(var(--accent) / 0.06), transparent 70%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle, rgb(var(--fg)) 0.9px, transparent 1.5px)",
            backgroundSize: "14px 14px",
            maskImage: "radial-gradient(70% 60% at 50% 60%, black 15%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(70% 60% at 50% 60%, black 15%, transparent 75%)",
          }}
        />
        <div
          className="absolute bottom-0 left-1/2 aspect-square w-[1500px] max-w-none -translate-x-1/2 translate-y-[54%] opacity-90 sm:w-[1700px]"
          style={{ perspective: "1600px", maskImage: "linear-gradient(180deg, transparent, black 30%)", WebkitMaskImage: "linear-gradient(180deg, transparent, black 30%)" }}
        >
          <div className="h-full w-full" style={{ transform: "rotateX(64deg)" }}>
            <GroundMotif />
          </div>
        </div>
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-canvas to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-canvas to-transparent" />
      </div>

      <div className="container-page relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <LandingHeading
            id="stats-title"
            eyebrow="By the numbers"
            title={
              <>
                Cricket communities already <span className="text-accent">play on CricsHub</span>
              </>
            }
          />
          <p className="max-w-sm text-base leading-relaxed text-fg-muted">
            Matches scored ball by ball, streams taken live and tournaments run end to end — by organisers,
            clubs and match admins using CricsHub.
          </p>
        </div>

        <ul className="mt-14 grid border-t border-line sm:mt-20 lg:grid-cols-3">
          {METRICS.map((m, i) => {
            const p = progress[i] ?? 1;
            const settled = p >= 1;
            const text = settled ? m.display : `${Math.round(m.value * p)}+`;
            return (
              <li
                key={m.label}
                className={cn(
                  "group relative flex flex-col border-b border-line py-7 sm:py-12 lg:border-b-0 lg:px-10 lg:py-14",
                  i > 0 && "lg:border-l",
                  i === 0 && "lg:pl-0",
                  "transition-[opacity,transform] duration-700 ease-out",
                  revealed ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
                )}
                style={{ transitionDelay: revealed ? `${i * STAGGER_MS}ms` : "0ms" }}
              >
                <div aria-hidden className="flex items-center justify-between text-2xs font-semibold uppercase tracking-[0.22em] text-fg-subtle">
                  <span className="font-mono tabular-nums">0{i + 1}</span>
                  <i className={cn(m.icon, "text-base text-accent/80")} aria-hidden />
                </div>
                <p className="order-3 mt-3 font-display text-xl font-semibold uppercase tracking-wide text-fg sm:text-2xl">
                  {m.label}
                </p>
                <p className="order-2 mt-4">
                  {/* Screen readers always get the exact final value */}
                  <span className="sr-only">{m.display}</span>
                  <span
                    aria-hidden
                    className="inline-block min-w-[4.2ch] font-display text-[5.75rem] font-bold leading-[0.82] tracking-[-0.02em] tabular-nums text-fg sm:text-[8.5rem] lg:text-[7.5rem] xl:text-[9.5rem]"
                  >
                    {text}
                  </span>
                </p>
                <p className="order-4 mt-2 max-w-xs text-sm leading-relaxed text-fg-subtle">{m.detail}</p>
                {/* Floodlit underline that sweeps in once counted */}
                <span
                  aria-hidden
                  className={cn(
                    "order-5 mt-6 block h-px origin-left bg-gradient-to-r from-primary/80 to-transparent transition-transform duration-1000 ease-out",
                    settled ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
