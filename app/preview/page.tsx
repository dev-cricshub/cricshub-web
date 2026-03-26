"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

// Basic bundle
import { ScoreOverlay } from "@/app/overlays/bundles/basic/ScoreOverlay";
import { MainMatchBanner } from "@/app/overlays/bundles/basic/MainMatchBanner";
import { BattingCard } from "@/app/overlays/bundles/basic/BattingCard";
import { BowlingCard } from "@/app/overlays/bundles/basic/BowlingCard";
import { PlayingXIBothTeamsCard } from "@/app/overlays/bundles/basic/PlayingXIBothTeamsCard";
import { MatchSummaryCard } from "@/app/overlays/bundles/basic/MatchSummaryCard";

// Glass bundle
import { GlassScoreOverlay } from "@/app/overlays/bundles/glass/GlassScoreOverlay";
import { GlassMainMatchBanner } from "@/app/overlays/bundles/glass/GlassMainMatchBanner";
import { GlassBattingCard } from "@/app/overlays/bundles/glass/GlassBattingCard";
import { GlassBowlingCard } from "@/app/overlays/bundles/glass/GlassBowlingCard";
import { GlassPlayingXIBothTeamsCard } from "@/app/overlays/bundles/glass/GlassPlayingXIBothTeamsCard";
import { GlassMatchSummaryCard } from "@/app/overlays/bundles/glass/GlassMatchSummaryCard";

// Material bundle
import { MaterialScoreOverlay } from "@/app/overlays/bundles/material/MaterialScoreOverlay";
import { MaterialMainMatchBanner } from "@/app/overlays/bundles/material/MaterialMainMatchBanner";
import { MaterialBattingCard } from "@/app/overlays/bundles/material/MaterialBattingCard";
import { MaterialBowlingCard } from "@/app/overlays/bundles/material/MaterialBowlingCard";
import { MaterialPlayingXIBothTeamsCard } from "@/app/overlays/bundles/material/MaterialPlayingXIBothTeamsCard";
import { MaterialMatchSummaryCard } from "@/app/overlays/bundles/material/MaterialMatchSummaryCard";

// Aero bundle
import { AeroScoreOverlay } from "@/app/overlays/bundles/aero/AeroScoreOverlay";
import { AeroMainMatchBanner } from "@/app/overlays/bundles/aero/AeroMainMatchBanner";
import { AeroBattingCard } from "@/app/overlays/bundles/aero/AeroBattingCard";
import { AeroBowlingCard } from "@/app/overlays/bundles/aero/AeroBowlingCard";
import { AeroPlayingXIBothTeamsCard } from "@/app/overlays/bundles/aero/AeroPlayingXIBothTeamsCard";
import { AeroMatchSummaryCard } from "@/app/overlays/bundles/aero/AeroMatchSummaryCard";

// Free
import SkeletalScoreOverlay from "@/app/overlays/free/SkeletalScoreOverlay";

// Premium add-ons
import EventBurstOverlay from "@/app/overlays/premium/matchAddOn/EventBurstOverlay";
import InlineBurstOverlay from "@/app/overlays/premium/matchAddOn/InlineBurstOverlay";
import WinPredictorOverlay from "@/app/overlays/premium/matchAddOn/WinPredictorOverlay";
import BrandingOverlay from "@/app/overlays/premium/matchAddOn/BrandingOverlay";

const PREVIEW_BRANDING_CONFIG = {
  logoUrl: null,
  showLogo: true,
  showLiveBadge: true,
  showMatchTitle: true,
  matchTitle: "IPL 2026 · MI vs RCB",
  showSocialHandle: true,
  socialHandle: "@stalktech",
  showSponsor: true,
  sponsorLogoUrl: "/stalkMediaAssets/stalkLogo.png",
  sponsorLabel: "Powered by",
  showWatermark: true,
  showVignette: true,
};

import type {
  PlayerStats,
  MatchState,
  MatchInfo,
} from "@/app/overlays/bundles/types";

// ═══════════════════════════════════════════════════════════
// STATIC MOCK DATA — no real match data, safe to be public
// ═══════════════════════════════════════════════════════════

