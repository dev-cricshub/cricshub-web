// ═══════════════════════════════════════════════════════════
// THEME CONFIG — Smart Color Palette System
// Users configure 6 master colors, rest auto-derived
// Stored in localStorage, encoded as ?tc= in overlay URL
// No backend required — purely client-side
// ═══════════════════════════════════════════════════════════

export type BundleId = "basic" | "glass" | "material" | "aero";
export type BundleOverrides = Record<string, string>;
export type ThemeConfig = Partial<Record<BundleId, BundleOverrides>>;

// New simplified config structure
export interface MasterColors {
  team1: string;      // Team 1 primary color
  team2: string;      // Team 2 primary color
  accent: string;     // Primary accent (gold/teal)
  alert: string;      // Alert/wicket color
  bg: string;         // Background base
  text: string;       // Text base
}

export interface BallColors {
  wicket: string;     // W (wicket)
  six: string;        // 6
  four: string;       // 4
  wide: string;       // Wd/Nb
}

export interface SimplifiedThemeConfig {
  master: MasterColors;
  balls: BallColors;
  advanced?: BundleOverrides;  // Optional advanced overrides
}

const STORAGE_PREFIX = "cricshub_theme_";

// ═══════════════════════════════════════════════════════════
// COLOR UTILITIES
// ═══════════════════════════════════════════════════════════

// Parse hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let h = hex.trim();
  if (h.startsWith("#")) h = h.slice(1);
  
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Parse rgba string to components
function parseRgba(rgba: string): { r: number; g: number; b: number; a: number } | null {
  const result = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i);
  return result
    ? {
        r: parseInt(result[1], 10),
        g: parseInt(result[2], 10),
        b: parseInt(result[3], 10),
        a: result[4] ? parseFloat(result[4]) : 1,
      }
    : null;
}

// Get lightness of a color (0-100)
function getLightness(color: string): number {
  let rgb: { r: number; g: number; b: number } | null = null;
  
  if (color.startsWith("#") || /^[a-f\d]{3,6}$/i.test(color)) {
    rgb = hexToRgb(color);
  } else {
    const rgba = parseRgba(color);
    if (rgba) {
      rgb = { r: rgba.r, g: rgba.g, b: rgba.b };
    }
  }
  
  if (!rgb) return 50;
  
  // HSP color model for perceived lightness
  return Math.sqrt(0.299 * rgb.r ** 2 + 0.587 * rgb.g ** 2 + 0.114 * rgb.b ** 2) / 2.55;
}

// Get contrasting text color (black or white)
function getContrastingText(bgColor: string): string {
  return getLightness(bgColor) > 55 ? "#111827" : "#FFFFFF";
}

// Create rgba from hex/rgba with alpha
function toRgba(color: string, alpha: number): string {
  // If it's already rgba, try to parse and update alpha
  if (color.startsWith("rgb")) {
    const parsed = parseRgba(color);
    if (parsed) return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${alpha})`;
  }
  
  const rgb = hexToRgb(color);
  if (!rgb) return color.startsWith("rgba") ? color : `rgba(0,0,0,${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

// Create glow effect
function toGlow(color: string, intensity: number = 0.4): string {
  return `0 0 15px ${toRgba(color, intensity)}`;
}

// Darken hex color (for Material dim variants)
function darken(color: string, percent: number): string {
  let rgb = hexToRgb(color);
  if (!rgb) {
    const parsed = parseRgba(color);
    if (parsed) rgb = { r: parsed.r, g: parsed.g, b: parsed.b };
    else return color;
  }
  
  const factor = 1 - percent / 100;
  const r = Math.round(rgb!.r * factor);
  const g = Math.round(rgb!.g * factor);
  const b = Math.round(rgb!.b * factor);
  
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, "0")).join("")}`;
}

// Lighten hex color (for Aero dim variants)
function lighten(color: string, percent: number): string {
  let rgb = hexToRgb(color);
  if (!rgb) {
    const parsed = parseRgba(color);
    if (parsed) rgb = { r: parsed.r, g: parsed.g, b: parsed.b };
    else return color;
  }
  
  const r = Math.round(rgb!.r + (255 - rgb!.r) * percent / 100);
  const g = Math.round(rgb!.g + (255 - rgb!.g) * percent / 100);
  const b = Math.round(rgb!.b + (255 - rgb!.b) * percent / 100);
  
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, "0")).join("")}`;
}

