"use client";

import { useState } from "react";
import { M } from "./theme";
import { initials } from "../helpers";

export function MaterialTeamBadge({
  name,
  logoUrl,
  size,
  accent,
}: {
  name: string;
  logoUrl: string | null;
  size: number;
  accent: string;
  // Note: 'glow' has been completely removed
}) {
  const [err, setErr] = useState(false);
  const show = logoUrl && !err;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: show ? M.bg : M.bgDeep, // Solid flat background
        border: `2px solid ${accent}`, // Crisp, solid team-color ring instead of a glow
        boxShadow: "0 2px 6px rgba(0,0,0,0.5)", // Standard broadcast drop shadow
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
          // Using contain or cover based on your original, but now bounded by a solid ring
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <span
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            fontSize: Math.round(size * 0.34),
            color: accent, // Solid accent color for fallback initials
            letterSpacing: 1,
          }}
        >
          {initials(name)}
        </span>
      )}
    </div>
  );
}
