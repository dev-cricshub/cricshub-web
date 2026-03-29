// ═══════════════════════════════════════════════════════════
// GLASS BUNDLE THEME — True Holographic & Neon Glassmorphism
// Colors use CSS custom properties so users can customise via
// the stream dashboard → Theme Config panel.
// Fallback values match the original hardcoded defaults.
// ═══════════════════════════════════════════════════════════

export const G = {
  bg:               "var(--g-bg, rgba(15, 23, 42, 0.45))",
  bgDeep:           "var(--g-bgDeep, rgba(2, 6, 23, 0.65))",
  bgLight:          "var(--g-bgLight, rgba(255, 255, 255, 0.08))",
  bgDark:           "var(--g-bgDark, rgba(0, 0, 0, 0.55))",

  borderHighlight:  "var(--g-borderHighlight, rgba(255, 255, 255, 0.35))",
  borderShadow:     "var(--g-borderShadow, rgba(255, 255, 255, 0.05))",
  borderSub:        "var(--g-borderSub, rgba(255, 255, 255, 0.15))",

  backdropBlur:     "var(--g-backdropBlur, blur(24px))",
  panelShadow:      "var(--g-panelShadow, 0 16px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.25))",

  teal:             "var(--g-teal, #00F5D4)",
  tealDim:          "var(--g-tealDim, rgba(0, 245, 212, 0.15))",
  tealGlow:         "var(--g-tealGlow, 0 0 15px rgba(0, 245, 212, 0.4))",

  cyan:             "var(--g-cyan, #00E5FF)",
  cyanDim:          "var(--g-cyanDim, rgba(0, 229, 255, 0.15))",
  cyanGlow:         "var(--g-cyanGlow, 0 0 15px rgba(0, 229, 255, 0.4))",

  pink:             "var(--g-pink, #FF007F)",
  pinkDim:          "var(--g-pinkDim, rgba(255, 0, 127, 0.15))",
  pinkGlow:         "var(--g-pinkGlow, 0 0 15px rgba(255, 0, 127, 0.4))",

  coral:            "var(--g-coral, #FF3366)",
  coralDim:         "var(--g-coralDim, rgba(255, 51, 102, 0.15))",

  white:            "var(--g-white, #FFFFFF)",
  w90:              "var(--g-w90, rgba(255,255,255,0.92))",
  w70:              "var(--g-w70, rgba(255,255,255,0.75))",
  w45:              "var(--g-w45, rgba(255,255,255,0.55))",
  w25:              "var(--g-w25, rgba(255,255,255,0.35))",
  w12:              "var(--g-w12, rgba(255,255,255,0.15))",

  textGlow:         "var(--g-textGlow, 0 2px 4px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.9))",
};

export function glassBallStyle(b: string): { bg: string; fg: string; border: string; shadow: string } {
  if (b === "W")
    return { bg: "var(--g-ball-W-bg, rgba(255, 51, 102, 0.2))", fg: "var(--g-ball-W-fg, #FF3366)", border: "var(--g-ball-W-border, 1px solid rgba(255, 51, 102, 0.6))", shadow: "var(--g-ball-W-shadow, 0 0 12px rgba(255, 51, 102, 0.4))" };
  if (b === "6")
    return { bg: "var(--g-ball-6-bg, rgba(189, 0, 255, 0.2))", fg: "var(--g-ball-6-fg, #BD00FF)", border: "var(--g-ball-6-border, 1px solid rgba(189, 0, 255, 0.6))", shadow: "var(--g-ball-6-shadow, 0 0 12px rgba(189, 0, 255, 0.4))" };
  if (b === "4")
    return { bg: "var(--g-ball-4-bg, rgba(0, 229, 255, 0.2))", fg: "var(--g-ball-4-fg, #00E5FF)", border: "var(--g-ball-4-border, 1px solid rgba(0, 229, 255, 0.6))", shadow: "var(--g-ball-4-shadow, 0 0 12px rgba(0, 229, 255, 0.4))" };
  if (b === "Wd" || b === "Nb")
    return { bg: "var(--g-ball-Wd-bg, rgba(255, 204, 0, 0.2))", fg: "var(--g-ball-Wd-fg, #FFCC00)", border: "var(--g-ball-Wd-border, 1px solid rgba(255, 204, 0, 0.6))", shadow: "var(--g-ball-Wd-shadow, 0 0 12px rgba(255, 204, 0, 0.4))" };
  if (b === "0")
    return { bg: "var(--g-ball-0-bg, rgba(255,255,255,0.05))", fg: "var(--g-ball-0-fg, rgba(255,255,255,0.5))", border: "var(--g-ball-0-border, 1px solid rgba(255,255,255,0.2))", shadow: "var(--g-ball-0-shadow, none)" };
  return { bg: "var(--g-ball-run-bg, rgba(0, 245, 212, 0.15))", fg: "var(--g-ball-run-fg, #00F5D4)", border: "var(--g-ball-run-border, 1px solid rgba(0, 245, 212, 0.5))", shadow: "var(--g-ball-run-shadow, 0 0 10px rgba(0, 245, 212, 0.3))" };
}
