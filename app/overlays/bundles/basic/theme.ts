// ═══════════════════════════════════════════════════════════
// BASIC BUNDLE THEME — dark palette, gold/blue/purple accents
// ═══════════════════════════════════════════════════════════

export const C = {
  bg:        "rgba(6, 8, 16, 0.97)",
  border:    "rgba(255,255,255,0.08)",
  gold:      "#E2B94B",
  goldDim:   "rgba(226,185,75,0.35)",
  blue:      "#4A9EF5",
  blueDim:   "rgba(74,158,245,0.25)",
  purple:    "#A855F7",
  purpleDim: "rgba(168,85,247,0.25)",
  red:       "#F87171",
  white:     "#FFFFFF",
  w80:       "rgba(255,255,255,0.80)",
  w55:       "rgba(255,255,255,0.55)",
  w35:       "rgba(255,255,255,0.35)",
  w20:       "rgba(255,255,255,0.20)",
  w10:       "rgba(255,255,255,0.10)",
  w06:       "rgba(255,255,255,0.06)",
  w04:       "rgba(255,255,255,0.04)",
};

export function ballStyle(b: string): { bg: string; fg: string; ring: string } {
  if (b === "W")  return { bg: "#7F1D1D", fg: "#FCA5A5", ring: "#EF4444" };
  if (b === "6")  return { bg: "#4C1D95", fg: "#DDD6FE", ring: "#8B5CF6" };
  if (b === "4")  return { bg: "#1E3A5F", fg: "#93C5FD", ring: "#3B82F6" };
  if (b === "Wd" || b === "Nb")
    return { bg: "#78350F", fg: "#FDE68A", ring: "#F59E0B" };
  if (b === "0")
    return { bg: "rgba(255,255,255,0.05)", fg: "rgba(255,255,255,0.35)", ring: "rgba(255,255,255,0.12)" };
  return { bg: "#064E2E", fg: "#6EE7B7", ring: "#10B981" };
}
