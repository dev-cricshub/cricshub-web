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

// ═══════════════════════════════════════════════════════════
// EVENT TYPES
// ═══════════════════════════════════════════════════════════

type EventType = "SIX" | "FOUR" | "WICKET" | "FIFTY" | "HUNDRED" | null;

interface BurstEvent {
  type: EventType;
  playerName: string;
  stat: string;
  subStat?: string;
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
): BurstEvent | null {
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
    curr.currentNonStriker?.name ?? curr.currentStriker?.name ?? "Batter";

  // // 🛑 TEMPORARY DEBUG TRIGGERS - DELETE BEFORE PRODUCTION 🛑
  // if (lastBall === "1") {
  //   return {
  //     type: "FIFTY",
  //     playerName: strikerName,
  //     stat: "FIFTY!",
  //     subStat: "52 off 31 balls", // Fake stats for the visual
  //   };
  // }
  // if (lastBall === "2") {
  //   return {
  //     type: "HUNDRED",
  //     playerName: strikerName,
  //     stat: "CENTURY!",
  //     subStat: "104 off 48 balls",
  //   };
  // }
  // // 🛑 END DEBUG 🛑

  // Check milestones on striker — compare prev and curr batting order
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
      if (prevPlayer.runs < 50 && player.runs >= 50 && player.runs < 100) {
        return {
          type: "FIFTY",
          playerName: player.name,
          stat: "FIFTY!",
          subStat: `${player.runs} off ${player.ballsFaced} balls`,
        };
      }
      if (prevPlayer.runs < 100 && player.runs >= 100) {
        return {
          type: "HUNDRED",
          playerName: player.name,
          stat: "CENTURY!",
          subStat: `${player.runs} off ${player.ballsFaced} balls`,
        };
      }
    }
  }

  // Wicket
  if (lastBall === "W") {
    const bowler = curr.currentBowler?.name ?? "Bowler";
    return {
      type: "WICKET",
      playerName: bowler,
      stat: "WICKET!",
      subStat: `${bat.wickets} down`,
    };
  }

  // Six
  if (lastBall === "6") {
    return {
      type: "SIX",
      playerName: strikerName,
      stat: "SIX!",
      subStat: `${bat.score}/${bat.wickets}`,
    };
  }

  // Four
  if (lastBall === "4") {
    return {
      type: "FOUR",
      playerName: strikerName,
      stat: "FOUR!",
      subStat: `${bat.score}/${bat.wickets}`,
    };
  }

  return null;
}

// ═══════════════════════════════════════════════════════════
// PARTICLE SYSTEM
// ═══════════════════════════════════════════════════════════

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  rotation: number;
  rotSpeed: number;
  shape: "circle" | "rect" | "diamond";
}

function useParticles(active: boolean, eventType: EventType) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const animRef = useRef<number | null>(null);
  const startTime = useRef<number>(0);

  useEffect(() => {
    if (!active || !eventType) {
      setParticles([]);
      return;
    }

    const colors: Record<NonNullable<EventType>, string[]> = {
      SIX: ["#FFD700", "#FF8C00", "#FFF200", "#FF4500", "#FFFFFF"],
      FOUR: ["#00D4FF", "#0099FF", "#00FFCC", "#FFFFFF", "#4FC3F7"],
      WICKET: ["#FF2D2D", "#FF6B00", "#FFD700", "#FFFFFF", "#FF8C00"],
      FIFTY: ["#C0C0C0", "#E8E8E8", "#FFD700", "#FFFFFF", "#A8D8EA"],
      HUNDRED: ["#FFD700", "#FFF200", "#FF8C00", "#FFFFFF", "#FF6B00"],
    };
    const palette = colors[eventType];

    const count =
      eventType === "WICKET" ? 60 : eventType === "HUNDRED" ? 120 : 80;
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 20,
      y: 45 + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 3.5,
      vy: -(Math.random() * 4 + 2),
      size: Math.random() * 10 + 4,
      color: palette[Math.floor(Math.random() * palette.length)],
      opacity: 1,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 8,
      shape: (["circle", "rect", "diamond"] as const)[
        Math.floor(Math.random() * 3)
      ],
    }));

    setParticles(newParticles);
    startTime.current = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - startTime.current) / 1000;
      if (elapsed > 2.8) {
        setParticles([]);
        return;
      }

      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          x: p.x + p.vx * 0.5,
          y: p.y + p.vy * 0.5,
          vy: p.vy + 0.08,
          opacity: Math.max(0, 1 - elapsed / 2.5),
          rotation: p.rotation + p.rotSpeed,
        })),
      );

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, [active, eventType]);

  return particles;
}

