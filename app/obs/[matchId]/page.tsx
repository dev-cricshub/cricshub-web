"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { fetchMatchById, fetchMatchState, fetchStreamState } from "@/lib/api";

// ═══════════════════════════════════════════════════════════
// TYPES — mirroring MatchState.java exactly
// ═══════════════════════════════════════════════════════════

interface PlayerDetails {
  playerId: string;
  name: string;
}
interface WicketDetails {
  dismissalType: string;
  bowlerId: PlayerDetails | null;
  catcherId: PlayerDetails | null;
  runOutMakerId: PlayerDetails | null;
  overNumber: number;
  ballNumber: number;
}
interface Extras {
  wide: number;
  noBall: number;
  bye: number;
  legBye: number;
  penalty: number;
}
interface PlayerStats {
  playerId: string;
  name: string;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  wicketDetails: WicketDetails | null;
  overs: number;
  ballsBowled: number;
  runsConceded: number;
  wicketsTaken: number;
  economyRate: number;
}
interface TeamDetails {
  name: string;
  logoUrl: string | null; // confirmed field from TeamDetails.java
  playingXI: PlayerStats[];
  captainId: string | null;
  score: number;
  wickets: number;
  overs: number;
  ballsPlayed: number;
  extras: Extras | null;
}
interface MatchState {
  matchId: string;
  team1: TeamDetails;
  team2: TeamDetails;
  tossWinner: string;
  choice: string;
  firstInnings: boolean;
  completedOvers: number;
  totalOvers: number;
  matchComplete: boolean;
  winner: string | null;
  winBy: string | null;
  battingFirst: TeamDetails | null;
  battingSecond: TeamDetails | null;
  currentStriker: PlayerDetails | null;
  currentNonStriker: PlayerDetails | null;
  currentBowler: PlayerDetails | null;
  currentOverBalls: string[];
  innings1BattingOrder?: PlayerStats[];
  innings2BattingOrder?: PlayerStats[];
  team1BowlingOrder?: PlayerStats[];
  team2BowlingOrder?: PlayerStats[];
}
interface MatchInfo {
  id: string;
  venue: string;
  matchDate: string;
  matchTime: string;
  stage: string | null;
  overs: number;
  tournamentName: string | null;
  team1: { name: string; logoPath: string | null };
  team2: { name: string; logoPath: string | null };
}
type BannerType =
  | "none"
  | "main"
  | "playingXI_bat"
  | "playingXI_bowl"
  | "score"
  | "summary"
  | string;
interface StreamState {
  activeBanner: BannerType;
  templateId: string | null;
}

// ═══════════════════════════════════════════════════════════
// DESIGN CANVAS — always 1920×1080, scaled to fit viewport
// ═══════════════════════════════════════════════════════════

const W = 1920;
const H = 1080;

// Brand palette
const C = {
  bg: "rgba(6, 8, 16, 0.97)",
  border: "rgba(255,255,255,0.08)",
  gold: "#E2B94B",
  goldDim: "rgba(226,185,75,0.35)",
  blue: "#4A9EF5",
  blueDim: "rgba(74,158,245,0.25)",
  purple: "#A855F7",
  purpleDim: "rgba(168,85,247,0.25)",
  red: "#F87171",
  white: "#FFFFFF",
  w80: "rgba(255,255,255,0.80)",
  w55: "rgba(255,255,255,0.55)",
  w35: "rgba(255,255,255,0.35)",
  w20: "rgba(255,255,255,0.20)",
  w10: "rgba(255,255,255,0.10)",
  w06: "rgba(255,255,255,0.06)",
  w04: "rgba(255,255,255,0.04)",
};

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

