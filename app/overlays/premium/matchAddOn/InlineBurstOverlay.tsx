"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════
// TYPES
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
  logoUrl: string | null;
  playingXI: PlayerStats[];
  score: number;
  wickets: number;
  overs: number;
  extras: any | null;
}
interface MatchState {
  matchId: string;
  team1: TeamDetails;
  team2: TeamDetails;
  firstInnings: boolean;
  totalOvers: number;
  completedOvers: number;
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

type EventType = "SIX" | "FOUR" | "WICKET" | "FIFTY" | "HUNDRED" | null;

interface BallEvent {
  type: EventType;
  playerName: string;
  label: string;
  subLabel: string;
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

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
const fmtOv = (v: number) => (v > 0 ? v.toFixed(1) : "0.0");

function detectEvent(
  prev: MatchState | null,
  curr: MatchState,
): BallEvent | null {
  if (!prev || !curr.currentOverBalls?.length) return null;
  const prevBalls = prev.currentOverBalls ?? [];
  const currBalls = curr.currentOverBalls ?? [];
  if (
    currBalls.length <= prevBalls.length &&
    curr.completedOvers === prev.completedOvers
  )
    return null;

  const lastBall = currBalls[currBalls.length - 1];
  const bat = getBatTeam(curr);
  const strikerName =
    curr.currentStriker?.name ?? curr.currentNonStriker?.name ?? "Batter";

  const batOrder = curr.firstInnings
    ? (curr as any).team1BattingOrder
    : (curr as any).team2BattingOrder;
  const prevBatOrder = prev.firstInnings
    ? (prev as any).team1BattingOrder
    : (prev as any).team2BattingOrder;
  if (batOrder && prevBatOrder) {
    for (const player of batOrder) {
      const prevPlayer = prevBatOrder.find(
        (p: PlayerStats) => p.playerId === player.playerId,
      );
      if (!prevPlayer) continue;
      if (prevPlayer.runs < 100 && player.runs >= 100)
        return {
          type: "HUNDRED",
          playerName: player.name,
          label: "CENTURY!",
          subLabel: `${player.runs} off ${player.ballsFaced}`,
        };
      if (prevPlayer.runs < 50 && player.runs >= 50 && player.runs < 100)
        return {
          type: "FIFTY",
          playerName: player.name,
          label: "FIFTY!",
          subLabel: `${player.runs} off ${player.ballsFaced}`,
        };
    }
  }

  if (lastBall === "W")
    return {
      type: "WICKET",
      playerName: curr.currentBowler?.name ?? "Bowler",
      label: "WICKET!",
      subLabel: `${bat.wickets} down`,
    };
  if (lastBall === "6")
    return {
      type: "SIX",
      playerName: strikerName,
      label: "SIX!",
      subLabel: `${bat.score}/${bat.wickets}`,
    };
  if (lastBall === "4")
    return {
      type: "FOUR",
      playerName: strikerName,
      label: "FOUR!",
      subLabel: `${bat.score}/${bat.wickets}`,
    };
  return null;
}

const EV_CFG: Record<
  NonNullable<EventType>,
  { color: string; glow: string; beam: string; icon: string }
> = {
  SIX: {
    color: "#FFD700",
    glow: "rgba(255,215,0,0.7)",
    beam: "rgba(255,215,0,0.18)",
    icon: "6",
  },
  FOUR: {
    color: "#00D4FF",
    glow: "rgba(0,212,255,0.6)",
    beam: "rgba(0,212,255,0.15)",
    icon: "4",
  },
  WICKET: {
    color: "#FF4444",
    glow: "rgba(255,68,68,0.7)",
    beam: "rgba(255,68,68,0.18)",
    icon: "W",
  },
  FIFTY: {
    color: "#E8E8E8",
    glow: "rgba(232,232,232,0.5)",
    beam: "rgba(232,232,232,0.12)",
    icon: "50",
  },
  HUNDRED: {
    color: "#FFD700",
    glow: "rgba(255,215,0,0.8)",
    beam: "rgba(255,215,0,0.22)",
    icon: "100",
  },
};

// ═══════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════

export default function InlineBurstOverlay({ state }: { state: MatchState }) {
  const [event, setEvent] = useState<BallEvent | null>(null);
  const [phase, setPhase] = useState<"idle" | "beaming" | "hold" | "fadeout">(
    "idle",
  );
  const prevStateRef = useRef<MatchState | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const triggerEvent = useCallback((ev: BallEvent) => {
    clearTimers();
    setEvent(ev);
    setPhase("beaming");
    timers.current.push(setTimeout(() => setPhase("hold"), 500));
    timers.current.push(setTimeout(() => setPhase("fadeout"), 2800));
    timers.current.push(
      setTimeout(() => {
        setPhase("idle");
        setEvent(null);
      }, 3600),
    );
  }, []);

  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;
    if (!prev) return;
    const ev = detectEvent(prev, state);
    if (ev) triggerEvent(ev);
  }, [state, triggerEvent]);

