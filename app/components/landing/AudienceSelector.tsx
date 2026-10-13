"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/app/components/ui";
import { PLAY_STORE_URL } from "@/lib/site";
import { CtaArrow, DemoTag, LandingHeading, ctaSecondary } from "./primitives";
import { AudienceVisual, type AudienceId } from "./AudienceSelector.visuals";

interface Audience {
  id: AudienceId;
  tab: string;
  icon: string;
  headline: string;
  description: string;
  features: { title: string; body: string; icon: string; soon?: boolean }[];
  cta: { label: string; href: string; external?: boolean };
}

const AUDIENCES: Audience[] = [
  {
    id: "players",
    tab: "Players",
    icon: "ri-user-star-line",
    headline: "Your whole career, one profile.",
    description: "Every run you score and every wicket you take in a CricsHub match lands on your profile automatically — no spreadsheets, no lost scorebooks.",
    features: [
      { icon: "ri-bar-chart-2-line", title: "Career stats", body: "Runs, averages, strike rates and economy across every match you play." },
      { icon: "ri-user-add-line", title: "Team invites", body: "Join a squad from an invite link and show up in the lineup instantly." },
      { icon: "ri-history-line", title: "Match history", body: "Full scorecards and ball-by-ball for every game you've been part of." },
    ],
    cta: { label: "Get the app", href: PLAY_STORE_URL, external: true },
  },
  {
    id: "scorers",
    tab: "Scorers & umpires",
    icon: "ri-edit-box-line",
    headline: "Score every ball in one tap.",
    description: "A scoring pad built for the boundary rope: big targets, quick extras and wickets, and an undo that never loses the plot.",
    features: [
      { icon: "ri-grid-line", title: "Ball-by-ball pad", body: "Runs, dots and boundaries with strike rotation handled for you." },
      { icon: "ri-error-warning-line", title: "Extras & wickets", body: "Wides, no-balls, byes and every mode of dismissal, recorded properly." },
      { icon: "ri-broadcast-line", title: "Live sync to overlays", body: "Each ball updates the live score page and stream overlay instantly." },
    ],
    cta: { label: "Start scoring", href: PLAY_STORE_URL, external: true },
  },
  {
    id: "organizers",
    tab: "Tournament organizers",
    icon: "ri-trophy-line",
    headline: "Run the tournament, not the paperwork.",
    description: "Fixtures, results and tables stay in sync on their own — and every match can go out live on YouTube with broadcast overlays.",
    features: [
      { icon: "ri-calendar-schedule-line", title: "Fixtures", body: "Schedule league rounds and keep every team on the same page." },
      { icon: "ri-table-line", title: "Points tables & knockouts", body: "Standings and net run rate update after each result, then on to the knockouts." },
      { icon: "ri-live-line", title: "Streaming with overlays", body: "Free score overlay for every match; overlay bundles from ₹49 per match." },
    ],
    cta: { label: "See streaming plans", href: "/pricing" },
  },
  {
    id: "fans",
    tab: "Fans",
    icon: "ri-heart-3-line",
    headline: "Never miss a ball from your local ground.",
    description: "Follow your club, your friends and your city's tournaments with the same live detail as the big leagues.",
    features: [
      { icon: "ri-pulse-line", title: "Live scores", body: "Scorecards that update the moment the scorer taps." },
      { icon: "ri-chat-quote-line", title: "Ball-by-ball commentary", body: "Every delivery described, from dot balls to last-over sixes." },
      { icon: "ri-youtube-line", title: "YouTube streams", body: "Watch matches live with broadcast-style score overlays." },
      { icon: "ri-gamepad-line", title: "Fantasy cricket", body: "Pick your XI from local matches.", soon: true },
    ],
    cta: { label: "Follow live on Android", href: PLAY_STORE_URL, external: true },
  },
];