// ═══════════════════════════════════════════════════════════
// PALETTE DERIVATION — Bundle-specific color generation
// ═══════════════════════════════════════════════════════════

export function derivePalette(bundle: BundleId, master: MasterColors, balls: BallColors): BundleOverrides {
  switch (bundle) {
    case "basic":
      return deriveBasicPalette(master, balls);
    case "glass":
      return deriveGlassPalette(master, balls);
    case "material":
      return deriveMaterialPalette(master, balls);
    case "aero":
      return deriveAeroPalette(master, balls);
  }
}

function deriveBasicPalette(master: MasterColors, balls: BallColors): BundleOverrides {
  const { team1, team2, accent, alert, bg, text } = master;
  
  return {
    // Panel
    bg: bg,
    border: toRgba(text, 0.08),
    
    // Accents
    gold: accent,
    goldDim: toRgba(accent, 0.35),
    blue: team1,
    blueDim: toRgba(team1, 0.25),
    purple: team2,
    purpleDim: toRgba(team2, 0.25),
    red: alert,
    
    // Text variants (derived from text base)
    white: text,
    w80: toRgba(text, 0.80),
    w55: toRgba(text, 0.55),
    w35: toRgba(text, 0.35),
    w20: toRgba(text, 0.20),
    w10: toRgba(text, 0.10),
    w06: toRgba(text, 0.06),
    w04: toRgba(text, 0.04),
    
    // Ball colors
    "ball-W-bg": balls.wicket,
    "ball-W-fg": getContrastingText(balls.wicket),
    "ball-W-ring": toRgba(balls.wicket, 0.8),
    
    "ball-6-bg": balls.six,
    "ball-6-fg": getContrastingText(balls.six),
    "ball-6-ring": toRgba(balls.six, 0.8),
    
    "ball-4-bg": balls.four,
    "ball-4-fg": getContrastingText(balls.four),
    "ball-4-ring": toRgba(balls.four, 0.8),
    
    "ball-Wd-bg": balls.wide,
    "ball-Wd-fg": getContrastingText(balls.wide),
    "ball-Wd-ring": toRgba(balls.wide, 0.8),
    
    "ball-0-bg": toRgba(text, 0.05),
    "ball-0-fg": toRgba(text, 0.35),
    "ball-0-ring": toRgba(text, 0.12),
    
    "ball-run-bg": toRgba("#10B981", 0.3),
    "ball-run-fg": "#6EE7B7",
    "ball-run-ring": "#10B981",
  };
}