  useEffect(() => () => clearTimers(), []);

  const bat = getBatTeam(state);
  const bowl = getBowlTeam(state);
  const isChasing = !state.firstInnings;
  const target = bowl.score + 1;
  const runsNeeded = Math.max(0, target - bat.score);
  const ballsLeft = Math.max(0, Math.round((state.totalOvers - bat.overs) * 6));
  const crr = bat.overs > 0 ? (bat.score / bat.overs).toFixed(2) : "0.00";
  const rrr = ballsLeft > 0 ? ((runsNeeded / ballsLeft) * 6).toFixed(2) : "—";
  const rrrNum = parseFloat(rrr);
  const rrrColor = rrrNum > 12 ? "#FF4444" : rrrNum > 8 ? "#FF9900" : "#00E676";

  const batOrder = state.firstInnings
    ? (state as any).team1BattingOrder
    : (state as any).team2BattingOrder;
  const bowlOrder = state.firstInnings
    ? (state as any).team1BowlingOrder
    : (state as any).team2BowlingOrder;
  const stS = state.currentStriker
    ? batOrder?.find(
        (p: PlayerStats) => p.playerId === state.currentStriker!.playerId,
      ) ||
      bat.playingXI.find(
        (p: PlayerStats) => p.playerId === state.currentStriker!.playerId,
      )
    : null;
  const nsS = state.currentNonStriker
    ? batOrder?.find(
        (p: PlayerStats) => p.playerId === state.currentNonStriker!.playerId,
      ) ||
      bat.playingXI.find(
        (p: PlayerStats) => p.playerId === state.currentNonStriker!.playerId,
      )
    : null;
  const bowS = state.currentBowler
    ? bowlOrder?.find(
        (p: PlayerStats) => p.playerId === state.currentBowler!.playerId,
      ) ||
      bowl.playingXI.find(
        (p: PlayerStats) => p.playerId === state.currentBowler!.playerId,
      )
    : null;

  const displayBalls = state.currentOverBalls ?? [];
  const mono = (n: string) =>
    n
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .slice(0, 3)
      .toUpperCase();

  const isAnimating = phase !== "idle";
  const cfg = event ? EV_CFG[event.type!] : null;

  const ballCfg = (b: string) => {
    if (b === "W") return { bg: "#B91C1C", text: "#fff", border: "#EF4444" };
    if (b === "6") return { bg: "#5B21B6", text: "#fff", border: "#8B5CF6" };
    if (b === "4") return { bg: "#1D4ED8", text: "#fff", border: "#60A5FA" };
    if (b === "0")
      return {
        bg: "rgba(255,255,255,0.05)",
        text: "rgba(255,255,255,0.3)",
        border: "rgba(255,255,255,0.09)",
      };
    if (b === "Wd" || b === "Nb")
      return { bg: "#92400E", text: "#FDE68A", border: "#F59E0B" };
    return { bg: "#064E3B", text: "#6EE7B7", border: "#10B981" };
  };

