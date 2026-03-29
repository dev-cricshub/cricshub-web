// ═══════════════════════════════════════════════════════════
// MATERIAL BUNDLE THEME — Solid, flat broadcast design
// Colors use CSS custom properties so users can customise via
// the stream dashboard → Theme Config panel.
// Fallback values match the original hardcoded defaults.
// ═══════════════════════════════════════════════════════════

export const M = {
  bg:          "var(--m-bg, #111827)",
  bgDeep:      "var(--m-bgDeep, #030712)",
  bgLight:     "var(--m-bgLight, #1F2937)",
  bgDark:      "var(--m-bgDark, #0F172A)",

  border:      "var(--m-border, #374151)",
  borderSub:   "var(--m-borderSub, #1F2937)",

  teal:        "var(--m-teal, #009688)",
  tealDim:     "var(--m-tealDim, #004D40)",
  tealGlow:    "var(--m-tealGlow, none)",

  cyan:        "var(--m-cyan, #00BCD4)",
  cyanDim:     "var(--m-cyanDim, #006064)",
  cyanGlow:    "var(--m-cyanGlow, none)",

  pink:        "var(--m-pink, #E91E63)",
  pinkDim:     "var(--m-pinkDim, #880E4F)",
  pinkGlow:    "var(--m-pinkGlow, none)",

  coral:       "var(--m-coral, #DC2626)",
  coralDim:    "var(--m-coralDim, #7F1D1D)",

  white:       "var(--m-white, #FFFFFF)",
  w90:         "var(--m-w90, #F3F4F6)",
  w70:         "var(--m-w70, #D1D5DB)",
  w45:         "var(--m-w45, #9CA3AF)",
  w25:         "var(--m-w25, #6B7280)",
  w12:         "var(--m-w12, #4B5563)",
  w06:         "var(--m-w06, #374151)",

  textGlow:    "var(--m-textGlow, 0 1px 2px rgba(0,0,0,0.8))",
  panelShadow: "var(--m-panelShadow, 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.24))",
};

export function materialBallStyle(b: string): { bg: string; fg: string; border: string; shadow: string } {
  if (b === "W")
    return { bg: "var(--m-ball-W-bg, #DC2626)", fg: "var(--m-ball-W-fg, #FFFFFF)", border: "var(--m-ball-W-border, 1px solid #991B1B)", shadow: "var(--m-ball-W-shadow, 0 2px 4px rgba(0,0,0,0.3))" };
  if (b === "6")
    return { bg: "var(--m-ball-6-bg, #6D28D9)", fg: "var(--m-ball-6-fg, #FFFFFF)", border: "var(--m-ball-6-border, 1px solid #4C1D95)", shadow: "var(--m-ball-6-shadow, 0 2px 4px rgba(0,0,0,0.3))" };
  if (b === "4")
    return { bg: "var(--m-ball-4-bg, #0284C7)", fg: "var(--m-ball-4-fg, #FFFFFF)", border: "var(--m-ball-4-border, 1px solid #075985)", shadow: "var(--m-ball-4-shadow, 0 2px 4px rgba(0,0,0,0.3))" };
  if (b === "Wd" || b === "Nb")
    return { bg: "var(--m-ball-Wd-bg, #D97706)", fg: "var(--m-ball-Wd-fg, #FFFFFF)", border: "var(--m-ball-Wd-border, 1px solid #92400E)", shadow: "var(--m-ball-Wd-shadow, 0 2px 4px rgba(0,0,0,0.3))" };
  if (b === "0")
    return { bg: "var(--m-ball-0-bg, #374151)", fg: "var(--m-ball-0-fg, #D1D5DB)", border: "var(--m-ball-0-border, 1px solid #1F2937)", shadow: "var(--m-ball-0-shadow, inset 0 1px 2px rgba(0,0,0,0.2))" };
  return { bg: "var(--m-ball-run-bg, #059669)", fg: "var(--m-ball-run-fg, #FFFFFF)", border: "var(--m-ball-run-border, 1px solid #065F46)", shadow: "var(--m-ball-run-shadow, 0 2px 4px rgba(0,0,0,0.3))" };
}
