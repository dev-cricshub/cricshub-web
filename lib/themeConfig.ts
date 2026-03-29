// ═══════════════════════════════════════════════════════════
// THEME CONFIG — User-customizable overlay colors
// Stored in localStorage, encoded as ?tc= in overlay URL
// No backend required — purely client-side
// ═══════════════════════════════════════════════════════════

export type BundleId = "basic" | "glass" | "material" | "aero";
export type BundleOverrides = Record<string, string>;
export type ThemeConfig = Partial<Record<BundleId, BundleOverrides>>;

const STORAGE_PREFIX = "cricshub_theme_";

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
  return btoa(JSON.stringify(config));
}

export function decodeThemeConfig(encoded: string): ThemeConfig {
  try {
    return JSON.parse(atob(encoded));
  } catch {
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
