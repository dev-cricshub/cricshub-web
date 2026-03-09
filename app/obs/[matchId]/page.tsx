"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { fetchMatchById, fetchMatchState, fetchStreamState } from "@/lib/api";
import { fetchBrandingConfig } from "@/lib/brandingConfig";

// Premium add-ons (unchanged)
import EventBurstOverlay from "@/app/overlays/premium/matchAddOn/EventBurstOverlay";
import InlineBurstOverlay from "@/app/overlays/premium/matchAddOn/InlineBurstOverlay";
import WinPredictorOverlay from "@/app/overlays/premium/matchAddOn/WinPredictorOverlay";
import BrandingOverlay, {
  BrandingConfig,
  DEFAULT_BRANDING_CONFIG,
} from "@/app/overlays/premium/matchAddOn/BrandingOverlay";
import MediaReelOverlay from "@/app/overlays/premium/matchAddOn/MediaReelOverlay";

// Free tier
import SkeletalScoreOverlay from "@/app/overlays/free/SkeletalScoreOverlay";

// Basic bundle overlays
import { ScoreOverlay } from "@/app/overlays/bundles/basic/ScoreOverlay";
import { MainMatchBanner } from "@/app/overlays/bundles/basic/MainMatchBanner";
import { BattingCard } from "@/app/overlays/bundles/basic/BattingCard";
import { BowlingCard } from "@/app/overlays/bundles/basic/BowlingCard";
import { PlayingXIBothTeamsCard } from "@/app/overlays/bundles/basic/PlayingXIBothTeamsCard";
import { MatchSummaryCard } from "@/app/overlays/bundles/basic/MatchSummaryCard";

// Glass bundle overlays
import { GlassScoreOverlay } from "@/app/overlays/bundles/glass/GlassScoreOverlay";
import { GlassMainMatchBanner } from "@/app/overlays/bundles/glass/GlassMainMatchBanner";
import { GlassBattingCard } from "@/app/overlays/bundles/glass/GlassBattingCard";
import { GlassBowlingCard } from "@/app/overlays/bundles/glass/GlassBowlingCard";
import { GlassPlayingXIBothTeamsCard } from "@/app/overlays/bundles/glass/GlassPlayingXIBothTeamsCard";
import { GlassMatchSummaryCard } from "@/app/overlays/bundles/glass/GlassMatchSummaryCard";

// Shared types
import { MatchState, MatchInfo, BannerType } from "@/app/overlays/bundles/types";

// ═══════════════════════════════════════════════════════════
// STREAM STATE
// ═══════════════════════════════════════════════════════════

interface StreamState {
  activeBanner: BannerType;
  templateId: string | null;
}

// ═══════════════════════════════════════════════════════════
// DESIGN CANVAS — always 1920×1080, scaled to fit viewport
// ═══════════════════════════════════════════════════════════