function deriveGlassPalette(master: MasterColors, balls: BallColors): BundleOverrides {
  const { team1, team2, accent, alert, bg, text } = master;
  
  return {
    // Panel backgrounds
    bg: toRgba(bg, 0.45),
    bgDeep: toRgba(bg, 0.65),
    bgLight: toRgba(text, 0.08),
    bgDark: "rgba(0, 0, 0, 0.55)",
    
    // Borders
    borderHighlight: toRgba(text, 0.35),
    borderShadow: toRgba(text, 0.05),
    borderSub: toRgba(text, 0.15),
    
    // Accents with glow
    teal: accent,
    tealDim: toRgba(accent, 0.15),
    tealGlow: toGlow(accent, 0.4),
    
    cyan: team1,
    cyanDim: toRgba(team1, 0.15),
    cyanGlow: toGlow(team1, 0.4),
    
    pink: team2,
    pinkDim: toRgba(team2, 0.15),
    pinkGlow: toGlow(team2, 0.4),
    
    coral: alert,
    coralDim: toRgba(alert, 0.15),
    
    // Text
    white: text,
    w90: toRgba(text, 0.92),
    w70: toRgba(text, 0.75),
    w45: toRgba(text, 0.55),
    w25: toRgba(text, 0.35),
    w12: toRgba(text, 0.15),
    textGlow: "0 2px 4px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.9)",
    
    // Ball colors with glass effect
    "ball-W-bg": toRgba(balls.wicket, 0.2),
    "ball-W-fg": balls.wicket,
    "ball-W-border": `1px solid ${toRgba(balls.wicket, 0.6)}`,
    "ball-W-shadow": toGlow(balls.wicket, 0.4),
    
    "ball-6-bg": toRgba(balls.six, 0.2),
    "ball-6-fg": balls.six,
    "ball-6-border": `1px solid ${toRgba(balls.six, 0.6)}`,
    "ball-6-shadow": toGlow(balls.six, 0.4),
    
    "ball-4-bg": toRgba(balls.four, 0.2),
    "ball-4-fg": balls.four,
    "ball-4-border": `1px solid ${toRgba(balls.four, 0.6)}`,
    "ball-4-shadow": toGlow(balls.four, 0.4),
    
    "ball-Wd-bg": toRgba(balls.wide, 0.2),
    "ball-Wd-fg": balls.wide,
    "ball-Wd-border": `1px solid ${toRgba(balls.wide, 0.6)}`,
    "ball-Wd-shadow": toGlow(balls.wide, 0.4),
    
    "ball-0-bg": toRgba(text, 0.05),
    "ball-0-fg": toRgba(text, 0.5),
    "ball-0-border": `1px solid ${toRgba(text, 0.2)}`,
    "ball-0-shadow": "none",
    
    "ball-run-bg": toRgba(accent, 0.15),
    "ball-run-fg": accent,
    "ball-run-border": `1px solid ${toRgba(accent, 0.5)}`,
    "ball-run-shadow": toGlow(accent, 0.3),
  };
}

function deriveMaterialPalette(master: MasterColors, balls: BallColors): BundleOverrides {
  const { team1, team2, accent, alert, bg, text } = master;
  
  return {
    // Panel backgrounds
    bg: bg,
    bgDeep: darken(bg, 20),
    bgLight: lighten(bg, 10),
    bgDark: darken(bg, 10),
    
    // Borders
    border: lighten(bg, 20),
    borderSub: lighten(bg, 10),
    
    // Accents (flat Material Design)
    teal: accent,
    tealDim: darken(accent, 40),
    
    cyan: team1,
    cyanDim: darken(team1, 40),
    
    pink: team2,
    pinkDim: darken(team2, 40),
    
    coral: alert,
    coralDim: darken(alert, 40),
    
    // Text
    white: text,
    w90: toRgba(text, 0.95),
    w70: toRgba(text, 0.75),
    w45: toRgba(text, 0.5),
    w25: toRgba(text, 0.3),
    w12: toRgba(text, 0.15),
    w06: toRgba(text, 0.08),
    
    // Ball colors (flat Material)
    "ball-W-bg": balls.wicket,
    "ball-W-fg": getContrastingText(balls.wicket),
    "ball-W-border": `1px solid ${darken(balls.wicket, 30)}`,
    "ball-W-shadow": "0 2px 4px rgba(0,0,0,0.3)",
    
    "ball-6-bg": balls.six,
    "ball-6-fg": getContrastingText(balls.six),
    "ball-6-border": `1px solid ${darken(balls.six, 30)}`,
    "ball-6-shadow": "0 2px 4px rgba(0,0,0,0.3)",
    
    "ball-4-bg": balls.four,
    "ball-4-fg": getContrastingText(balls.four),
    "ball-4-border": `1px solid ${darken(balls.four, 30)}`,
    "ball-4-shadow": "0 2px 4px rgba(0,0,0,0.3)",
    
    "ball-Wd-bg": balls.wide,
    "ball-Wd-fg": getContrastingText(balls.wide),
    "ball-Wd-border": `1px solid ${darken(balls.wide, 30)}`,
    "ball-Wd-shadow": "0 2px 4px rgba(0,0,0,0.3)",
    
    "ball-0-bg": lighten(bg, 15),
    "ball-0-fg": toRgba(text, 0.7),
    "ball-0-border": `1px solid ${darken(bg, 10)}`,
    "ball-0-shadow": "inset 0 1px 2px rgba(0,0,0,0.2)",
    
    "ball-run-bg": "#059669",
    "ball-run-fg": text,
    "ball-run-border": `1px solid ${darken("#059669", 20)}`,
    "ball-run-shadow": "0 2px 4px rgba(0,0,0,0.3)",
  };
}

