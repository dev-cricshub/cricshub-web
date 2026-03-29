// ═══════════════════════════════════════════════════════════
// AERO BUNDLE THEME — Premium, elegant light mode design
// Colors use CSS custom properties so users can customise via
// the stream dashboard → Theme Config panel.
// Fallback values match the original hardcoded defaults.
// ═══════════════════════════════════════════════════════════

export const A = {
  bg:          "var(--a-bg, #FFFFFF)",
  bgDeep:      "var(--a-bgDeep, #F3F4F6)",
  bgLight:     "var(--a-bgLight, #FAFAFA)",
  bgDark:      "var(--a-bgDark, #E5E7EB)",

  border:      "var(--a-border, #E5E7EB)",
  borderSub:   "var(--a-borderSub, #F3F4F6)",

  teal:        "var(--a-teal, #0D9488)",
  tealDim:     "var(--a-tealDim, #CCFBF1)",
  tealGlow:    "var(--a-tealGlow, none)",

  cyan:        "var(--a-cyan, #0284C7)",
  cyanDim:     "var(--a-cyanDim, #E0F2FE)",
  cyanGlow:    "var(--a-cyanGlow, none)",

  pink:        "var(--a-pink, #E11D48)",
  pinkDim:     "var(--a-pinkDim, #FFE4E6)",
  pinkGlow:    "var(--a-pinkGlow, none)",

  coral:       "var(--a-coral, #EF4444)",
  coralDim:    "var(--a-coralDim, #FEE2E2)",

  textMain:    "var(--a-textMain, #111827)",
  t90:         "var(--a-t90, #1F2937)",
  t70:         "var(--a-t70, #4B5563)",
  t45:         "var(--a-t45, #6B7280)",
  t25:         "var(--a-t25, #9CA3AF)",
  t12:         "var(--a-t12, #D1D5DB)",
  t06:         "var(--a-t06, #E5E7EB)",

  textShadow:  "var(--a-textShadow, none)",
  panelShadow: "var(--a-panelShadow, 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01))",
};

export function aeroBallStyle(b: string): { bg: string; fg: string; border: string; shadow: string } {
  if (b === "W")
    return { bg: "var(--a-ball-W-bg, #EF4444)", fg: "var(--a-ball-W-fg, #FFFFFF)", border: "var(--a-ball-W-border, none)", shadow: "var(--a-ball-W-shadow, 0 2px 6px rgba(239,68,68,0.25))" };
  if (b === "6")
    return { bg: "var(--a-ball-6-bg, #8B5CF6)", fg: "var(--a-ball-6-fg, #FFFFFF)", border: "var(--a-ball-6-border, none)", shadow: "var(--a-ball-6-shadow, 0 2px 6px rgba(139,92,246,0.25))" };
  if (b === "4")
    return { bg: "var(--a-ball-4-bg, #0EA5E9)", fg: "var(--a-ball-4-fg, #FFFFFF)", border: "var(--a-ball-4-border, none)", shadow: "var(--a-ball-4-shadow, 0 2px 6px rgba(14,165,233,0.25))" };
  if (b === "Wd" || b === "Nb")
    return { bg: "var(--a-ball-Wd-bg, #F59E0B)", fg: "var(--a-ball-Wd-fg, #FFFFFF)", border: "var(--a-ball-Wd-border, none)", shadow: "var(--a-ball-Wd-shadow, 0 2px 6px rgba(245,158,11,0.25))" };
  if (b === "0")
    return { bg: "var(--a-ball-0-bg, #FFFFFF)", fg: "var(--a-ball-0-fg, #9CA3AF)", border: "var(--a-ball-0-border, 1px solid #E5E7EB)", shadow: "var(--a-ball-0-shadow, none)" };
  return { bg: "var(--a-ball-run-bg, #F3F4F6)", fg: "var(--a-ball-run-fg, #374151)", border: "var(--a-ball-run-border, 1px solid #E5E7EB)", shadow: "var(--a-ball-run-shadow, none)" };
}
