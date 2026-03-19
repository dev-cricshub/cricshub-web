"use client";

import { useState } from "react";
import { C } from "./theme";
import { initials } from "../helpers";

export function TeamBadge({
  name,
  logoUrl,
  size,
  accent,
  accentBg,
}: {
  name: string;
  logoUrl: string | null;
  size: number;
  accent: string;
  accentBg: string;
}) {
  const [err, setErr] = useState(false);
  const show = logoUrl && !err;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.16),
        background: show ? "transparent" : accentBg,
        border: `1px solid ${show ? C.border : accent + "44"}`,
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