  const D = () => (
    <div
      style={{
        width: 1,
        background: "rgba(255,255,255,0.07)",
        alignSelf: "stretch",
        flexShrink: 0,
      }}
    />
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        fontFamily: "'Barlow Condensed', sans-serif",
        animation: "ilbSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      {/* Top accent */}
      <div
        style={{
          height: 2,
          background:
            "linear-gradient(90deg, #3B82F6 0%, #B45309 30%, #D97706 50%, #B45309 70%, #A855F7 100%)",
        }}
      />

      {/* Main bar */}
      <div
        style={{
          height: 88,
          background: "#0D0F1E",
          boxShadow: "0 -8px 60px rgba(0,0,0,0.95)",
          display: "flex",
          alignItems: "stretch",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ── LEFT: Batting team (always visible) ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 13,
            padding: "0 20px 0 14px",
            background:
              "linear-gradient(90deg, rgba(59,130,246,0.13) 0%, transparent 100%)",
            borderLeft: "4px solid #3B82F6",
            minWidth: 185,
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 9,
              flexShrink: 0,
              background: bat.logoUrl ? "transparent" : "rgba(59,130,246,0.22)",
              border: "1.5px solid rgba(59,130,246,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {bat.logoUrl ? (
              <img
                src={bat.logoUrl}
                alt={bat.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ color: "#93C5FD", fontWeight: 900, fontSize: 13 }}>
                {mono(bat.name)}
              </span>
            )}
          </div>
          <div>
            <div
              style={{
                color: "rgba(147,197,253,0.55)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 3,
                textTransform: "uppercase",
                marginBottom: 3,
              }}
            >
              {state.firstInnings ? "1st Inn" : "2nd Inn"}
            </div>
            <div
              style={{
                color: "#FFFFFF",
                fontWeight: 900,
                fontSize: 20,
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              {bat.name}
            </div>
          </div>
        </div>

        {/* ── SCORE HERO (always visible) ── */}
        <div
          style={{
            background:
              "linear-gradient(160deg, #92400E 0%, #B45309 45%, #CA6D1A 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 34px 0 28px",
            flexShrink: 0,
            minWidth: 160,
            clipPath:
              "polygon(14px 0%, 100% 0%, calc(100% - 14px) 100%, 0% 100%)",
            marginLeft: -2,
            zIndex: 10,
          }}
        >
          <div
            style={{
              color: "#FFFFFF",
              fontWeight: 900,
              fontSize: 44,
              lineHeight: 1,
              letterSpacing: -2,
            }}
          >
            {bat.score}/{bat.wickets}
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              marginTop: 3,
            }}
          >
            {bat.overs} / {state.totalOvers} OV
          </div>
        </div>

        {/* ── MIDDLE DATA ZONE (fades out during animation) ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "stretch",
            transition: "opacity 0.3s ease",
            opacity: isAnimating ? 0 : 1,
            overflow: "hidden",
          }}
        >
          {/* Rates */}
          <div
            style={{ display: "flex", alignItems: "stretch", flexShrink: 0 }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "0 18px",
                borderRight: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 2.5,
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                CRR
              </div>
              <div style={{ color: "#FBBF24", fontWeight: 900, fontSize: 28 }}>
                {crr}
              </div>
            </div>
            {isChasing && (
              <>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    padding: "0 18px",
                    borderRight: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: 2.5,
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    RRR
                  </div>
                  <div
                    style={{ color: rrrColor, fontWeight: 900, fontSize: 28 }}
                  >
                    {rrr}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    padding: "0 18px",
                  }}
                >
                  <div
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: 2.5,
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    Need
                  </div>
                  <div
                    style={{ color: "#FFFFFF", fontWeight: 900, fontSize: 26 }}
                  >
                    {runsNeeded}
                    <span
                      style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}
                    >
                      {" "}
                      off {ballsLeft}b
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          <D />

