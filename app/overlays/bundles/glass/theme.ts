// ═══════════════════════════════════════════════════════════
// BROADCAST BUNDLE THEME — Professional TV Graphics
// Clean, readable, cohesive color system
// Inspired by Star Sports / Sky Sports / ESPN
// ═══════════════════════════════════════════════════════════

const B = {
  // ── Panel surfaces — Rich dark with subtle warmth ────────
  panelBg:       "var(--g-bg, #0B1120)",
  panelBgDeep:   "var(--g-bgDeep, #070C18)",
  panelBgMid:    "var(--g-bgLight, #151E32)",
  headerBg:      "var(--g-bgDark, #080D1A)",
  
  // Standard names (aliases)
  bg:          "var(--g-bg, #0B1120)",
  bgDeep:      "var(--g-bgDeep, #070C18)",
  bgLight:     "var(--g-bgLight, #151E32)",
  bgDark:      "var(--g-bgDark, #080D1A)",

  // ── Borders — Subtle definition ───────────────────────────
  borderHighlight: "var(--g-borderHighlight, #1E2A44)",
  borderShadow:    "var(--g-borderShadow, #0F1626)",
  borderSub:       "var(--g-borderSub, #151E32)",

  // ── Team 1 colors — Vibrant but readable ──────────────────
  // Use saturation/brightness adjustments, not just darken
  t1:         "var(--g-cyan, #00D4FF)",
  t1Dim:      "var(--g-cyanDim, #005A6E)",
  t1Mid:      "var(--g-cyanMid, #008FB3)",
  t1Glow:     "none",
  t1Border:   "var(--g-cyanBorder, #00A8CC)",

  // ── Team 2 colors — Vibrant but readable ──────────────────
  t2:         "var(--g-pink, #FF2D95)",
  t2Dim:      "var(--g-pinkDim, #8F1452)",
  t2Mid:      "var(--g-pinkMid, #C91F7A)",
  t2Glow:     "none",
  t2Border:   "var(--g-pinkBorder, #E62581)",

  // ── Accent colors — Teal for highlights ───────────────────
  accent:     "var(--g-teal, #14F195)",
  accentDim:  "var(--g-tealDim, #0A7A4C)",
  accentGlow: "none",

  // ── Alert colors — Clear red for wickets ──────────────────
  alert:      "var(--g-coral, #FF4757)",
  alertDim:   "var(--g-coralDim, #8F232F)",

  // ── Text — Crisp white hierarchy ──────────────────────────
  white:      "var(--g-white, #FFFFFF)",
  w90:        "var(--g-w90, #E8ECF1)",
  w70:        "var(--g-w70, #B0B8C4)",
  w50:        "var(--g-w50, #7D8796)",
  w45:        "var(--g-w45, #6B7685)",
  w30:        "var(--g-w30, #4A5260)",
  w25:        "var(--g-w25, #3D4452)",
  w12:        "var(--g-w12, #252933)",
  textGlow:   "none",

  // ── Structural lines — Subtle separation ──────────────────
  lineHard:   "var(--g-lineHard, #1E2A44)",
  lineSoft:   "var(--g-lineSoft, #151E32)",
  lineDim:    "var(--g-lineDim, #0F1626)",

  // ── Ball outcome colors — Clear, distinct, readable ───────
  ballWicket: "var(--g-ball-W-fg, #FF4757)",
  ballSix:    "var(--g-ball-6-fg, #A66CFF)",
  ballFour:   "var(--g-ball-4-fg, #00D4FF)",
  ballWide:   "var(--g-ball-Wd-fg, #FFB800)",
  ballDot:    "var(--g-white, #7D8796)",
  ballRun:    "var(--g-teal, #14F195)",

  // ── Utility ───────────────────────────────────────────────
  live:       "#FF4757",
  gold:       "var(--g-teal, #FFB800)",
  shadow:     "0 4px 16px rgba(0,0,0,0.4)",
  textShadow: "none",
  backdropBlur: "none",
};

// ── Ball style helper — Clean solid blocks ──────────────────
export function broadcastBallStyle(b: string): {
  bg: string; fg: string; border: string;
} {
  if (b === "W")
    return {
      bg:     "var(--g-ball-W-bg, #FF4757)",
      fg:     "var(--g-ball-W-fg, #FFFFFF)",
      border: "var(--g-ball-W-border, 1px solid #CC3744)",
    };
  if (b === "6")
    return {
      bg:     "var(--g-ball-6-bg, #A66CFF)",
      fg:     "var(--g-ball-6-fg, #FFFFFF)",
      border: "var(--g-ball-6-border, 1px solid #8554CC)",
    };
  if (b === "4")
    return {
      bg:     "var(--g-ball-4-bg, #00D4FF)",
      fg:     "var(--g-ball-4-fg, #0B1120)",
      border: "var(--g-ball-4-border, 1px solid #00A8CC)",
    };
  if (b === "Wd" || b === "Nb")
    return {
      bg:     "var(--g-ball-Wd-bg, #FFB800)",
      fg:     "var(--g-ball-Wd-fg, #0B1120)",
      border: "var(--g-ball-Wd-border, 1px solid #CC9300)",
    };
  if (b === "0")
    return {
      bg:     "var(--g-ball-0-bg, #1E2A44)",
      fg:     "var(--g-ball-0-fg, #7D8796)",
      border: "var(--g-ball-0-border, 1px solid #151E32)",
    };
  // runs 1-3 etc.
  return {
    bg:     "var(--g-ball-run-bg, #14F195)",
    fg:     "var(--g-ball-run-fg, #0B1120)",
    border: "var(--g-ball-run-border, 1px solid #0FC97A)",
  };
}

// Alias for glassBallStyle imports
export { broadcastBallStyle as glassBallStyle };

// Export as both B and G for compatibility
export { B as G, B };
