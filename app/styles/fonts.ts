import { Barlow_Condensed, Geist, Geist_Mono } from "next/font/google";

// Type system:
//  - Geist Sans:        UI and body copy
//  - Geist Mono:        tabular data (overs, figures, codes)
//  - Barlow Condensed:  display headlines and scoreboard numerals — the same
//                       family the on-air overlays use, so site and broadcast match.
export const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
export const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
export const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const fontVariables = `${sans.variable} ${mono.variable} ${display.variable}`;