const W = 1920;
const H = 1080;

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
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>(
    DEFAULT_BRANDING_CONFIG,
  );
  const [playlistRefreshKey, setPlaylistRefreshKey] = useState(0);

  // Scale the 1920×1080 canvas to fit whatever the actual browser viewport is.
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
      fetchBrandingConfig(matchId),
    ])
      .then(([rawMatch, state, stream, branding]) => {
        const m = rawMatch?.data || rawMatch;
        const s = state?.data || state;
        const st = stream;
        if (!s?.team1 || !s?.team2) {
          console.warn(
            "fetchMatchState returned invalid state — waiting for WebSocket",
          );
          if (m) {
            setInfo({
              id: m?.matchId || m?.id,
              venue: m?.venue || "",
              matchDate: m?.matchDate,
              matchTime: m?.matchTime,
              stage: m?.stage,
              overs: m?.overs || 0,
              tournamentName:
                m?.tournamentResponse?.name || m?.tournamentName || null,
              team1: { name: m?.team1?.name || "Team 1", logoPath: null },
              team2: { name: m?.team2?.name || "Team 2", logoPath: null },
            });
          }
          return;
        }
        setBrandingConfig(branding);

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
          activeBanner:
            st?.activeBanner === "premium" && st?.activeTemplateId
              ? st.activeTemplateId
              : st?.activeBanner || "none",
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
              activeBanner:
                d.activeBanner === "premium" && d.activeTemplateId
                  ? d.activeTemplateId
                  : d.activeBanner,
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
        stompClient.subscribe(`/topic/branding/${matchId}`, async () => {
          try {
            console.log("Branding ping received, fetching fresh config...");
            const freshConfig = await fetchBrandingConfig(matchId);
            setBrandingConfig(freshConfig);
          } catch (e) {
            console.error("Branding fetch failed:", e);
          }
        });
        stompClient.subscribe(`/topic/playlist/${matchId}`, () => {
          setPlaylistRefreshKey((k) => k + 1);
        });
      },
    });
    stompClient.activate();
    return () => {
      stompClient.deactivate();
    };
  }, [matchId]);

  if (!info || !liveState || !liveState.team1 || !liveState.team2) return null;

  const ab = streamState.activeBanner;

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
          {/* Always-on branding layer */}
          <BrandingOverlay config={brandingConfig} />

          {/* ── Basic bundle ── */}
          {ab === "score" && <ScoreOverlay state={liveState} />}
          {ab === "main" && <MainMatchBanner info={info} state={liveState} />}
          {ab === "playingXI_bat_team1" && (
            <BattingCard team={liveState.team1} state={liveState} />
          )}
          {ab === "playingXI_bat_team2" && (
            <BattingCard team={liveState.team2} state={liveState} />
          )}
          {ab === "playingXI_bowl_team1" && (
            <BowlingCard team={liveState.team1} state={liveState} />
          )}
          {ab === "playingXI_bowl_team2" && (
            <BowlingCard team={liveState.team2} state={liveState} />
          )}
          {ab === "playingXI_combined" && (
            <PlayingXIBothTeamsCard state={liveState} />
          )}
          {ab === "summary" && (
            <MatchSummaryCard
              state={liveState}
              key={`${liveState.team1.score}-${liveState.team2.score}-${liveState.team1.wickets}-${liveState.team2.wickets}`}
            />
          )}

          {/* ── Glass bundle ── */}
          {ab === "glass_score" && <GlassScoreOverlay state={liveState} />}
          {ab === "glass_main" && (
            <GlassMainMatchBanner info={info} state={liveState} />
          )}
          {ab === "glass_bat_team1" && (
            <GlassBattingCard team={liveState.team1} state={liveState} />
          )}
          {ab === "glass_bat_team2" && (
            <GlassBattingCard team={liveState.team2} state={liveState} />
          )}
          {ab === "glass_bowl_team1" && (
            <GlassBowlingCard team={liveState.team1} state={liveState} />
          )}
          {ab === "glass_bowl_team2" && (
            <GlassBowlingCard team={liveState.team2} state={liveState} />
          )}
          {ab === "glass_xi_combined" && (
            <GlassPlayingXIBothTeamsCard state={liveState} />
          )}
          {ab === "glass_summary" && (
            <GlassMatchSummaryCard
              state={liveState}
              key={`gs-${liveState.team1.score}-${liveState.team2.score}-${liveState.team1.wickets}-${liveState.team2.wickets}`}
            />
          )}

          {/* ── Premium add-ons ── */}
          {ab === "tpl-pro-1" && <EventBurstOverlay state={liveState} />}
          {ab === "tpl-pro-2" && <InlineBurstOverlay state={liveState} />}
          {ab === "tpl-pro-3" && <WinPredictorOverlay state={liveState} />}
          {ab === "tpl-pro-5" && (
            <MediaReelOverlay
              matchId={matchId}
              refreshKey={playlistRefreshKey}
            />
          )}

          {/* ── Free tier ── */}
          {ab === "tpl-skeletal" && <SkeletalScoreOverlay state={liveState} />}
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

        /* ── Basic bundle animations ── */
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 22px)) scale(0.97); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }

        /* ── Glass bundle animations ── */
        @keyframes glassSlideUp {
          from { opacity: 0; transform: translateY(20px); filter: blur(3px); }
          to   { opacity: 1; transform: translateY(0);    filter: blur(0); }
        }
        @keyframes glassScaleIn {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 16px)) scale(0.96); filter: blur(3px); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1);               filter: blur(0); }
        }

        /* ── Shared: pulsing live dot used in PlayingXI ── */
        @keyframes reelPing {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>
    </>
  );
}
