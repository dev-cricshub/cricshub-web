"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const ACCENT = "#5AA9F0";

export type FeatureKey = "stream" | "auction" | "account";

export function FeatureIcon({ name, size, color = ACCENT }: { name: FeatureKey; size: number; color?: string }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {name === "stream" && (
        <>
          <circle cx="12" cy="12" r="2" />
          <path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19 5a10 10 0 0 1 0 14M5 19A10 10 0 0 1 5 5" />
        </>
      )}
      {name === "auction" && (
        <>
          <path d="m14 13-7.5 7.5a2.1 2.1 0 0 1-3-3L11 10" />
          <path d="m16 16 6-6M8 8l6-6M9 7l8 8M21 11l-8-8" />
        </>
      )}
      {name === "account" && (
        <>
          <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
          <path d="M11 18h2" />
        </>
      )}
    </svg>
  );
}

const FEATS: { key: FeatureKey; label: string; color: string }[] = [
  { key: "stream", label: "Stream Studio", color: ACCENT },
  { key: "auction", label: "Auctions", color: "#FFD3B0" },
  { key: "account", label: "One account", color: "#C4B5FD" },
];

// Geometry (px, except rx which is % of width).
const H = 420;
const CY = 200;
const RX = 41;
const RY = 92;
const TILE = 84;
const CENTER = 156;
const CENTER_RADIUS = 44;

/**
 * Decorative: the three feature tiles orbit the CricsHub mark. Static under reduced motion.
 * Fills its parent's height: the scene is drawn at H px tall and scaled down to fit.
 */
