"use client";

import { Button, ButtonLink } from "@/app/components/ui";
import { PLAY_STORE_URL } from "@/lib/site";
import BroadcastPreview from "./BroadcastPreview";
import { useStartStreaming } from "./useStartStreaming";

const STATS = [
  { value: "1K+", label: "Matches scored live" },
  { value: "300+", label: "Streams broadcast" },
  { value: "500+", label: "Tournaments run" },
];

export default function Hero() {
  const start = useStartStreaming();
  return (
    <section className="relative overflow-hidden">
      {/* Subtle pitch-line grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.5] [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(var(--line)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--line)) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div className="container-page grid items-center gap-14 pb-20 pt-12 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pb-28 lg:pt-20">
        <div className="max-w-xl animate-fade-up">
          <p className="eyebrow">
            <i className="ri-live-line" aria-hidden />
            Score · Manage · Stream
          </p>
          <h1 className="mt-4 text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.035em] text-fg sm:text-5xl lg:text-[3.6rem]">
            Every ball scored.
            <br />
            <span className="text-primary">Every match on air.</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-fg-muted">
            CricsHub is the all-in-one cricket app for live scoring, tournament management and
            broadcast-quality streaming — built for local leagues that play like the pros.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={start} trailingIcon="ri-arrow-right-line">
              Open Stream Studio
            </Button>
            <ButtonLink href={PLAY_STORE_URL} external size="lg" variant="outline" icon="ri-google-play-fill">
              Get the Android app
            </ButtonLink>
          </div>

          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-line pt-6">
            {STATS.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-fg">{s.value}</dd>
                <dd className="mt-0.5 text-xs leading-snug text-fg-muted">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="animate-fade-up [animation-delay:150ms] lg:pl-4">
          <BroadcastPreview />
        </div>
      </div>
    </section>
  );
}
