// ═══════════════════════════════════════════════════════════
// BASIC BUNDLE THEME — dark palette, gold/blue/purple accents
// Colors use CSS custom properties so users can customise via
// the stream dashboard → Theme Config panel.
// Fallback values match the original hardcoded defaults.
// ═══════════════════════════════════════════════════════════

export const C = {
  bg:        "var(--b-bg, rgba(6, 8, 16, 0.97))",
  border:    "var(--b-border, rgba(255,255,255,0.08))",
  gold:      "var(--b-gold, #E2B94B)",
  goldDim:   "var(--b-goldDim, rgba(226,185,75,0.35))",
  blue:      "var(--b-blue, #4A9EF5)",
  blueDim:   "var(--b-blueDim, rgba(74,158,245,0.25))",
  purple:    "var(--b-purple, #A855F7)",
  purpleDim: "var(--b-purpleDim, rgba(168,85,247,0.25))",
  red:       "var(--b-red, #F87171)",
  white:     "var(--b-white, #FFFFFF)",
  w80:       "var(--b-w80, rgba(255,255,255,0.80))",
  w55:       "var(--b-w55, rgba(255,255,255,0.55))",
  w35:       "var(--b-w35, rgba(255,255,255,0.35))",
  w20:       "var(--b-w20, rgba(255,255,255,0.20))",
  w10:       "var(--b-w10, rgba(255,255,255,0.10))",
  w06:       "var(--b-w06, rgba(255,255,255,0.06))",
  w04:       "var(--b-w04, rgba(255,255,255,0.04))",
};

export function ballStyle(b: string): { bg: string; fg: string; ring: string } {
  if (b === "W")
    return { bg: "var(--b-ball-W-bg, #7F1D1D)", fg: "var(--b-ball-W-fg, #FCA5A5)", ring: "var(--b-ball-W-ring, #EF4444)" };
  if (b === "6")
    return { bg: "var(--b-ball-6-bg, #4C1D95)", fg: "var(--b-ball-6-fg, #DDD6FE)", ring: "var(--b-ball-6-ring, #8B5CF6)" };
  if (b === "4")
    return { bg: "var(--b-ball-4-bg, #1E3A5F)", fg: "var(--b-ball-4-fg, #93C5FD)", ring: "var(--b-ball-4-ring, #3B82F6)" };
  if (b === "Wd" || b === "Nb")
    return { bg: "var(--b-ball-Wd-bg, #78350F)", fg: "var(--b-ball-Wd-fg, #FDE68A)", ring: "var(--b-ball-Wd-ring, #F59E0B)" };
  if (b === "0")
    return { bg: "var(--b-ball-0-bg, rgba(255,255,255,0.05))", fg: "var(--b-ball-0-fg, rgba(255,255,255,0.35))", ring: "var(--b-ball-0-ring, rgba(255,255,255,0.12))" };
  return { bg: "var(--b-ball-run-bg, #064E2E)", fg: "var(--b-ball-run-fg, #6EE7B7)", ring: "var(--b-ball-run-ring, #10B981)" };
}
