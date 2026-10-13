// JS-side design tokens. app/styles/tokens.css (CSS variables) is the source of
// truth for the web app; this file mirrors values JavaScript needs directly —
// colours for canvas/native/email code and other CricsHub apps, motion for
// GSAP/rAF code, breakpoints for matchMedia, and z-index layers. Keep in sync.

/** Brand colours sampled from the logo artwork. */
export const brand = {
  blue: "#207BBE",
  navy: "#273687",
  sky: "#22A4DC",
} as const;

/** Dark (default) theme roles — hex equivalents of the CSS variables. */
export const colors = {
  background: "#060A12",
  surface: { DEFAULT: "#0B111D", 2: "#111928", 3: "#1A2437" },
  border: { DEFAULT: "#1D283C", strong: "#2E3C56" },
  text: { DEFAULT: "#EAF0F7", muted: "#9CAABE", subtle: "#707F96" },
  primary: { DEFAULT: brand.blue, hover: "#1B6CAA", fg: "#FFFFFF", soft: "#10253E", softFg: "#8AC7F2" },
  secondary: { DEFAULT: brand.navy, fg: "#EAF0F7" },
  accent: "#66B6EC",
  gold: "#E2B94B",
  live: "#F8524C",
  success: "#34C770",
  warning: "#F5A623",
  danger: "#F85C5C",
} as const;

export const radius = { control: 8, card: 12, frame: 16 } as const; // px

export const typography = {
  fonts: { sans: "Geist", mono: "Geist Mono", display: "Barlow Condensed" },
  /** Display headlines are uppercase Barlow Condensed; min/max px of the fluid scale. */
  display: { xl: [52, 100], lg: [40, 68], md: [28, 38] },
  body: { sm: 14, base: 16, lg: 18 },
} as const;

export const motion = {
  duration: { fast: 0.15, base: 0.25, slow: 0.4, reveal: 0.7 }, // seconds (GSAP)
  ease: {
    out: "power3.out", // ≈ cubic-bezier(0.2, 0.8, 0.2, 1)
    inOut: "power2.inOut",
    spring: "back.out(1.6)",
  },
  stagger: 0.08,
} as const;

/** Tailwind default breakpoints, for matchMedia queries in JS. */
export const breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280 } as const;

export const media = {
  desktop: `(min-width: ${breakpoints.lg}px) and (hover: hover) and (pointer: fine)`,
  reducedMotion: "(prefers-reduced-motion: reduce)",
} as const;

export const zIndex = { header: 40, sticky: 30, menu: 50, modal: 200, toast: 400 } as const;
