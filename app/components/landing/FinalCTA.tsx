"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/app/components/ui";
import { getStoredUser } from "@/lib/session";
import { PLAY_STORE_URL } from "@/lib/site";
import { CtaArrow, Eyebrow, ctaPrimary, ctaSecondary } from "./primitives";
import { useInViewOnce } from "./hooks";

const LINES = ["Your game.", "Your community.", "Your CricsHub."];

export default function FinalCTA() {
  const [ref, inView] = useInViewOnce<HTMLElement>("0px 0px -20% 0px");
  // Only hide content for the reveal once JS is running and motion is allowed —
  // SSR / no-JS / reduced-motion render the final state.
  const [armed, setArmed] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!getStoredUser());
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (el && el.getBoundingClientRect().top < window.innerHeight * 0.75) return; // already on screen
    setArmed(true);
  }, [ref]);

  const shown = !armed || inView;
  const reveal = (delay: number, className?: string) => ({
    className: cn(
      "transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
      shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
      className,
    ),
    style: { transitionDelay: shown ? `${delay}ms` : "0ms" },
  });

  const openLogin = () => {
    window.dispatchEvent(new CustomEvent("openLoginModal", { detail: { redirect: "/dashboard" } }));
  };

  return (
    <section ref={ref} aria-labelledby="final-cta-title" className="relative border-t border-line py-section">
      <div className="container-page grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-10">
        <div className="lg:col-span-7">
          <div {...reveal(0)}>
            <Eyebrow>Ready when you are</Eyebrow>
          </div>
          <h2 id="final-cta-title" className="mt-6 font-display text-display-xl font-extrabold uppercase text-fg">
            {LINES.map((line, i) => (
              <span key={line} className="block overflow-hidden pb-[0.04em]">
                <span
                  className={cn(
                    "block transition-transform duration-[800ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]",
                    shown ? "translate-y-0" : "translate-y-full",
                    i === 2 && "text-accent",
                  )}
                  style={{ transitionDelay: shown ? `${80 + i * 100}ms` : "0ms" }}
                >
                  {line}
                </span>
              </span>
            ))}
          </h2>
        </div>

        <div {...reveal(360, "lg:col-span-5 lg:pb-3")}>
          <p className="max-w-md text-base leading-relaxed text-fg-muted sm:text-lg">
            Score it, run it, stream it. Get the free Android app for your next match, or log in to Stream Studio on
            the web to put it on YouTube.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-start">
            <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className={ctaPrimary}>
              <i className="ri-google-play-fill text-lg" aria-hidden />
              Get CricsHub on Google Play
            </a>
            {loggedIn ? (
              <Link href="/dashboard" className={ctaSecondary}>
                Open Stream Studio
                <CtaArrow />
              </Link>
            ) : (
              <button type="button" onClick={openLogin} className={ctaSecondary}>
                Log in to Stream Studio
                <CtaArrow />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
