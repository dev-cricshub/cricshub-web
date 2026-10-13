"use client";

import Link from "next/link";
import { Reveal } from "@/app/components/ui";
import { useStartStreaming } from "./useStartStreaming";

export default function FinalCta() {
  const start = useStartStreaming();
  return (
    <section className="py-20 sm:py-24">
      <div className="container-page">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-[#0B1F40] px-6 py-14 text-center text-white sm:px-12 sm:py-16">
            <div
              aria-hidden
              className="absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 50% 120%, #1E88E5 0, transparent 55%), linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
                backgroundSize: "100% 100%, 48px 48px, 48px 48px",
              }}
            />
            <div className="relative">
              <h2 className="mx-auto max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
                Your next match deserves a broadcast.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base text-white/70">
                The streaming dashboard and score overlay are free for every match admin. Upgrade only
                when you want more.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={start}
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-base font-medium text-[#0B1F40] shadow-xs transition-[background-color,transform] duration-150 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 active:scale-[0.98]"
                >
                  Get started free
                  <i className="ri-arrow-right-line transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                </button>
                <Link
                  href="/pricing"
                  className="inline-flex h-12 items-center justify-center rounded-xl px-6 text-base font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  Compare plans
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
