/** @type {import('tailwindcss').Config} */

// Semantic colours resolve to CSS variables defined in app/styles/tokens.css (dark theme only),
// so components use roles like `bg-surface` instead of raw hex values.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: ["./{app,components,libs,pages,hooks}/**/*.{html,js,ts,jsx,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Static brand scale built around the logo blue (500 = #207BBE). Prefer semantic tokens in UI.
        brand: {
          DEFAULT: token("brand"),
          navy: token("brand-navy"),
          sky: token("brand-sky"),
          50: "#EEF6FC",
          100: "#D7E9F7",
          200: "#AFD3EF",
          300: "#7EB8E4",
          400: "#4C9AD4",
          500: "#207BBE",
          600: "#1A66A0",
          700: "#165283",
          800: "#134268",
          900: "#10344F",
          950: "#0A2136",
        },
        secondary: {
          DEFAULT: token("secondary"),
          fg: token("secondary-fg"),
        },
        canvas: token("canvas"),
        surface: {
          DEFAULT: token("surface"),
          2: token("surface-2"),
          3: token("surface-3"),
          inverse: token("surface-inverse"),
        },
        line: {
          DEFAULT: token("line"),
          strong: token("line-strong"),
        },
        fg: {
          DEFAULT: token("fg"),
          muted: token("fg-muted"),
          subtle: token("fg-subtle"),
          inverse: token("fg-inverse"),
        },
        primary: {
          DEFAULT: token("primary"),
          hover: token("primary-hover"),
          fg: token("primary-fg"),
          soft: token("primary-soft"),
          "soft-fg": token("primary-soft-fg"),
        },
        success: {
          DEFAULT: token("success"),
          soft: token("success-soft"),
          "soft-fg": token("success-soft-fg"),
        },
        warning: {
          DEFAULT: token("warning"),
          soft: token("warning-soft"),
          "soft-fg": token("warning-soft-fg"),
        },
        danger: {
          DEFAULT: token("danger"),
          soft: token("danger-soft"),
          "soft-fg": token("danger-soft-fg"),
        },
        // Landing-only roles (see .landing in tokens.css)
        well: token("well"),
        raised: token("raised"),
        "line-accent": token("line-accent"),
        "fg-lead": token("fg-lead"),
        "accent-soft": token("accent-soft"),
        live: token("live"),
        accent: token("accent"),
        gold: token("gold"),
        ring: token("ring"),
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        display: ["var(--font-display)", "var(--font-geist-sans)", "ui-sans-serif", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
        // Display scale (Barlow Condensed, uppercase). Fluid so headlines keep their proportions on every screen.
        "display-xl": ["clamp(3.25rem, 1.6rem + 5.4vw, 6.25rem)", { lineHeight: "0.88", letterSpacing: "-0.012em" }],
        "display-lg": ["clamp(2.5rem, 1.5rem + 3.4vw, 4.25rem)", { lineHeight: "0.92", letterSpacing: "-0.01em" }],
        "display-md": ["clamp(1.75rem, 1.3rem + 1.4vw, 2.375rem)", { lineHeight: "0.95", letterSpacing: "0" }],
      },
      borderRadius: {
        "4xl": "2rem",
        control: "var(--radius-control)",
        card: "var(--radius-card)",
        frame: "var(--radius-frame)",
      },
      spacing: {
        section: "var(--section-y)",
        header: "var(--header-h)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(var(--shadow) / 0.06)",
        card: "0 1px 2px 0 rgb(var(--shadow) / 0.05), 0 1px 3px 0 rgb(var(--shadow) / 0.04)",
        raised: "0 4px 12px -2px rgb(var(--shadow) / 0.08), 0 2px 4px -2px rgb(var(--shadow) / 0.05)",
        pop: "0 12px 32px -8px rgb(var(--shadow) / 0.18), 0 4px 8px -4px rgb(var(--shadow) / 0.08)",
        overlay: "0 24px 64px -12px rgb(var(--shadow) / 0.35)",
        focus: "0 0 0 3px rgb(var(--ring) / 0.35)",
        // Product frames: a hairline top highlight + deep, soft drop. No coloured glows.
        frame: "inset 0 1px 0 rgb(255 255 255 / 0.04), 0 24px 60px -24px rgb(var(--shadow) / 0.9)",
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
        spring: "var(--ease-spring)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "sheet-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateY(12px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        shimmer: { from: { backgroundPosition: "200% 0" }, to: { backgroundPosition: "-200% 0" } },
        "live-ping": {
          "0%": { transform: "scale(1)", opacity: "0.7" },
          "80%, 100%": { transform: "scale(2.4)", opacity: "0" },
        },
        pop: {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-4px)" },
          "40%, 80%": { transform: "translateX(4px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "fade-up": "fade-up 300ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "scale-in": "scale-in 200ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "sheet-up": "sheet-up 320ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "toast-in": "toast-in 240ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
        shimmer: "shimmer 1.6s linear infinite",
        "live-ping": "live-ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite",
        pop: "pop 360ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
        shake: "shake 360ms ease-in-out",
      },
    },
  },
  plugins: [],
};
