// Aerial-ground motif shared by the lower landing sections — a quieter echo of the hero's
// HeroGround (boundary rope, 30-yard ring, pitch, optional wagon-wheel spokes).
// Original vector art, coloured entirely from design tokens. Decorative only.

import { useId } from "react";
import { cn } from "@/app/components/ui";

const C = 500;
const ROPE = 440;
const STRIKER = { x: C, y: C + 70 };

// Angle in degrees, 0 = straight down the ground ("up" in the SVG); dist relative to the rope.
const SPOKES: { angle: number; dist: number; runs: 1 | 4 | 6 }[] = [
  { angle: -12, dist: 1.06, runs: 6 },
  { angle: 44, dist: 1, runs: 4 },
  { angle: -70, dist: 1, runs: 4 },
  { angle: 104, dist: 0.5, runs: 1 },
  { angle: -128, dist: 0.46, runs: 1 },
  { angle: 150, dist: 1, runs: 4 },
  { angle: 72, dist: 1.1, runs: 6 },
];

const tone = (runs: 1 | 4 | 6) => (runs === 6 ? "rgb(var(--accent))" : runs === 4 ? "rgb(var(--brand))" : "rgb(var(--fg) / 0.4)");

export default function GroundMotif({
  shots = false,
  drawn = true,
  className,
}: {
  /** Show wagon-wheel spokes. */
  shots?: boolean;
  /** When false the spokes wait undrawn (used for an in-view reveal). */
  drawn?: boolean;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 1000 1000" className={cn("h-full w-full overflow-visible", className)} aria-hidden>
      <defs>
        <radialGradient id={`${id}-grass`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgb(var(--primary))" stopOpacity="0.22" />
          <stop offset="60%" stopColor="rgb(var(--primary))" stopOpacity="0.1" />
          <stop offset="100%" stopColor="rgb(var(--primary))" stopOpacity="0.03" />
        </radialGradient>
        <pattern id={`${id}-stripes`} width="80" height="1000" patternUnits="userSpaceOnUse">
          <rect width="40" height="1000" fill="rgb(var(--fg))" fillOpacity="0.02" />
        </pattern>
        <clipPath id={`${id}-field`}>
          <circle cx={C} cy={C} r={ROPE + 30} />
        </clipPath>
      </defs>

      <circle cx={C} cy={C} r={ROPE + 30} fill={`url(#${id}-grass)`} />
      <rect width="1000" height="1000" fill={`url(#${id}-stripes)`} clipPath={`url(#${id}-field)`} />
      <circle cx={C} cy={C} r={ROPE + 30} fill="none" stroke="rgb(var(--fg))" strokeOpacity="0.07" strokeWidth="1.5" />
      <circle cx={C} cy={C} r={ROPE} fill="none" stroke="rgb(var(--accent))" strokeOpacity="0.4" strokeWidth="2" />
      <circle cx={C} cy={C} r={ROPE * 0.48} fill="none" stroke="rgb(var(--fg))" strokeOpacity="0.12" strokeWidth="1.5" strokeDasharray="6 10" />
      <rect x={C - 16} y={C - 80} width="32" height="160" rx="3" fill="rgb(var(--gold))" fillOpacity="0.28" />
      {[C - 64, C + 64].map((y) => (
        <line key={y} x1={C - 22} x2={C + 22} y1={y} y2={y} stroke="rgb(var(--fg))" strokeOpacity="0.4" strokeWidth="1.5" />
      ))}

      {shots && (
        <g strokeLinecap="round" fill="none">
          {SPOKES.map((s, i) => {
            const rad = ((s.angle - 90) * Math.PI) / 180;
            const x = STRIKER.x + Math.cos(rad) * ROPE * s.dist;
            const y = STRIKER.y + Math.sin(rad) * ROPE * s.dist;
            const len = Math.hypot(x - STRIKER.x, y - STRIKER.y);
            return (
              <g key={i}>
                <line
                  x1={STRIKER.x}
                  y1={STRIKER.y}
                  x2={x}
                  y2={y}
                  stroke={tone(s.runs)}
                  strokeOpacity="0.8"
                  strokeWidth={s.runs >= 4 ? 2.5 : 1.75}
                  strokeDasharray={len}
                  strokeDashoffset={drawn ? 0 : len}
                  style={{ transition: `stroke-dashoffset 1100ms var(--ease-out) ${300 + i * 120}ms` }}
                  className="motion-reduce:!transition-none"
                />
                <circle
                  cx={x}
                  cy={y}
                  r={s.runs === 6 ? 7 : s.runs === 4 ? 5 : 3.5}
                  fill={tone(s.runs)}
                  style={{ opacity: drawn ? 1 : 0, transition: `opacity 300ms ease-out ${1100 + i * 120}ms` }}
                  className="motion-reduce:!transition-none"
                />
              </g>
            );
          })}
          <circle cx={STRIKER.x} cy={STRIKER.y} r="6" fill="rgb(var(--fg))" fillOpacity="0.85" />
        </g>
      )}
    </svg>
  );
}