// ═══════════════════════════════════════════════════════════
// ANIMATION CONFIG PER EVENT
// ═══════════════════════════════════════════════════════════

const EVENT_CONFIG: Record<
  NonNullable<EventType>,
  {
    bg: string;
    accentColor: string;
    glowColor: string;
    ringColor: string;
    labelColor: string;
    icon: string;
  }
> = {
  SIX: {
    bg: "radial-gradient(ellipse at center, rgba(255,140,0,0.25) 0%, rgba(6,8,16,0.97) 70%)",
    accentColor: "#FFD700",
    glowColor: "rgba(255,215,0,0.6)",
    ringColor: "rgba(255,215,0,0.3)",
    labelColor: "#FFD700",
    icon: "6",
  },
  FOUR: {
    bg: "radial-gradient(ellipse at center, rgba(0,180,255,0.2) 0%, rgba(6,8,16,0.97) 70%)",
    accentColor: "#00D4FF",
    glowColor: "rgba(0,212,255,0.5)",
    ringColor: "rgba(0,212,255,0.25)",
    labelColor: "#00D4FF",
    icon: "4",
  },
  WICKET: {
    bg: "radial-gradient(ellipse at center, rgba(220,38,38,0.25) 0%, rgba(6,8,16,0.97) 70%)",
    accentColor: "#FF2D2D",
    glowColor: "rgba(255,45,45,0.6)",
    ringColor: "rgba(255,45,45,0.3)",
    labelColor: "#FF6B6B",
    icon: "W",
  },
  FIFTY: {
    bg: "radial-gradient(ellipse at center, rgba(192,192,192,0.2) 0%, rgba(6,8,16,0.97) 70%)",
    accentColor: "#E8E8E8",
    glowColor: "rgba(232,232,232,0.4)",
    ringColor: "rgba(232,232,232,0.2)",
    labelColor: "#FFFFFF",
    icon: "50",
  },
  HUNDRED: {
    bg: "radial-gradient(ellipse at center, rgba(255,215,0,0.3) 0%, rgba(6,8,16,0.97) 70%)",
    accentColor: "#FFD700",
    glowColor: "rgba(255,215,0,0.7)",
    ringColor: "rgba(255,215,0,0.4)",
    labelColor: "#FFD700",
    icon: "100",
  },
};

// ═══════════════════════════════════════════════════════════
// BURST ANIMATION FULLSCREEN
// ═══════════════════════════════════════════════════════════

