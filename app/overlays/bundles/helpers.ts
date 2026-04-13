// ═══════════════════════════════════════════════════════════
// SHARED HELPERS — pure computation utilities
// Bundle-agnostic: no colors, no React, no styles
// ═══════════════════════════════════════════════════════════

import { MatchState, TeamDetails, PlayerStats } from "./types";

export const initials = (n: string) =>
  n
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function fmt12(t: string | number[]) {
  if (!t) return "";
  let h: number, m: string | number;
  if (Array.isArray(t)) {
    h = t[0];
    m = t[1] !== undefined ? String(t[1]).padStart(2, "0") : "00";
  } else {
    const p = String(t).split(":");
    h = parseInt(p[0]);
    m = p[1] || "00";
  }
  return `${h % 12 || 12}:${m} ${h >= 12 ? "PM" : "AM"}`;
}

export function fmtDate(d: string | number[]) {
  if (!d) return "";
  const o = Array.isArray(d) ? new Date(d[0], d[1] - 1, d[2]) : new Date(d);
  return o.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getBatTeam(s: MatchState): TeamDetails {
  if (!s.battingFirst) return s.team1;
  return s.firstInnings
    ? s.battingFirst.name === s.team1.name
      ? s.team1
      : s.team2
    : s.battingFirst.name === s.team1.name
      ? s.team2
      : s.team1;
}

export function getBowlTeam(s: MatchState): TeamDetails {
  const bat = getBatTeam(s);
  return bat.name === s.team1.name ? s.team2 : s.team1;
}

export const fmtSR = (v: number) => (v > 0 ? v.toFixed(1) : "—");
export const fmtEcon = (v: number) => (v > 0 ? v.toFixed(2) : "—");
export const fmtOv = (v: number) => (v > 0 ? v.toFixed(1) : "0.0");

export function dismissalText(p: PlayerStats): string {
  if (p.retiredHurt === true) return "Retired Hurt";
  const d = p.wicketDetails;
  if (!d) return "";
  if (d.dismissalType === "Bowled") return `b ${d.bowlerId?.name ?? ""}`;
  if (d.dismissalType === "Caught")
    return `c ${d.catcherId?.name ?? ""} b ${d.bowlerId?.name ?? ""}`;
  if (d.dismissalType === "LBW") return `lbw b ${d.bowlerId?.name ?? ""}`;
  if (d.dismissalType === "Run Out") return `run out`;
  return d.dismissalType;
}

export const ROLE_META: Record<string, { label: string; color: string; bg: string }> = {
  BAT:             { label: "Batsman",       color: "#60A5FA", bg: "rgba(96,165,250,0.12)" },
  BWL:             { label: "Bowler",        color: "#C084FC", bg: "rgba(192,132,252,0.12)" },
  AR:              { label: "All-rounder",   color: "#34D399", bg: "rgba(52,211,153,0.12)" },
  WK:              { label: "Wicket-keeper", color: "#FCD34D", bg: "rgba(252,211,77,0.12)"  },
  BATSMAN:         { label: "Batsman",       color: "#60A5FA", bg: "rgba(96,165,250,0.12)" },
  BOWLER:          { label: "Bowler",        color: "#C084FC", bg: "rgba(192,132,252,0.12)" },
  "ALL-ROUNDER":   { label: "All-rounder",   color: "#34D399", bg: "rgba(52,211,153,0.12)" },
  "WICKET-KEEPER": { label: "Wicket-keeper", color: "#FCD34D", bg: "rgba(252,211,77,0.12)"  },
};
