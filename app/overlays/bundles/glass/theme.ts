// ═══════════════════════════════════════════════════════════
// GLASS BUNDLE THEME — dark glassmorphism, teal/cyan/pink accents
// Opacities tuned for outdoor field backgrounds in OBS
// ═══════════════════════════════════════════════════════════

export const G = {
  // Panel backgrounds — near-opaque dark panels for outdoor legibility
  bg:        "rgba(8,12,28,0.94)",   // main card/bar panel (was 0.72)
  bgDeep:    "rgba(4,6,16,0.97)",    // deepest sections (was 0.85)
  bgLight:   "rgba(255,255,255,0.05)", // alternating row tint
  bgDark:    "rgba(0,0,0,0.60)",     // header/footer strips (was 0.35)

  // Borders — slightly more visible against field glow
  border:    "rgba(255,255,255,0.20)", // was 0.14
  borderSub: "rgba(255,255,255,0.10)", // was 0.07

  // Primary accent — teal
  teal:      "#00D4AA",
  tealDim:   "rgba(0,212,170,0.18)",
  tealGlow:  "rgba(0,212,170,0.35)",

  // Team 1 — cyan
  cyan:      "#22D3EE",
  cyanDim:   "rgba(34,211,238,0.15)",
  cyanGlow:  "rgba(34,211,238,0.3)",

  // Team 2 — pink
  pink:      "#F472B6",
  pinkDim:   "rgba(244,114,182,0.15)",
  pinkGlow:  "rgba(244,114,182,0.3)",

  // Alert / wicket
  coral:     "#FB7185",
  coralDim:  "rgba(251,113,133,0.15)",

  // Text — brighter dim tokens for legibility through potential background bleed
  white:     "#FFFFFF",
  w90:       "rgba(255,255,255,0.92)",
  w70:       "rgba(255,255,255,0.72)",
  w45:       "rgba(255,255,255,0.55)", // raised from 0.45 — labels readable on field
  w25:       "rgba(255,255,255,0.32)", // raised from 0.25
  w12:       "rgba(255,255,255,0.14)",
  w06:       "rgba(255,255,255,0.07)",

  // Text shadows — add depth against bright backgrounds
  textGlow:  "0 1px 10px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,1)",
};

export function glassBallStyle(b: string): { bg: string; fg: string; border: string; shadow: string } {
  if (b === "W")
    return { bg: "rgba(251,113,133,0.22)", fg: "#FB7185", border: "rgba(251,113,133,0.55)", shadow: "0 0 10px rgba(251,113,133,0.35)" };
  if (b === "6")
    return { bg: "rgba(167,139,250,0.22)", fg: "#A78BFA", border: "rgba(167,139,250,0.55)", shadow: "0 0 10px rgba(167,139,250,0.35)" };
  if (b === "4")
    return { bg: "rgba(34,211,238,0.22)", fg: "#22D3EE", border: "rgba(34,211,238,0.55)", shadow: "0 0 10px rgba(34,211,238,0.35)" };
  if (b === "Wd" || b === "Nb")
    return { bg: "rgba(251,191,36,0.18)", fg: "#FCD34D", border: "rgba(251,191,36,0.5)", shadow: "0 0 8px rgba(251,191,36,0.25)" };
  if (b === "0")
    return { bg: "rgba(255,255,255,0.06)", fg: "rgba(255,255,255,0.38)", border: "rgba(255,255,255,0.14)", shadow: "none" };
  return { bg: "rgba(0,212,170,0.18)", fg: "#00D4AA", border: "rgba(0,212,170,0.5)", shadow: "0 0 10px rgba(0,212,170,0.3)" };
}