function mkPlayer(
  id: string,
  name: string,
  role: string,
  runs: number,
  balls: number,
  fours: number,
  sixes: number,
  dismissal: string | null,
  overs: number,
  rc: number,
  wkts: number,
): PlayerStats {
  const fullOv = Math.floor(overs);
  const partBalls = Math.round((overs - fullOv) * 10);
  return {
    playerId: id,
    name,
    role: role as PlayerStats["role"],
    runs,
    ballsFaced: balls,
    fours,
    sixes,
    strikeRate: balls > 0 ? Math.round((runs / balls) * 1000) / 10 : 0,
    wicketDetails: dismissal
      ? {
          dismissalType: dismissal,
          bowlerId: null,
          catcherId: null,
          runOutMakerId: null,
          overNumber: 0,
          ballNumber: 0,
        }
      : null,
    overs,
    ballsBowled: fullOv * 6 + partBalls,
    runsConceded: rc,
    wicketsTaken: wkts,
    economyRate: overs > 0 ? Math.round((rc / overs) * 100) / 100 : 0,
  };
}

// Mumbai Indians — batted first, 187/5 in 20 overs
const MI_XI: PlayerStats[] = [
  mkPlayer("p1", "R. Sharma", "BAT", 62, 41, 7, 3, "caught", 0, 0, 0),
  mkPlayer("p2", "I. Kishan", "WK", 8, 12, 0, 0, "bowled", 0, 0, 0),
  mkPlayer("p3", "S. Yadav", "BAT", 45, 28, 3, 4, null, 0, 0, 0),
  mkPlayer("p4", "T. Tilak", "BAT", 22, 17, 2, 1, "caught", 0, 0, 0),
  mkPlayer("p5", "T. Stubbs", "BAT", 31, 22, 2, 2, null, 0, 0, 0),
  mkPlayer("p6", "H. Pandya", "AR", 12, 9, 1, 0, "run out", 0, 0, 0),
  mkPlayer("p7", "M. Pollard", "AR", 7, 6, 0, 0, null, 0, 0, 0),
  mkPlayer("p8", "K. Kartikeya", "BWL", 0, 0, 0, 0, null, 4, 28, 1),
  mkPlayer("p9", "J. Bumrah", "BWL", 0, 0, 0, 0, null, 4, 24, 2),
  mkPlayer("p10", "M. Siraj", "BWL", 0, 0, 0, 0, null, 4, 38, 1),
  mkPlayer("p11", "A. Khan", "BWL", 0, 0, 0, 0, null, 4, 32, 0),
];

// Royal Challengers Bangalore — chasing 188, 148/4 in 16.4 overs
const RCB_XI: PlayerStats[] = [
  mkPlayer("p12", "F. du Plessis", "BAT", 18, 15, 2, 0, "caught", 0, 0, 0),
  mkPlayer("p13", "V. Kohli", "BAT", 67, 48, 6, 2, null, 0, 0, 0), // striker
  mkPlayer("p14", "G. Maxwell", "AR", 23, 18, 2, 1, null, 0, 0, 0), // non-striker
  mkPlayer("p15", "M. Kerr", "BAT", 14, 12, 1, 0, "lbw", 0, 0, 0),
  mkPlayer("p16", "D. Karthik", "WK", 21, 14, 1, 1, "stumped", 0, 0, 0),
  mkPlayer("p17", "S. Rajendran", "AR", 5, 4, 0, 0, null, 0, 0, 0),
  mkPlayer("p18", "W. Hasaranga", "AR", 0, 0, 0, 0, null, 3, 22, 1),
  mkPlayer("p19", "J. Bumrah_rcb", "BWL", 0, 0, 0, 0, null, 3.4, 34, 2), // current bowler
  mkPlayer("p20", "H. Tyagi", "BWL", 0, 0, 0, 0, null, 4, 41, 0),
  mkPlayer("p21", "A. Harshal", "BWL", 0, 0, 0, 0, null, 4, 36, 1),
  mkPlayer("p22", "K. Ahmed", "BWL", 0, 0, 0, 0, null, 2, 18, 0),
];