export function FeatureOrbit() {
  const [t, setT] = useState(2.2);
  const [k, setK] = useState(1);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setK(Math.min(1, entry.contentRect.height / H)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let start: number | null = null;
    const step = (now: number) => {
      if (start === null) start = now - 2200;
      setT((now - start) / 1000);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const x = (pct: number) => `${(50 + pct).toFixed(3)}%`;

  const tiles = FEATS.map((f, i) => {
    const a = t * 0.28 + (i * Math.PI * 2) / 3;
    const s = Math.sin(a);
    const d = (s + 1) / 2;
    return { ...f, left: x(RX * Math.cos(a)), top: CY + RY * s - 6, scale: 0.66 + 0.4 * d, op: 0.5 + 0.5 * d, blur: (1 - d) * 1.6, halo: Math.round(10 + 30 * d), z: s > 0 ? 8 : 3 };
  });

  const comet = Array.from({ length: 6 }, (_, k) => {
    const a = t * 0.9 - k * 0.07 + 1.3;
    const s = Math.sin(a);
    const color = k === 0 ? "#FFFFFF" : ACCENT;
    return { left: x(RX * Math.cos(a)), top: CY + RY * s, size: Math.max(2, 9 - k * 1.3), op: (1 - k / 6) * (0.45 + 0.55 * (s + 1) / 2), glow: k === 0 ? 14 : 0, color, z: s > 0 ? 7 : 3 };
  });

  const dust = Array.from({ length: 12 }, (_, j) => {
    const a = -t * 0.18 + (j * Math.PI * 2) / 12;
    const s = Math.sin(a);
    return { left: x(RX * 0.62 * Math.cos(a)), top: CY + RY * 0.62 * s + Math.sin(t * 1.3 + j) * 3, size: j % 3 === 0 ? 4 : 2.5, op: 0.2 + (0.55 * (s + 1)) / 2, z: s > 0 ? 6 : 2 };
  });

  const rings = [0, 0.5].map((off) => {
    const p = (t / 3.2 + off) % 1;
    return { size: Math.round(CENTER + p * 150), radius: Math.round(CENTER_RADIUS + p * 75), op: (1 - p) * 0.4 };
  });

  const center = "translate(-50%, -50%)";

  return (
    <div ref={boxRef} aria-hidden className="relative h-full w-full">
      <div
        className="absolute left-1/2 top-1/2 text-white"
        style={{ width: `${100 / k}%`, height: H, transform: `translate(-50%, -50%) scale(${k})` }}
      >
        {/* core glow */}
        <div
          className="absolute left-1/2 z-0 rounded-full"
          style={{ top: CY, width: 240, height: 240, transform: center, background: ACCENT, opacity: 0.45 + 0.2 * Math.sin(t * 1.1), filter: "blur(70px)" }}
        />

        {/* orbit paths */}
        <svg width="100%" height={H} className="absolute left-0 top-0 z-[1] overflow-visible">
          <ellipse cx="50%" cy={CY} rx={`${RX}%`} ry={RY} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" strokeDasharray="3 9" strokeDashoffset={-t * 14} />
          <ellipse cx="50%" cy={CY} rx={`${(RX * 0.62).toFixed(2)}%`} ry={RY * 0.62} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
        </svg>

        {dust.map((d, i) => (
          <div key={`d${i}`} className="absolute rounded-full bg-white" style={{ left: d.left, top: d.top, width: d.size, height: d.size, transform: center, opacity: d.op, zIndex: d.z }} />
        ))}

        {comet.map((c, i) => (
          <div
            key={`c${i}`}
            className="absolute rounded-full"
            style={{ left: c.left, top: c.top, width: c.size, height: c.size, transform: center, background: c.color, opacity: c.op, boxShadow: `0 0 ${c.glow}px ${c.color}`, zIndex: c.z }}
          />
        ))}

        {rings.map((r, i) => (
          <div
            key={`r${i}`}
            className="absolute left-1/2 z-[2] border border-white/60"
            style={{ top: CY, width: r.size, height: r.size, borderRadius: r.radius, transform: center, opacity: r.op }}
          />
        ))}

        {/* centre tile */}
        <div
          className="absolute left-1/2 z-[5] flex items-center justify-center border border-white/[0.42]"
          style={{
            top: CY,
            width: CENTER,
            height: CENTER,
            borderRadius: CENTER_RADIUS,
            transform: `${center} scale(${1 + 0.025 * Math.sin(t * 1.6)})`,
            background: "linear-gradient(145deg, rgba(255,255,255,0.32), rgba(255,255,255,0.06) 55%, rgba(255,255,255,0.16))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -12px 30px rgba(0,0,0,0.2), 0 30px 60px -20px rgba(0,0,0,0.75)",
            backdropFilter: "blur(20px) saturate(170%)",
            WebkitBackdropFilter: "blur(20px) saturate(170%)",
          }}
        >
          <Image src="/images/iconLogoTransparent.png" alt="" width={84} height={75} priority />
        </div>

        {/* orbiting feature tiles */}
        {tiles.map((f) => (
          <div
            key={f.key}
            className="absolute flex flex-col items-center gap-2.5"
            style={{ left: f.left, top: f.top, transform: `${center} scale(${f.scale})`, zIndex: f.z, opacity: f.op, filter: `blur(${f.blur}px)` }}
          >
            <div
              className="flex items-center justify-center border border-white/[0.38]"
              style={{
                width: TILE,
                height: TILE,
                borderRadius: 24,
                background: "linear-gradient(150deg, rgba(255,255,255,0.26), rgba(255,255,255,0.07) 60%, rgba(255,255,255,0.14))",
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 20px 40px -14px rgba(0,0,0,0.65), 0 0 ${f.halo}px -6px ${f.color}`,
                backdropFilter: "blur(16px) saturate(160%)",
                WebkitBackdropFilter: "blur(16px) saturate(160%)",
              }}
            >
              <FeatureIcon name={f.key} size={34} color={f.color} />
            </div>
            <span className="ch-glass whitespace-nowrap rounded-full border-white/[0.22] bg-white/10 px-[11px] py-[5px] text-xs font-semibold tracking-[0.02em]">
              {f.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
