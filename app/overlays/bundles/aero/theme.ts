// ═══════════════════════════════════════════════════════════
// AERO BUNDLE THEME — Premium, elegant light mode design
// Bright panels, minimal borders, pill shapes, soft shadows
// ═══════════════════════════════════════════════════════════

export const A = {
  // Panel backgrounds — Clean, bright white and soft grays
  bg:        "#FFFFFF",      // Pure white main cards
  bgDeep:    "#F3F4F6",      // Soft gray for headers/footers (Tailwind gray-100)
  bgLight:   "#FAFAFA",      // Ultra-light alternating rows
  bgDark:    "#E5E7EB",      // Slightly deeper gray for emphasis (Tailwind gray-200)

  // Borders — Very subtle, almost invisible dividing lines
  border:    "#E5E7EB",      // Soft structural border
  borderSub: "#F3F4F6",      // Barely-there inner separator

  // Primary accent — Deep Aqua/Teal for light bg contrast
  teal:      "#0D9488",
  tealDim:   "#CCFBF1",      // Soft tinted background for active states
  tealGlow:  "none",         // No neon glows in Aero

  // Team 1 — Rich Sky Blue
  cyan:      "#0284C7",
  cyanDim:   "#E0F2FE",
  cyanGlow:  "none",

  // Team 2 — Vibrant Rose
  pink:      "#E11D48",
  pinkDim:   "#FFE4E6",
  pinkGlow:  "none",

  // Alert / Wicket — Punchy Red
  coral:     "#EF4444",
  coralDim:  "#FEE2E2",

  // Text — Dark scale for light backgrounds (Inverted from dark mode)
  textMain:  "#111827",      // Primary high-contrast text (Near Black)
  t90:       "#1F2937",      // Standard text
  t70:       "#4B5563",      // Secondary text
  t45:       "#6B7280",      // Muted labels
  t25:       "#9CA3AF",      // Disabled / highly muted
  t12:       "#D1D5DB",
  t06:       "#E5E7EB",

  // Shadows — Premium, diffused, Apple-esque soft drop shadows
  textShadow: "none", 
  panelShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
};

export function aeroBallStyle(b: string): { bg: string; fg: string; border: string; shadow: string } {
  // Aero balls use clean, flat colors with soft, elegant shadows
  if (b === "W")
    return { bg: "#EF4444", fg: "#FFFFFF", border: "none", shadow: "0 2px 6px rgba(239,68,68,0.25)" };
  if (b === "6")
    return { bg: "#8B5CF6", fg: "#FFFFFF", border: "none", shadow: "0 2px 6px rgba(139,92,246,0.25)" };
  if (b === "4")
    return { bg: "#0EA5E9", fg: "#FFFFFF", border: "none", shadow: "0 2px 6px rgba(14,165,233,0.25)" };
  if (b === "Wd" || b === "Nb")
    return { bg: "#F59E0B", fg: "#FFFFFF", border: "none", shadow: "0 2px 6px rgba(245,158,11,0.25)" };
  
  // Dot balls are incredibly subtle, outlined rings
  if (b === "0")
    return { bg: "#FFFFFF", fg: "#9CA3AF", border: "1px solid #E5E7EB", shadow: "none" };
  
  // Standard runs (1, 2, 3) are soft, flat gray pills
  return { bg: "#F3F4F6", fg: "#374151", border: "1px solid #E5E7EB", shadow: "none" };
}