function BurstAnimation({
  event,
  onDone,
}: {
  event: BurstEvent;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  const cfg = EVENT_CONFIG[event.type!]!;
  const particles = useParticles(true, event.type);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 400);
    const t2 = setTimeout(() => setPhase("out"), 2400);
    const t3 = setTimeout(() => onDone(), 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  const scaleIn =
    phase === "in"
      ? "scale(0.85)"
      : phase === "hold"
        ? "scale(1)"
        : "scale(1.04)";
  const opacity = phase === "out" ? 0 : 1;
  const bgOpacity = phase === "in" ? 0 : phase === "hold" ? 1 : 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 100,
        background: `radial-gradient(ellipse at center, rgba(4,6,14,0.88) 0%, rgba(4,6,14,0.96) 100%)`,
        opacity: bgOpacity,
        transition:
          phase === "in"
            ? "opacity 0.4s ease"
            : phase === "out"
              ? "opacity 0.6s ease"
              : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Scanning lines texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
          pointerEvents: "none",
        }}
      />
      {/* Colored tint layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: cfg.bg,
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />

      {/* Radial ring pulses */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: `${300 + i * 180}px`,
            height: `${300 + i * 180}px`,
            borderRadius: "50%",
            border: `1px solid ${cfg.ringColor}`,
            animation: `ringPulse${i} 1.5s ease-out ${i * 0.15}s both`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Particles */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        {particles.map((p) => {
          const x = `${p.x}%`;
          const y = `${p.y}%`;
          if (p.shape === "circle") {
            return (
              <circle
                key={p.id}
                cx={x}
                cy={y}
                r={p.size / 2}
                fill={p.color}
                opacity={p.opacity}
              />
            );
          }
          if (p.shape === "rect") {
            return (
              <rect
                key={p.id}
                x={`calc(${x} - ${p.size / 2}px)`}
                y={`calc(${y} - ${p.size / 4}px)`}
                width={p.size}
                height={p.size / 2}
                fill={p.color}
                opacity={p.opacity}
                transform={`rotate(${p.rotation}, ${p.x * 19.2}, ${p.y * 10.8})`}
              />
            );
          }
          return (
            <polygon
              key={p.id}
              points={`${p.x * 19.2},${p.y * 10.8 - p.size} ${p.x * 19.2 + p.size * 0.6},${p.y * 10.8} ${p.x * 19.2},${p.y * 10.8 + p.size} ${p.x * 19.2 - p.size * 0.6},${p.y * 10.8}`}
              fill={p.color}
              opacity={p.opacity}
            />
          );
        })}
      </svg>

      {/* Main card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
          transform: scaleIn,
          opacity,
          transition:
            phase === "in"
              ? "transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease"
              : phase === "out"
                ? "transform 0.6s ease, opacity 0.6s ease"
                : "none",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Top label */}
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: 6,
            color: "rgba(255,255,255,0.45)",
            textTransform: "uppercase",
            marginBottom: 20,
            animation:
              phase === "hold" ? "fadeSlideDown 0.4s ease both" : "none",
          }}
        >
          {event.type === "WICKET"
            ? "WICKET TAKEN"
            : event.type === "SIX"
              ? "MAXIMUM"
              : event.type === "FOUR"
                ? "BOUNDARY"
                : event.type === "FIFTY"
                  ? "MILESTONE"
                  : "MILESTONE"}
        </div>

        {/* Giant number badge */}
        <div
          style={{
            position: "relative",
            width: 240,
            height: 240,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Glow blob */}
          <div
            style={{
              position: "absolute",
              inset: -40,
              background: `radial-gradient(circle, ${cfg.glowColor} 0%, transparent 70%)`,
              animation: "glowPulse 1s ease-in-out infinite alternate",
            }}
          />

          {/* Outer ring */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `2px solid ${cfg.accentColor}`,
              opacity: 0.4,
            }}
          />

          {/* Inner ring */}
          <div
            style={{
              position: "absolute",
              inset: 12,
              borderRadius: "50%",
              border: `1px solid ${cfg.accentColor}`,
              opacity: 0.2,
            }}
          />

          {/* Number */}
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: cfg.icon?.length > 2 ? 100 : 140,
              fontWeight: 900,
              lineHeight: 1,
              color: cfg.accentColor,
              textShadow: `0 0 60px ${cfg.glowColor}, 0 0 120px ${cfg.glowColor}, 0 2px 8px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,1)`,
              WebkitTextStroke: "2px rgba(0,0,0,0.6)",
              letterSpacing: -4,
              position: "relative",
              zIndex: 2,
            }}
          >
            {cfg.icon}
          </span>
        </div>

        {/* Player name */}
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 52,
            fontWeight: 900,
            color: "#FFFFFF",
            textTransform: "uppercase",
            letterSpacing: 3,
            marginTop: 24,
            lineHeight: 1,
            textShadow: "0 2px 20px rgba(0,0,0,0.8)",
          }}
        >
          {event.playerName}
        </div>

        {/* Stat line */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginTop: 14,
          }}
        >
          <div
            style={{
              height: 1,
              width: 60,
              background: `linear-gradient(90deg, transparent, ${cfg.accentColor})`,
            }}
          />
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              color: cfg.labelColor,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {event.subStat}
          </span>
          <div
            style={{
              height: 1,
              width: 60,
              background: `linear-gradient(90deg, ${cfg.accentColor}, transparent)`,
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes ringPulse1 { from { transform: scale(0.3); opacity: 0.8; } to { transform: scale(1.2); opacity: 0; } }
        @keyframes ringPulse2 { from { transform: scale(0.2); opacity: 0.6; } to { transform: scale(1.4); opacity: 0; } }
        @keyframes ringPulse3 { from { transform: scale(0.1); opacity: 0.4; } to { transform: scale(1.6); opacity: 0; } }
        @keyframes glowPulse { from { opacity: 0.7; transform: scale(0.95); } to { opacity: 1; transform: scale(1.05); } }
        @keyframes fadeSlideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PREMIUM SCORE BAR
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// TEAM LOGO HELPER (add before PremiumScoreBar)
// ═══════════════════════════════════════════════════════════

function TeamLogo({ name, logoUrl, size, glowColor }: { name: string; logoUrl: string | null; size: number; glowColor: string }) {
  const [err, setErr] = useState(false);
  const mono = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.18, flexShrink: 0,
      background: err || !logoUrl ? `rgba(255,255,255,0.06)` : "transparent",
      border: `1.5px solid ${glowColor}44`,
      boxShadow: `0 0 16px ${glowColor}22`,
      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
    }}>
      {logoUrl && !err
        ? <img src={logoUrl} alt={name} onError={() => setErr(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: size * 0.32, color: glowColor, letterSpacing: 1 }}>{mono}</span>
      }
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PREMIUM SCORE BAR v4 — Single tall row, everything inline
// [TEAM+LOGO] [SCORE HERO] [CRR/RRR/NEED] [OVER BALLS] [BATTERS+BOWLER] [TARGET?] [FIELDING]
// No bottom row — players are full size in the main bar
// ═══════════════════════════════════════════════════════════

function PremiumScoreBar({ state, visible }: { state: MatchState; visible: boolean }) {
  const bat = getBatTeam(state);
  const bowl = getBowlTeam(state);
  const crr = bat.overs > 0 ? (bat.score / bat.overs).toFixed(2) : "0.00";
  const isChasing = !state.firstInnings;
  const target = bowl.score + 1;
  const runsNeeded = Math.max(0, target - bat.score);
  const ballsLeft = Math.max(0, Math.round((state.totalOvers - bat.overs) * 6));
  const rrr = ballsLeft > 0 ? ((runsNeeded / ballsLeft) * 6).toFixed(2) : "—";
  const rrrNum = parseFloat(rrr);
  const rrrColor = rrrNum > 12 ? "#FF4444" : rrrNum > 8 ? "#FF9900" : "#00E676";

  const batOrder = state.firstInnings ? (state as any).team1BattingOrder : (state as any).team2BattingOrder;
  const bowlOrder = state.firstInnings ? (state as any).team1BowlingOrder : (state as any).team2BowlingOrder;

  const stS = state.currentStriker
    ? batOrder?.find((p: PlayerStats) => p.playerId === state.currentStriker!.playerId) || bat.playingXI.find((p: PlayerStats) => p.playerId === state.currentStriker!.playerId)
    : null;
  const nsS = state.currentNonStriker
    ? batOrder?.find((p: PlayerStats) => p.playerId === state.currentNonStriker!.playerId) || bat.playingXI.find((p: PlayerStats) => p.playerId === state.currentNonStriker!.playerId)
    : null;
  const bowS = state.currentBowler
    ? bowlOrder?.find((p: PlayerStats) => p.playerId === state.currentBowler!.playerId) || bowl.playingXI.find((p: PlayerStats) => p.playerId === state.currentBowler!.playerId)
    : null;

  const displayBalls = state.currentOverBalls ?? [];
  const mono = (n: string) => n.split(" ").map((w: string) => w[0]).join("").slice(0, 3).toUpperCase();

  const ballCfg = (b: string) => {
    if (b === "W")  return { bg: "#B91C1C", text: "#fff", border: "#EF4444" };
    if (b === "6")  return { bg: "#5B21B6", text: "#fff", border: "#8B5CF6" };
    if (b === "4")  return { bg: "#1D4ED8", text: "#fff", border: "#60A5FA" };
    if (b === "0")  return { bg: "rgba(255,255,255,0.05)", text: "rgba(255,255,255,0.3)", border: "rgba(255,255,255,0.09)" };
    if (b === "Wd" || b === "Nb") return { bg: "#92400E", text: "#FDE68A", border: "#F59E0B" };
    return { bg: "#064E3B", text: "#6EE7B7", border: "#10B981" };
  };

  const D = ({ color = "rgba(255,255,255,0.07)" }: { color?: string }) => (
    <div style={{ width: 1, background: color, alignSelf: "stretch", flexShrink: 0 }} />
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        transform: visible ? "translateY(0)" : "translateY(110%)",
        transition: "transform 0.5s cubic-bezier(0.16,1,0.3,1)",
        fontFamily: "'Barlow Condensed', sans-serif",
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

      {/* ══ SINGLE MAIN BAR ══ */}
      <div
        style={{
          height: 88,
          display: "flex",
          alignItems: "stretch",
          background: "#0D0F1E",
          boxShadow: "0 -8px 60px rgba(0,0,0,0.95)",
          overflow: "hidden",
        }}
      >
        {/* ── BATTING TEAM ── */}
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
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 9,
              flexShrink: 0,
              background: bat.logoUrl ? "transparent" : "rgba(59,130,246,0.18)",
              border: "1.5px solid rgba(59,130,246,0.45)",
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

        {/* ── SCORE HERO — angled amber block ── */}
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
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        >
          <div
            style={{
              color: "#FFFFFF",
              fontWeight: 900,
              fontSize: 44,
              lineHeight: 1,
              letterSpacing: -2,
              textShadow: "0 2px 10px rgba(0,0,0,0.4)",
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

        {/* ── RATES ── */}
        <div style={{ display: "flex", alignItems: "stretch", flexShrink: 0 }}>
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
                color: "rgba(255, 255, 255, 0.6)",
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
                    color: "rgba(255, 255, 255, 0.6)",
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: 2.5,
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  RRR
                </div>
                <div style={{ color: rrrColor, fontWeight: 900, fontSize: 28 }}>
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
                    color: "rgba(255, 255, 255, 0.6)",
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

        {/* ── OVER BALLS ── */}
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
              color: "rgba(255,255,255,0.6)",
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

        {/* ── BATTERS + BOWLER — full height, side by side ── */}
        <div style={{ display: "flex", alignItems: "stretch", flex: 1 }}>
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
                    color: "rgba(255,255,255,0.7)",
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
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "2px 7px",
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

        {/* ── TARGET (2nd inn only) ── */}
        {isChasing && (
          <>
            <D />
            <div
              style={{
                background: "linear-gradient(135deg, #134E4A 0%, #0F766E 100%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 22px",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 9,
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
                  fontSize: 36,
                  lineHeight: 1,
                }}
              >
                {target}
              </div>
            </div>
          </>
        )}

        <D />

        {/* ── FIELDING TEAM ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 13,
            padding: "0 14px 0 20px",
            background:
              "linear-gradient(270deg, rgba(168,85,247,0.13) 0%, transparent 100%)",
            borderRight: "4px solid #A855F7",
            minWidth: 185,
            flexShrink: 0,
          }}
        >
          <div style={{ textAlign: "right", flex: 1 }}>
            <div
              style={{
                color: "rgba(192,132,252,0.55)",
                fontSize: 9,
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
                : "rgba(168,85,247,0.18)",
              border: "1.5px solid rgba(168,85,247,0.45)",
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
              <span style={{ color: "#C084FC", fontWeight: 900, fontSize: 13 }}>
                {mono(bowl.name)}
              </span>
            )}
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
    </div>
  );
}



// ═══════════════════════════════════════════════════════════
// MAIN EXPORT — drop-in replacement for tpl-pro-1
// ═══════════════════════════════════════════════════════════

export default function EventBurstOverlay({ state }: { state: MatchState }) {
  const [burstEvent, setBurstEvent] = useState<BurstEvent | null>(null);
  const [showBar, setShowBar] = useState(true);
  const prevStateRef = useRef<MatchState | null>(null);

  const handleDone = useCallback(() => {
    setBurstEvent(null);
    setShowBar(true);
  }, []);

  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;

    if (!prev) {
      console.log(
        "BURST_DEBUG: [INIT] Initial state loaded. Waiting for events.",
      );
      return;
    }

    // 1. Capture the raw arrays safely
    const prevBalls = prev.currentOverBalls ?? [];
    const currBalls = state.currentOverBalls ?? [];
    const lastBallScored = currBalls[currBalls.length - 1];

    

    // 2. Run the detection logic
    const event = detectEvent(prev, state);

    if (event) {
      
      setShowBar(false);
      setTimeout(() => setBurstEvent(event), 350);
    } else {
      console.log("BURST_DEBUG: ❌ [NO EVENT] detectEvent() returned null.");
    }
  }, [state]);

  return (
    <>
      {burstEvent && <BurstAnimation event={burstEvent} onDone={handleDone} />}
      <PremiumScoreBar state={state} visible={showBar} />
    </>
  );
}
