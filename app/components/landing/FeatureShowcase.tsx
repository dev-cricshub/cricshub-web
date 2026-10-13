"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/app/components/ui";
import { LandingHeading, Panel } from "./primitives";
import StreamPreview from "./FeatureShowcase.stream";
import TournamentPreview from "./FeatureShowcase.tournament";
import FantasyPreview from "./FeatureShowcase.fantasy";

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [state, setState] = useState<"static" | "armed" | "shown">("static");
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) return;
    setState("armed");
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, state] as const;
}

export default function FeatureShowcase() {
  const [sectionRef, reveal] = useReveal<HTMLElement>();
  const shown = reveal !== "armed";

  return (
    <section
      ref={sectionRef}
      id="features"
      aria-labelledby="features-title"
      className="relative scroll-mt-20 py-section"
    >
      <div className="container-page">
        <div
          className={cn(
            "grid items-end gap-8 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] lg:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.7fr)]",
            !shown && "translate-y-6 opacity-0",
          )}
        >
          <LandingHeading
            id="features-title"
            eyebrow="Streaming, tournaments, fantasy"
            title={
              <>
                On the stream.
                <br />
                In the tournament.
              </>
            }
            lead="The overlay is the graphic that sits on your YouTube broadcast. The league screen is how fixtures and the points table live in the app."
          />
          <p className="max-w-sm text-sm leading-relaxed text-fg-muted lg:pb-2 lg:text-right">
            Fantasy is drawn here as the app will show it. Contests are not open yet.
          </p>
        </div>

        <figure
          className={cn(
            "mt-12 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
            !shown && "translate-y-6 opacity-0",
          )}
          style={{ transitionDelay: shown ? "80ms" : "0ms" }}
        >
          <Panel className="overflow-hidden">
            <figcaption className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
              <span className="font-display text-sm font-bold uppercase tracking-[0.16em] text-fg">YouTube overlay</span>
              <span className="text-xs text-fg-subtle">Glass score bar · sample match</span>
            </figcaption>
            <StreamPreview />
          </Panel>
        </figure>

        <div className="mt-6 grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(16rem,0.7fr)]">
          <figure
            className={cn(
              "transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
              !shown && "translate-y-6 opacity-0",
            )}
            style={{ transitionDelay: shown ? "140ms" : "0ms" }}
          >
            <Panel className="h-full overflow-hidden">
              <TournamentPreview />
            </Panel>
            <figcaption className="mt-3 text-sm text-fg-muted">
              <span className="font-semibold text-fg">Tournament.</span> Fixtures and the points table, in the app.
            </figcaption>
          </figure>

          <figure
            className={cn(
              "flex flex-col transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
              !shown && "translate-y-6 opacity-0",
            )}
            style={{ transitionDelay: shown ? "200ms" : "0ms" }}
          >
            <div className="flex flex-1 items-center justify-center rounded-frame border border-line bg-surface px-6 py-8 shadow-frame">
              <FantasyPreview />
            </div>
            <figcaption className="mt-3 text-sm text-fg-muted">
              <span className="font-semibold text-fg">Fantasy.</span> A sample XI. Coming soon.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