const MI_TEAM = {
  name: "Mumbai Indians",
  logoUrl: null,
  playingXI: MI_XI,
  captainId: "p1",
  score: 187,
  wickets: 5,
  overs: 20,
  ballsPlayed: 120,
  extras: { wide: 6, noBall: 2, bye: 0, legBye: 3, penalty: 0 },
};

const RCB_TEAM = {
  name: "Royal Challengers",
  logoUrl: null,
  playingXI: RCB_XI,
  captainId: "p12",
  score: 148,
  wickets: 4,
  overs: 16.4,
  ballsPlayed: 100,
  extras: { wide: 4, noBall: 1, bye: 0, legBye: 1, penalty: 0 },
};

const MOCK_STATE: MatchState = {
  matchId: "preview",
  team1: MI_TEAM,
  team2: RCB_TEAM,
  tossWinner: "Mumbai Indians",
  choice: "bat",
  firstInnings: false,
  completedOvers: 16,
  totalOvers: 20,
  matchComplete: false,
  winner: null,
  winBy: null,
  battingFirst: MI_TEAM,
  battingSecond: RCB_TEAM,
  currentStriker: { playerId: "p13", name: "V. Kohli" },
  currentNonStriker: { playerId: "p14", name: "G. Maxwell" },
  currentBowler: { playerId: "p9", name: "J. Bumrah" },
  currentOverBalls: ["1", "4", "0", "6", "W"],
  innings1BattingOrder: MI_XI,
  innings2BattingOrder: RCB_XI,
  team1BowlingOrder: RCB_XI,
  team2BowlingOrder: MI_XI,
};

const MOCK_INFO: MatchInfo = {
  id: "preview",
  venue: "Wankhede Stadium, Mumbai",
  matchDate: "2026-03-14",
  matchTime: "19:30",
  stage: "Final",
  overs: 20,
  tournamentName: "IPL 2026",
  team1: { name: "Mumbai Indians", logoPath: null },
  team2: { name: "Royal Challengers", logoPath: null },
};

// ═══════════════════════════════════════════════════════════
// CANVAS
// ═══════════════════════════════════════════════════════════

const W = 1920;
const H = 1080;

// ── Media Reel preview — cycles through the stalk demo assets ──
const PREVIEW_ASSETS = [
  { id: "1", type: "VIDEO", url: "/stalkMediaAssets/stalkVideo1.mp4" },
  { id: "2", type: "VIDEO", url: "/stalkMediaAssets/stalkVideo2.mp4" },
  { id: "3", type: "IMAGE", url: "/stalkMediaAssets/stalkImage.png" },
];
const IMAGE_DURATION_MS = 8000;
const FADE_MS = 500;

