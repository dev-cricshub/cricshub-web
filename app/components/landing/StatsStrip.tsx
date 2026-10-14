import { cn } from "@/app/components/ui";

/** Verified site metrics — use exactly these. Swap for an API-backed source later. */
const STATS = [
  { value: "1K+", label: "matches scored live" },
  { value: "500+", label: "tournaments run" },
  { value: "300+", label: "streams broadcast" },
  { value: "₹0", label: "to start scoring", accent: true },
];

export default function StatsStrip() {
  return (
    <section aria-label="CricsHub in numbers" className="relative z-[5] mx-auto -mt-10 max-w-[1000px] px-6">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-px overflow-hidden rounded-[28px] border border-[#22304A] bg-[#22304A]">
        {STATS.map((s) => (
          <div key={s.label} className="bg-surface-2 px-5 py-[26px] text-center">
            <div className={cn("font-display text-[46px] font-extrabold leading-none", s.accent && "text-accent")}>{s.value}</div>
            <div className="mt-1 text-[13px] text-fg-muted">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
