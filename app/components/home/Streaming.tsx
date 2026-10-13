"use client";

import { Button, ButtonLink, MarketingHeading, Reveal } from "@/app/components/ui";
import { useStartStreaming } from "./useStartStreaming";

const STEPS = [
  {
    icon: "ri-links-line",
    title: "Connect OBS or vMix",
    body: "Add one browser source URL. Control scenes, audio and replays right from the dashboard.",
  },
  {
    icon: "ri-palette-line",
    title: "Pick an overlay style",
    body: "Free score bar for every match, or unlock an 8-overlay bundle with your team colours.",
  },
  {
    icon: "ri-broadcast-line",
    title: "Go live",
    body: "The scorer updates the app; overlays update on-air within a second. No operator typing.",
  },
];

const OVERLAYS = [
  "Live score bar",
  "Main match banner",
  "Playing XI",
  "Batting & bowling cards",
  "Match summary",
  "Event bursts — 4s, 6s, wickets",
  "Win predictor",
  "Sponsor branding",
  "Media reel",
];

export default function Streaming() {
  const start = useStartStreaming();
  return (
    <section id="streaming" className="scroll-mt-20 py-20 sm:py-28">
      <div className="container-page">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <Reveal>
            <MarketingHeading
              align="left"
              eyebrow="Stream Studio"
              title="A broadcast crew in a browser tab"
              lead="Professional overlays that read straight from the live scorecard — so your stream looks like TV without anyone retyping the score."
            />
            <ul className="mt-8 flex flex-wrap gap-2">
              {OVERLAYS.map((o) => (
                <li
                  key={o}
                  className="rounded-full border border-line bg-surface px-3 py-1 text-sm text-fg-muted"
                >
                  {o}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button onClick={start} trailingIcon="ri-arrow-right-line">
                Start streaming free
              </Button>
              <ButtonLink href="/pricing" variant="outline">
                See overlay bundles
              </ButtonLink>
            </div>
          </Reveal>

          <ol className="relative space-y-4">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 90}>
                <div className="group flex gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card transition-[border-color,box-shadow] duration-200 hover:border-line-strong hover:shadow-raised sm:p-6">
                  <div className="flex flex-col items-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-inverse text-lg text-fg-inverse">
                      <i className={s.icon} aria-hidden />
                    </span>
                  </div>
                  <div>
                    <p className="font-mono text-xs font-medium text-fg-subtle">Step {i + 1}</p>
                    <h3 className="mt-0.5 text-base font-semibold tracking-tight text-fg">{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-fg-muted">{s.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
