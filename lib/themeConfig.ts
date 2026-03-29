// ═══════════════════════════════════════════════════════════
// THEME CONFIG — Professional Broadcast Color System
// Uses HSL color theory for harmonious color derivation
// Stored in localStorage, encoded as ?tc= in overlay URL
// ═══════════════════════════════════════════════════════════

export type BundleId = "basic" | "glass" | "material" | "aero";
export type BundleOverrides = Record<string, string>;
export type ThemeConfig = Partial<Record<BundleId, BundleOverrides>>;

export interface MasterColors {
  team1: string;
  team2: string;
  accent: string;
  alert: string;
  bg: string;
  text: string;
}

export interface BallColors {
  wicket: string;
  six: string;
  four: string;
  wide: string;
}

const STORAGE_PREFIX = "cricshub_theme_";

// ═══════════════════════════════════════════════════════════
// COLOR UTILITIES — HSL-based for harmonious colors
// ═══════════════════════════════════════════════════════════

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360; s /= 100; l /= 100;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1/3);
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Create harmonious variants using HSL
function createDimVariant(hex: string): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  // Reduce saturation by 35%, reduce lightness by 18%
  return hslToHex(hsl.h, Math.max(15, hsl.s - 35), Math.max(15, hsl.l - 18));
}

function createMidVariant(hex: string): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  // Reduce saturation by 18%, reduce lightness by 10%
  return hslToHex(hsl.h, Math.max(20, hsl.s - 18), Math.max(20, hsl.l - 10));
}

function createBorderVariant(hex: string): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  // Same hue/saturation, reduce lightness by 12%
  return hslToHex(hsl.h, hsl.s, Math.max(15, hsl.l - 12));
}

function getContrastingText(bg: string): string {
  const hsl = hexToHsl(bg);
  return hsl && hsl.l > 55 ? "#0B1120" : "#FFFFFF";
}

function toRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(0,0,0,${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function lighten(hex: string, percent: number): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  return hslToHex(hsl.h, hsl.s, Math.min(95, hsl.l + percent));
}

function darken(hex: string, percent: number): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  return hslToHex(hsl.h, hsl.s, Math.max(5, hsl.l - percent));
}

// ═══════════════════════════════════════════════════════════
// PALETTE DERIVATION
// ═══════════════════════════════════════════════════════════

export function derivePalette(bundle: BundleId, master: MasterColors, balls: BallColors): BundleOverrides {
  switch (bundle) {
    case "basic": return deriveBasicPalette(master, balls);
    case "glass": return deriveGlassPalette(master, balls);
    case "material": return deriveMaterialPalette(master, balls);
    case "aero": return deriveAeroPalette(master, balls);
  }
}

function deriveGlassPalette(master: MasterColors, balls: BallColors): BundleOverrides {
  const { team1, team2, accent, alert, bg, text } = master;

  return {
    // Panel backgrounds — Rich dark
    bg: bg.startsWith("#") ? bg : "#0B1120",
    bgDeep: darken(bg, 12),
    bgLight: lighten(bg, 10),
    bgDark: darken(bg, 6),

    // Borders
    borderHighlight: lighten(bg, 20),
    borderShadow: lighten(bg, 10),
    borderSub: lighten(bg, 8),
    lineHard: lighten(bg, 20),
    lineSoft: lighten(bg, 10),
    lineDim: lighten(bg, 5),

    // Text variants
    w50: toRgba(text, 0.50),
    w30: toRgba(text, 0.30),
    backdropBlur: "none",

    // Team 1 — Harmonious variants
    cyan: team1,
    cyanDim: createDimVariant(team1),
    cyanMid: createMidVariant(team1),
    cyanGlow: "none",
    cyanBorder: createBorderVariant(team1),

    // Team 2 — Harmonious variants
    pink: team2,
    pinkDim: createDimVariant(team2),
    pinkMid: createMidVariant(team2),
    pinkGlow: "none",
    pinkBorder: createBorderVariant(team2),

    // Accent
    teal: accent,
    tealDim: createDimVariant(accent),
    tealGlow: "none",

    // Alert
    coral: alert,
    coralDim: createDimVariant(alert),

    // Text
    white: text,
    w90: toRgba(text, 0.95),
    w70: toRgba(text, 0.75),
    w45: toRgba(text, 0.50),
    w25: toRgba(text, 0.30),
    w12: toRgba(text, 0.15),
    textGlow: "none",

    // Ball colors — Solid, readable
    "ball-W-bg": balls.wicket,
    "ball-W-fg": "#FFFFFF",
    "ball-W-border": createBorderVariant(balls.wicket),
    "ball-W-shadow": "none",

    "ball-6-bg": balls.six,
    "ball-6-fg": "#FFFFFF",
    "ball-6-border": createBorderVariant(balls.six),
    "ball-6-shadow": "none",

    "ball-4-bg": balls.four,
    "ball-4-fg": getContrastingText(balls.four),
    "ball-4-border": createBorderVariant(balls.four),
    "ball-4-shadow": "none",

    "ball-Wd-bg": balls.wide,
    "ball-Wd-fg": getContrastingText(balls.wide),
    "ball-Wd-border": createBorderVariant(balls.wide),
    "ball-Wd-shadow": "none",

    "ball-0-bg": lighten(bg, 18),
    "ball-0-fg": toRgba(text, 0.5),
    "ball-0-border": lighten(bg, 10),
    "ball-0-shadow": "none",

    "ball-run-bg": "#14F195",
    "ball-run-fg": "#0B1120",
    "ball-run-border": "#0FC97A",
    "ball-run-shadow": "none",
  };
}

