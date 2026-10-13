"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/app/components/ui";
import { DemoTag, LandingHeading } from "./primitives";
import { usePrefersReducedMotion } from "./hooks";
import { StoryPreview } from "./ProductStory.preview";

interface StoryStep {
  title: string;
  body: string;
  points: string[];
}

const STEPS: StoryStep[] = [
  {
    title: "A match is created",
    body: "Pick the tournament, format and venue. CricsHub sets up the scorecard, the overs and a shareable match page in seconds.",
    points: ["Tournament or friendly", "Any overs format"],
  },
  {
    title: "Teams and players are added",
    body: "Bring in squads from your teams or invite players with a link. Captains, keepers and the toss are locked in before the first ball.",
    points: ["Invite links", "Captain & keeper roles"],
  },
  {
    title: "Live scoring begins",
    body: "Every delivery is one tap — runs, extras, wickets. Batting and bowling figures, run rates and commentary update ball by ball.",
    points: ["Ball-by-ball", "Auto commentary"],
  },
  {
    title: "A broadcast-style score overlay appears",
    body: "Drop the overlay into OBS or vMix as a browser source and it syncs every ball to your YouTube stream. Free for every match admin.",
    points: ["OBS & vMix", "YouTube live"],
  },
  {
    title: "Tournament standings update",
    body: "The result flows straight into the points table — wins, points and net run rate — ready for the knockout stage.",
    points: ["Points tables", "Knockouts"],
  },
];

const LG = "(min-width: 1024px)";

export default function ProductStory() {
  const [active, setActive] = useState(0);
  const [scrubbed, setScrubbed] = useState(false);
  const reduced = usePrefersReducedMotion();
  const listRef = useRef<HTMLOListElement>(null);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const fillRef = useRef<HTMLSpanElement>(null);

  // Scroll → active step. GSAP ScrollTrigger (desktop, motion OK) with an
  // IntersectionObserver fallback (reduced motion, or GSAP failed to load).
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const mql = window.matchMedia(LG);
    let cleanup: () => void = () => {};
    let gen = 0;
    let disposed = false;

    const observeSteps = () => {
      if (typeof IntersectionObserver === "undefined") return () => {};
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            const i = stepRefs.current.indexOf(e.target as HTMLLIElement);
            if (i >= 0) setActive(i);
          }
        },
        { rootMargin: "-45% 0px -54% 0px" },
      );
      stepRefs.current.forEach((el) => el && io.observe(el));
      return () => io.disconnect();
    };

    const setup = async () => {
      const my = ++gen;
      cleanup();
      cleanup = () => {};
      if (!mql.matches) return;
      if (reduced) {
        cleanup = observeSteps();
        return;
      }
      try {
        const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
        if (disposed || my !== gen) return;
        gsap.registerPlugin(ScrollTrigger);
        const ctx = gsap.context(() => {
          stepRefs.current.forEach((el, i) => {
            if (!el) return;
            ScrollTrigger.create({
              trigger: el,
              start: "top 55%",
              end: "bottom 55%",
              onToggle: (self) => self.isActive && setActive(i),
            });
          });
          if (fillRef.current) {
            gsap.fromTo(
              fillRef.current,
              { scaleY: 0 },
              { scaleY: 1, ease: "none", scrollTrigger: { trigger: list, start: "top 55%", end: "bottom 55%", scrub: 0.4 } },
            );
          }
        }, list);
        setScrubbed(true);
        cleanup = () => {
          ctx.revert();
          setScrubbed(false);
        };
      } catch {
        if (!disposed && my === gen) cleanup = observeSteps();
      }
    };

    setup();
    const onChange = () => void setup();
    mql.addEventListener("change", onChange);
    return () => {
      disposed = true;
      gen++;
      mql.removeEventListener("change", onChange);
      cleanup();
    };
  }, [reduced]);

  const jumpTo = (i: number) => {
    stepRefs.current[i]?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  };

  return (
    <section id="story" aria-labelledby="story-title" className="relative scroll-mt-20 border-y border-line bg-surface/50 py-section">
      <div className="container-page">
        <LandingHeading
          id="story-title"
          eyebrow="How it works"
          title={
            <>
              From first ball <br className="hidden sm:block" />to final table.
            </>
          }
          lead="Follow one match through CricsHub — set up in a minute, scored ball by ball, broadcast with live overlays, and straight into the standings."
        />

        {/* Desktop: scrolling steps + sticky evolving preview */}
        <div className="mt-16 hidden gap-16 lg:grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] xl:gap-24">
          <div className="relative">
            {/* Progress rail */}
            <div aria-hidden className="absolute bottom-[35vh] left-[19px] top-[35vh] w-px bg-surface-3">
              <span
                ref={fillRef}
                className={cn("absolute inset-0 origin-top bg-accent", !scrubbed && "hidden")}
                style={{ transform: "scaleY(0)" }}
              />
              {!scrubbed && (
                <span
                  className="absolute inset-0 origin-top bg-accent transition-transform duration-500 ease-out motion-reduce:transition-none"
                  style={{ transform: `scaleY(${active / (STEPS.length - 1)})` }}
                />
              )}
            </div>

            <ol ref={listRef} className="relative">
              {STEPS.map((s, i) => {
                const on = i === active;
                return (
                  <li
                    key={s.title}
                    ref={(el) => {
                      stepRefs.current[i] = el;
                    }}
                    aria-current={on ? "step" : undefined}
                    className="flex min-h-[70vh] items-center"
                  >
                    <div className="flex gap-6">
                      <button
                        type="button"
                        onClick={() => jumpTo(i)}
                        aria-label={`Go to step ${i + 1}: ${s.title}`}
                        className={cn(
                          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-display text-base font-bold tabular-nums transition-colors duration-300",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
                          on
                            ? "border-accent bg-primary text-primary-fg"
                            : i < active
                              ? "border-primary/50 bg-surface text-accent"
                              : "border-line bg-surface text-fg-subtle hover:border-line-strong hover:text-fg",
                        )}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </button>
                      <div className={cn("max-w-md transition-opacity duration-300 motion-reduce:transition-none", on ? "opacity-100" : "opacity-45")}>
                        <h3 className="font-display text-3xl font-bold uppercase leading-[0.95] text-fg xl:text-4xl">{s.title}</h3>
                        <p className="mt-4 text-base leading-relaxed text-fg-muted">{s.body}</p>
                        <ul className="mt-5 flex flex-wrap gap-2">
                          {s.points.map((p) => (
                            <li key={p} className="rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-medium text-fg-muted">
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div>
            <div className="sticky" style={{ top: "max(6rem, calc(50vh - 15rem))" }}>
              <StoryPreview step={active} mode="live" />
              <div className="mt-4 flex items-center justify-between gap-4">
                <p className="text-sm text-fg-subtle" aria-live="polite">
                  Step {active + 1} of {STEPS.length} · <span className="text-fg-muted">{STEPS[active].title}</span>
                </p>
                <DemoTag label="Simulated match" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile / tablet: each step with its own static preview */}
        <ol className="mt-12 space-y-14 lg:hidden">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <div className="flex items-start gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/50 bg-surface font-display text-sm font-bold text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-2xl font-bold uppercase leading-[0.95] text-fg sm:text-3xl">{s.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">{s.body}</p>
                </div>
              </div>
              <StoryPreview step={i} className="mt-6 sm:mx-auto sm:max-w-xl" />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
