"use client";

import { useEffect, useState } from "react";
import { tile } from "./primitives";

/** Verified site metrics — use exactly these. Swap for an API-backed source later. */
const STATS = [
  { value: "1K+", count: 1000, label: "matches scored live" },
  { value: "500+", count: 500, label: "tournaments run" },
  { value: "300+", count: 300, label: "streams broadcast" },
  { value: "₹0", label: "to start scoring" },
];

/** Counts the numbers up once on load (eased over 1.8s), then settles on the exact figures. */
export default function StatsStrip() {
  const [p, setP] = useState(1);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let start: number | null = null;
    const step = (now: number) => {
      if (start === null) start = now;
      const t = Math.min(1, (now - start) / 1800);
      setP(1 - Math.pow(1 - t, 3));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    setP(0);
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section
      aria-label="CricsHub in numbers"
      data-anim="scale"
      className={`${tile} -mt-[clamp(32px,5vw,64px)] grid grid-cols-2 overflow-hidden rounded-[28px] lg:grid-cols-4`}
    >
      {STATS.map((s) => (
        <div key={s.label} className="flex flex-col gap-1.5 border-white/[0.08] p-6 sm:p-8 [&:not(:last-child)]:border-r max-lg:[&:nth-child(2)]:border-r-0 max-lg:[&:nth-child(-n+2)]:border-b">
          <span className="font-display text-[clamp(2.5rem,5vw,3.5rem)] font-bold leading-none text-white tabular-nums">
            {s.count === undefined || p >= 1 ? s.value : Math.round(s.count * p)}
          </span>
          <span className="text-sm text-[#C3CEE0]">{s.label}</span>
        </div>
      ))}
    </section>
  );
}