function deriveBasicPalette(master: MasterColors, balls: BallColors): BundleOverrides {
  const { team1, team2, accent, alert, bg, text } = master;

  return {
    bg, border: toRgba(text, 0.08),
    gold: accent, goldDim: toRgba(accent, 0.35),
    blue: team1, blueDim: toRgba(team1, 0.25),
    purple: team2, purpleDim: toRgba(team2, 0.25),
    red: alert,
    white: text, w80: toRgba(text, 0.80), w55: toRgba(text, 0.55), w35: toRgba(text, 0.35),
    w20: toRgba(text, 0.20), w10: toRgba(text, 0.10), w06: toRgba(text, 0.06), w04: toRgba(text, 0.04),
    "ball-W-bg": balls.wicket, "ball-W-fg": getContrastingText(balls.wicket), "ball-W-ring": toRgba(balls.wicket, 0.8),
    "ball-6-bg": balls.six, "ball-6-fg": getContrastingText(balls.six), "ball-6-ring": toRgba(balls.six, 0.8),
    "ball-4-bg": balls.four, "ball-4-fg": getContrastingText(balls.four), "ball-4-ring": toRgba(balls.four, 0.8),
    "ball-Wd-bg": balls.wide, "ball-Wd-fg": getContrastingText(balls.wide), "ball-Wd-ring": toRgba(balls.wide, 0.8),
    "ball-0-bg": toRgba(text, 0.05), "ball-0-fg": toRgba(text, 0.35), "ball-0-ring": toRgba(text, 0.12),
    "ball-run-bg": "#064E2E", "ball-run-fg": "#6EE7B7", "ball-run-ring": "#10B981",
  };
}

function deriveMaterialPalette(master: MasterColors, balls: BallColors): BundleOverrides {
  const { team1, team2, accent, alert, bg, text } = master;
  return {
    bg, bgDeep: darken(bg, 15), bgLight: lighten(bg, 8), bgDark: darken(bg, 8),
    border: lighten(bg, 20), borderSub: lighten(bg, 12),
    teal: accent, tealDim: darken(accent, 30),
    cyan: team1, cyanDim: darken(team1, 30),
    pink: team2, pinkDim: darken(team2, 30),
    coral: alert, coralDim: darken(alert, 30),
    white: text, w90: toRgba(text, 0.95), w70: toRgba(text, 0.75), w45: toRgba(text, 0.5), w25: toRgba(text, 0.3), w12: toRgba(text, 0.15), w06: toRgba(text, 0.08),
    "ball-W-bg": balls.wicket, "ball-W-fg": "#FFFFFF", "ball-W-border": darken(balls.wicket, 25), "ball-W-shadow": "0 2px 4px rgba(0,0,0,0.3)",
    "ball-6-bg": balls.six, "ball-6-fg": "#FFFFFF", "ball-6-border": darken(balls.six, 25), "ball-6-shadow": "0 2px 4px rgba(0,0,0,0.3)",
    "ball-4-bg": balls.four, "ball-4-fg": "#FFFFFF", "ball-4-border": darken(balls.four, 25), "ball-4-shadow": "0 2px 4px rgba(0,0,0,0.3)",
    "ball-Wd-bg": balls.wide, "ball-Wd-fg": "#FFFFFF", "ball-Wd-border": darken(balls.wide, 25), "ball-Wd-shadow": "0 2px 4px rgba(0,0,0,0.3)",
    "ball-0-bg": lighten(bg, 15), "ball-0-fg": toRgba(text, 0.7), "ball-0-border": darken(bg, 10), "ball-0-shadow": "inset 0 1px 2px rgba(0,0,0,0.2)",
    "ball-run-bg": "#059669", "ball-run-fg": text, "ball-run-border": darken("#059669", 20), "ball-run-shadow": "0 2px 4px rgba(0,0,0,0.3)",
  };
}