const initials = (n: string) =>
  n
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function fmt12(t: string | number[]) {
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
function fmtDate(d: string | number[]) {
  if (!d) return "";
  const o = Array.isArray(d) ? new Date(d[0], d[1] - 1, d[2]) : new Date(d);
  return o.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ballStyle(b: string): { bg: string; fg: string; ring: string } {
  if (b === "W") return { bg: "#7F1D1D", fg: "#FCA5A5", ring: "#EF4444" };
  if (b === "6") return { bg: "#4C1D95", fg: "#DDD6FE", ring: "#8B5CF6" };
  if (b === "4") return { bg: "#1E3A5F", fg: "#93C5FD", ring: "#3B82F6" };
  if (b === "Wd" || b === "Nb")
    return { bg: "#78350F", fg: "#FDE68A", ring: "#F59E0B" };
  if (b === "0")
    return {
      bg: "rgba(255,255,255,0.05)",
      fg: "rgba(255,255,255,0.35)",
      ring: "rgba(255,255,255,0.12)",
    };
  return { bg: "#064E2E", fg: "#6EE7B7", ring: "#10B981" };
}

function getBatTeam(s: MatchState): TeamDetails {
  if (!s.battingFirst) return s.team1;
  return s.firstInnings
    ? s.battingFirst.name === s.team1.name
      ? s.team1
      : s.team2
    : s.battingFirst.name === s.team1.name
      ? s.team2
      : s.team1;
}
function getBowlTeam(s: MatchState): TeamDetails {
  const bat = getBatTeam(s);
  return bat.name === s.team1.name ? s.team2 : s.team1;
}

const fmtSR = (v: number) => (v > 0 ? v.toFixed(1) : "—");
const fmtEcon = (v: number) => (v > 0 ? v.toFixed(2) : "—");
const fmtOv = (v: number) => (v > 0 ? v.toFixed(1) : "0.0");

// ═══════════════════════════════════════════════════════════
// SHARED: TEAM BADGE (logo or monogram)
// ═══════════════════════════════════════════════════════════

function TeamBadge({
  name,
  logoUrl,
  size,
  accent,
  accentBg,
}: {
  name: string;
  logoUrl: string | null;
  size: number;
  accent: string;
  accentBg: string;
}) {
  const [err, setErr] = useState(false);
  const show = logoUrl && !err;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.16),
        background: show ? "transparent" : accentBg,
        border: `1px solid ${show ? C.border : accent + "44"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {show ? (
        <img
          src={logoUrl!}
          alt={name}
          onError={() => setErr(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <span
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            fontSize: Math.round(size * 0.34),
            color: accent,
            letterSpacing: 1,
          }}
        >
          {initials(name)}
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// OVERLAY 1: SCORE BAR
// Full-width, anchored to bottom. Height: 3px accent + 88px bar = 91px.
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// OVERLAY 1: SCORE BAR
// ═══════════════════════════════════════════════════════════

function ScoreOverlay({ state }: { state: MatchState }) {
  const bat = getBatTeam(state);
  const bowl = getBowlTeam(state);
  const crr = bat.overs > 0 ? (bat.score / bat.overs).toFixed(2) : "0.00";
  const target = bowl.score + 1;
  const runsNeeded = Math.max(0, target - bat.score);
  const ballsLeft = Math.max(0, Math.round((state.totalOvers - bat.overs) * 6));
  const rrr = ballsLeft > 0 ? ((runsNeeded / ballsLeft) * 6).toFixed(2) : "—";
  const inning = state.firstInnings ? "1ST INN" : "2ND INN";

  const isBatTeam1 = bat.name === state.team1.name;
  const batOrder = isBatTeam1
    ? state.innings1BattingOrder
    : state.innings2BattingOrder;
  const isBowlTeam1 = bowl.name === state.team1.name;
  const bowlOrder = isBowlTeam1
    ? state.team1BowlingOrder
    : state.team2BowlingOrder;

  const striker = state.currentStriker;
  const nonStriker = state.currentNonStriker;
  const bowler = state.currentBowler;

  // Look in live batting order first, fallback to playingXI
  const stS = striker
    ? batOrder?.find((p) => p.playerId === striker.playerId) ||
      bat.playingXI.find((p) => p.playerId === striker.playerId)
    : null;
  const nsS = nonStriker
    ? batOrder?.find((p) => p.playerId === nonStriker.playerId) ||
      bat.playingXI.find((p) => p.playerId === nonStriker.playerId)
    : null;
  const bowS = bowler
    ? bowlOrder?.find((p) => p.playerId === bowler.playerId) ||
      bowl.playingXI.find((p) => p.playerId === bowler.playerId)
    : null;

  const divider = { borderRight: `1px solid ${C.border}` };

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        animation: "slideUp 0.4s cubic-bezier(0.16,1,0.3,1) both",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Accent line - Fades into Purple on the right side! */}
      <div
        style={{
          height: 3,
          background: `linear-gradient(90deg, ${C.blue} 0%, ${C.gold} 40%, ${C.gold} 60%, ${C.purple} 100%)`,
        }}
      />

      {/* Bar */}
      <div
        style={{
          height: 88,
          background: C.bg,
          borderTop: `1px solid ${C.border}`,
          boxShadow: "0 -8px 48px rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "stretch",
          padding: "0 40px",
        }}
      >
        {/* BATTING TEAM + SCORE */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            paddingRight: 32,
            ...divider,
            minWidth: 340,
          }}
        >
          <TeamBadge
            name={bat.name}
            logoUrl={bat.logoUrl}
            size={48}
            accent={C.blue}
            accentBg={C.blueDim}
          />
          <div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: C.w35,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2.5,
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              {bat.name}&nbsp;·&nbsp;{inning}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: C.white,
                  fontWeight: 900,
                  fontSize: 48,
                  lineHeight: 1,
                  letterSpacing: -1,
                }}
              >
                {bat.score}/{bat.wickets}
              </span>
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: C.w35,
                  fontSize: 17,
                  fontWeight: 600,
                }}
              >
                ({bat.overs}/{state.totalOvers})
              </span>
            </div>
          </div>
        </div>

        {/* CRR / RRR */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 6,
            padding: "0 28px",
            ...divider,
            minWidth: 120,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
            <span
              style={{
                color: C.w35,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              CRR
            </span>
            <span
              style={{
                color: C.gold,
                fontWeight: 900,
                fontSize: 24,
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              {crr}
            </span>
          </div>
          {!state.firstInnings && (
            <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
              <span
                style={{
                  color: C.w35,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  fontFamily: "'Barlow Condensed', sans-serif",
                }}
              >
                RRR
              </span>
              <span
                style={{
                  color: C.red,
                  fontWeight: 900,
                  fontSize: 24,
                  fontFamily: "'Barlow Condensed', sans-serif",
                }}
              >
                {rrr}
              </span>
            </div>
          )}
        </div>

        {/* TARGET — 2nd innings only */}
        {!state.firstInnings && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 3,
              padding: "0 28px",
              ...divider,
              minWidth: 150,
            }}
          >
            <div
              style={{
                color: C.w35,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              Need
            </div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                fontSize: 30,
                color: C.white,
                lineHeight: 1,
              }}
            >
              {runsNeeded}{" "}
              <span style={{ color: C.w35, fontSize: 16, fontWeight: 600 }}>
                {" "}
                off {ballsLeft}b
              </span>
            </div>
          </div>
        )}

        {/* THIS OVER */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 8,
            padding: "0 28px",
            ...divider,
            minWidth: 240,
          }}
        >
          <div
            style={{
              color: C.w35,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
          >
            Over {state.completedOvers + 1}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {(state.currentOverBalls ?? []).map((b, i) => {
              const s = ballStyle(b);
              return (
                <div
                  key={i}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: s.bg,
                    border: `1.5px solid ${s.ring}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 900,
                    fontSize: 13,
                    color: s.fg,
                  }}
                >
                  {b}
                </div>
              );
            })}
            {Array.from({
              length: Math.max(0, 6 - (state.currentOverBalls?.length ?? 0)),
            }).map((_, i) => (
              <div
                key={`ep${i}`}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: C.w04,
                  border: `1px solid ${C.w10}`,
                }}
              />
            ))}
          </div>
        </div>

        {/* BATTERS */}
        {(striker || nonStriker) && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 10,
              padding: "0 28px",
              ...divider,
              minWidth: 320,
              maxWidth: 360,
            }}
          >
            {[
              { p: striker, stats: stS, isOn: true },
              { p: nonStriker, stats: nsS, isOn: false },
            ]
              .filter((x) => x.p)
              .map(({ p, stats, isOn }) => (
                <div
                  key={p!.playerId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: isOn ? C.gold : C.w20,
                      boxShadow: isOn ? `0 0 8px ${C.gold}` : "none",
                    }}
                  />
                  <span
                    style={{
                      color: isOn ? C.white : C.w55,
                      fontWeight: isOn ? 700 : 500,
                      fontSize: isOn ? 15 : 13,
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p!.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      color: isOn ? C.gold : C.w55,
                      fontWeight: 900,
                      fontSize: isOn ? 19 : 15,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      minWidth: 60,
                      textAlign: "right",
                    }}
                  >
                    {stats ? (
                      <>
                        {stats.runs}
                        <span
                          style={{
                            color: C.w35,
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          ({stats.ballsFaced})
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* BOWLER */}
        {bowler && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 4,
              padding: "0 32px",
              minWidth: 190,
            }}
          >
            <div
              style={{
                color: C.w35,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              Bowling
            </div>
            <div
              style={{
                color: C.white,
                fontWeight: 700,
                fontSize: 16,
                whiteSpace: "nowrap",
              }}
            >
              {bowler.name}
            </div>
            {bowS && (
              <div
                style={{
                  color: C.w55,
                  fontSize: 14,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  letterSpacing: 0.5,
                }}
              >
                {fmtOv(bowS.overs)} ov · {bowS.wicketsTaken}w ·{" "}
                {bowS.runsConceded}r
              </div>
            )}
          </div>
        )}

        {/* 🔥 NEW: FIELDING TEAM ALIGNED TO THE FAR RIGHT */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginLeft: "auto",
            paddingLeft: 32,
            borderLeft: `1px solid ${C.border}`,
          }}
        >
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: C.w35,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2.5,
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              FIELDING
            </div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: C.white,
                fontWeight: 800,
                fontSize: 24,
                lineHeight: 1,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              {bowl.name}
            </div>
          </div>
          <TeamBadge
            name={bowl.name}
            logoUrl={bowl.logoUrl}
            size={48}
            accent={C.purple}
            accentBg={C.purpleDim}
          />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// OVERLAY 2: MAIN MATCH BANNER — centred, 1120px wide
// ═══════════════════════════════════════════════════════════

function MainMatchBanner({
  info,
  state,
}: {
  info: MatchInfo;
  state: MatchState;
}) {
  const hasScores =
    state.team1.score > 0 || state.team2.score > 0 || state.team1.wickets > 0;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 1120,
        animation: "scaleIn 0.45s cubic-bezier(0.16,1,0.3,1) both",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Tournament pill */}
      {(info.tournamentName || info.stage) && (
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: C.bg,
              border: `1px solid ${C.goldDim}`,
              borderRadius: 4,
              padding: "8px 28px",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 800,
              fontSize: 13,
              color: C.gold,
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            {info.tournamentName}
            {info.tournamentName && info.stage && (
              <span style={{ color: C.goldDim }}>◆</span>
            )}
            {info.stage && (
              <span style={{ color: "rgba(226,185,75,0.65)" }}>
                {info.stage}
              </span>
            )}
          </span>
        </div>
      )}

      {/* Card */}
      <div
        style={{
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          overflow: "hidden",
          boxShadow: "0 40px 100px rgba(0,0,0,0.85)",
        }}
      >
        <div
          style={{
            height: 4,
            background: `linear-gradient(90deg, ${C.blue}, ${C.gold} 50%, ${C.purple})`,
          }}
        />

        {/* Teams */}
        <div style={{ display: "flex", alignItems: "stretch", minHeight: 230 }}>
          {/* Team 1 */}
          <div
            style={{
              flex: 1,
              padding: "36px 48px",
              background: `linear-gradient(120deg, rgba(74,158,245,0.12) 0%, transparent 70%)`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <TeamBadge
              name={state.team1.name}
              logoUrl={state.team1.logoUrl}
              size={64}
              accent={C.blue}
              accentBg={C.blueDim}
            />
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: C.white,
                fontWeight: 900,
                fontSize: 40,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                lineHeight: 1,
              }}
            >
              {state.team1.name}
            </div>
            {hasScores && (
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: C.blue,
                    fontWeight: 900,
                    fontSize: 60,
                    lineHeight: 1,
                  }}
                >
                  {state.team1.score}/{state.team1.wickets}
                </span>
                <span style={{ color: C.w35, fontSize: 20, fontWeight: 500 }}>
                  ({state.team1.overs} ov)
                </span>
              </div>
            )}
          </div>

          {/* VS */}
          <div
            style={{
              width: 116,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              borderLeft: `1px solid ${C.border}`,
              borderRight: `1px solid ${C.border}`,
            }}
          >
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: "50%",
                border: `1.5px solid ${C.goldDim}`,
                background: "rgba(226,185,75,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                fontSize: 17,
                color: C.gold,
                letterSpacing: 3,
              }}
            >
              VS
            </div>
            {info.overs > 0 && (
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: C.w20,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 1,
                }}
              >
                T{info.overs}
              </div>
            )}
          </div>

          {/* Team 2 */}
          <div
            style={{
              flex: 1,
              padding: "36px 48px",
              background: `linear-gradient(240deg, rgba(168,85,247,0.12) 0%, transparent 70%)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <TeamBadge
              name={state.team2.name}
              logoUrl={state.team2.logoUrl}
              size={64}
              accent={C.purple}
              accentBg={C.purpleDim}
            />
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: C.white,
                fontWeight: 900,
                fontSize: 40,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                lineHeight: 1,
                textAlign: "right",
              }}
            >
              {state.team2.name}
            </div>
            {hasScores && (
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{ color: C.w35, fontSize: 20, fontWeight: 500 }}>
                  ({state.team2.overs} ov)
                </span>
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: C.purple,
                    fontWeight: 900,
                    fontSize: 60,
                    lineHeight: 1,
                  }}
                >
                  {state.team2.score}/{state.team2.wickets}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Meta strip */}
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            borderTop: `1px solid ${C.border}`,
            background: "rgba(0,0,0,0.25)",
          }}
        >
          {(
            [
              info.venue ? { label: "Venue", value: info.venue } : null,
              info.matchDate
                ? {
                    label: "Date",
                    value: `${fmtDate(info.matchDate)}${info.matchTime ? "  ·  " + fmt12(info.matchTime) : ""}`,
                  }
                : null,
              state.tossWinner
                ? {
                    label: "Toss",
                    value: `${state.tossWinner} won · chose to ${state.choice}`,
                  }
                : null,
            ] as const
          )
            .filter(Boolean)
            .map((item: any, i, arr) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  padding: "16px 32px",
                  borderRight:
                    i < arr.length - 1 ? `1px solid ${C.border}` : "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: C.w35,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 2.5,
                    textTransform: "uppercase",
                  }}
                >
                  {item.label}
                </div>
                <div style={{ color: C.w80, fontSize: 15, fontWeight: 600 }}>
                  {item.value}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// OVERLAY 3 & 4: PLAYING XI — full stats table
// ═══════════════════════════════════════════════════════════
// OVERLAY 3: BATTING CARD  — broadcast scorecard style
// ═══════════════════════════════════════════════════════════
//
// Layout mirrors professional cricket broadcast:
//   Header:  [Badge] [Team Name]  [Score top-right]
//   Rows:    Name | Dismissal info | R | B
//   NOT OUT rows highlighted with accent colour
//   Footer:  Extras breakdown  |  Overs  |  Total
//
// Only batted players show stats. Yet-to-bat listed plainly.

// ═══════════════════════════════════════════════════════════
// OVERLAY 3: BATTING CARD  — broadcast scorecard style
// ═══════════════════════════════════════════════════════════

function dismissalText(p: PlayerStats): string {
  const d = p.wicketDetails;
  if (!d) return "";
  if (d.dismissalType === "Bowled") return `b ${d.bowlerId?.name ?? ""}`;
  if (d.dismissalType === "Caught")
    return `c ${d.catcherId?.name ?? ""} b ${d.bowlerId?.name ?? ""}`;
  if (d.dismissalType === "LBW") return `lbw b ${d.bowlerId?.name ?? ""}`;
  if (d.dismissalType === "Run Out") return `run out`;
  return d.dismissalType;
}

function BattingCard({
  team,
  state,
}: {
  team: TeamDetails;
  state: MatchState;
}) {
  const battingFirstName = state.battingFirst?.name;
  const isInnings1Team = team.name === battingFirstName;
  const rawOrder: PlayerStats[] =
    (isInnings1Team
      ? (state as any).team1BattingOrder
      : (state as any).team2BattingOrder) || [];

  const strikerId = state.currentStriker?.playerId;
  const nonStrikerId = state.currentNonStriker?.playerId;
  const actualWickets = team.wickets;

  // ── 1. Deduplicate by playerId, keeping first occurrence (arrival order) ──
  const seenIds = new Set<string>();
  const dedupedOrder: PlayerStats[] = [];
  for (const p of rawOrder) {
    if (!seenIds.has(p.playerId)) {
      seenIds.add(p.playerId);
      dedupedOrder.push(p);
    }
  }

  // ── 2. Clear wicketDetails for anyone currently at crease ──
  // currentStriker/NonStriker is ground truth — overrides any stale backend data
  let dismissedCount = 0;
  const battedPlayers = dedupedOrder.map((p) => {
    const isAtCrease = p.playerId === strikerId || p.playerId === nonStrikerId;

    // Rule a: at crease = not out, clear stale wicketDetails
    if (isAtCrease) return { ...p, wicketDetails: null };

    // Rule b: cap dismissals at actual wicket count
    if (p.wicketDetails) {
      if (dismissedCount < actualWickets) {
        dismissedCount++;
        return p; // legitimate dismissal
      } else {
        return { ...p, wicketDetails: null }; // stale — undo cleared this wicket
      }
    }

    return p;
  });
  const battedIds = new Set(battedPlayers.map((p) => p.playerId));

  // ── 3. Yet-to-bat from playingXI, in squad order ──
  const yetToBat = team.playingXI.filter((p) => !battedIds.has(p.playerId));

  // ── 4. Final list ──
  const players = [...battedPlayers, ...yetToBat].slice(0, 11);

  const totalExtras = team.extras
    ? team.extras.wide +
      team.extras.noBall +
      team.extras.bye +
      team.extras.legBye +
      team.extras.penalty
    : 0;

  const ROW_H = 46;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 1100,
        animation: "scaleIn 0.45s cubic-bezier(0.16,1,0.3,1) both",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          background: "rgba(6,8,16,0.98)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 10,
          overflow: "hidden",
          boxShadow: "0 40px 100px rgba(0,0,0,0.9)",
        }}
      >
        <div
          style={{
            height: 4,
            background: `linear-gradient(90deg, ${C.blue}, ${C.gold} 50%, ${C.blue})`,
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 32px",
            background:
              "linear-gradient(135deg, rgba(74,158,245,0.13) 0%, transparent 60%)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <TeamBadge
              name={team.name}
              logoUrl={team.logoUrl}
              size={52}
              accent={C.blue}
              accentBg={C.blueDim}
            />
            <div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: C.blue,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  marginBottom: 3,
                }}
              >
                BATTING
              </div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: C.white,
                  fontWeight: 900,
                  fontSize: 30,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  lineHeight: 1,
                }}
              >
                {team.name}
              </div>
            </div>
          </div>
          {(team.score > 0 || team.wickets > 0) && (
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: C.blue,
                  fontWeight: 900,
                  fontSize: 44,
                  lineHeight: 1,
                }}
              >
                {team.score}/{team.wickets}
              </div>
              <div
                style={{
                  color: C.w35,
                  fontSize: 14,
                  fontWeight: 500,
                  marginTop: 2,
                }}
              >
                {team.overs} overs
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: 36,
            padding: "0 32px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(0,0,0,0.4)",
          }}
        >
          <div style={{ width: 28, flexShrink: 0 }} />
          <div
            style={{
              flex: 1,
              fontFamily: "'Barlow Condensed', sans-serif",
              color: C.w35,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 2.5,
              textTransform: "uppercase",
            }}
          >
            BATTER
          </div>
          <div
            style={{
              width: 260,
              fontFamily: "'Barlow Condensed', sans-serif",
              color: C.w35,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 2.5,
              textTransform: "uppercase",
            }}
          ></div>
          {["R", "B", "4s", "6s", "SR"].map((h) => (
            <div
              key={h}
              style={{
                width: h === "SR" ? 76 : 56,
                textAlign: "right",
                fontFamily: "'Barlow Condensed', sans-serif",
                color: C.w35,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 2.5,
                textTransform: "uppercase",
              }}
            >
              {h}
            </div>
          ))}
        </div>

        <div>
          {players.map((p, i) => {
            const isStriker = strikerId === p.playerId;
            const isNonStriker = nonStrikerId === p.playerId;
            const isAtCrease = isStriker || isNonStriker;
            const isOut = !!p.wicketDetails && !isAtCrease;
            const hasBat = (p.ballsFaced ?? 0) > 0;
            const isNotOut = isAtCrease || (!isOut && hasBat);
            const isCap = p.playerId === team.captainId;

            const rowBg = isAtCrease
              ? "rgba(52,211,153,0.05)"
              : i % 2 === 0
                ? C.w04
                : "transparent";

            return (
              <div
                key={`${p.playerId}-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  minHeight: ROW_H,
                  padding: "0 32px",
                  background: rowBg,
                  borderBottom:
                    i < players.length - 1
                      ? "1px solid rgba(255,255,255,0.04)"
                      : "none",
                  opacity: isOut ? 0.52 : 1,
                }}
              >
                <div
                  style={{
                    width: 28,
                    flexShrink: 0,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: C.w20,
                    fontSize: 12,
                    fontWeight: 800,
                    textAlign: "right",
                    paddingRight: 10,
                  }}
                >
                  {i + 1}
                </div>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    overflow: "hidden",
                  }}
                >
                  {isAtCrease && (
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: isStriker ? C.gold : C.w35,
                        boxShadow: isStriker ? `0 0 5px ${C.gold}` : "none",
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      color: isNotOut ? C.white : C.w80,
                      fontWeight: isNotOut ? 800 : 700,
                      fontSize: 17,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.name}
                  </span>
                  {isCap && (
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: 9,
                        fontWeight: 900,
                        color: C.gold,
                        border: `1px solid ${C.goldDim}`,
                        borderRadius: 2,
                        padding: "1px 5px",
                        letterSpacing: 1.5,
                        flexShrink: 0,
                      }}
                    >
                      C
                    </span>
                  )}
                </div>
                <div
                  style={{
                    width: 260,
                    flexShrink: 0,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: isNotOut ? "#34D399" : C.w35,
                    letterSpacing: isNotOut ? 1 : 0,
                    textTransform: isNotOut ? "uppercase" : "none",
                  }}
                >
                  {isOut ? dismissalText(p) : isNotOut ? "NOT OUT" : ""}
                </div>
                {hasBat || isAtCrease ? (
                  <>
                    <div
                      style={{
                        width: 56,
                        textAlign: "right",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 900,
                        fontSize: 18,
                        color: C.blue,
                        flexShrink: 0,
                      }}
                    >
                      {p.runs ?? 0}
                    </div>
                    <div
                      style={{
                        width: 56,
                        textAlign: "right",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700,
                        fontSize: 17,
                        color: C.w80,
                        flexShrink: 0,
                      }}
                    >
                      {p.ballsFaced ?? 0}
                    </div>
                    <div
                      style={{
                        width: 56,
                        textAlign: "right",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700,
                        fontSize: 17,
                        color: C.w80,
                        flexShrink: 0,
                      }}
                    >
                      {p.fours ?? 0}
                    </div>
                    <div
                      style={{
                        width: 56,
                        textAlign: "right",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700,
                        fontSize: 17,
                        color: C.w80,
                        flexShrink: 0,
                      }}
                    >
                      {p.sixes ?? 0}
                    </div>
                    <div
                      style={{
                        width: 76,
                        textAlign: "right",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700,
                        fontSize: 15,
                        color: C.w55,
                        flexShrink: 0,
                      }}
                    >
                      {fmtSR(p.strikeRate ?? 0)}
                    </div>
                  </>
                ) : (
                  [56, 56, 56, 56, 76].map((w, j) => (
                    <div
                      key={j}
                      style={{
                        width: w,
                        textAlign: "right",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700,
                        fontSize: 17,
                        color: "rgba(255,255,255,0.15)",
                        flexShrink: 0,
                      }}
                    >
                      —
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 32px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(0,0,0,0.45)",
            gap: 0,
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}
          >
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: C.w35,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Extras
            </span>
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: C.w80,
                fontSize: 17,
                fontWeight: 900,
              }}
            >
              {totalExtras}
            </span>
            {team.extras && (
              <span
                style={{
                  color: C.w35,
                  fontSize: 12,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 600,
                }}
              >
                (w {team.extras.wide}, nb {team.extras.noBall}, b{" "}
                {team.extras.bye}, lb {team.extras.legBye})
              </span>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0 32px",
              borderLeft: "1px solid rgba(255,255,255,0.07)",
              borderRight: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: C.w35,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Overs
            </span>
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: C.w80,
                fontSize: 17,
                fontWeight: 900,
              }}
            >
              {team.overs}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              paddingLeft: 32,
            }}
          >
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: C.w35,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Total
            </span>
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: C.gold,
                fontSize: 22,
                fontWeight: 900,
                letterSpacing: -0.5,
              }}
            >
              {team.score}/{team.wickets}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// OVERLAY 4: BOWLING CARD — broadcast scorecard style