function MediaReelPreview() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const advance = () => {
    setVisible(false);
    setTimeout(() => {
      setIndex((i) => (i + 1) % PREVIEW_ASSETS.length);
      setVisible(true);
    }, FADE_MS);
  };

  useEffect(() => {
    const current = PREVIEW_ASSETS[index];
    if (timerRef.current) clearTimeout(timerRef.current);
    if (current.type === "IMAGE") {
      timerRef.current = setTimeout(advance, IMAGE_DURATION_MS);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [index]);

  const current = PREVIEW_ASSETS[index];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 90,
        background: "#000",
        overflow: "hidden",
      }}
    >
      {/* Full-bleed media */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: visible ? 1 : 0,
          transition: `opacity ${FADE_MS}ms ease`,
        }}
      >
        {current.type === "IMAGE" ? (
          <img
            key={current.id}
            src={current.url}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <video
            key={current.id}
            ref={videoRef}
            src={current.url}
            autoPlay
            playsInline
            muted
            onEnded={advance}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </div>

      {/* Gradient vignettes */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
          linear-gradient(180deg, rgba(0,0,0,0.45) 0%, transparent 18%),
          linear-gradient(0deg,   rgba(0,0,0,0.72) 0%, transparent 32%)
        `,
        }}
      />

      {/* Lower third */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
        <div
          style={{
            height: 2,
            background:
              "linear-gradient(90deg, transparent 0%, rgba(217,119,6,0.9) 12%, rgba(217,119,6,0.9) 88%, transparent 100%)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 44px 22px",
            gap: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 3,
                alignSelf: "stretch",
                background: "#D97706",
                borderRadius: 2,
                minHeight: 32,
              }}
            />
            <div>
              <div
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: 10,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  letterSpacing: 3.5,
                  textTransform: "uppercase",
                  marginBottom: 3,
                  lineHeight: 1,
                }}
              >
                Commercial Break
              </div>
              <div
                style={{
                  color: "#FFFFFF",
                  fontSize: 30,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  lineHeight: 1,
                }}
              >
                Advertisement
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 9,
            }}
          >
            <div
              style={{
                color: "rgba(255,255,255,0.35)",
                fontSize: 11,
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 600,
                letterSpacing: 2,
                lineHeight: 1,
              }}
            >
              {index + 1}&nbsp;/&nbsp;{PREVIEW_ASSETS.length}
            </div>
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              {PREVIEW_ASSETS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 3,
                    width: i === index ? 32 : 10,
                    borderRadius: 2,
                    background:
                      i === index ? "#D97706" : "rgba(255,255,255,0.2)",
                    transition: "width 0.4s ease, background 0.4s ease",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* On-air indicator */}
      <div
        style={{
          position: "absolute",
          top: 24,
          right: 36,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#D97706",
            flexShrink: 0,
            animation: "onAirPulse 2s ease-in-out infinite",
          }}
        />
        <span
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 11,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          Ad Break
        </span>
      </div>

      <style>{`
        @keyframes onAirPulse {
          0%, 100% { opacity: 1;   transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}

const EVENT_OVERLAY_KEYS = ["tpl-pro-1", "tpl-pro-2"];

// ── Event trigger buttons — rendered at normal scale outside the canvas ──
function EventTriggerBar({ onFire }: { onFire: (ball: string) => void }) {
  const events: { label: string; ball: string; color: string }[] = [
    { label: "SIX", ball: "6", color: "#FFD700" },
    { label: "FOUR", ball: "4", color: "#00D4FF" },
    { label: "WICKET", ball: "W", color: "#FF4444" },
  ];
  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 999,
        padding: "8px 16px",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <span
        style={{
          color: "rgba(255,255,255,0.4)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 2,
          textTransform: "uppercase",
          marginRight: 4,
        }}
      >
        Trigger
      </span>
      {events.map(({ label, ball, color }) => (
        <button
          key={ball}
          onClick={() => onFire(ball)}
          style={{
            background: `${color}18`,
            border: `1.5px solid ${color}55`,
            color,
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: 1,
            padding: "5px 14px",
            borderRadius: 999,
            cursor: "pointer",
            transition: "background 0.15s, transform 0.1s",
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = `${color}33`)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = `${color}18`)
          }
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function OverlayCanvas({ overlayKey }: { overlayKey: string }) {
  const [scale, setScale] = useState(1);
  const [mockState, setMockState] = useState(MOCK_STATE);
  const overCounter = useRef(MOCK_STATE.completedOvers);

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

  function fireEvent(ball: string) {
    overCounter.current += 1;
    setMockState({
      ...MOCK_STATE,
      completedOvers: overCounter.current,
      currentOverBalls: [ball],
    });
  }

  const s = mockState;
  const info = MOCK_INFO;
  const showEventControls = EVENT_OVERLAY_KEYS.includes(overlayKey);

  function renderOverlay() {
    switch (overlayKey) {
      // Basic
      case "score":
        return <ScoreOverlay state={s} />;
      case "main":
        return <MainMatchBanner info={info} state={s} />;
      case "playingXI_bat_team1":
        return <BattingCard team={s.team1} state={s} />;
      case "playingXI_bat_team2":
        return <BattingCard team={s.team2} state={s} />;
      case "playingXI_bowl_team1":
        return <BowlingCard team={s.team1} state={s} />;
      case "playingXI_bowl_team2":
        return <BowlingCard team={s.team2} state={s} />;
      case "playingXI_combined":
        return <PlayingXIBothTeamsCard state={s} />;
      case "summary":
        return <MatchSummaryCard state={s} />;

      // Glass
      case "glass_score":
        return <GlassScoreOverlay state={s} />;
      case "glass_main":
        return <GlassMainMatchBanner info={info} state={s} />;
      case "glass_bat_team1":
        return <GlassBattingCard team={s.team1} state={s} />;
      case "glass_bat_team2":
        return <GlassBattingCard team={s.team2} state={s} />;
      case "glass_bowl_team1":
        return <GlassBowlingCard team={s.team1} state={s} />;
      case "glass_bowl_team2":
        return <GlassBowlingCard team={s.team2} state={s} />;
      case "glass_xi_combined":
        return <GlassPlayingXIBothTeamsCard state={s} />;
      case "glass_summary":
        return <GlassMatchSummaryCard state={s} />;

      // Material
      case "material_score":
        return <MaterialScoreOverlay state={s} />;
      case "material_main":
        return <MaterialMainMatchBanner info={info} state={s} />;
      case "material_bat_team1":
        return <MaterialBattingCard team={s.team1} state={s} />;
      case "material_bat_team2":
        return <MaterialBattingCard team={s.team2} state={s} />;
      case "material_bowl_team1":
        return <MaterialBowlingCard team={s.team1} state={s} />;
      case "material_bowl_team2":
        return <MaterialBowlingCard team={s.team2} state={s} />;
      case "material_xi_combined":
        return <MaterialPlayingXIBothTeamsCard state={s} />;
      case "material_summary":
        return <MaterialMatchSummaryCard state={s} />;

      // Aero
      case "aero_score":
        return <AeroScoreOverlay state={s} />;
      case "aero_main":
        return <AeroMainMatchBanner info={info} state={s} />;
      case "aero_bat_team1":
        return <AeroBattingCard team={s.team1} state={s} />;
      case "aero_bat_team2":
        return <AeroBattingCard team={s.team2} state={s} />;
      case "aero_bowl_team1":
        return <AeroBowlingCard team={s.team1} state={s} />;
      case "aero_bowl_team2":
        return <AeroBowlingCard team={s.team2} state={s} />;
      case "aero_xi_combined":
        return <AeroPlayingXIBothTeamsCard state={s} />;
      case "aero_summary":
        return <AeroMatchSummaryCard state={s} />;

      // Free
      case "tpl-skeletal":
        return <SkeletalScoreOverlay state={s} />;

      // Premium add-ons
      case "tpl-pro-1":
        return <EventBurstOverlay state={s as any} />;
      case "tpl-pro-2":
        return <InlineBurstOverlay state={s as any} />;
      case "tpl-pro-3":
        return <WinPredictorOverlay state={s as any} />;
      case "tpl-pro-4":
        return <BrandingOverlay config={PREVIEW_BRANDING_CONFIG} />;
      case "tpl-pro-5":
        return <MediaReelPreview />;

      default:
        return null;
    }
  }

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
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
            backgroundImage: "url('/images/matchStalkImage.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            overflow: "hidden",
            fontFamily: "'DM Sans', sans-serif",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
          }}
        >
          {renderOverlay()}
        </div>
      </div>

      {showEventControls && <EventTriggerBar onFire={fireEvent} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 22px)) scale(0.97); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes glassSlideUp {
          from { opacity: 0; transform: translateY(20px); filter: blur(3px); }
          to   { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes glassScaleIn {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 16px)) scale(0.96); filter: blur(3px); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); filter: blur(0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeScaleIn {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 12px)) scale(0.98); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes aeroSlideUp {
          from { opacity: 0; transform: translate(-50%, 40px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes aeroScaleIn {
          from { opacity: 0; transform: translate(-50%, -45%) scale(0.92); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes reelPing {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>
    </>
  );
}

function PreviewContent() {
  const searchParams = useSearchParams();
  const overlayKey = searchParams.get("overlay") ?? "";

  if (!overlayKey) return null;
  return <OverlayCanvas overlayKey={overlayKey} />;
}

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            width: "100vw",
            height: "100vh",
            background: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
            Loading preview...
          </p>
        </div>
      }
    >
      <PreviewContent />
    </Suspense>
  );
}
