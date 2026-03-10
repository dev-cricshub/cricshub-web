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
  // glow is now a full box-shadow string from our theme (e.g., G.cyanGlow)
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
        // Base tint — very transparent so the blur does the heavy lifting
        background: "rgba(10, 15, 30, 0.3)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        // Subtle structural outline
        border: `1px solid ${G.borderSub}`,
        // The magic: Combines the neon glow prop + deep drop shadow + 3D inset rim lighting
        boxShadow: `${glow}, 0 8px 16px rgba(0,0,0,0.6), inset 1px 1px 2px rgba(255,255,255,0.3), inset -1px -1px 2px rgba(0,0,0,0.5)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
        position: "relative", // Required to contain the glare layer
      }}
    >
      {/* The Glare Layer: Creates a diagonal light reflection sweeping across the glass 
        It sits above the background but won't block clicks due to pointerEvents: "none"
      */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 35%, rgba(255,255,255,0) 50%)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {show ? (
        <img
          src={logoUrl!}
          alt={name}
          onError={() => setErr(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 1,
          }}
        />
      ) : (
        <span
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            fontSize: Math.round(size * 0.38),
            color: accent,
            letterSpacing: 1,
            // Makes the initials look like a glowing LED inside the glass
            textShadow: `0 0 10px ${accent}, 0 0 20px ${accent}`,
            zIndex: 1,
          }}
        >
          {initials(name)}
        </span>
      )}
    </div>
  );
}
