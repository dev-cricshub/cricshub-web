"use client";

import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface PlayerDetails {
  playerId: string;
  name: string;
}
interface PlayerStats {
  playerId: string;
  name: string;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  wicketDetails: any | null;
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
}

// ═══════════════════════════════════════════════════════════
// WIN PROBABILITY ENGINE
// ═══════════════════════════════════════════════════════════

function calcWinProb(state: MatchState): {
  batPct: number;
  label: string;
  pressure: "low" | "mid" | "high" | "critical";
} {
  const bat = getBatTeam(state);
  const bowl = getBowlTeam(state);
  const totalBalls = state.totalOvers * 6;
  const ballsPlayed = Math.round(bat.overs * 6);
  const ballsLeft = Math.max(1, totalBalls - ballsPlayed);
  const wicketsLeft = 10 - bat.wickets;

  if (state.firstInnings) {
    // 1st innings: project final score vs par
    const crr = bat.overs > 0 ? bat.score / bat.overs : 0;
    const projectedTotal = bat.score + crr * (ballsLeft / 6);
    // par score typically ~150 in T20, scales with overs
    const parScore = (state.totalOvers / 20) * 155;
    // wicket factor: each wicket lost reduces probability
    const wicketPenalty = (bat.wickets / 10) * 18;
    let raw =
      50 + ((projectedTotal - parScore) / parScore) * 40 - wicketPenalty;
    raw = Math.max(8, Math.min(92, raw));
    const pressure =
      bat.wickets >= 7
        ? "critical"
        : bat.wickets >= 5
          ? "high"
          : bat.wickets >= 3
            ? "mid"
            : "low";
    return {
      batPct: Math.round(raw),
      label: `Projected ${Math.round(projectedTotal)}`,
      pressure,
    };
  }

  // 2nd innings
  const target = bowl.score + 1;
  const runsNeeded = Math.max(0, target - bat.score);
  const rrr = (runsNeeded / ballsLeft) * 6;
  const crr = bat.overs > 0 ? bat.score / bat.overs : 0;

  // Base: runs needed vs balls available
  const runFactor = Math.max(
    0,
    Math.min(1, 1 - runsNeeded / ((ballsLeft / 6) * 18)),
  );
  // Wicket factor: more wickets = harder
  const wicketFactor = wicketsLeft / 10;
  // Rate factor: how CRR compares to RRR
  const rateFactor = rrr > 0 ? Math.min(1.2, crr / rrr) : 1;
  // Ball pressure: fewer balls = more binary
  const ballPressure = Math.min(1, ballsLeft / 30);

  let raw =
    (runFactor * 0.4 + wicketFactor * 0.35 + (rateFactor - 0.5) * 0.25) * 100;
  raw = raw + ballPressure * 5;
  raw = Math.max(4, Math.min(96, raw));

  // If already won or lost
  if (runsNeeded <= 0) raw = 96;
  if (ballsLeft <= 0 && runsNeeded > 0) raw = 4;

  const pressure: "low" | "mid" | "high" | "critical" =
    rrr > 18 ? "critical" : rrr > 12 ? "high" : rrr > 8 ? "mid" : "low";

  return {
    batPct: Math.round(raw),
    label: `Need ${runsNeeded} off ${ballsLeft}b`,
    pressure,
  };
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

// ═══════════════════════════════════════════════════════════
// ANIMATED PROBABILITY VALUE HOOK
// ═══════════════════════════════════════════════════════════

function useAnimatedValue(target: number, duration = 800) {
  const [value, setValue] = useState(target);
  const prev = useRef(target);
  const raf = useRef<number | null>(null);
  const start = useRef<number>(0);
  const from = useRef(target);

  useEffect(() => {
    if (Math.abs(target - prev.current) < 0.5) return;
    from.current = prev.current;
    start.current = performance.now();
    const animate = (now: number) => {
      const t = Math.min(1, (now - start.current) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      setValue(from.current + (target - from.current) * ease);
      if (t < 1) raf.current = requestAnimationFrame(animate);
      else {
        setValue(target);
        prev.current = target;
      }
    };
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(animate);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration]);

  return value;
}

// ═══════════════════════════════════════════════════════════
// TEAM LOGO
// ═══════════════════════════════════════════════════════════

function TeamLogo({
  team,
  size,
  glow,
}: {
  team: TeamDetails;
  size: number;
  glow: string;
}) {
  const [err, setErr] = useState(false);
  const mono = team.name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.2,
        flexShrink: 0,
        overflow: "hidden",
        background: team.logoUrl && !err ? "transparent" : `${glow}22`,
        border: `2px solid ${glow}55`,
        boxShadow: `0 0 20px ${glow}33`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {team.logoUrl && !err ? (
        <img
          src={team.logoUrl}
          alt={team.name}
          onError={() => setErr(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <span
          style={{
            fontFamily: "'Barlow Condensed',sans-serif",
            fontWeight: 900,
            fontSize: size * 0.3,
            color: glow,
          }}
        >
          {mono}
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════

export default function WinPredictorOverlay({ state }: { state: MatchState }) {
  const { batPct, label, pressure } = calcWinProb(state);
  const bat = getBatTeam(state);
  const bowl = getBowlTeam(state);

  const animatedBatPct = useAnimatedValue(batPct, 900);
  const bowlPct = 100 - animatedBatPct;
  const batPctDisplay = Math.round(animatedBatPct);
  const bowlPctDisplay = 100 - batPctDisplay;

  // Previous ball flash
  const [flash, setFlash] = useState(false);
  const prevPct = useRef(batPct);
  useEffect(() => {
    if (Math.abs(batPct - prevPct.current) >= 2) {
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
    }
    prevPct.current = batPct;
  }, [batPct]);

  // Pressure colors
  const pressureCfg = {
    low: {
      bat: "#10B981",
      bowl: "#3B82F6",
      mid: "#1a2a1a",
      glow: "rgba(16,185,129,0.2)",
    },
    mid: {
      bat: "#F59E0B",
      bowl: "#3B82F6",
      mid: "#2a2510",
      glow: "rgba(245,158,11,0.2)",
    },
    high: {
      bat: "#F97316",
      bowl: "#3B82F6",
      mid: "#2a1a08",
      glow: "rgba(249,115,22,0.25)",
    },
    critical: {
      bat: "#EF4444",
      bowl: "#22C55E",
      mid: "#2a0808",
      glow: "rgba(239,68,68,0.3)",
    },
  }[pressure];

  const mono = (n: string) =>
    n
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div
      style={{
        position: "absolute",
        bottom: 110, // floats above where score bar would sit
        left: "50%",
        transform: "translateX(-50%)",
        width: 1240,
        fontFamily: "'Barlow Condensed', sans-serif",
        animation: "wpFadeIn 0.5s cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      {/* ── HEADER LABEL ── floating pill above bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(6,8,20,0.92)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 40,
            padding: "6px 22px",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Pulse dot */}
          <div
            style={{ position: "relative", width: 8, height: 8, flexShrink: 0 }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "#EF4444",
                animation: "wpPing 1.4s ease-in-out infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: "1.5px",
                borderRadius: "50%",
                background: "#EF4444",
              }}
            />
          </div>
          <span
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            Win Predictor
          </span>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>
            ·
          </span>
          <span
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            {label}
          </span>
        </div>
      </div>

      {/* ── MAIN PREDICTOR CARD ── */}
      <div
        style={{
          background: "rgba(6,8,20,0.94)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          overflow: "hidden",
          backdropFilter: "blur(20px)",
          boxShadow: `0 20px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}
      >
        {/* Inner content */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "20px 28px",
            gap: 60,
          }}
        >
          {/* ── BATTING TEAM ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              minWidth: 220,
              flexShrink: 0,
            }}
          >
            <TeamLogo team={bat} size={100} glow={pressureCfg.bat} />
            <div>
              <div
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  marginBottom: 3,
                }}
              >
                {state.firstInnings ? "Batting" : "Chasing"}
              </div>
              <div
                style={{
                  color: "#FFFFFF",
                  fontWeight: 900,
                  fontSize: 30,
                  textTransform: "uppercase",
                  lineHeight: 1,
                }}
              >
                {bat.name}
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.35)",
                  fontSize: 18,
                  fontWeight: 600,
                  marginTop: 3,
                }}
              >
                {bat.score}/{bat.wickets} · {bat.overs} ov
              </div>
            </div>
          </div>

          {/* ── PROBABILITY METER ── */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {/* Percentage labels */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              {/* Batting % */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span
                  style={{
                    color: pressureCfg.bat,
                    fontWeight: 900,
                    fontSize: batPctDisplay >= 60 ? 52 : 40,
                    lineHeight: 1,
                    letterSpacing: 3,
                    textShadow: `0 0 30px ${pressureCfg.bat}88`,
                    transition: "font-size 0.4s ease",
                  }}
                >
                  {batPctDisplay}
                </span>
                <span
                  style={{
                    color: `${pressureCfg.bat}88`,
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                >
                  %
                </span>
              </div>

              {/* VS badge */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.5)",
                  background: "rgba(255,255,255,0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 1,
                  }}
                >
                  VS
                </span>
              </div>

              {/* Bowling % */}
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 6,
                  flexDirection: "row-reverse",
                }}
              >
                <span
                  style={{
                    color: pressureCfg.bowl,
                    fontWeight: 900,
                    fontSize: bowlPctDisplay >= 60 ? 52 : 40,
                    lineHeight: 1,
                    letterSpacing: 3,
                    textShadow: `0 0 30px ${pressureCfg.bowl}88`,
                    transition: "font-size 0.4s ease",
                  }}
                >
                  {bowlPctDisplay}
                </span>
                <span
                  style={{
                    color: `${pressureCfg.bowl}88`,
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                >
                  %
                </span>
              </div>
            </div>

            {/* ── THE BAR ── */}
            <div
              style={{
                position: "relative",
                height: 28,
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              {/* Background track */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(90deg, ${pressureCfg.bat}22 0%, rgba(255,255,255,0.03) 50%, ${pressureCfg.bowl}22 100%)`,
                }}
              />

              {/* Bat fill */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${animatedBatPct}%`,
                  background: `linear-gradient(90deg, ${pressureCfg.bat}cc, ${pressureCfg.bat})`,
                  borderRadius: "14px 0 0 14px",
                  boxShadow: `4px 0 20px ${pressureCfg.bat}66`,
                  transition: "width 0.9s cubic-bezier(0.16,1,0.3,1)",
                }}
              />

              {/* Bowl fill */}
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: `${100 - animatedBatPct}%`,
                  background: `linear-gradient(270deg, ${pressureCfg.bowl}cc, ${pressureCfg.bowl})`,
                  borderRadius: "0 14px 14px 0",
                  boxShadow: `-4px 0 20px ${pressureCfg.bowl}66`,
                  transition: "width 0.9s cubic-bezier(0.16,1,0.3,1)",
                }}
              />

              {/* Divider needle at split point */}
              <div
                style={{
                  position: "absolute",
                  top: -2,
                  bottom: -2,
                  left: `calc(${animatedBatPct}% - 1.5px)`,
                  width: 3,
                  background: "#FFFFFF",
                  boxShadow:
                    "0 0 12px rgba(255,255,255,0.9), 0 0 24px rgba(255,255,255,0.4)",
                  borderRadius: 2,
                  transition: "left 0.9s cubic-bezier(0.16,1,0.3,1)",
                }}
              />

              {/* Flash pulse on update */}
              {flash && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.12)",
                    animation: "wpFlash 0.5s ease-out both",
                  }}
                />
              )}
            </div>

            {/* Tick marks */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0 2px",
              }}
            >
              {[0, 25, 50, 75, 100].map((tick) => (
                <div
                  key={tick}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <div
                    style={{
                      width: 1,
                      height: 4,
                      background: "rgba(255,255,255,0.12)",
                    }}
                  />
                  <span
                    style={{
                      color: "rgba(255,255,255,0.8)",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {tick}
                  </span>
                </div>
              ))}
            </div>

            {/* Context stats row */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 32,
                marginTop: 12,
              }}
            >
              {(() => {
                const items = [];
                const ballsLeft = Math.max(
                  0,
                  Math.round((state.totalOvers - bat.overs) * 6),
                );
                const wicketsLeft = 10 - bat.wickets;

                if (!state.firstInnings) {
                  const target = bowl.score + 1;
                  const runsNeeded = Math.max(0, target - bat.score);
                  const rrr =
                    ballsLeft > 0
                      ? ((runsNeeded / ballsLeft) * 6).toFixed(2)
                      : "—";
                  const crr =
                    bat.overs > 0 ? (bat.score / bat.overs).toFixed(2) : "0.00";
                  items.push({ label: "CRR", value: crr, color: "#FBBF24" });
                  items.push({
                    label: "RRR",
                    value: rrr,
                    color:
                      pressure === "critical"
                        ? "#EF4444"
                        : pressure === "high"
                          ? "#F97316"
                          : "#F59E0B",
                  });
                  items.push({
                    label: "Wickets Left",
                    value: `${wicketsLeft}`,
                    color:
                      wicketsLeft <= 3
                        ? "#EF4444"
                        : wicketsLeft <= 5
                          ? "#F59E0B"
                          : "#10B981",
                  });
                  items.push({
                    label: "Balls Left",
                    value: `${ballsLeft}`,
                    color: "rgba(255,255,255,0.6)",
                  });
                } else {
                  const crr =
                    bat.overs > 0 ? (bat.score / bat.overs).toFixed(2) : "0.00";
                  const projectedTotal =
                    bat.score + parseFloat(crr) * (ballsLeft / 6);
                  items.push({ label: "CRR", value: crr, color: "#FBBF24" });
                  items.push({
                    label: "Projected",
                    value: Math.round(projectedTotal).toString(),
                    color: "#60A5FA",
                  });
                  items.push({
                    label: "Wickets Left",
                    value: `${wicketsLeft}`,
                    color:
                      wicketsLeft <= 3
                        ? "#EF4444"
                        : wicketsLeft <= 5
                          ? "#F59E0B"
                          : "#10B981",
                  });
                  items.push({
                    label: "Balls Left",
                    value: `${ballsLeft}`,
                    color: "rgba(255,255,255,0.6)",
                  });
                }

                return items.map(({ label, value, color }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <span
                      style={{
                        color: "rgba(255,255,255,0.4)",
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: 2,
                        textTransform: "uppercase",
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        color,
                        fontWeight: 900,
                        fontSize: 18,
                        lineHeight: 1,
                      }}
                    >
                      {value}
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* ── FIELDING TEAM ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexDirection: "row-reverse",
              minWidth: 220,
              flexShrink: 0,
            }}
          >
            <TeamLogo team={bowl} size={100} glow={pressureCfg.bowl} />
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  marginBottom: 3,
                }}
              >
                {state.firstInnings ? "Fielding" : "Defending"}
              </div>
              <div
                style={{
                  color: "#FFFFFF",
                  fontWeight: 900,
                  fontSize: 30,
                  textTransform: "uppercase",
                  lineHeight: 1,
                }}
              >
                {bowl.name}
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.35)",
                  fontSize: 18,
                  fontWeight: 600,
                  marginTop: 3,
                }}
              >
                {!state.firstInnings
                  ? `${bowl.score}/${bowl.wickets}`
                  : "Bowling"}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom pressure strip */}
        <div
          style={{
            height: 3,
            background: `linear-gradient(90deg, ${pressureCfg.bat} 0%, ${pressureCfg.bat}44 ${animatedBatPct}%, ${pressureCfg.bowl}44 ${animatedBatPct}%, ${pressureCfg.bowl} 100%)`,
            transition: "background 0.9s ease",
          }}
        />
      </div>

      <style>{`
        @keyframes wpFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes wpPing {
          0%  { transform: scale(1); opacity: 1; }
          70% { transform: scale(2.5); opacity: 0; }
          100%{ transform: scale(1); opacity: 0; }
        }
        @keyframes wpFlash {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