export default function AudienceSelector() {
  const [selected, setSelected] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const measure = useCallback(() => {
    const el = tabRefs.current[selected];
    if (!el) return;
    setIndicator({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
  }, [selected]);

  useLayoutEffect(() => {
    measure();
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => ro.disconnect();
  }, [measure]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const n = AUDIENCES.length;
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (selected + 1) % n;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (selected - 1 + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    if (next === null) return;
    e.preventDefault();
    setSelected(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section aria-labelledby="audience-title" className="relative py-24 sm:py-32">
      <div className="container-page">
        <LandingHeading
          id="audience-title"
          eyebrow="Who it's for"
          title="Built for Everyone Who Lives Cricket."
          lead="Whether you're padding up, holding the scorebook, running a league or following from the stands — CricsHub fits the way you play."
        />

        {/* Tabs: 2x2 below lg, a single segmented row on lg+. Sliding indicator follows the selection. */}
        <div
          ref={listRef}
          role="tablist"
          aria-label="Choose your role"
          aria-orientation="horizontal"
          onKeyDown={onKeyDown}
          className="relative mt-12 grid grid-cols-2 gap-1 rounded-2xl border border-line bg-surface-2 p-1 lg:inline-grid lg:grid-cols-4 lg:rounded-full"
        >
          {indicator && (
            <span
              aria-hidden
              className="absolute left-0 top-0 rounded-xl bg-primary shadow-[0_8px_24px_-10px_rgb(var(--primary)/0.45)] transition-[transform,width,height] duration-300 ease-out motion-reduce:transition-none lg:rounded-full"
              style={{ transform: `translate(${indicator.x}px, ${indicator.y}px)`, width: indicator.w, height: indicator.h }}
            />
          )}
          {AUDIENCES.map((a, i) => {
            const on = i === selected;
            return (
              <button
                key={a.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                id={`aud-tab-${a.id}`}
                role="tab"
                type="button"
                aria-selected={on}
                aria-controls={`aud-panel-${a.id}`}
                tabIndex={on ? 0 : -1}
                onClick={() => setSelected(i)}
                className={cn(
                  "relative z-10 flex min-h-[3rem] items-center justify-center gap-2 rounded-xl px-3 py-2 text-center text-sm font-semibold leading-tight transition-colors duration-200 lg:rounded-full lg:px-5",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
                  on ? "text-primary-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                  // Before the indicator is measured (no JS yet), show selection with a plain fill.
                  on && !indicator && "bg-primary",
                )}
              >
                <i className={cn(a.icon, "text-base")} aria-hidden />
                <span className="lg:whitespace-nowrap">{a.tab}</span>
              </button>
            );
          })}
        </div>

        {/* Panels stacked in one grid cell → true crossfade, height = tallest panel (no layout shift). */}
        <div className="mt-10 grid grid-cols-[minmax(0,1fr)]">
          {AUDIENCES.map((a, i) => {
            const on = i === selected;
            return (
              <div
                key={a.id}
                id={`aud-panel-${a.id}`}
                role="tabpanel"
                aria-labelledby={`aud-tab-${a.id}`}
                tabIndex={on ? 0 : -1}
                aria-hidden={!on}
                inert={!on}
                className={cn(
                  "col-start-1 row-start-1 grid grid-cols-[minmax(0,1fr)] items-center gap-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14",
                  "transition-[opacity,transform,visibility] duration-[400ms] ease-out motion-reduce:transition-none",
                  on ? "visible translate-y-0 opacity-100" : "invisible translate-y-3 opacity-0",
                )}
              >
                <div>
                  <h3 className="font-display text-4xl font-bold uppercase leading-[0.95] text-fg sm:text-5xl">{a.headline}</h3>
                  <p className="mt-5 max-w-lg text-base leading-relaxed text-fg-muted sm:text-lg">{a.description}</p>

                  <ul className="mt-8 divide-y divide-line border-y border-line">
                    {a.features.map((f, fi) => (
                      <li
                        key={f.title}
                        className={cn(
                          "flex gap-4 py-4 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none",
                          on ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0",
                        )}
                        style={{ transitionDelay: on ? `${120 + fi * 70}ms` : "0ms" }}
                      >
                        <i className={cn(f.icon, "mt-0.5 text-xl", f.soon ? "text-fg-subtle" : "text-accent")} aria-hidden />
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2 font-semibold text-fg">
                            {f.title}
                            {f.soon && (
                              <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-px text-2xs font-semibold uppercase tracking-[0.12em] text-gold">
                                Coming soon
                              </span>
                            )}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-fg-subtle">{f.body}</p>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {a.cta.external ? (
                    <a href={a.cta.href} target="_blank" rel="noopener noreferrer" className={cn(ctaSecondary, "mt-8")}>
                      {a.cta.label}
                      <CtaArrow />
                    </a>
                  ) : (
                    <Link href={a.cta.href} className={cn(ctaSecondary, "mt-8")}>
                      {a.cta.label}
                      <CtaArrow />
                    </Link>
                  )}
                </div>

                <div className="relative">
                  <AudienceVisual id={a.id} active={on} />
                  <DemoTag label="Demo" className="absolute right-3 top-3 z-20 bg-canvas/70 backdrop-blur" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
