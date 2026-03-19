// ═══════════════════════════════════════════════════════════
// GLASS BUNDLE THEME — True Holographic & Neon Glassmorphism
// Heavy blur, edge-lighting, and vibrant glowing data points
// ═══════════════════════════════════════════════════════════

export const G = {
  // Core Glass Backgrounds — Lower opacities, relying on blur for legibility
  bg:        "rgba(15, 23, 42, 0.45)",    // Main floating panel
  bgDeep:    "rgba(2, 6, 23, 0.65)",      // Deep structural anchors (for high contrast areas)
  bgLight:   "rgba(255, 255, 255, 0.08)", // Inner frosted highlights (alternating rows)
  bgDark:    "rgba(0, 0, 0, 0.55)",       // High-contrast footers

  // Edge Lighting (Creates the 3D Holographic Bevel)
  borderHighlight: "rgba(255, 255, 255, 0.35)", // Top/Left light reflection
  borderShadow:    "rgba(255, 255, 255, 0.05)", // Bottom/Right shadow edge
  borderSub:       "rgba(255, 255, 255, 0.15)", // Internal dividers

  // Glass Optical Effects
  backdropBlur: "blur(24px)", // Heavy blur to melt the camera video behind it
  panelShadow:  "0 16px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.25)", // Drop shadow + Top rim light

  // Accents — Shifted to pure Neon Hex codes for maximum pop
  teal:      "#00F5D4",
  tealDim:   "rgba(0, 245, 212, 0.15)",
  tealGlow:  "0 0 15px rgba(0, 245, 212, 0.4)",

  cyan:      "#00E5FF",
  cyanDim:   "rgba(0, 229, 255, 0.15)",
  cyanGlow:  "0 0 15px rgba(0, 229, 255, 0.4)",

  pink:      "#FF007F",
  pinkDim:   "rgba(255, 0, 127, 0.15)",
  pinkGlow:  "0 0 15px rgba(255, 0, 127, 0.4)",

  coral:     "#FF3366",
  coralDim:  "rgba(255, 51, 102, 0.15)",

  // Text — Opacities tuned to glow against the dark glass
  white:     "#FFFFFF",
  w90:       "rgba(255,255,255,0.92)",
  w70:       "rgba(255,255,255,0.75)",
  w45:       "rgba(255,255,255,0.55)", 
  w25:       "rgba(255,255,255,0.35)", 
  w12:       "rgba(255,255,255,0.15)",

  // Critical Text Shadow: Ensures readability even if the camera points at the sky
  textGlow:  "0 2px 4px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.9)", 
};

export function glassBallStyle(b: string): { bg: string; fg: string; border: string; shadow: string } {
  // LED / Neon styled ball markers that look like physical glowing diodes
  if (b === "W")
    return { bg: "rgba(255, 51, 102, 0.2)", fg: "#FF3366", border: "1px solid rgba(255, 51, 102, 0.6)", shadow: "0 0 12px rgba(255, 51, 102, 0.4)" };
  if (b === "6")
    return { bg: "rgba(189, 0, 255, 0.2)", fg: "#BD00FF", border: "1px solid rgba(189, 0, 255, 0.6)", shadow: "0 0 12px rgba(189, 0, 255, 0.4)" };
  if (b === "4")
    return { bg: "rgba(0, 229, 255, 0.2)", fg: "#00E5FF", border: "1px solid rgba(0, 229, 255, 0.6)", shadow: "0 0 12px rgba(0, 229, 255, 0.4)" };
  if (b === "Wd" || b === "Nb")
    return { bg: "rgba(255, 204, 0, 0.2)", fg: "#FFCC00", border: "1px solid rgba(255, 204, 0, 0.6)", shadow: "0 0 12px rgba(255, 204, 0, 0.4)" };
  if (b === "0")
    return { bg: "rgba(255,255,255,0.05)", fg: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.2)", shadow: "none" };
  
  // Normal runs
  return { bg: "rgba(0, 245, 212, 0.15)", fg: "#00F5D4", border: "1px solid rgba(0, 245, 212, 0.5)", shadow: "0 0 10px rgba(0, 245, 212, 0.3)" };
}