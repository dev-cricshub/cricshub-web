// Aerial cricket ground with a wagon wheel (shot map) — the hero's match-centre visual.
// Original vector art, coloured entirely from design tokens. Decorative only.
// Shots draw in sequence via stroke-dashoffset (CSS); static under reduced motion.

type Shot = { angle: number; dist: number; runs: 1 | 2 | 4 | 6 };

// Angle in degrees, 0 = straight down the ground (towards the bowler's end, "up" in the SVG).
const SHOTS: Shot[] = [
  { angle: -8, dist: 1.08, runs: 6 },
  { angle: 38, dist: 1, runs: 4 },
  { angle: -62, dist: 1, runs: 4 },
  { angle: 96, dist: 0.46, runs: 1 },
  { angle: -118, dist: 0.52, runs: 2 },
  { angle: 140, dist: 1, runs: 4 },
  { angle: 66, dist: 1.12, runs: 6 },
  { angle: -150, dist: 0.38, runs: 1 },
  { angle: 18, dist: 0.55, runs: 2 },
  { angle: -88, dist: 1, runs: 4 },
  { angle: 168, dist: 0.42, runs: 1 },
  { angle: -30, dist: 1.1, runs: 6 },
];

const FIELDERS = [
  [500, 120], [250, 230], [760, 220], [160, 520], [860, 470], [300, 820], [700, 830], [430, 330], [600, 700],
];

const CX = 500;
const CY = 500;
const ROPE = 440;
const STRIKER = { x: CX, y: CY + 70 };

function endpoint(s: Shot) {
  const rad = ((s.angle - 90) * Math.PI) / 180; // 0° points up
  const r = (s.runs >= 4 ? ROPE : ROPE) * s.dist;
  return { x: STRIKER.x + Math.cos(rad) * r, y: STRIKER.y + Math.sin(rad) * r };
}

const shotColor = (runs: Shot["runs"]) =>
  runs === 6 ? "rgb(var(--accent))" : runs === 4 ? "rgb(var(--brand))" : "rgb(var(--fg) / 0.45)";

export default function HeroGround() {
  return (
    <svg viewBox="0 0 1000 1000" className="h-full w-full overflow-visible" aria-hidden>
      <defs>
        <radialGradient id="hg-grass" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgb(var(--brand-navy))" stopOpacity="0.45" />
          <stop offset="70%" stopColor="rgb(var(--brand-navy))" stopOpacity="0.22" />
          <stop offset="100%" stopColor="rgb(var(--brand-navy))" stopOpacity="0.12" />
        </radialGradient>
        <pattern id="hg-stripes" width="80" height="1000" patternUnits="userSpaceOnUse">
          <rect width="40" height="1000" fill="rgb(var(--fg))" fillOpacity="0.025" />
        </pattern>
        <clipPath id="hg-field">
          <circle cx={CX} cy={CY} r={ROPE + 30} />
        </clipPath>
        <radialGradient id="hg-pitch" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgb(var(--gold))" stopOpacity="0.55" />
          <stop offset="100%" stopColor="rgb(var(--gold))" stopOpacity="0.3" />
        </radialGradient>
      </defs>

      {/* Outfield */}
      <circle cx={CX} cy={CY} r={ROPE + 30} fill="url(#hg-grass)" />
      <rect width="1000" height="1000" fill="url(#hg-stripes)" clipPath="url(#hg-field)" />

      {/* Boundary rope + outer ring */}
      <circle cx={CX} cy={CY} r={ROPE + 30} fill="none" stroke="rgb(var(--fg))" strokeOpacity="0.08" strokeWidth="1.5" />
      <circle cx={CX} cy={CY} r={ROPE} fill="none" stroke="rgb(var(--fg))" strokeOpacity="0.28" strokeWidth="2.5" />

      {/* 30-yard circle */}
      <circle cx={CX} cy={CY} r={ROPE * 0.48} fill="none" stroke="rgb(var(--fg))" strokeOpacity="0.16" strokeWidth="1.5" strokeDasharray="6 10" />

      {/* Pitch + creases */}
      <rect x={CX - 16} y={CY - 80} width="32" height="160" rx="3" fill="url(#hg-pitch)" />
      {[CY - 64, CY + 64].map((y) => (
        <line key={y} x1={CX - 22} x2={CX + 22} y1={y} y2={y} stroke="rgb(var(--fg))" strokeOpacity="0.55" strokeWidth="1.5" />
      ))}

      {/* Fielders */}
      {FIELDERS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="5" fill="rgb(var(--fg))" fillOpacity="0.5" />
      ))}

      {/* Wagon wheel */}
      <g strokeLinecap="round" fill="none">
        {SHOTS.map((s, i) => {
          const e = endpoint(s);
          const len = Math.hypot(e.x - STRIKER.x, e.y - STRIKER.y);
          const big = s.runs >= 4;
          return (
            <g key={i} className="hg-shot" style={{ ["--len" as string]: len, ["--i" as string]: i } as React.CSSProperties}>
              <line
                x1={STRIKER.x}
                y1={STRIKER.y}
                x2={e.x}
                y2={e.y}
                stroke={shotColor(s.runs)}
                strokeWidth={big ? 3 : 2}
                strokeDasharray={len}
                strokeDashoffset={len}
                className="hg-line"
              />
              <circle
                cx={e.x}
                cy={e.y}
                r={s.runs === 6 ? 8 : big ? 6 : 4}
                fill={shotColor(s.runs)}
                className="hg-dot"
              />
              {s.runs === 6 && (
                <circle cx={e.x} cy={e.y} r="18" fill="none" stroke={shotColor(6)} strokeOpacity="0.5" className="hg-dot" />
              )}
            </g>
          );
        })}
      </g>
      <circle cx={STRIKER.x} cy={STRIKER.y} r="7" fill="rgb(var(--fg))" />

      <style>{`
        .hg-line { animation: hg-draw 900ms var(--ease-out) forwards; animation-delay: calc(700ms + var(--i) * 110ms); }
        .hg-dot { opacity: 0; transform-box: fill-box; transform-origin: center; animation: hg-pop 400ms var(--ease-spring) forwards; animation-delay: calc(1400ms + var(--i) * 110ms); }
        @keyframes hg-draw { to { stroke-dashoffset: 0; } }
        @keyframes hg-pop { from { opacity: 0; transform: scale(0.2); } to { opacity: 1; transform: scale(1); } }
        @media (prefers-reduced-motion: reduce) {
          .hg-line { animation: none; stroke-dashoffset: 0; }
          .hg-dot { animation: none; opacity: 1; }
        }
      `}</style>
    </svg>
  );
}

export const WAGON_WHEEL_TOTALS = SHOTS.reduce(
  (t, s) => ({ runs: t.runs + s.runs, fours: t.fours + (s.runs === 4 ? 1 : 0), sixes: t.sixes + (s.runs === 6 ? 1 : 0) }),
  { runs: 0, fours: 0, sixes: 0 },
);