          {/* Over balls */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 8,
              padding: "0 20px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Over {Math.min(state.completedOvers + 1, state.totalOvers)}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {displayBalls.map((b, i) => {
                const c = ballCfg(b);
                return (
                  <div
                    key={i}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: c.bg,
                      border: `1.5px solid ${c.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: 12,
                      color: c.text,
                      flexShrink: 0,
                    }}
                  >
                    {b}
                  </div>
                );
              })}
              {Array.from({ length: Math.max(0, 6 - displayBalls.length) }).map(
                (_, i) => (
                  <div
                    key={`e${i}`}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      flexShrink: 0,
                    }}
                  />
                ),
              )}
            </div>
          </div>

          <D />

          {/* Striker */}
          {state.currentStriker && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 5,
                padding: "0 18px",
                borderRight: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(251,191,36,0.04)",
                minWidth: 170,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#FBBF24",
                    boxShadow: "0 0 6px #FBBF24",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: "rgba(255,255,255,0.35)",
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                  }}
                >
                  Batting
                </span>
              </div>
              <div
                style={{
                  color: "#FFFFFF",
                  fontWeight: 900,
                  fontSize: 19,
                  textTransform: "uppercase",
                  lineHeight: 1,
                }}
              >
                {state.currentStriker.name}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span
                  style={{
                    color: "#FBBF24",
                    fontWeight: 900,
                    fontSize: 26,
                    lineHeight: 1,
                  }}
                >
                  {stS?.runs ?? 0}
                </span>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>
                  ({stS?.ballsFaced ?? 0})
                </span>
                {stS && stS.strikeRate > 0 && (
                  <span
                    style={{
                      background: "rgba(251,191,36,0.12)",
                      color: "rgba(251,191,36,0.7)",
                      fontSize: 12,
                      fontWeight: 800,
                      padding: "2px 7px",
                      marginLeft: 10,
                      borderRadius: 4,
                    }}
                  >
                    SR {stS.strikeRate.toFixed(0)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Non-striker */}
          {state.currentNonStriker && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 5,
                padding: "0 18px",
                borderRight: "1px solid rgba(255,255,255,0.05)",
                minWidth: 150,
              }}
            >
              <div
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                Non-striker
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontWeight: 800,
                  fontSize: 17,
                  textTransform: "uppercase",
                  lineHeight: 1,
                }}
              >
                {state.currentNonStriker.name}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                <span
                  style={{
                    color: "rgba(255,255,255,0.55)",
                    fontWeight: 900,
                    fontSize: 20,
                  }}
                >
                  {nsS?.runs ?? 0}
                </span>
                <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
                  ({nsS?.ballsFaced ?? 0})
                </span>
              </div>
            </div>
          )}

          {/* Bowler */}
          {state.currentBowler && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 5,
                padding: "0 18px",
              }}
            >
              <div
                style={{
                  color: "rgba(192,132,252,0.6)",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                Bowling
              </div>
              <div
                style={{
                  color: "#FFFFFF",
                  fontWeight: 900,
                  fontSize: 17,
                  textTransform: "uppercase",
                  lineHeight: 1,
                }}
              >
                {state.currentBowler.name}
              </div>
              {bowS && (
                <div
                  style={{
                    color: "rgba(255,255,255,0.45)",
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  {fmtOv(bowS.overs)} ov
                  {bowS.wicketsTaken > 0 && (
                    <span style={{ color: "#C084FC", fontWeight: 900 }}>
                      {" "}
                      · {bowS.wicketsTaken}w
                    </span>
                  )}
                  {` · ${bowS.runsConceded}r`}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── ANIMATION LAYER — appears over middle zone ── */}
        {isAnimating && cfg && event && (
          <div
            style={{
              position: "absolute",
              left: 343, // 185 (team) + 158 (score hero)
              right: isChasing ? 275 : 185, // leave room for target + fielding
              top: 0,
              bottom: 0,
              zIndex: 20,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Dark base */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(6,8,20,0.92)",
                opacity: phase === "fadeout" ? 0 : 1,
                transition:
                  phase === "fadeout"
                    ? "opacity 0.8s ease"
                    : "opacity 0.25s ease",
              }}
            />

            {/* Light beams sweeping left to right */}
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: "50%",
                  background: `linear-gradient(90deg, transparent 0%, ${cfg.beam} 40%, ${cfg.color}33 60%, transparent 100%)`,
                  animation: `ilbBeam ${0.75 + i * 0.12}s ease-out ${i * 0.08}s both`,
                  opacity: phase === "fadeout" ? 0 : 1,
                  transition:
                    phase === "fadeout" ? "opacity 0.5s ease" : "none",
                  pointerEvents: "none",
                }}
              />
            ))}

            {/* Centre glow line */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                height: 1,
                top: "50%",
                background: `linear-gradient(90deg, transparent, ${cfg.color}77, transparent)`,
                opacity: phase === "fadeout" ? 0 : 0.7,
                transition:
                  phase === "fadeout"
                    ? "opacity 0.5s ease"
                    : "opacity 0.3s ease",
              }}
            />

            {/* Event card */}
            <div
              style={{
                position: "relative",
                zIndex: 5,
                display: "flex",
                alignItems: "center",
                gap: 18,
                animation:
                  phase === "beaming"
                    ? "ilbSlideIn 0.45s cubic-bezier(0.16,1,0.3,1) both"
                    : phase === "fadeout"
                      ? "ilbSlideOut 0.5s ease-in both"
                      : "none",
              }}
            >
              {/* Icon circle */}
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  border: `2px solid ${cfg.color}`,
                  background: `radial-gradient(circle, ${cfg.color}22 0%, transparent 70%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 0 20px ${cfg.glow}, 0 0 40px ${cfg.color}33`,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    color: cfg.color,
                    fontWeight: 900,
                    fontSize: cfg.icon.length > 2 ? 20 : 30,
                    textShadow: `0 0 16px ${cfg.glow}`,
                    lineHeight: 1,
                  }}
                >
                  {cfg.icon}
                </span>
              </div>

              {/* Text */}
              <div>
                <div
                  style={{
                    color: cfg.color,
                    fontWeight: 900,
                    fontSize: 42,
                    lineHeight: 1,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    textShadow: `0 0 24px ${cfg.glow}`,
                  }}
                >
                  {event.label}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginTop: 5,
                  }}
                >
                  <div
                    style={{
                      height: 1,
                      width: 36,
                      background: `linear-gradient(90deg, transparent, ${cfg.color}77)`,
                    }}
                  />
                  <span
                    style={{
                      color: "#FFFFFF",
                      fontWeight: 700,
                      fontSize: 17,
                      letterSpacing: 0.5,
                    }}
                  >
                    {event.playerName}
                  </span>
                  <span
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {event.subLabel}
                  </span>
                  <div
                    style={{
                      height: 1,
                      width: 36,
                      background: `linear-gradient(90deg, ${cfg.color}77, transparent)`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── RIGHT: Target + Fielding team (always visible) ── */}
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          {isChasing && (
            <div
              style={{
                background: "linear-gradient(135deg, #134E4A 0%, #0F766E 100%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 22px",
                borderLeft: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 2.5,
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                Target
              </div>
              <div
                style={{
                  color: "#FFFFFF",
                  fontWeight: 900,
                  fontSize: 34,
                  lineHeight: 1,
                }}
              >
                {target}
              </div>
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 13,
              padding: "0 14px 0 20px",
              background:
                "linear-gradient(270deg, rgba(168,85,247,0.13) 0%, transparent 100%)",
              borderLeft: "1px solid rgba(255,255,255,0.07)",
              borderRight: "4px solid #A855F7",
              minWidth: 185,
            }}
          >
            <div style={{ textAlign: "right", flex: 1 }}>
              <div
                style={{
                  color: "rgba(192,132,252,0.55)",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  marginBottom: 3,
                }}
              >
                Fielding
              </div>
              <div
                style={{
                  color: "#FFFFFF",
                  fontWeight: 900,
                  fontSize: 20,
                  textTransform: "uppercase",
                  lineHeight: 1,
                }}
              >
                {bowl.name}
              </div>
            </div>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 9,
                flexShrink: 0,
                background: bowl.logoUrl
                  ? "transparent"
                  : "rgba(168,85,247,0.22)",
                border: "1.5px solid rgba(168,85,247,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {bowl.logoUrl ? (
                <img
                  src={bowl.logoUrl}
                  alt={bowl.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span
                  style={{ color: "#C084FC", fontWeight: 900, fontSize: 13 }}
                >
                  {mono(bowl.name)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent */}
      <div
        style={{
          height: 2,
          background:
            "linear-gradient(90deg, #3B82F6 0%, #B45309 30%, #D97706 50%, #B45309 70%, #A855F7 100%)",
        }}
      />

      <style>{`
        @keyframes ilbSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ilbBeam {
          from { transform: translateX(-120%); opacity: 0.3; }
          to   { transform: translateX(230%);  opacity: 0.8; }
        }
        @keyframes ilbSlideIn {
          from { opacity: 0; transform: translateX(-50px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes ilbSlideOut {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(50px); }
        }
      `}</style>
    </div>
  );
}