function deriveAeroPalette(master: MasterColors, balls: BallColors): BundleOverrides {
  const { team1, team2, accent, alert, bg, text } = master;
  const isLight = getContrastingText(bg) === "#0B1120";
  return {
    bg, bgDeep: isLight ? lighten(bg, 4) : darken(bg, 8), bgLight: isLight ? lighten(bg, 2) : lighten(bg, 5), bgDark: isLight ? darken(bg, 6) : darken(bg, 4),
    border: isLight ? darken(bg, 10) : lighten(bg, 15), borderSub: isLight ? darken(bg, 5) : lighten(bg, 8),
    teal: accent, tealDim: isLight ? lighten(accent, 75) : darken(accent, 30),
    cyan: team1, cyanDim: isLight ? lighten(team1, 75) : darken(team1, 30),
    pink: team2, pinkDim: isLight ? lighten(team2, 75) : darken(team2, 30),
    coral: alert, coralDim: isLight ? lighten(alert, 75) : darken(alert, 30),
    textMain: text, t90: toRgba(text, 0.9), t70: toRgba(text, 0.7), t45: toRgba(text, 0.45), t25: toRgba(text, 0.25), t12: toRgba(text, 0.12), t06: toRgba(text, 0.06),
    "ball-W-bg": balls.wicket, "ball-W-fg": "#FFFFFF", "ball-W-border": "none", "ball-W-shadow": `0 2px 6px ${toRgba(balls.wicket, 0.25)}`,
    "ball-6-bg": balls.six, "ball-6-fg": "#FFFFFF", "ball-6-border": "none", "ball-6-shadow": `0 2px 6px ${toRgba(balls.six, 0.25)}`,
    "ball-4-bg": balls.four, "ball-4-fg": getContrastingText(balls.four), "ball-4-border": "none", "ball-4-shadow": `0 2px 6px ${toRgba(balls.four, 0.25)}`,
    "ball-Wd-bg": balls.wide, "ball-Wd-fg": getContrastingText(balls.wide), "ball-Wd-border": "none", "ball-Wd-shadow": `0 2px 6px ${toRgba(balls.wide, 0.25)}`,
    "ball-0-bg": bg, "ball-0-fg": toRgba(text, 0.4), "ball-0-border": isLight ? darken(bg, 10) : lighten(bg, 15), "ball-0-shadow": "none",
    "ball-run-bg": isLight ? darken(bg, 3) : lighten(bg, 5), "ball-run-fg": text, "ball-run-border": isLight ? darken(bg, 10) : lighten(bg, 15), "ball-run-shadow": "none",
  };
}

// ═══════════════════════════════════════════════════════════
// DEFAULT PALETTES
// ═══════════════════════════════════════════════════════════

export const DEFAULT_MASTER_COLORS: Record<BundleId, MasterColors> = {
  basic: { team1: "#4A9EF5", team2: "#A855F7", accent: "#E2B94B", alert: "#F87171", bg: "#060810", text: "#FFFFFF" },
  glass: { team1: "#00D4FF", team2: "#FF2D95", accent: "#14F195", alert: "#FF4757", bg: "#0B1120", text: "#FFFFFF" },
  material: { team1: "#00BCD4", team2: "#E91E63", accent: "#009688", alert: "#DC2626", bg: "#111827", text: "#FFFFFF" },
  aero: { team1: "#0284C7", team2: "#E11D48", accent: "#0D9488", alert: "#EF4444", bg: "#FFFFFF", text: "#111827" },
};

export const DEFAULT_BALL_COLORS: BallColors = {
  wicket: "#FF4757",
  six: "#A66CFF",
  four: "#00D4FF",
  wide: "#FFB800",
};

// ═══════════════════════════════════════════════════════════
// STORAGE & ENCODING
// ═══════════════════════════════════════════════════════════

export function loadThemeConfig(matchId: string): ThemeConfig {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${matchId}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function saveThemeConfig(matchId: string, config: ThemeConfig): void {
  localStorage.setItem(`${STORAGE_PREFIX}${matchId}`, JSON.stringify(config));
}

export function encodeThemeConfig(config: ThemeConfig): string {
  return btoa(JSON.stringify(config));
}

export function decodeThemeConfig(encoded: string): ThemeConfig {
  try { return JSON.parse(atob(encoded)); } catch { return {}; }
}

const PREFIX: Record<BundleId, string> = { basic: "b", glass: "g", material: "m", aero: "a" };

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

export function buildConfigFromSimplified(
  bundle: BundleId,
  master: MasterColors,
  balls: BallColors,
  advanced?: BundleOverrides
): BundleOverrides {
  const derived = derivePalette(bundle, master, balls);
  return advanced ? { ...derived, ...advanced } : derived;
}
