// ═══════════════════════════════════════════════════════════
// MATERIAL BUNDLE THEME — Solid, flat broadcast design
// Opaque panels, strong color blocking, subtle drop shadows
// ═══════════════════════════════════════════════════════════

export const M = {
  // Panel backgrounds — Fully solid for zero background bleed
  bg:        "#111827",      // Main card/bar panel (Solid deep gray/blue)
  bgDeep:    "#030712",      // Deepest sections (Near black for heavy contrast)
  bgLight:   "#1F2937",      // Alternating row tint (Slightly lighter gray)
  bgDark:    "#0F172A",      // Header/footer strips

  // Borders — Crisp, solid dividing lines instead of glowing edges
  border:    "#374151",      // Visible flat separator
  borderSub: "#1F2937",      // Subtle inner separator

  // Primary accent — Material Teal (Solid)
  teal:      "#009688",
  tealDim:   "#004D40",      // Darker solid shade for active states
  tealGlow:  "none",         // Removed glow for Material theme

  // Team 1 — Material Cyan (Solid)
  cyan:      "#00BCD4",
  cyanDim:   "#006064",
  cyanGlow:  "none",

  // Team 2 — Material Pink (Solid)
  pink:      "#E91E63",
  pinkDim:   "#880E4F",
  pinkGlow:  "none",

  // Alert / Wicket — Material Red (Solid)
  coral:     "#DC2626",
  coralDim:  "#7F1D1D",

  // Text — Pure solid grays for absolute contrast
  white:     "#FFFFFF",
  w90:       "#F3F4F6",      // Primary text
  w70:       "#D1D5DB",      // Secondary text
  w45:       "#9CA3AF",      // Muted labels
  w25:       "#6B7280",      // Disabled / highly muted
  w12:       "#4B5563",
  w06:       "#374151",

  // Shadows — Broadcast-style drop shadows for depth, not glowing text
  textGlow:  "0 1px 2px rgba(0,0,0,0.8)", 
  panelShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.24)",
};

export function materialBallStyle(b: string): { bg: string; fg: string; border: string; shadow: string } {
  // Material balls use bold solid backgrounds and stark white text with no glowing borders
  if (b === "W")
    return { bg: "#DC2626", fg: "#FFFFFF", border: "1px solid #991B1B", shadow: "0 2px 4px rgba(0,0,0,0.3)" };
  if (b === "6")
    return { bg: "#6D28D9", fg: "#FFFFFF", border: "1px solid #4C1D95", shadow: "0 2px 4px rgba(0,0,0,0.3)" };
  if (b === "4")
    return { bg: "#0284C7", fg: "#FFFFFF", border: "1px solid #075985", shadow: "0 2px 4px rgba(0,0,0,0.3)" };
  if (b === "Wd" || b === "Nb")
    return { bg: "#D97706", fg: "#FFFFFF", border: "1px solid #92400E", shadow: "0 2px 4px rgba(0,0,0,0.3)" };
  if (b === "0")
    return { bg: "#374151", fg: "#D1D5DB", border: "1px solid #1F2937", shadow: "inset 0 1px 2px rgba(0,0,0,0.2)" };
  
  // Standard runs (1, 2, 3)
  return { bg: "#059669", fg: "#FFFFFF", border: "1px solid #065F46", shadow: "0 2px 4px rgba(0,0,0,0.3)" };
}