// ═══════════════════════════════════════════════════════════
//
// Only shows players who have actually bowled (ballsBowled > 0 || wicketsTaken > 0).
// Columns: Player | O | R | W | ECON
// Current bowler row highlighted.
// Footer: team score context.

// ═══════════════════════════════════════════════════════════
// OVERLAY 4: BOWLING CARD — broadcast scorecard style
// ═══════════════════════════════════════════════════════════

function BowlingCard({
  team,
  bowlingTeam,
  state,
}: {
  team: TeamDetails;
  bowlingTeam: TeamDetails;
  state: MatchState;
    }) {
    
  const isTeam1 = team.name === state.team1.name;
  const bowlingOrderArr =
    (isTeam1 ? state.team1BowlingOrder : state.team2BowlingOrder) || [];

  // 🔥 FIX: Force the active bowler into the list even if they haven't bowled a delivery yet
  const isActiveBowlTeam = team.name === getBowlTeam(state).name;
  const activeBowlerId = isActiveBowlTeam
    ? state.currentBowler?.playerId
    : null;

  const placedIds = new Set<string>();
  const orderedBowlers: PlayerStats[] = [];

  bowlingOrderArr.forEach((p) => {
    if ((p.ballsBowled ?? 0) > 0 || (p.wicketsTaken ?? 0) > 0) {
      orderedBowlers.push(p);
      placedIds.add(p.playerId);
    }
  });

  if (activeBowlerId && !placedIds.has(activeBowlerId)) {
    const baseProfile = team.playingXI.find(
      (p) => p.playerId === activeBowlerId,
    );
    if (baseProfile) {
      orderedBowlers.push({
        ...baseProfile,
        overs: 0,
        ballsBowled: 0,
        runsConceded: 0,
        wicketsTaken: 0,
        economyRate: 0,
      });
      placedIds.add(activeBowlerId);
    }
  }

  const bowlers = orderedBowlers.sort(
    (a, b) => (b.ballsBowled || 0) - (a.ballsBowled || 0),
  );

  const currentBowlerId = state.currentBowler?.playerId;
  const ROW_H = 50;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 900,
        animation: "scaleIn 0.45s cubic-bezier(0.16,1,0.3,1) both",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          background: "rgba(6,8,16,0.98)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 10,
          overflow: "hidden",
          boxShadow: "0 40px 100px rgba(0,0,0,0.9)",
        }}
      >
        <div
          style={{
            height: 4,
            background: `linear-gradient(90deg, ${C.purple}, ${C.gold} 50%, ${C.purple})`,
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 32px",
            background:
              "linear-gradient(135deg, rgba(168,85,247,0.12) 0%, transparent 60%)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <TeamBadge
              name={team.name}
              logoUrl={team.logoUrl}
              size={52}
              accent={C.purple}
              accentBg={C.purpleDim}
            />
            <div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: C.purple,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  marginBottom: 3,
                }}
              >
                BOWLING
              </div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: C.white,
                  fontWeight: 900,
                  fontSize: 30,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  lineHeight: 1,
                }}
              >
                {team.name}
              </div>
            </div>
          </div>
          {(() => {
            const batTeam = getBatTeam(state);
            return batTeam.score > 0 || batTeam.wickets > 0 ? (
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    color: C.w35,
                    fontSize: 11,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    marginBottom: 2,
                  }}
                >
                  {batTeam.name}
                </div>
                <div
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: C.w80,
                    fontWeight: 900,
                    fontSize: 28,
                    lineHeight: 1,
                  }}
                >
                  {batTeam.score}/{batTeam.wickets}{" "}
                  <span style={{ color: C.w35, fontSize: 15, fontWeight: 600 }}>
                    ({batTeam.overs})
                  </span>
                </div>
              </div>
            ) : null;
          })()}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: 36,
            padding: "0 32px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(0,0,0,0.4)",
          }}
        >
          <div
            style={{
              flex: 1,
              fontFamily: "'Barlow Condensed', sans-serif",
              color: C.w35,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 2.5,
              textTransform: "uppercase",
            }}
          >
            BOWLER
          </div>
          {[
            { h: "O", w: 80 },
            { h: "R", w: 72 },
            { h: "W", w: 64 },
            { h: "ECON", w: 90 },
          ].map(({ h, w }) => (
            <div
              key={h}
              style={{
                width: w,
                textAlign: "right",
                fontFamily: "'Barlow Condensed', sans-serif",
                color: C.w35,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 2.5,
                textTransform: "uppercase",
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {bowlers.length === 0 ? (
          <div
            style={{
              padding: "32px",
              textAlign: "center",
              color: C.w35,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 14,
              letterSpacing: 1,
            }}
          >
            NO OVERS BOWLED YET
          </div>
        ) : (
          <div>
            {bowlers.map((p, i) => {
              const isCurrent = p.playerId === currentBowlerId;
              const isCap = p.playerId === team.captainId;

              return (
                <div
                  key={p.playerId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: ROW_H,
                    padding: "0 32px",
                    background: isCurrent
                      ? "rgba(168,85,247,0.08)"
                      : i % 2 === 0
                        ? C.w04
                        : "transparent",
                    borderBottom:
                      i < bowlers.length - 1
                        ? "1px solid rgba(255,255,255,0.04)"
                        : "none",
                    borderLeft: isCurrent
                      ? `3px solid ${C.purple}`
                      : "3px solid transparent",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      overflow: "hidden",
                    }}
                  >
                    {isCurrent && (
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          flexShrink: 0,
                          background: C.purple,
                          boxShadow: `0 0 6px ${C.purple}`,
                        }}
                      />
                    )}
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        color: isCurrent ? C.white : C.w80,
                        fontWeight: isCurrent ? 800 : 700,
                        fontSize: 17,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.name}
                    </span>
                    {isCap && (
                      <span
                        style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontSize: 9,
                          fontWeight: 900,
                          color: C.gold,
                          border: `1px solid ${C.goldDim}`,
                          borderRadius: 2,
                          padding: "1px 5px",
                          letterSpacing: 1.5,
                          flexShrink: 0,
                        }}
                      >
                        C
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      width: 80,
                      textAlign: "right",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: 17,
                      color: C.w80,
                      flexShrink: 0,
                    }}
                  >
                    {fmtOv(p.overs ?? 0)}
                  </div>
                  <div
                    style={{
                      width: 72,
                      textAlign: "right",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: 17,
                      color: C.w80,
                      flexShrink: 0,
                    }}
                  >
                    {p.runsConceded ?? 0}
                  </div>
                  <div
                    style={{
                      width: 64,
                      textAlign: "right",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: (p.wicketsTaken ?? 0) > 0 ? 900 : 700,
                      fontSize: 18,
                      color: (p.wicketsTaken ?? 0) > 0 ? C.purple : C.w80,
                      flexShrink: 0,
                    }}
                  >
                    {p.wicketsTaken ?? 0}
                  </div>
                  <div
                    style={{
                      width: 90,
                      textAlign: "right",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: 16,
                      color: C.w55,
                      flexShrink: 0,
                    }}
                  >
                    {fmtEcon(p.economyRate ?? 0)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 32px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(0,0,0,0.45)",
            gap: 0,
          }}
        >
          <div
            style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}
          >
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: C.w35,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Overs
            </span>
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: C.w80,
                fontSize: 17,
                fontWeight: 900,
              }}
            >
              {getBatTeam(state).overs} / {state.totalOvers}
            </span>
          </div>
          {(() => {
            const batTeam = getBatTeam(state);
            const extras = batTeam.extras;
            const total = extras
              ? extras.wide +
                extras.noBall +
                extras.bye +
                extras.legBye +
                extras.penalty
              : 0;
            return total > 0 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "0 32px",
                  borderLeft: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: C.w35,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                  }}
                >
                  Extras
                </span>
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: C.w80,
                    fontSize: 17,
                    fontWeight: 900,
                  }}
                >
                  {total}
                </span>
              </div>
            ) : null;
          })()}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// OVERLAY 5: MATCH SUMMARY CARD