function deriveAeroPalette(master: MasterColors, balls: BallColors): BundleOverrides {
  const { team1, team2, accent, alert, bg, text } = master;
  
  const isLight = getLightness(bg) > 50;
  
  return {
    // Panel backgrounds
    bg: bg,
    bgDeep: isLight ? lighten(bg, 5) : darken(bg, 10),
    bgLight: isLight ? lighten(bg, 3) : lighten(bg, 5),
    bgDark: isLight ? darken(bg, 8) : darken(bg, 5),
    
    // Borders
    border: isLight ? darken(bg, 10) : lighten(bg, 15),
    borderSub: isLight ? darken(bg, 5) : lighten(bg, 8),
    
    // Accents (light theme friendly)
    teal: accent,
    tealDim: lighten(accent, 85),
    
    cyan: team1,
    cyanDim: lighten(team1, 85),
    
    pink: team2,
    pinkDim: lighten(team2, 85),
    
    coral: alert,
    coralDim: lighten(alert, 85),
    
    // Text
    textMain: text,
    t90: toRgba(text, 0.9),
    t70: toRgba(text, 0.7),
    t45: toRgba(text, 0.45),
    t25: toRgba(text, 0.25),
    t12: toRgba(text, 0.12),
    t06: toRgba(text, 0.06),
    
    // Ball colors (clean, minimal shadows)
    "ball-W-bg": balls.wicket,
    "ball-W-fg": getContrastingText(balls.wicket),
    "ball-W-border": "none",
    "ball-W-shadow": `0 2px 6px ${toRgba(balls.wicket, 0.25)}`,
    
    "ball-6-bg": balls.six,
    "ball-6-fg": getContrastingText(balls.six),
    "ball-6-border": "none",
    "ball-6-shadow": `0 2px 6px ${toRgba(balls.six, 0.25)}`,
    
    "ball-4-bg": balls.four,
    "ball-4-fg": getContrastingText(balls.four),
    "ball-4-border": "none",
    "ball-4-shadow": `0 2px 6px ${toRgba(balls.four, 0.25)}`,
    
    "ball-Wd-bg": balls.wide,
    "ball-Wd-fg": getContrastingText(balls.wide),
    "ball-Wd-border": "none",
    "ball-Wd-shadow": `0 2px 6px ${toRgba(balls.wide, 0.25)}`,
    
    "ball-0-bg": bg,
    "ball-0-fg": toRgba(text, 0.4),
    "ball-0-border": `1px solid ${isLight ? darken(bg, 10) : lighten(bg, 15)}`,
    "ball-0-shadow": "none",
    
    "ball-run-bg": isLight ? darken(bg, 3) : lighten(bg, 5),
    "ball-run-fg": text,
    "ball-run-border": `1px solid ${isLight ? darken(bg, 10) : lighten(bg, 15)}`,
    "ball-run-shadow": "none",
  };
}

// ═══════════════════════════════════════════════════════════
// DEFAULT PALETTES — Beautiful preset configurations
// ═══════════════════════════════════════════════════════════

