"use client";

import { useState } from "react";
import { G } from "./theme";
import { initials } from "../helpers";

export function GlassTeamBadge({
  name,
  logoUrl,
  size,
  accent,
  glow,
}: {
  name: string;
  logoUrl: string | null;
  size: number;
  accent: string;
  glow: string;
}) {
  const [err, setErr] = useState(false);
  const show = logoUrl && !err;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: show ? "transparent" : `rgba(255,255,255,0.06)`,
        border: `1.5px solid ${show ? G.border : accent + "55"}`,
        boxShadow: `0 0 0 1px ${glow}, 0 4px 16px rgba(0,0,0,0.4)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {show ? (
        <img
          src={logoUrl!}
          alt={name}
          onError={() => setErr(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <span
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            fontSize: Math.round(size * 0.34),
            color: accent,
            letterSpacing: 1,
          }}
        >
          {initials(name)}
        </span>
      )}
    </div>
  );
}
