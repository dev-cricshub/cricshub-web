"use client";

import { useState } from "react";
import { A } from "./theme";
import { initials } from "../helpers";

export function AeroTeamBadge({
  name,
  logoUrl,
  size,
  accent,
}: {
  name: string;
  logoUrl: string | null;
  size: number;
  accent: string;
}) {
  const [err, setErr] = useState(false);
  const show = logoUrl && !err;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: A.bg, // Clean, pure white background token
        // If there's an image, use a barely-there structural border.
        // If it's initials, use a very soft, semi-transparent tint of the team's accent color.
        border: show ? `1px solid ${A.border}` : `1.5px solid ${accent}40`,
        boxShadow: "0 8px 24px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.03)", // Soft, diffused premium drop shadow
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
            fontWeight: 800, // Dialed back slightly from 900 for a cleaner, modern look
            fontSize: Math.round(size * 0.36),
            color: accent, // Team accent color pops beautifully on the white background
            letterSpacing: 1,
          }}
        >
          {initials(name)}
        </span>
      )}
    </div>
  );
}