export const DEFAULT_MASTER_COLORS: Record<BundleId, MasterColors> = {
  basic: {
    team1: "#4A9EF5",
    team2: "#A855F7",
    accent: "#E2B94B",
    alert: "#F87171",
    bg: "#060810",
    text: "#FFFFFF",
  },
  glass: {
    team1: "#00E5FF",
    team2: "#FF007F",
    accent: "#00F5D4",
    alert: "#FF3366",
    bg: "#0F172A",
    text: "#FFFFFF",
  },
  material: {
    team1: "#00BCD4",
    team2: "#E91E63",
    accent: "#009688",
    alert: "#DC2626",
    bg: "#111827",
    text: "#FFFFFF",
  },
  aero: {
    team1: "#0284C7",
    team2: "#E11D48",
    accent: "#0D9488",
    alert: "#EF4444",
    bg: "#FFFFFF",
    text: "#111827",
  },
};

export const DEFAULT_BALL_COLORS: BallColors = {
  wicket: "#FF3366",
  six: "#BD00FF",
  four: "#00E5FF",
  wide: "#FFCC00",
};

// ═══════════════════════════════════════════════════════════
// STORAGE & ENCODING
// ═══════════════════════════════════════════════════════════

export function loadThemeConfig(matchId: string): ThemeConfig {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${matchId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveThemeConfig(matchId: string, config: ThemeConfig): void {
  localStorage.setItem(`${STORAGE_PREFIX}${matchId}`, JSON.stringify(config));
}

export function encodeThemeConfig(config: ThemeConfig): string {
  // Use a safer base64 encoding that avoids issues with non-Latin1 chars
  const json = JSON.stringify(config);
  return btoa(unescape(encodeURIComponent(json)));
}

export function decodeThemeConfig(encoded: string): ThemeConfig {
  try {
    // Handle URL-safe base64 (if any) and potential space-instead-of-plus from URL decoding
    const normalized = encoded.replace(/ /g, "+");
    const json = decodeURIComponent(escape(atob(normalized)));
    return JSON.parse(json);
  } catch (e) {
    console.error("Theme decode failed:", e);
    return {};
  }
}


// CSS variable prefix per bundle
const PREFIX: Record<BundleId, string> = {
  basic: "b",
  glass: "g",
  material: "m",
  aero: "a",
};

export function buildThemeCss(config: ThemeConfig): string {
  const vars: string[] = [];
  for (const [bundle, overrides] of Object.entries(config)) {
    const prefix = PREFIX[bundle as BundleId];
    if (!prefix || !overrides) continue;
    for (const [key, val] of Object.entries(overrides)) {
      vars.push(`--${prefix}-${key}: ${val};`);
    }
  }
  return vars.length > 0 ? `:root { ${vars.join(" ")} }` : "";
}

export function hasOverrides(config: ThemeConfig): boolean {
  return Object.values(config).some((o) => o && Object.keys(o).length > 0);
}

// ═══════════════════════════════════════════════════════════
// SIMPLIFIED CONFIG HELPERS
// ═══════════════════════════════════════════════════════════

export function convertToSimplified(config: ThemeConfig): Record<BundleId, SimplifiedThemeConfig> {
  const result: Record<BundleId, SimplifiedThemeConfig> = {
    basic: { master: { ...DEFAULT_MASTER_COLORS.basic }, balls: { ...DEFAULT_BALL_COLORS } },
    glass: { master: { ...DEFAULT_MASTER_COLORS.glass }, balls: { ...DEFAULT_BALL_COLORS } },
    material: { master: { ...DEFAULT_MASTER_COLORS.material }, balls: { ...DEFAULT_BALL_COLORS } },
    aero: { master: { ...DEFAULT_MASTER_COLORS.aero }, balls: { ...DEFAULT_BALL_COLORS } },
  };
  
  // Try to extract master colors from existing config
  for (const [bundleId, overrides] of Object.entries(config)) {
    if (!overrides) continue;
    const bundle = bundleId as BundleId;
    
    // This is a simplified extraction - in practice, users would set these fresh
    // Advanced users can still use the full override system
    result[bundle].advanced = overrides;
  }
  
  return result;
}

export function buildConfigFromSimplified(
  bundle: BundleId,
  master: MasterColors,
  balls: BallColors,
  advanced?: BundleOverrides
): BundleOverrides {
  const derived = derivePalette(bundle, master, balls);
  return advanced ? { ...derived, ...advanced } : derived;
}
