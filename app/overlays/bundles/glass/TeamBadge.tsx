"use client";

import { useState } from "react";
import { B } from "./theme";
import { initials } from "../helpers";

// ═══════════════════════════════════════════════════════════
// BROADCAST TEAM BADGE
// Square badge with team color flood + team crest / initials.
// TV-standard: bold, flat, instantly readable.
// ═══════════════════════════════════════════════════════════

export function BroadcastTeamBadge({
  name,
  logoUrl,
  size,
  teamColor, // solid hex/var — the team's primary color
  textColor, // contrasting text for initials fallback
}: {
  name: string;
  logoUrl: string | null;
  size: number;
  teamColor: string;
  textColor?: string;
}) {
  const [err, setErr] = useState(false);
  const show = logoUrl && !err;
  const fg = textColor ?? "#FFFFFF";
  const radius = Math.round(size * 0.18);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: teamColor,
        border: `2px solid rgba(255,255,255,0.18)`,
        boxShadow: `0 4px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.22)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
        position: "relative",
      }}
    >
      {/* Subtle top sheen */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "45%",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 100%)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
      {show ? (
        <img
          src={logoUrl!}
          alt={name}
          onError={() => setErr(true)}
          style={{
            width: "88%",
            height: "88%",
            objectFit: "contain",
            zIndex: 1,
          }}
        />
      ) : (
        <span
          style={{
            fontFamily: "'Barlow Condensed', 'DM Sans', sans-serif",
            fontWeight: 900,
            fontSize: Math.round(size * 0.36),
            color: fg,
            letterSpacing: 1,
            textShadow: B.textShadow,
            zIndex: 1,
          }}
        >
          {initials(name)}
        </span>
      )}
    </div>
  );
}