// ═══════════════════════════════════════════════════════════

function MatchSummaryCard({ state }: { state: MatchState }) {
 
  // ── Innings mapping ──────────────────────────────────────────────
  // team1BattingOrder = innings 1 (battingFirst's batters)
  // team1BowlingOrder = innings 1 bowlers (battingFirst's opposition)
  // team2BattingOrder = innings 2 (battingSecond's batters)
  // team2BowlingOrder = innings 2 bowlers (battingSecond's opposition)

  // ── Innings mapping ──────────────────────────────────────────────
  const inn1BatTeam =
    state.battingFirst?.name === state.team1.name ? state.team1 : state.team2;
  const inn1BowlTeam =
    inn1BatTeam.name === state.team1.name ? state.team2 : state.team1;
  const inn2BatTeam = inn1BowlTeam;
    const inn2BowlTeam = inn1BatTeam;
    const strikerId = state.currentStriker?.playerId;
    const nonStrikerId = state.currentNonStriker?.playerId;
    
  const inn1Batters: PlayerStats[] = ((state as any).team1BattingOrder ?? [])
    .filter((p: PlayerStats) => p.ballsFaced > 0)
    .map((p: PlayerStats) => {
      const live = inn1BatTeam.playingXI.find((x) => x.playerId === p.playerId);
      const enriched = live ?? p;
      const isAtCrease =
        enriched.playerId === strikerId || enriched.playerId === nonStrikerId;
      return isAtCrease ? { ...enriched, wicketDetails: null } : enriched;
    })
    .sort((a: PlayerStats, b: PlayerStats) => b.runs - a.runs)
    .slice(0, 4);

  const inn1Bowlers: PlayerStats[] = ((state as any).team1BowlingOrder ?? [])
    .sort(
      (a: PlayerStats, b: PlayerStats) =>
        b.wicketsTaken - a.wicketsTaken || a.economyRate - b.economyRate,
    )
    .slice(0, 4);
    console.log(
      "NOT_OUT_DEBUG",
      JSON.stringify(
        {
          currentStriker: state.currentStriker,
          currentNonStriker: state.currentNonStriker,
          team2BattingOrder: (state as any).team2BattingOrder?.map(
            (p: any) => ({
              name: p.name,
              runs: p.runs,
              balls: p.ballsFaced,
              out: !!p.wicketDetails,
              wicketType: p.wicketDetails?.dismissalType,
            }),
          ),
          inn2PlayingXI: inn2BatTeam.playingXI?.map((p) => ({
            name: p.name,
            runs: p.runs,
            balls: p.ballsFaced,
            out: !!p.wicketDetails,
          })),
          wickets: inn2BatTeam.wickets,
        },
        null,
        2,
      ),
    );

  const inn2Batters: PlayerStats[] = ((state as any).team2BattingOrder ?? [])
    .filter((p: PlayerStats) => p.ballsFaced > 0)
    .map((p: PlayerStats) => {
      const live = inn2BatTeam.playingXI.find((x) => x.playerId === p.playerId);
      const enriched = live ?? p;
      const isAtCrease =
        enriched.playerId === strikerId || enriched.playerId === nonStrikerId;
      return isAtCrease ? { ...enriched, wicketDetails: null } : enriched;
    })
    .sort((a: PlayerStats, b: PlayerStats) => b.runs - a.runs)
    .slice(0, 4);

  const inn2Bowlers: PlayerStats[] = ((state as any).team2BowlingOrder ?? [])
    .sort(
      (a: PlayerStats, b: PlayerStats) =>
        b.wicketsTaken - a.wicketsTaken || a.economyRate - b.economyRate,
    )
    .slice(0, 4);

  const showInnings2 =
    !state.firstInnings || inn2Batters.length > 0 || inn2Bowlers.length > 0;

  // ── Bottom status bar ────────────────────────────────────────────
  function statusBar() {
    if (state.matchComplete && state.winner) {
      return {
        text: `${state.winner.toUpperCase()} WON`,
        sub: state.winBy ? state.winBy.toUpperCase() : "",
        isResult: true,
      };
    }
    const bat = getBatTeam(state);
    const bowl = getBowlTeam(state);
    const crr = bat.overs > 0 ? (bat.score / bat.overs).toFixed(2) : "0.00";
    if (!state.firstInnings) {
      const target = bowl.score + 1;
      const runsNeeded = Math.max(0, target - bat.score);
      const ballsLeft = Math.max(
        0,
        Math.round((state.totalOvers - bat.overs) * 6),
      );
      const rrr =
        ballsLeft > 0 ? ((runsNeeded / ballsLeft) * 6).toFixed(2) : "—";
      return {
        text: `${bat.name.toUpperCase()} NEED ${runsNeeded} OFF ${ballsLeft} BALLS`,
        sub: `RRR  ${rrr}`,
        isResult: false,
      };
    }
    return {
      text: `${bat.name.toUpperCase()} — INNINGS IN PROGRESS`,
      sub: `CRR  ${crr}`,
      isResult: false,
    };
  }
  const bar = statusBar();

  // ── Innings panel component ──────────────────────────────────────
  function InningsPanel({
    inningsNum,
    batTeam,
    bowlTeam,
    batters,
    bowlers,
    accent,
  }: {
    inningsNum: number;
    batTeam: TeamDetails;
    bowlTeam: TeamDetails;
    batters: PlayerStats[];
    bowlers: PlayerStats[];
    accent: string;
  }) {
    const ROW_H = 38;
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        {/* Innings header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 28px",
            background: "rgba(0,0,0,0.3)",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: C.gold,
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 3,
                textTransform: "uppercase",
                border: `1px solid ${C.goldDim}`,
                borderRadius: 3,
                padding: "2px 8px",
              }}
            >
              {inningsNum === 1 ? "1ST INNINGS" : "2ND INNINGS"}
            </span>
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: C.white,
                fontSize: 18,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {batTeam.name}
            </span>
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: accent,
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              {batTeam.score}/{batTeam.wickets}
            </span>
            <span style={{ color: C.w35, fontSize: 13, fontWeight: 500 }}>
              ({batTeam.overs} ov)
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                color: C.w35,
                fontSize: 12,
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              vs
            </span>
            <TeamBadge
              name={bowlTeam.name}
              logoUrl={bowlTeam.logoUrl}
              size={28}
              accent={accent === C.blue ? C.purple : C.blue}
              accentBg={accent === C.blue ? C.purpleDim : C.blueDim}
            />
            <span
              style={{
                color: C.w55,
                fontSize: 14,
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {bowlTeam.name}
            </span>
          </div>
        </div>

        {/* Stats columns */}
        <div style={{ display: "flex" }}>
          {/* BATTERS */}
          <div style={{ flex: 1, borderRight: `1px solid ${C.border}` }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 20px",
                borderBottom: `1px solid rgba(255,255,255,0.05)`,
                background: "rgba(0,0,0,0.25)",
              }}
            >
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: C.w35,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 2.5,
                  textTransform: "uppercase",
                }}
              >
                Batter
              </span>
              <div style={{ display: "flex", gap: 16 }}>
                {["R", "B", "SR"].map((h) => (
                  <span
                    key={h}
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      color: C.w35,
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      width: 36,
                      textAlign: "right",
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
            {batters.length === 0 ? (
              <div
                style={{
                  padding: "14px 20px",
                  color: C.w20,
                  fontSize: 12,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  letterSpacing: 1,
                }}
              >
                NO BATTING DATA
              </div>
            ) : (
              batters.map((p, i) => {
                const isNotOut = !p.wicketDetails;
                return (
                  <div
                    key={p.playerId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      height: ROW_H,
                      padding: "0 20px",
                      background:
                        i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
                      borderBottom:
                        i < batters.length - 1
                          ? `1px solid rgba(255,255,255,0.04)`
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flex: 1,
                        overflow: "hidden",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          color: isNotOut ? C.white : C.w80,
                          fontWeight: 700,
                          fontSize: 15,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.name}
                      </span>
                      {isNotOut && (
                        <span
                          style={{
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontSize: 9,
                            color: "#34D399",
                            border: "1px solid rgba(52,211,153,0.3)",
                            borderRadius: 2,
                            padding: "1px 4px",
                            letterSpacing: 1,
                            flexShrink: 0,
                          }}
                        >
                          *
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                      <span
                        style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          color: accent,
                          fontWeight: 900,
                          fontSize: 16,
                          width: 36,
                          textAlign: "right",
                        }}
                      >
                        {p.runs}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          color: C.w55,
                          fontWeight: 700,
                          fontSize: 15,
                          width: 36,
                          textAlign: "right",
                        }}
                      >
                        {p.ballsFaced}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          color: C.w35,
                          fontWeight: 700,
                          fontSize: 13,
                          width: 36,
                          textAlign: "right",
                        }}
                      >
                        {fmtSR(p.strikeRate)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* BOWLERS */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 20px",
                borderBottom: `1px solid rgba(255,255,255,0.05)`,
                background: "rgba(0,0,0,0.25)",
              }}
            >
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: C.w35,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 2.5,
                  textTransform: "uppercase",
                }}
              >
                Bowler
              </span>
              <div style={{ display: "flex", gap: 16 }}>
                {["W-R", "O", "ECO"].map((h) => (
                  <span
                    key={h}
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      color: C.w35,
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      width: 36,
                      textAlign: "right",
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
            {bowlers.length === 0 ? (
              <div
                style={{
                  padding: "14px 20px",
                  color: C.w20,
                  fontSize: 12,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  letterSpacing: 1,
                }}
              >
                NO BOWLING DATA
              </div>
            ) : (
              bowlers.map((p, i) => (
                <div
                  key={p.playerId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: ROW_H,
                    padding: "0 20px",
                    background:
                      i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
                    borderBottom:
                      i < bowlers.length - 1
                        ? `1px solid rgba(255,255,255,0.04)`
                        : "none",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      color: C.w80,
                      fontWeight: 700,
                      fontSize: 15,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                      paddingRight: 12,
                    }}
                  >
                    {p.name}
                  </span>
                  <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        color: p.wicketsTaken > 0 ? accent : C.w55,
                        fontWeight: p.wicketsTaken > 0 ? 900 : 700,
                        fontSize: 16,
                        width: 36,
                        textAlign: "right",
                      }}
                    >
                      {p.wicketsTaken}-{p.runsConceded}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        color: C.w55,
                        fontWeight: 700,
                        fontSize: 15,
                        width: 36,
                        textAlign: "right",
                      }}
                    >
                      {fmtOv(p.overs)}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        color: C.w35,
                        fontWeight: 700,
                        fontSize: 13,
                        width: 36,
                        textAlign: "right",
                      }}
                    >
                      {fmtEcon(p.economyRate)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 1460,
        animation: "scaleIn 0.45s cubic-bezier(0.16,1,0.3,1) both",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          background: "rgba(6,8,16,0.98)",
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          overflow: "hidden",
          boxShadow: "0 40px 100px rgba(0,0,0,0.9)",
        }}
      >
        <div
          style={{
            height: 4,
            background: `linear-gradient(90deg, ${C.blue}, ${C.gold} 50%, ${C.purple})`,
          }}
        />

        {/* Title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px 36px",
            borderBottom: `1px solid ${C.border}`,
            background: "rgba(0,0,0,0.3)",
            gap: 16,
          }}
        >
          <div
            style={{
              height: 1,
              flex: 1,
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.12))",
            }}
          />
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              color: C.gold,
              fontWeight: 900,
              fontSize: 18,
              letterSpacing: 5,
              textTransform: "uppercase",
            }}
          >
            Match Summary
          </span>
          <div
            style={{
              height: 1,
              flex: 1,
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.12), transparent)",
            }}
          />
        </div>

        {/* Innings 1 */}
        <InningsPanel
          inningsNum={1}
          batTeam={inn1BatTeam}
          bowlTeam={inn1BowlTeam}
          batters={inn1Batters}
          bowlers={inn1Bowlers}
          accent={C.blue}
        />

        {/* Innings 2 — only show if in progress or complete */}
        {showInnings2 && (
          <InningsPanel
            inningsNum={2}
            batTeam={inn2BatTeam}
            bowlTeam={inn2BowlTeam}
            batters={inn2Batters}
            bowlers={inn2Bowlers}
            accent={C.purple}
          />
        )}

        {/* Status bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 36px",
            background: state.matchComplete
              ? "linear-gradient(90deg, rgba(226,185,75,0.15), rgba(226,185,75,0.08), rgba(226,185,75,0.15))"
              : "rgba(0,0,0,0.4)",
          }}
        >
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              color: state.matchComplete ? C.gold : C.white,
              fontWeight: 900,
              fontSize: state.matchComplete ? 20 : 15,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {bar.text}
          </span>
          {bar.sub && (
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: C.gold,
                fontWeight: 900,
                fontSize: 16,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              {bar.sub}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ROOT PAGE
// ═══════════════════════════════════════════════════════════

export default function ObsOverlayPage() {
  const params = useParams();
  const matchId = params?.matchId as string;

  const [info, setInfo] = useState<MatchInfo | null>(null);
  const [liveState, setLiveState] = useState<MatchState | null>(null);
  const [streamState, setStreamState] = useState<StreamState>({
    activeBanner: "none",
    templateId: null,
  });

  // Scale the 1920×1080 canvas to fit whatever the actual browser viewport is.
  // This is the reliable way to handle OBS browser source at any configured size.
  const [scale, setScale] = useState(1);
  useEffect(() => {
    function calc() {
      const sx = window.innerWidth / W;
      const sy = window.innerHeight / H;
      setScale(Math.min(sx, sy));
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  useEffect(() => {
    if (!matchId) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    Promise.all([
      fetchMatchById(matchId),
      fetchMatchState(matchId),
      fetchStreamState(matchId),
    ])
      .then(([rawMatch, state, stream]) => {
        const m = rawMatch?.data || rawMatch;
        const s = state?.data || state;
        const st = stream;

        setInfo({
          id: m?.matchId || m?.id,
          venue: m?.venue || "",
          matchDate: m?.matchDate,
          matchTime: m?.matchTime,
          stage: m?.stage,
          overs: m?.overs || 0,
          tournamentName:
            m?.tournamentResponse?.name || m?.tournamentName || null,
          team1: { name: s?.team1?.name || "Team 1", logoPath: null },
          team2: { name: s?.team2?.name || "Team 2", logoPath: null },
        });

        setLiveState(s);
        setStreamState({
          activeBanner: st?.activeBanner || "none",
          templateId: st?.activeTemplateId || null,
        });
      })
      .catch((err) => console.error("OBS Fetch Error:", err));

    const stompClient = new Client({
      webSocketFactory: () => new SockJS(`${API_URL}/ws`),
      reconnectDelay: 5000,
      onConnect: () => {
        stompClient.subscribe(`/topic/stream/${matchId}`, (msg) => {
          try {
            const d = JSON.parse(msg.body);
            setStreamState({
              activeBanner: d.activeBanner,
              templateId: d.activeTemplateId,
            });
          } catch (e) {
            console.error("Banner parse:", e);
          }
        });
        stompClient.subscribe(`/topic/match/${matchId}`, async (msg) => {
          try {
            const parsed = JSON.parse(msg.body);
            const d = parsed.payload ? parsed.payload : parsed;
            if (d?.team1 && d?.team2) {
              setLiveState(d);
            } else {
              const full = await fetchMatchState(matchId);
              setLiveState(full.data || full);
            }
          } catch (e) {
            console.error("Score parse:", e);
          }
        });
      },
    });
    stompClient.activate();
    return () => {
      stompClient.deactivate();
    };
  }, [matchId]);

  if (!info || !liveState) return null;

  const batTeam = getBatTeam(liveState);
  const bowlTeam = getBowlTeam(liveState);

  return (
    <>
      {/*
                Outer wrapper fills the real browser viewport (whatever OBS sets).
                Inner canvas is always exactly 1920×1080, then CSS-scaled to fit.
                Result: overlays are always full-size relative to the stream canvas.
            */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: W,
            height: H,
            position: "relative",
            flexShrink: 0,
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            background: "transparent",
            overflow: "hidden",
            fontFamily: "'DM Sans', sans-serif",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
          }}
        >
          {streamState.activeBanner === "score" && (
            <ScoreOverlay state={liveState} />
          )}
          {streamState.activeBanner === "main" && (
            <MainMatchBanner info={info} state={liveState} />
          )}
          {streamState.activeBanner === "playingXI_bat" && (
            <BattingCard team={batTeam} state={liveState} />
          )}
          {streamState.activeBanner === "playingXI_bowl" && (
            <BowlingCard
              team={bowlTeam}
              bowlingTeam={bowlTeam}
              state={liveState}
            />
          )}
          {streamState.activeBanner === "summary" && (
            <MatchSummaryCard
              state={liveState}
              key={`${liveState.team1.score}-${liveState.team2.score}-${liveState.team1.wickets}-${liveState.team2.wickets}`}
            />
          )}
          {streamState.activeBanner.startsWith("tpl-") && (
            <ScoreOverlay
              state={liveState}
              key={`${liveState.team1.score}-${liveState.team2.score}-${liveState.team1.wickets}-${liveState.team2.wickets}`}
            />
          )}
        </div>
      </div>

      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');

                *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
                html, body {
                    background: transparent !important;
                    overflow: hidden;
                    width: 100vw; height: 100vh;
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(28px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: translate(-50%, calc(-50% + 22px)) scale(0.97); }
                    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
            `}</style>
    </>
  );
}
