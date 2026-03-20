"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  fetchMatchById,
  fetchMatchState,
  fetchStreamSession,
  fetchMatchSubscription,
  claimStreamLock,
  releaseStreamLock,
  pushActiveBanner,
  streamHeartbeat,
  fetchAvailableTemplates,
  fetchAvailableBundles,
  fetchStreamState,
  unlockBundleWithSubscription,
} from "@/lib/api";
import { useMatchWebSocket } from "@/hooks/useMatchWebSocket";
import UpiCheckoutModal from "@/app/components/UpiCheckoutModal";
import BrandingConfigPanel from "@/app/components/overlays/BrandingConfigPanel";
import MediaAssetsPanel from "@/app/components/overlays/MediaAssetsPanel";
import { fetchBrandingConfig, saveBrandingConfig } from "@/lib/brandingConfig";
import { DEFAULT_BRANDING_CONFIG } from "@/app/overlays/premium/matchAddOn/BrandingOverlay";
import { useObs } from "@/hooks/useObs";
import { useVmix } from "@/hooks/useVmix";
import ConnectionSettingsPanel from "@/app/components/streaming/ConnectionSettingsPanel";
import ObsControlPanel from "@/app/components/streaming/obs/ObsControlPanel";
import VmixControlPanel from "@/app/components/streaming/vmix/VmixControlPanel";

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
  wicketDetails: { dismissalType: string } | null;
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
  extras: {
    wide: number;
    noBall: number;
    bye: number;
    legBye: number;
    penalty: number;
  } | null;
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
  status: string;
  overs: number;
  tournamentName: string | null;
  team1: { id: string; name: string; logoPath: string | null };
  team2: { id: string; name: string; logoPath: string | null };
  creatorId: string;
  matchOps: string[];
}
interface StreamSession {
  isLocked: boolean;
  lockedByUserId: string | null;
  lockedByName: string | null;
}

export type BannerType =
  | "none"
  | "main"
  | "playingXI_bat_team1"
  | "playingXI_bat_team2"
  | "playingXI_bowl_team1"
  | "playingXI_bowl_team2"
  | "playingXI_combined"
  | "score"
  | "summary"
  | "glass_main"
  | "glass_score"
  | "glass_summary"
  | "glass_xi_combined"
  | "glass_bat_team1"
  | "glass_bat_team2"
  | "glass_bowl_team1"
  | "glass_bowl_team2"
  | "material_main"
  | "material_score"
  | "material_summary"
  | "material_xi_combined"
  | "material_bat_team1"
  | "material_bat_team2"
  | "material_bowl_team1"
  | "material_bowl_team2"
  | "aero_main"
  | "aero_score"
  | "aero_summary"
  | "aero_xi_combined"
  | "aero_bat_team1"
  | "aero_bat_team2"
  | "aero_bowl_team1"
  | "aero_bowl_team2"
  | string;

type MatchRole = "admin" | "operator";
interface MatchSubscription {
  adminHasSubscription: boolean;
  purchasedTemplateIds: string[];
  purchasedBundleIds: string[];
  subscriptionUnlockedBundleId: string | null;
}
interface Bundle {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  features: string[];
  bannerKeys: string[];
}
interface AddOnTemplate {
  id: string;
  name: string;
  tier: "pro" | "elite";
  price: number;
  originalPrice?: number;
  features: string[];
  previewGradient?: string;
}

// ═══════════════════════════════════════════════════════════
// VISUAL MAPPING
// ═══════════════════════════════════════════════════════════

const VISUAL_MAP: Record<string, string> = {
  "tpl-pro-1": "linear-gradient(135deg,#00F5A0,#00D9F5)",
  "tpl-pro-2": "linear-gradient(135deg,#F7971E,#FFD200)",
  "tpl-elite-1": "linear-gradient(135deg,#8E54E9,#4776E6)",
  "tpl-elite-2": "linear-gradient(135deg,#FF416C,#FF4B2B)",
};

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

const fmt12 = (t: string | number[]) => {
  if (!t) return "";
  let h: number, m: string | number;
  if (Array.isArray(t)) {
    h = t[0];
    m = t[1] !== undefined ? t[1].toString().padStart(2, "0") : "00";
  } else {
    const parts = t.split(":");
    h = parseInt(parts[0]);
    m = parts[1];
  }
  return `${h % 12 || 12}:${m} ${h >= 12 ? "PM" : "AM"}`;
};
const fmtDate = (d: string | number[]) => {
  if (!d) return "";
  const dateObj = Array.isArray(d)
    ? new Date(d[0], d[1] - 1, d[2])
    : new Date(d);
  return dateObj.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
const ballBg = (b: string) =>
  b === "W"
    ? "bg-red-500 text-white"
    : b === "4"
      ? "bg-blue-500 text-white"
      : b === "6"
        ? "bg-purple-500 text-white"
        : b === "0"
          ? "bg-gray-100 text-gray-500"
          : "bg-emerald-500 text-white";
const getBatTeam = (s: MatchState): TeamDetails | null => {
  if (!s?.team1 || !s?.team2) return null;
  if (!s.battingFirst) return s.team1;
  return s.firstInnings
    ? s.battingFirst.name === s.team1.name
      ? s.team1
      : s.team2
    : s.battingFirst.name === s.team1.name
      ? s.team2
      : s.team1;
};
const getBowlTeam = (s: MatchState): TeamDetails | null => {
  if (!s?.team1 || !s?.team2) return null;
  const bat = getBatTeam(s);
  if (!bat) return null;
  return bat.name === s.team1.name ? s.team2 : s.team1;
};
const fmtOv = (v: number) => (v > 0 ? v.toFixed(1) : "0.0");

// ═══════════════════════════════════════════════════════════
// OVERLAY PREVIEW MODAL
// ═══════════════════════════════════════════════════════════

interface OverlayPreviewModalProps {
  bannerKey: string;
  bannerTitle: string;
  previewBg: string;
  onClose: () => void;
}

function OverlayPreviewModal({
  bannerKey,
  bannerTitle,
  previewBg,
  onClose,
}: OverlayPreviewModalProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const previewUrl = `/preview?overlay=${bannerKey}`;

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Header */}
      <div className="w-full max-w-5xl px-4 pb-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex-shrink-0"
            style={{ background: previewBg }}
          />
          <div>
            <p className="text-white font-black text-sm">{bannerTitle}</p>
            <p className="text-white/40 text-xs">Live preview · 1920×1080</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold text-white/60 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition-all"
          >
            <i className="ri-external-link-line" />
            Open full size
          </a>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <i className="ri-close-line text-white" />
          </button>
        </div>
      </div>

      {/* 16:9 iframe container */}
      <div className="w-full max-w-5xl px-4 flex-shrink-0">
        <div
          className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
          style={{ aspectRatio: "16/9" }}
        >
          {/* Stadium background */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/images/matchStalkImage.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          {!iframeLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <i className="ri-loader-4-line text-white/40 text-3xl animate-spin mb-3" />
              <p className="text-white/40 text-sm font-medium">
                Loading overlay preview…
              </p>
            </div>
          )}
          <iframe
            src={previewUrl}
            className="absolute inset-0 w-full h-full"
            style={{
              border: "none",
              opacity: iframeLoaded ? 1 : 0,
              transition: "opacity 0.3s",
            }}
            onLoad={() => setIframeLoaded(true)}
            allow="autoplay"
          />
        </div>
      </div>

      {/* Footer note */}
      <div className="w-full max-w-5xl px-4 pt-3 flex items-center justify-between">
        <p className="text-white/30 text-xs">
          Preview uses sample data — actual overlay will show live match data
        </p>
        <button
          onClick={onClose}
          className="text-xs font-bold text-white/50 hover:text-white transition-colors"
        >
          Close preview
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════

function ScoreLive({ state }: { state: MatchState }) {
  const bat = getBatTeam(state);
  const bowl = getBowlTeam(state);

  if (!bat || !bowl)
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs text-gray-400 text-center">
          Match not started yet
        </p>
      </div>
    );

  const crr = bat.overs > 0 ? (bat.score / bat.overs).toFixed(2) : "—";
  const isBatTeam1 = bat.name === state.team1.name;
  const batOrder = isBatTeam1
    ? state.innings1BattingOrder
    : state.innings2BattingOrder;
  const isBowlTeam1 = bowl.name === state.team1.name;
  const bowlOrder = isBowlTeam1
    ? state.team1BowlingOrder
    : state.team2BowlingOrder;
  const stS = state.currentStriker
    ? batOrder?.find((p) => p.playerId === state.currentStriker!.playerId) ||
      bat.playingXI.find((p) => p.playerId === state.currentStriker!.playerId)
    : null;
  const nsS = state.currentNonStriker
    ? batOrder?.find((p) => p.playerId === state.currentNonStriker!.playerId) ||
      bat.playingXI.find(
        (p) => p.playerId === state.currentNonStriker!.playerId,
      )
    : null;
  const bowS = state.currentBowler
    ? bowlOrder?.find((p) => p.playerId === state.currentBowler!.playerId) ||
      bowl.playingXI.find((p) => p.playerId === state.currentBowler!.playerId)
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Live Score
        </p>
        <span className="flex items-center gap-1.5 text-[10px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
          LIVE
        </span>
      </div>
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-bold text-gray-900 text-sm">{bat.name}</p>
          <p className="font-black text-2xl text-[#1E88E5]">
            {bat.score}/{bat.wickets}
          </p>
        </div>
        <p className="text-xs text-gray-400">
          {bat.overs} ov · CRR {crr}
        </p>
        {state.currentOverBalls?.length > 0 && (
          <div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5">
              This over
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {state.currentOverBalls.map((b, i) => (
                <span
                  key={i}
                  className={`w-7 h-7 rounded-full text-[11px] font-black flex items-center justify-center ${ballBg(b)}`}
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        )}
        {(state.currentStriker ||
          state.currentNonStriker ||
          state.currentBowler) && (
          <div className="space-y-1 pt-2 border-t border-gray-50">
            {[
              { p: state.currentStriker, s: stS },
              { p: state.currentNonStriker, s: nsS },
            ]
              .filter((x) => x.p)
              .map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-gray-700 font-semibold">
                    {i === 0 ? "🏏 " : ""}
                    {item.p?.name}
                  </span>
                  {item.s ? (
                    <span className="text-gray-500 font-mono">
                      {item.s.runs}({item.s.ballsFaced})
                    </span>
                  ) : (
                    <span className="text-gray-500 font-mono">0(0)</span>
                  )}
                </div>
              ))}
            {state.currentBowler && (
              <div className="flex items-center justify-between text-xs pt-2 mt-2 border-t border-dashed border-gray-100">
                <span className="text-gray-700 font-semibold">
                  ⚾ {state.currentBowler.name}
                </span>
                {bowS ? (
                  <span className="text-gray-500 font-mono">
                    {bowS.wicketsTaken}-{bowS.runsConceded} ({fmtOv(bowS.overs)}
                    )
                  </span>
                ) : (
                  <span className="text-gray-500 font-mono">0-0 (0)</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BannerCard({
  icon,
  title,
  teamName,
  desc,
  active,
  canActivate,
  lockedReason,
  onToggle,
  previewBg,
  badge,
  onPreview,
}: {
  icon: string;
  title: string;
  teamName?: string;
  desc: string;
  active: boolean;
  canActivate: boolean;
  lockedReason?: string;
  onToggle: () => void;
  previewBg?: string;
  badge?: string;
  onPreview?: () => void;
}) {
  return (
    <div
      className={`relative rounded-2xl border overflow-hidden transition-all duration-300 select-none flex flex-col
        ${active ? "border-[#34B8FF] shadow-lg shadow-blue-100 bg-blue-50 cursor-pointer" : ""}
        ${!active && canActivate ? "border-gray-200 bg-white cursor-pointer hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5" : ""}
        ${!canActivate ? "border-gray-200 bg-gray-50 cursor-not-allowed" : ""}`}
      onClick={() => canActivate && onToggle()}
    >
      {/* Preview colour bar */}
      {previewBg && (
        <div
          className="h-12 w-full relative flex-shrink-0"
          style={{ background: previewBg }}
        >
          {active && (
            <div className="absolute top-2 left-2.5 flex items-center gap-1 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              ON AIR
            </div>
          )}
          {/* Preview button */}
          {onPreview && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPreview();
              }}
              className="absolute top-2 right-2 flex items-center gap-1 bg-black/40 hover:bg-black/60 text-white text-[9px] font-bold px-2 py-1 rounded-full transition-colors backdrop-blur-sm"
            >
              <i className="ri-eye-line text-xs" />
              Preview
            </button>
          )}
          {active && (
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-[#34B8FF] via-blue-300 to-[#34B8FF] animate-pulse" />
          )}
        </div>
      )}

      {/* Body */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? "bg-gradient-to-br from-[#34B8FF] to-[#1E88E5]" : "bg-gray-100"}`}
          >
            <i
              className={`${icon} text-base ${active ? "text-white" : "text-gray-500"}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p
                className={`font-semibold text-[11px] uppercase tracking-widest ${active ? "text-[#1E88E5]" : "text-gray-500"}`}
              >
                {title}
              </p>
              {badge && (
                <span className="text-[9px] font-black bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
            </div>
            {teamName && (
              <p
                className={`font-bold text-sm leading-tight mt-0.5 truncate ${active ? "text-[#1565C0]" : "text-gray-800"}`}
              >
                {teamName}
              </p>
            )}
            <p
              className={`text-xs leading-relaxed mt-1 ${active ? "text-blue-600" : "text-gray-500"}`}
            >
              {desc}
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="mt-auto">
          {!canActivate ? (
            <div className="w-full py-2 rounded-xl bg-gray-100 text-gray-400 text-xs font-bold text-center flex items-center justify-center gap-1.5">
              <i className="ri-lock-line" />
              {lockedReason ?? "Unavailable"}
            </div>
          ) : active ? (
            <div className="w-full py-2 rounded-xl bg-red-50 text-red-500 border border-red-200 text-xs font-bold text-center">
              <i className="ri-stop-circle-line mr-1.5" />
              Hide Banner
            </div>
          ) : (
            <div className="w-full py-2 rounded-xl bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white text-xs font-bold text-center">
              <i className="ri-play-circle-line mr-1.5" />
              Show Banner
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StreamControlPanel({
  session,
  streaming,
  claimBusy,
  canStream,
  lockedReason,
  onClaim,
  onRelease,
  overlayUrl,
  copied,
  onCopy,
  currentUserId,
  streamSoftware,
  onSoftwareChange,
}: {
  session: StreamSession;
  streaming: boolean;
  claimBusy: boolean;
  canStream: boolean;
  lockedReason?: string;
  onClaim: () => void;
  onRelease: () => void;
  overlayUrl: string;
  copied: boolean;
  onCopy: () => void;
  currentUserId: string;
  streamSoftware: "obs" | "vmix";
  onSoftwareChange: (sw: "obs" | "vmix") => void;
}) {
  const lockedByOther =
    session.isLocked && session.lockedByUserId !== currentUserId;
  const swLabel = streamSoftware === "obs" ? "OBS" : "vMix";
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
          Stream Control
        </p>

        {/* Software selector */}
        <div className="mb-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Streaming Software
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onSoftwareChange("obs")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                streamSoftware === "obs"
                  ? "bg-[#34B8FF]/10 text-[#1E88E5] border-[#34B8FF]/30 shadow-sm"
                  : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <i className="ri-camera-line" />
              OBS Studio
            </button>
            <button
              onClick={() => onSoftwareChange("vmix")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                streamSoftware === "vmix"
                  ? "bg-[#34B8FF]/10 text-[#1E88E5] border-[#34B8FF]/30 shadow-sm"
                  : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <i className="ri-vidicon-line" />
              vMix
            </button>
          </div>
        </div>

        {!canStream ? (
          <div className="text-center py-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-3">
              <i className="ri-vip-crown-line text-amber-500 text-2xl" />
            </div>
            <p className="font-bold text-gray-900 text-sm mb-1">
              Streaming dashboard locked
            </p>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              {lockedReason}
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:shadow-md transition-all"
            >
              <i className="ri-vip-crown-line" />
              View Plans
            </Link>
          </div>
        ) : lockedByOther ? (
          <div className="text-center py-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-3">
              <i className="ri-lock-2-line text-amber-500 text-2xl" />
            </div>
            <p className="font-bold text-gray-900 text-sm mb-1">
              Stream is active
            </p>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              <strong>{session.lockedByName}</strong> is currently streaming.
            </p>
          </div>
        ) : !streaming ? (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 space-y-1">
              <p className="font-bold">Before you start:</p>
              <p>① Copy the URL below & add as Browser Source in {swLabel}</p>
              <p>② Click &quot;Start Streaming&quot; to take control</p>
            </div>
            <button
              onClick={onClaim}
              disabled={claimBusy}
              className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 text-white font-black rounded-xl hover:shadow-lg hover:shadow-red-200 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            >
              {claimBusy ? (
                <>
                  <i className="ri-loader-4-line animate-spin" />
                  Claiming…
                </>
              ) : (
                <>
                  <i className="ri-live-line" />
                  Start Streaming
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping flex-shrink-0" />
              <div>
                <p className="text-red-700 text-sm font-bold">You are live</p>
                <p className="text-red-500 text-xs">
                  {swLabel} is capturing your overlay
                </p>
              </div>
            </div>
            <button
              onClick={onRelease}
              className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-red-50 hover:text-red-600 transition-all border border-gray-200 flex items-center justify-center gap-1.5"
            >
              <i className="ri-stop-circle-line" />
              Release Stream
            </button>
          </div>
        )}
      </div>
      {canStream && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Browser Source URL
            </p>
            <Link
              href={overlayUrl}
              target="_blank"
              className="text-[10px] text-[#34B8FF] font-semibold hover:underline"
            >
              Preview <i className="ri-external-link-line" />
            </Link>
          </div>
          <div className="flex gap-2 mb-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-500 font-mono truncate">
              {overlayUrl}
            </div>
            <button
              onClick={onCopy}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all ${copied ? "bg-green-500 text-white" : "bg-[#34B8FF]/10 text-[#1E88E5] border border-[#34B8FF]/20 hover:bg-[#34B8FF]/20"}`}
            >
              {copied ? (
                <>
                  <i className="ri-check-line" /> Copied!
                </>
              ) : (
                <>
                  <i className="ri-clipboard-line" /> Copy
                </>
              )}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            {streamSoftware === "obs"
              ? "OBS \u2192 Add Source \u2192 Browser \u2192 paste URL \u2192 1920\u00d71080 \u2192 \u2705 Allow transparency"
              : "vMix \u2192 Add Input \u2192 Web Browser \u2192 paste URL \u2192 1920\u00d71080"}
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// BUNDLE INFO MODAL
// ═══════════════════════════════════════════════════════════

const BUNDLE_OVERLAY_DETAILS: Record<
  string,
  {
    icon: string;
    title: string;
    desc: string;
    previewBg: string;
    teamLabel?: string;
  }
> = {
  main: {
    icon: "ri-layout-top-2-line",
    title: "Main Match Banner",
    desc: "Tournament name, both teams, venue, date and toss result.",
    previewBg: "linear-gradient(135deg,#34B8FF,#1E88E5)",
  },
  score: {
    icon: "ri-bar-chart-line",
    title: "Live Score Overlay",
    desc: "Always-on bottom bar — live score, batters, bowler and ball-by-ball.",
    previewBg: "linear-gradient(135deg,#0a1628,#1E88E5)",
  },
  summary: {
    icon: "ri-file-list-3-line",
    title: "Match Summary",
    desc: "Top batters & bowlers from both teams.",
    previewBg: "linear-gradient(135deg,#E2B94B,#8B6914)",
  },
  playingXI_combined: {
    icon: "ri-team-line",
    title: "Playing XI — Both Teams",
    desc: "Side-by-side full lineup with player roles and captain badge.",
    previewBg: "linear-gradient(135deg,#4A9EF5,#A855F7)",
  },
  playingXI_bat_team1: {
    icon: "ri-group-line",
    title: "Batting XI",
    desc: "Full batting lineup for Team 1.",
    previewBg: "linear-gradient(135deg,#00b4d8,#0077b6)",
    teamLabel: "Team 1",
  },
  playingXI_bat_team2: {
    icon: "ri-group-line",
    title: "Batting XI",
    desc: "Full batting lineup for Team 2.",
    previewBg: "linear-gradient(135deg,#00b4d8,#0077b6)",
    teamLabel: "Team 2",
  },
  playingXI_bowl_team1: {
    icon: "ri-group-2-line",
    title: "Bowling XI",
    desc: "Bowling lineup for Team 1.",
    previewBg: "linear-gradient(135deg,#8E54E9,#4776E6)",
    teamLabel: "Team 1",
  },
  playingXI_bowl_team2: {
    icon: "ri-group-2-line",
    title: "Bowling XI",
    desc: "Bowling lineup for Team 2.",
    previewBg: "linear-gradient(135deg,#8E54E9,#4776E6)",
    teamLabel: "Team 2",
  },
  glass_main: {
    icon: "ri-layout-top-2-line",
    title: "Glass Match Banner",
    desc: "Frosted-glass panel with teal glow accents.",
    previewBg: "linear-gradient(135deg,#00D4AA,#22D3EE)",
  },
  glass_score: {
    icon: "ri-bar-chart-line",
    title: "Glass Score Overlay",
    desc: "Bottom score bar with backdrop blur and teal glow border.",
    previewBg: "linear-gradient(135deg,#00D4AA,#0a1628)",
  },
  glass_summary: {
    icon: "ri-file-list-3-line",
    title: "Glass Match Summary",
    desc: "Frosted-glass innings panels with cyan/pink accents.",
    previewBg: "linear-gradient(135deg,#0a1628,#22D3EE)",
  },
  glass_xi_combined: {
    icon: "ri-team-line",
    title: "Glass Playing XI",
    desc: "Two-column glassmorphism lineup card.",
    previewBg: "linear-gradient(135deg,#22D3EE,#F472B6)",
  },
  glass_bat_team1: {
    icon: "ri-group-line",
    title: "Glass Batting XI",
    desc: "Frosted batting lineup for Team 1.",
    previewBg: "linear-gradient(135deg,#22D3EE,#0077b6)",
    teamLabel: "Team 1",
  },
  glass_bat_team2: {
    icon: "ri-group-line",
    title: "Glass Batting XI",
    desc: "Frosted batting lineup for Team 2.",
    previewBg: "linear-gradient(135deg,#22D3EE,#0077b6)",
    teamLabel: "Team 2",
  },
  glass_bowl_team1: {
    icon: "ri-group-2-line",
    title: "Glass Bowling XI",
    desc: "Frosted bowling lineup for Team 1.",
    previewBg: "linear-gradient(135deg,#00D4AA,#F472B6)",
    teamLabel: "Team 1",
  },
  glass_bowl_team2: {
    icon: "ri-group-2-line",
    title: "Glass Bowling XI",
    desc: "Frosted bowling lineup for Team 2.",
    previewBg: "linear-gradient(135deg,#00D4AA,#F472B6)",
    teamLabel: "Team 2",
  },
  material_main: {
    icon: "ri-layout-top-2-line",
    title: "Material Match Banner",
    desc: "Clean flat-design tournament banner.",
    previewBg: "#009688",
  },
  material_score: {
    icon: "ri-bar-chart-line",
    title: "Material Score Overlay",
    desc: "Solid high-contrast bottom score bar.",
    previewBg: "#111827",
  },
  material_summary: {
    icon: "ri-file-list-3-line",
    title: "Material Match Summary",
    desc: "Flat color-blocked innings panels.",
    previewBg: "#030712",
  },
  material_xi_combined: {
    icon: "ri-team-line",
    title: "Material Playing XI",
    desc: "Side-by-side solid lineup card.",
    previewBg: "#00BCD4",
  },
  material_bat_team1: {
    icon: "ri-group-line",
    title: "Material Batting XI",
    desc: "Solid batting lineup for Team 1.",
    previewBg: "#00BCD4",
    teamLabel: "Team 1",
  },
  material_bat_team2: {
    icon: "ri-group-line",
    title: "Material Batting XI",
    desc: "Solid batting lineup for Team 2.",
    previewBg: "#00BCD4",
    teamLabel: "Team 2",
  },
  material_bowl_team1: {
    icon: "ri-group-2-line",
    title: "Material Bowling XI",
    desc: "Solid bowling lineup for Team 1.",
    previewBg: "#E91E63",
    teamLabel: "Team 1",
  },
  material_bowl_team2: {
    icon: "ri-group-2-line",
    title: "Material Bowling XI",
    desc: "Solid bowling lineup for Team 2.",
    previewBg: "#E91E63",
    teamLabel: "Team 2",
  },
  aero_main: {
    icon: "ri-layout-top-2-line",
    title: "Aero Match Banner",
    desc: "Floating modular stack with tournament pill and team islands.",
    previewBg: "#F3F4F6",
  },
  aero_score: {
    icon: "ri-bar-chart-line",
    title: "Aero Score Stack",
    desc: "Decoupled modular floating islands.",
    previewBg: "#FFFFFF",
  },
  aero_summary: {
    icon: "ri-file-list-3-line",
    title: "Aero Match Summary",
    desc: "Elegant light-mode panels with soft gray backgrounds.",
    previewBg: "#F3F4F6",
  },
  aero_xi_combined: {
    icon: "ri-team-line",
    title: "Aero Playing XI",
    desc: "Clean floating lineup with role pills.",
    previewBg: "#FFFFFF",
  },
  aero_bat_team1: {
    icon: "ri-group-line",
    title: "Aero Batting XI",
    desc: "Light-themed batting card — Team 1.",
    previewBg: "#E0F2FE",
    teamLabel: "Team 1",
  },
  aero_bat_team2: {
    icon: "ri-group-line",
    title: "Aero Batting XI",
    desc: "Light-themed batting card — Team 2.",
    previewBg: "#E0F2FE",
    teamLabel: "Team 2",
  },
  aero_bowl_team1: {
    icon: "ri-group-2-line",
    title: "Aero Bowling XI",
    desc: "Minimalist bowling lineup — Team 1.",
    previewBg: "#FFE4E6",
    teamLabel: "Team 1",
  },
  aero_bowl_team2: {
    icon: "ri-group-2-line",
    title: "Aero Bowling XI",
    desc: "Minimalist bowling lineup — Team 2.",
    previewBg: "#FFE4E6",
    teamLabel: "Team 2",
  },
};

function BundleInfoModal({
  bundle,
  onClose,
  onPreview,
}: {
  bundle: Bundle;
  onClose: () => void;
  onPreview: (key: string, title: string, previewBg: string) => void;
}) {
  const cards = bundle.bannerKeys
    .map((key) => ({ key, ...BUNDLE_OVERLAY_DETAILS[key] }))
    .filter((c) => c.icon);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl w-full sm:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
              <i className="ri-stack-line text-emerald-600" />
            </div>
            <div>
              <h2 className="font-black text-gray-900 text-base sm:text-lg leading-none">
                {bundle.name}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {cards.length} overlays · ₹{bundle.price}/match
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <i className="ri-close-line text-gray-600 text-lg" />
          </button>
        </div>
        <div className="px-5 sm:px-6 py-3 bg-emerald-50 border-b border-emerald-100 flex-shrink-0">
          <p className="text-sm text-emerald-800">{bundle.description}</p>
        </div>
        <div
          className="overflow-y-auto overscroll-contain p-4 sm:p-6"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {cards.map((card) => (
              <div
                key={card.key}
                className="rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className="h-16 sm:h-20 w-full relative flex items-center justify-center"
                  style={{ background: card.previewBg }}
                >
                  <div className="bg-black/25 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                    <i className={`${card.icon} text-white text-sm`} />
                    <span className="text-white text-[10px] font-black tracking-widest uppercase">
                      OBS Overlay
                    </span>
                  </div>
                  <button
                    onClick={() => onPreview(card.key, card.title, card.previewBg)}
                    className="absolute top-1.5 right-2 flex items-center gap-1 bg-black/40 hover:bg-black/60 text-white text-[9px] font-bold px-2 py-1 rounded-full transition-colors backdrop-blur-sm"
                  >
                    <i className="ri-eye-line text-xs" />
                    Preview
                  </button>
                </div>
                <div className="p-3 sm:p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i className={`${card.icon} text-gray-500 text-xs`} />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm leading-tight">
                        {card.title}
                        {card.teamLabel && (
                          <span className="ml-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">
                            {card.teamLabel}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-5 sm:px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4 flex-shrink-0">
          <p className="text-xs text-gray-400">
            All overlays update in real time.
          </p>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold rounded-xl hover:shadow-md transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SUBSCRIPTION UNLOCK CONFIRMATION MODAL
// ═══════════════════════════════════════════════════════════

function SubscriptionUnlockModal({
  bundle,
  onConfirm,
  onCancel,
}: {
  bundle: Bundle;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header strip */}
        <div className="bg-gradient-to-r from-[#1E88E5] to-[#1565C0] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <i className="ri-vip-crown-line text-white text-lg" />
            </div>
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">
                Subscription Perk
              </p>
              <h2 className="text-white font-black text-base leading-tight">
                Unlock {bundle.name}
              </h2>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-3">
            <i className="ri-error-warning-line text-amber-500 text-lg flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 leading-relaxed">
              Your subscription includes <strong>one free bundle per match.</strong> Once you choose {bundle.name}, this cannot be changed for this match.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              What you&apos;re unlocking
            </p>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="font-bold text-gray-900 text-sm">{bundle.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{bundle.description}</p>
              <ul className="mt-2 space-y-1">
                {bundle.features.slice(0, 4).map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <i className="ri-check-line text-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#1E88E5] to-[#1565C0] text-white text-sm font-black hover:shadow-lg hover:shadow-blue-200 transition-all"
          >
            Confirm Unlock
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════

export default function StreamDashboard() {
  const params = useParams();
  const matchId = params?.matchId as string;
  const [currentUser, setCurrentUser] = useState({ id: "", name: "" });
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [session, setSession] = useState<StreamSession>({
    isLocked: false,
    lockedByUserId: null,
    lockedByName: null,
  });
  const [matchSub, setMatchSub] = useState<MatchSubscription | null>(null);
  const [activeBanner, setActiveBanner] = useState<BannerType>("none");
  const [previousBanner, setPreviousBanner] = useState<BannerType>("none");
  const [brandingOpen, setBrandingOpen] = useState(true);
  const [mediaReelOpen, setMediaReelOpen] = useState(true);
  const [templates, setTemplates] = useState<AddOnTemplate[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [claimBusy, setClaimBusy] = useState(false);
  const [bannerBusy, setBannerBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checkoutAddon, setCheckoutAddon] = useState<AddOnTemplate | null>(
    null,
  );
  const [successAddonId, setSuccessAddonId] = useState<string | null>(null);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [checkoutBundle, setCheckoutBundle] = useState<Bundle | null>(null);
  const [successBundleId, setSuccessBundleId] = useState<string | null>(null);
  const [freeUnlockBusy, setFreeUnlockBusy] = useState<string | null>(null); // holds bundleId while unlocking
  const [confirmUnlockBundle, setConfirmUnlockBundle] = useState<Bundle | null>(null);
  const [infoBundleId, setInfoBundleId] = useState<string | null>(null);
  const [brandingConfig, setBrandingConfig] = useState(DEFAULT_BRANDING_CONFIG);
  const [overlayTab, setOverlayTab] = useState<
    "basic" | "glass" | "material" | "aero"
  >("basic");

  // ── Sidebar drawer state (mobile) ──
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Overlay preview state ──
  const [previewBanner, setPreviewBanner] = useState<{
    key: string;
    title: string;
    previewBg: string;
  } | null>(null);

  useEffect(() => {
    const basic = (matchSub?.purchasedBundleIds ?? []).includes("bundle-basic");
    const glass = (matchSub?.purchasedBundleIds ?? []).includes("bundle-glass");
    const material = (matchSub?.purchasedBundleIds ?? []).includes(
      "bundle-material",
    );
    const aero = (matchSub?.purchasedBundleIds ?? []).includes("bundle-aero");
    if (basic) setOverlayTab("basic");
    else if (glass) setOverlayTab("glass");
    else if (material) setOverlayTab("material");
    else if (aero) setOverlayTab("aero");
  }, [matchSub]);

  useEffect(() => {
    fetchBrandingConfig(matchId).then(setBrandingConfig);
  }, [matchId]);

  useEffect(() => {
    const userId = localStorage.getItem("userUUID");
    if (!userId) {
      const returnUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `/?login=true&redirect=${returnUrl}`;
      return;
    }
    setCurrentUser({
      id: userId,
      name: localStorage.getItem("userName") ?? "User",
    });
  }, []);

  const [overlayUrl, setOverlayUrl] = useState("");
  const [streamSoftware, setStreamSoftware] = useState<"obs" | "vmix">("obs");
  useEffect(() => {
    setOverlayUrl(`${window.location.origin}/overlay/${matchId}`);
  }, [matchId]);

  // ── OBS & vMix integration hooks ──
  const obs = useObs();
  const vmix = useVmix();

  const matchRole: MatchRole | null = matchInfo
    ? matchInfo.creatorId === currentUser.id
      ? "admin"
      : "operator"
    : null;
  const isAdmin = matchRole === "admin";
  const isOperator = matchRole === "operator";
  const iAmStreaming =
    session.isLocked && session.lockedByUserId === currentUser.id;
  const canStream = true;
  const streamLockReason = "";

  const hasBasicBundle = (matchSub?.purchasedBundleIds ?? []).includes("bundle-basic");
  const hasGlassBundle = (matchSub?.purchasedBundleIds ?? []).includes(
    "bundle-glass",
  );
  const hasMaterialBundle = (matchSub?.purchasedBundleIds ?? []).includes(
    "bundle-material",
  );
  const hasAeroBundle = (matchSub?.purchasedBundleIds ?? []).includes(
    "bundle-aero",
  );
  const hasAnyBundle =
    hasBasicBundle ||
    hasGlassBundle ||
    hasMaterialBundle ||
    hasAeroBundle ||
    (matchSub?.purchasedBundleIds ?? []).length > 0;

  const { matchState: wsMatchState, activeBanner: wsActiveBanner } =
    useMatchWebSocket(matchId);
  useEffect(() => {
    if (wsMatchState) setMatchState(wsMatchState);
  }, [wsMatchState]);
  useEffect(() => {
    if (wsActiveBanner && wsActiveBanner !== activeBanner)
      setActiveBanner(wsActiveBanner as BannerType);
  }, [wsActiveBanner]);

  useEffect(() => {
    if (!matchId || !currentUser.id) return;
    Promise.all([
      fetchMatchById(matchId),
      fetchMatchState(matchId),
      fetchStreamSession(matchId),
      fetchMatchSubscription(matchId),
      fetchAvailableTemplates(),
      fetchAvailableBundles(),
      fetchStreamState(matchId),
    ])
      .then(([rawMatch, state, sess, sub, tpls, bndls, streamState]) => {
        const actualMatch = rawMatch?.data || rawMatch;
        const creatorId =
          actualMatch?.creatorId || actualMatch?.creatorName?.id;
        const opsArray = actualMatch?.matchOps || [];
        if (
          currentUser.id !== creatorId &&
          !opsArray.includes(currentUser.id)
        ) {
          setIsUnauthorized(true);
          setLoading(false);
          return;
        }
        const actualState = state?.data || state;
        setMatchInfo({
          id: actualMatch?.matchId || actualMatch?.id,
          venue: actualMatch?.venue || "Venue TBD",
          matchDate: actualMatch?.matchDate,
          matchTime: actualMatch?.matchTime,
          stage: actualMatch?.stage,
          status: actualMatch?.status,
          overs: actualMatch?.overs,
          tournamentName: actualMatch?.tournamentResponse?.name || null,
          team1: {
            id: actualMatch?.team1Id || "t1",
            name: actualState?.team1?.name || "Team 1",
            logoPath: actualState?.team1?.logoUrl || null,
          },
          team2: {
            id: actualMatch?.team2Id || "t2",
            name: actualState?.team2?.name || "Team 2",
            logoPath: actualState?.team2?.logoUrl || null,
          },
          creatorId: actualMatch?.creatorId || actualMatch?.creatorName?.id,
          matchOps: actualMatch?.matchOps || [],
        });
        setMatchState(actualState);
        setSession({
          isLocked: sess?.locked ?? false,
          lockedByUserId: sess?.lockedByUserId ?? null,
          lockedByName: sess?.lockedByName ?? null,
        });
        setMatchSub(sub);
        const mappedTemplates = (tpls || []).map((t: any) => ({
          ...t,
          previewGradient:
            VISUAL_MAP[t.id] || "linear-gradient(135deg,#111,#333)",
        }));
        setTemplates(mappedTemplates);
        setBundles(bndls || []);
        if (sess?.locked && sess?.lockedByUserId === currentUser.id)
          setStreaming(true);
        if (streamState?.activeBanner && streamState.activeBanner !== "none") {
          const restored =
            streamState.activeTemplateId ?? streamState.activeBanner;
          setActiveBanner(restored as BannerType);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load match dashboard:", err);
        setLoading(false);
      });
  }, [matchId, currentUser.id]);

  useEffect(() => {
    if (!iAmStreaming || !matchId) return;
    const interval = setInterval(() => {
      streamHeartbeat(matchId, currentUser.id).catch(console.error);
    }, 60000);
    return () => clearInterval(interval);
  }, [iAmStreaming, matchId, currentUser.id]);

  const handleClaim = async () => {
    setClaimBusy(true);
    const result = await claimStreamLock(
      matchId,
      currentUser.id,
      currentUser.name,
    );
    if (result.success) {
      setSession({
        isLocked: true,
        lockedByUserId: currentUser.id,
        lockedByName: currentUser.name,
      });
      setStreaming(true);
    } else
      alert(`Could not claim stream: ${result.message || "Already locked"}`);
    setClaimBusy(false);
  };

  const handleRelease = async () => {
    await releaseStreamLock(matchId, currentUser.id);
    await pushActiveBanner(matchId, currentUser.id, "none", null);
    setSession({ isLocked: false, lockedByUserId: null, lockedByName: null });
    setStreaming(false);
    setActiveBanner("none");
  };

  const handleBanner = async (banner: BannerType) => {
    if (!iAmStreaming || bannerBusy) return;
    setBannerBusy(true);
    let next: BannerType;
    if (activeBanner === banner) {
      if (banner === "tpl-pro-5" && previousBanner !== "none") {
        next = previousBanner;
      } else {
        next = "none";
      }
      setPreviousBanner("none");
    } else {
      if (banner === "tpl-pro-5") setPreviousBanner(activeBanner);
      next = banner;
    }
    const isPremium = next.startsWith("tpl-") && next !== "tpl-skeletal";
    await pushActiveBanner(
      matchId,
      currentUser.id,
      isPremium ? "premium" : next,
      isPremium ? next : null,
    );
    setActiveBanner(next);
    setBannerBusy(false);
  };

  const copyOverlayUrl = () => {
    navigator.clipboard.writeText(overlayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFreeUnlock = async (bundle: Bundle) => {
    if (freeUnlockBusy) return;
    setConfirmUnlockBundle(null);
    setFreeUnlockBusy(bundle.id);
    try {
      await unlockBundleWithSubscription(matchId, {
        userId: currentUser.id,
        bundleId: bundle.id,
        bundleName: bundle.name,
      });
      const updated = await fetchMatchSubscription(matchId);
      setMatchSub(updated);
      setSuccessBundleId(bundle.id);
      setTimeout(() => setSuccessBundleId(null), 3000);
    } catch (e: any) {
      alert(e.message ?? "Failed to unlock bundle.");
    } finally {
      setFreeUnlockBusy(null);
    }
  };

  // ── Helper: open preview modal ──
  const openPreview = (key: string, title: string, previewBg: string) => {
    setPreviewBanner({ key, title, previewBg });
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#34B8FF] to-[#1E88E5] flex items-center justify-center shadow-xl animate-pulse">
            <i className="ri-live-line text-white text-3xl" />
          </div>
          <p className="font-semibold text-gray-500">Loading stream studio…</p>
        </div>
      </div>
    );

  if (isUnauthorized)
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center border border-gray-100">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-shield-keyhole-line text-4xl text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            You do not have permission to view the streaming dashboard for this
            match.
          </p>
          <Link
            href="/dashboard"
            className="block w-full py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
          >
            Back to My Dashboard
          </Link>
        </div>
        <link
          href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css"
          rel="stylesheet"
        />
      </div>
    );

  const purchasedTemplates = templates.filter((t) =>
    matchSub?.purchasedTemplateIds.includes(t.id),
  );

  const swLabel = streamSoftware === "obs" ? "OBS" : "vMix";
  const activeBannerLabel = () => {
    if (activeBanner === "none")
      return `No banner active — overlay is clear`;
    if (activeBanner === "tpl-skeletal")
      return `📊 Score Overlay (Free) is live on ${swLabel}`;
    if (activeBanner === "main") return `📺 Main Match Banner is live on ${swLabel}`;
    if (activeBanner === "playingXI_bat_team1")
      return `🏏 Batting XI — ${matchState?.team1?.name ?? "Team 1"} is live`;
    if (activeBanner === "playingXI_bat_team2")
      return `🏏 Batting XI — ${matchState?.team2?.name ?? "Team 2"} is live`;
    if (activeBanner === "playingXI_bowl_team1")
      return `🎳 Bowling XI — ${matchState?.team1?.name ?? "Team 1"} is live`;
    if (activeBanner === "playingXI_bowl_team2")
      return `🎳 Bowling XI — ${matchState?.team2?.name ?? "Team 2"} is live`;
    if (activeBanner === "playingXI_combined")
      return `👥 Playing XI — Both Teams is live on ${swLabel}`;
    if (activeBanner === "score") return `📊 Score Overlay is live on ${swLabel}`;
    if (activeBanner === "summary") return `📋 Match Summary is live on ${swLabel}`;
    if (activeBanner.startsWith("glass_"))
      return `🔷 Glass ${activeBanner.replace("glass_", "")} is live`;
    if (activeBanner.startsWith("material_"))
      return `🔲 Material ${activeBanner.replace("material_", "")} is live`;
    if (activeBanner.startsWith("aero_"))
      return `🌤 Aero ${activeBanner.replace("aero_", "")} is live`;
    return `✨ ${templates.find((t) => t.id === activeBanner)?.name ?? "Premium Overlay"} is live on ${swLabel}`;
  };

  // ── Banner lists ──
  const INCLUDED_BANNERS_ADMIN = [
    {
      icon: "ri-layout-top-2-line",
      title: "Main Match Banner",
      desc: "Tournament, teams, venue, date and toss result.",
      key: "main",
      previewBg: "linear-gradient(135deg,#34B8FF,#1E88E5)",
    },
    {
      icon: "ri-team-line",
      title: "Playing XI — Both Teams",
      desc: "Side-by-side lineup with player roles and captain badge.",
      key: "playingXI_combined",
      previewBg: "linear-gradient(135deg,#4A9EF5,#A855F7)",
    },
    {
      icon: "ri-group-line",
      title: "Batting XI",
      teamName: matchState?.team1?.name ?? "Team 1",
      desc: "Full batting lineup with live runs and dismissal info.",
      key: "playingXI_bat_team1",
      previewBg: "linear-gradient(135deg,#00b4d8,#0077b6)",
    },
    {
      icon: "ri-group-line",
      title: "Batting XI",
      teamName: matchState?.team2?.name ?? "Team 2",
      desc: "Full batting lineup with live runs and dismissal info.",
      key: "playingXI_bat_team2",
      previewBg: "linear-gradient(135deg,#00b4d8,#0077b6)",
    },
    {
      icon: "ri-group-2-line",
      title: "Bowling XI",
      teamName: matchState?.team1?.name ?? "Team 1",
      desc: "Bowling lineup with overs, wickets and economy.",
      key: "playingXI_bowl_team1",
      previewBg: "linear-gradient(135deg,#8E54E9,#4776E6)",
    },
    {
      icon: "ri-group-2-line",
      title: "Bowling XI",
      teamName: matchState?.team2?.name ?? "Team 2",
      desc: "Bowling lineup with overs, wickets and economy.",
      key: "playingXI_bowl_team2",
      previewBg: "linear-gradient(135deg,#8E54E9,#4776E6)",
    },
    {
      icon: "ri-bar-chart-line",
      title: "Live Score Overlay",
      desc: "Persistent bottom score bar, updates ball by ball.",
      key: "score",
      previewBg: "linear-gradient(135deg,#0a1628,#1E88E5)",
    },
    {
      icon: "ri-file-list-3-line",
      title: "Match Summary",
      desc: "Top batters & bowlers from both teams.",
      key: "summary",
      previewBg: "linear-gradient(135deg,#E2B94B,#8B6914)",
    },
  ];
  const GLASS_BUNDLE_BANNERS = [
    {
      icon: "ri-layout-top-2-line",
      title: "Glass Match Banner",
      desc: "Frosted glass match banner.",
      key: "glass_main",
      previewBg: "linear-gradient(135deg,#00D4AA,#22D3EE)",
    },
    {
      icon: "ri-team-line",
      title: "Glass Playing XI",
      desc: "Glassmorphism lineup card.",
      key: "glass_xi_combined",
      previewBg: "linear-gradient(135deg,#22D3EE,#F472B6)",
    },
    {
      icon: "ri-group-line",
      title: "Glass Batting XI",
      teamName: matchState?.team1?.name ?? "Team 1",
      desc: "Frosted batting lineup — Team 1.",
      key: "glass_bat_team1",
      previewBg: "linear-gradient(135deg,#22D3EE,#0077b6)",
    },
    {
      icon: "ri-group-line",
      title: "Glass Batting XI",
      teamName: matchState?.team2?.name ?? "Team 2",
      desc: "Frosted batting lineup — Team 2.",
      key: "glass_bat_team2",
      previewBg: "linear-gradient(135deg,#22D3EE,#0077b6)",
    },
    {
      icon: "ri-group-2-line",
      title: "Glass Bowling XI",
      teamName: matchState?.team1?.name ?? "Team 1",
      desc: "Frosted bowling lineup — Team 1.",
      key: "glass_bowl_team1",
      previewBg: "linear-gradient(135deg,#00D4AA,#F472B6)",
    },
    {
      icon: "ri-group-2-line",
      title: "Glass Bowling XI",
      teamName: matchState?.team2?.name ?? "Team 2",
      desc: "Frosted bowling lineup — Team 2.",
      key: "glass_bowl_team2",
      previewBg: "linear-gradient(135deg,#00D4AA,#F472B6)",
    },
    {
      icon: "ri-bar-chart-line",
      title: "Glass Score Overlay",
      desc: "Frosted score bar with teal glow.",
      key: "glass_score",
      previewBg: "linear-gradient(135deg,#00D4AA,#0a1628)",
    },
    {
      icon: "ri-file-list-3-line",
      title: "Glass Match Summary",
      desc: "Glassmorphism summary card.",
      key: "glass_summary",
      previewBg: "linear-gradient(135deg,#0a1628,#22D3EE)",
    },
  ];
  const MATERIAL_BUNDLE_BANNERS = [
    {
      icon: "ri-layout-top-2-line",
      title: "Material Match Banner",
      desc: "Flat-design tournament banner.",
      key: "material_main",
      previewBg: "#009688",
    },
    {
      icon: "ri-team-line",
      title: "Material Playing XI",
      desc: "Solid lineup card.",
      key: "material_xi_combined",
      previewBg: "#00BCD4",
    },
    {
      icon: "ri-group-line",
      title: "Material Batting XI",
      teamName: matchState?.team1?.name ?? "Team 1",
      desc: "Solid batting lineup — Team 1.",
      key: "material_bat_team1",
      previewBg: "#00BCD4",
    },
    {
      icon: "ri-group-line",
      title: "Material Batting XI",
      teamName: matchState?.team2?.name ?? "Team 2",
      desc: "Solid batting lineup — Team 2.",
      key: "material_bat_team2",
      previewBg: "#00BCD4",
    },
    {
      icon: "ri-group-2-line",
      title: "Material Bowling XI",
      teamName: matchState?.team1?.name ?? "Team 1",
      desc: "Solid bowling lineup — Team 1.",
      key: "material_bowl_team1",
      previewBg: "#E91E63",
    },
    {
      icon: "ri-group-2-line",
      title: "Material Bowling XI",
      teamName: matchState?.team2?.name ?? "Team 2",
      desc: "Solid bowling lineup — Team 2.",
      key: "material_bowl_team2",
      previewBg: "#E91E63",
    },
    {
      icon: "ri-bar-chart-line",
      title: "Material Score Overlay",
      desc: "High-contrast score bar.",
      key: "material_score",
      previewBg: "#111827",
    },
    {
      icon: "ri-file-list-3-line",
      title: "Material Match Summary",
      desc: "Flat color-blocked summary.",
      key: "material_summary",
      previewBg: "#030712",
    },
  ];
  const AERO_BUNDLE_BANNERS = [
    {
      icon: "ri-layout-top-2-line",
      title: "Aero Match Banner",
      desc: "Modular floating banner.",
      key: "aero_main",
      previewBg: "#F3F4F6",
    },
    {
      icon: "ri-team-line",
      title: "Aero Playing XI",
      desc: "Floating lineup card.",
      key: "aero_xi_combined",
      previewBg: "#FFFFFF",
    },
    {
      icon: "ri-group-line",
      title: "Aero Batting XI",
      teamName: matchState?.team1?.name ?? "Team 1",
      desc: "Light-mode batting — Team 1.",
      key: "aero_bat_team1",
      previewBg: "#E0F2FE",
    },
    {
      icon: "ri-group-line",
      title: "Aero Batting XI",
      teamName: matchState?.team2?.name ?? "Team 2",
      desc: "Light-mode batting — Team 2.",
      key: "aero_bat_team2",
      previewBg: "#E0F2FE",
    },
    {
      icon: "ri-group-2-line",
      title: "Aero Bowling XI",
      teamName: matchState?.team1?.name ?? "Team 1",
      desc: "Minimalist bowling — Team 1.",
      key: "aero_bowl_team1",
      previewBg: "#FFE4E6",
    },
    {
      icon: "ri-group-2-line",
      title: "Aero Bowling XI",
      teamName: matchState?.team2?.name ?? "Team 2",
      desc: "Minimalist bowling — Team 2.",
      key: "aero_bowl_team2",
      previewBg: "#FFE4E6",
    },
    {
      icon: "ri-bar-chart-line",
      title: "Aero Score Stack",
      desc: "Floating score islands.",
      key: "aero_score",
      previewBg: "#FFFFFF",
    },
    {
      icon: "ri-file-list-3-line",
      title: "Aero Match Summary",
      desc: "Soft pill-shaped data badges.",
      key: "aero_summary",
      previewBg: "#F3F4F6",
    },
  ];

  // Shared tab UI renderer — avoids duplicating admin/operator tab markup
  const renderBundleTabs = (showMaterialAero: boolean) => (
    <div className="overflow-x-auto -mx-1 pb-1">
      <div className="flex items-center gap-2 px-1 min-w-max">
        <button
          onClick={() => setOverlayTab("basic")}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border whitespace-nowrap ${overlayTab === "basic" ? "bg-[#1E88E5] text-white border-[#1E88E5] shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:border-[#34B8FF] hover:text-[#1E88E5]"}`}
        >
          <i className="ri-gift-line" />
          IPL
          {hasBasicBundle && (
            <span
              className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${overlayTab === "basic" ? "bg-white/20 text-white" : "bg-blue-50 text-blue-500"}`}
            >
              {matchSub?.subscriptionUnlockedBundleId === "bundle-basic" ? "FREE" : "OWNED"}
            </span>
          )}
        </button>
        <button
          onClick={() => setOverlayTab("glass")}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border whitespace-nowrap ${overlayTab === "glass" ? "text-white border-[#00D4AA] shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:border-[#00D4AA] hover:text-[#00D4AA]"}`}
          style={
            overlayTab === "glass"
              ? { background: "linear-gradient(135deg,#00D4AA,#22D3EE)" }
              : {}
          }
        >
          <i className="ri-contrast-2-line" />
          WPL
          {hasGlassBundle && (
            <span
              className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${overlayTab === "glass" ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-600"}`}
            >
              OWNED
            </span>
          )}
        </button>
        {showMaterialAero && (
          <>
            <button
              onClick={() => setOverlayTab("material")}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border whitespace-nowrap ${overlayTab === "material" ? "text-white border-[#009688] bg-[#009688] shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:border-[#009688] hover:text-[#009688]"}`}
            >
              <i className="ri-tv-2-line" />
              CT
              {hasMaterialBundle && (
                <span
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${overlayTab === "material" ? "bg-white/20 text-white" : "bg-teal-50 text-teal-600"}`}
                >
                  OWNED
                </span>
              )}
            </button>
            <button
              onClick={() => setOverlayTab("aero")}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border whitespace-nowrap ${overlayTab === "aero" ? "text-white border-[#0D9488] bg-[#0D9488] shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:border-[#0D9488] hover:text-[#0D9488]"}`}
            >
              <i className="ri-cloud-line" />
              BGT
              {hasAeroBundle && (
                <span
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${overlayTab === "aero" ? "bg-white/20 text-white" : "bg-teal-50 text-teal-600"}`}
                >
                  OWNED
                </span>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );

  const renderLockedTabState = (bundleName: string, forAdmin: boolean) => (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-6 py-8 text-center">
      <i className="ri-lock-line text-gray-300 text-3xl block mb-2" />
      <p className="font-bold text-gray-400 text-sm">
        {bundleName} not {forAdmin ? "purchased" : "available for this match"}
      </p>
      <p className="text-xs text-gray-300 mt-1">
        {forAdmin
          ? "Purchase from the Bundles section below."
          : "The match admin has not purchased this bundle."}
      </p>
    </div>
  );

  const renderBannerGrid = (
    banners: typeof INCLUDED_BANNERS_ADMIN,
    hasBundle: boolean,
    bundleName: string,
    forAdmin: boolean,
  ) => {
    if (!hasBundle) return renderLockedTabState(bundleName, forAdmin);
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {banners.map((b) => (
          <BannerCard
            key={b.key}
            icon={b.icon}
            title={b.title}
            teamName={(b as any).teamName}
            desc={b.desc}
            active={activeBanner === b.key}
            canActivate={iAmStreaming}
            lockedReason="Start streaming first"
            onToggle={() => handleBanner(b.key as BannerType)}
            previewBg={b.previewBg}
            onPreview={() =>
              openPreview(
                b.key,
                b.title +
                  ((b as any).teamName ? ` — ${(b as any).teamName}` : ""),
                b.previewBg,
              )
            }
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* ── Overlay Preview Modal ── */}
      {previewBanner && (
        <OverlayPreviewModal
          bannerKey={previewBanner.key}
          bannerTitle={previewBanner.title}
          previewBg={previewBanner.previewBg}
          onClose={() => setPreviewBanner(null)}
        />
      )}

      {checkoutAddon && (
        <UpiCheckoutModal
          userId={currentUser.id}
          addonPayload={{
            matchId,
            templateId: checkoutAddon.id,
            templateName: checkoutAddon.name,
            tier: checkoutAddon.tier,
            amount: checkoutAddon.price,
          }}
          onClose={() => setCheckoutAddon(null)}
          onConfirmed={async () => {
            setCheckoutAddon(null);
            try {
              const updated = await fetchMatchSubscription(matchId);
              setMatchSub(updated);
              if (checkoutAddon) {
                setSuccessAddonId(checkoutAddon.id);
                setTimeout(() => setSuccessAddonId(null), 3000);
              }
            } catch (e) {
              console.error(e);
            }
          }}
        />
      )}
      {confirmUnlockBundle && (
        <SubscriptionUnlockModal
          bundle={confirmUnlockBundle}
          onConfirm={() => handleFreeUnlock(confirmUnlockBundle)}
          onCancel={() => setConfirmUnlockBundle(null)}
        />
      )}
      {infoBundleId && bundles.find((b) => b.id === infoBundleId) && (
        <BundleInfoModal
          bundle={bundles.find((b) => b.id === infoBundleId)!}
          onClose={() => setInfoBundleId(null)}
          onPreview={(key, title, previewBg) => {
            setInfoBundleId(null);
            openPreview(key, title, previewBg);
          }}
        />
      )}
      {checkoutBundle && (
        <UpiCheckoutModal
          userId={currentUser.id}
          bundlePayload={{
            matchId,
            bundleId: checkoutBundle.id,
            bundleName: checkoutBundle.name,
            amount: checkoutBundle.price,
          }}
          onClose={() => setCheckoutBundle(null)}
          onConfirmed={async () => {
            setCheckoutBundle(null);
            try {
              const updated = await fetchMatchSubscription(matchId);
              setMatchSub(updated);
              if (checkoutBundle) {
                setSuccessBundleId(checkoutBundle.id);
                setTimeout(() => setSuccessBundleId(null), 3000);
              }
            } catch (e) {
              console.error(e);
            }
          }}
        />
      )}

      {/* ── Mobile sidebar backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Mobile sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"
            >
              <i className="ri-layout-left-line text-gray-600" />
            </button>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 font-semibold transition-colors flex-shrink-0"
            >
              <i className="ri-arrow-left-line" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <span className="text-gray-200 hidden sm:block">|</span>
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <Image
                src="/images/iconLogo.png"
                alt="Cricshub"
                width={26}
                height={26}
                className="rounded-md flex-shrink-0"
              />
              <span className="font-black text-gray-900 text-sm truncate">
                Stream Studio
              </span>
            </div>
            {matchInfo && (
              <span className="text-xs text-gray-400 truncate hidden md:block max-w-[200px]">
                {matchInfo.team1.name} vs {matchInfo.team2.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {matchRole && (
              <span
                className={`hidden sm:flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-full ${matchRole === "admin" ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-blue-50 text-[#1E88E5] border border-blue-200"}`}
              >
                <i
                  className={
                    matchRole === "admin"
                      ? "ri-shield-star-line"
                      : "ri-user-settings-line"
                  }
                />
                {matchRole === "admin" ? "Admin" : "Operator"}
              </span>
            )}
            {iAmStreaming ? (
              <span className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-black px-2.5 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping inline-block" />
                <span className="hidden sm:inline">STREAMING</span>
                <span className="sm:hidden">LIVE</span>
              </span>
            ) : session.isLocked && !iAmStreaming ? (
              <span className="flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1.5 rounded-full border border-amber-200">
                <i className="ri-lock-line" />
                <span className="hidden sm:inline">
                  Locked · {session.lockedByName}
                </span>
                <span className="sm:hidden">Locked</span>
              </span>
            ) : null}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-7xl">
        <div className="flex gap-6 relative">
          {/* ══ LEFT SIDEBAR — fixed on desktop, drawer on mobile ══ */}
          <aside
            className={`
              fixed lg:static top-0 left-0 h-full lg:h-auto z-50 lg:z-auto
              w-[300px] sm:w-[320px] lg:w-[320px] flex-shrink-0
              bg-[#F8F9FA] lg:bg-transparent
              overflow-y-auto lg:overflow-visible
              transition-transform duration-300 ease-in-out
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
              pt-4 lg:pt-0 px-4 lg:px-0
            `}
          >
            {/* Mobile close button */}
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <p className="font-black text-gray-900">Match Info</p>
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
              >
                <i className="ri-close-line text-gray-600" />
              </button>
            </div>

            <div className="space-y-4 sm:space-y-5 pb-8">
              {matchInfo && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] px-5 pt-5 pb-4">
                    {matchInfo.tournamentName && (
                      <p className="text-white/70 text-xs font-semibold mb-1">
                        {matchInfo.tournamentName}
                      </p>
                    )}
                    <h1 className="text-white font-black text-base leading-snug">
                      {matchInfo.team1.name}{" "}
                      <span className="text-white/50 font-normal text-sm">
                        vs
                      </span>{" "}
                      {matchInfo.team2.name}
                    </h1>
                    {matchInfo.stage && (
                      <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 inline-block uppercase">
                        {matchInfo.stage}
                      </span>
                    )}
                  </div>
                  <div className="px-5 py-4 space-y-2 text-sm text-gray-600">
                    {[
                      { icon: "ri-map-pin-line", text: matchInfo.venue },
                      {
                        icon: "ri-calendar-line",
                        text: fmtDate(matchInfo.matchDate),
                      },
                      {
                        icon: "ri-time-line",
                        text: `${fmt12(matchInfo.matchTime)} · ${matchInfo.overs} overs`,
                      },
                    ].map((r, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <i
                          className={`${r.icon} text-[#34B8FF] flex-shrink-0`}
                        />
                        <span className="truncate">{r.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <StreamControlPanel
                session={session}
                streaming={iAmStreaming}
                claimBusy={claimBusy}
                canStream={canStream}
                lockedReason={streamLockReason}
                onClaim={handleClaim}
                onRelease={handleRelease}
                overlayUrl={overlayUrl}
                copied={copied}
                onCopy={copyOverlayUrl}
                currentUserId={currentUser.id}
                streamSoftware={streamSoftware}
                onSoftwareChange={setStreamSoftware}
              />

              {/* ── OBS / vMix Connection + Controls ── */}
              <ConnectionSettingsPanel
                software={streamSoftware}
                status={streamSoftware === "obs" ? obs.status : vmix.status}
                error={streamSoftware === "obs" ? obs.error : vmix.error}
                onConnectObs={obs.connect}
                onConnectVmix={vmix.connect}
                onDisconnect={streamSoftware === "obs" ? obs.disconnect : vmix.disconnect}
              />
              {streamSoftware === "obs" && <ObsControlPanel obs={obs} />}
              {streamSoftware === "vmix" && <VmixControlPanel vmix={vmix} />}

              {matchState && <ScoreLive state={matchState} />}

              {matchSub?.purchasedTemplateIds.includes("tpl-pro-4") && (
                <div
                  style={{
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.07)",
                    overflow: "hidden",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <button
                    onClick={() => setBrandingOpen((v) => !v)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "13px 20px",
                      background: "rgba(8,10,24,0.97)",
                      border: "none",
                      borderBottom: brandingOpen
                        ? "1px solid rgba(255,255,255,0.06)"
                        : "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <span
                      style={{
                        color: "#F3F4F6",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Branding Config
                    </span>
                    <i
                      className={`ri-arrow-${brandingOpen ? "up" : "down"}-s-line`}
                      style={{ color: "rgba(255,255,255,0.35)", fontSize: 18 }}
                    />
                  </button>
                  {brandingOpen && (
                    <BrandingConfigPanel
                      config={brandingConfig}
                      onChange={setBrandingConfig}
                      onSave={async (cfg) => {
                        const ok = await saveBrandingConfig(matchId, cfg);
                        if (!ok) alert("Failed to save branding config.");
                      }}
                    />
                  )}
                </div>
              )}

              {matchSub?.purchasedTemplateIds.includes("tpl-pro-5") && (
                <div
                  style={{
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.07)",
                    overflow: "hidden",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <button
                    onClick={() => setMediaReelOpen((v) => !v)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "13px 20px",
                      background: "rgba(8,10,24,0.97)",
                      border: "none",
                      borderBottom: mediaReelOpen
                        ? "1px solid rgba(255,255,255,0.06)"
                        : "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <span
                      style={{
                        color: "#F3F4F6",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Media Reel
                    </span>
                    <i
                      className={`ri-arrow-${mediaReelOpen ? "up" : "down"}-s-line`}
                      style={{ color: "rgba(255,255,255,0.35)", fontSize: 18 }}
                    />
                  </button>
                  {mediaReelOpen && (
                    <MediaAssetsPanel
                      matchId={matchId}
                      userId={currentUser.id}
                    />
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* ══ MAIN PANEL ══ */}
          <main className="flex-1 min-w-0 space-y-4 sm:space-y-6">
            {/* Active banner status bar */}
            <div
              className={`rounded-2xl border-2 px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-3 transition-all duration-300 ${activeBanner !== "none" ? "border-red-200 bg-red-50" : "border-gray-100 bg-white"}`}
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div
                  className={`w-9 sm:w-10 h-9 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${activeBanner !== "none" ? "bg-red-500" : "bg-gray-100"}`}
                >
                  <i
                    className={`ri-broadcast-line text-lg sm:text-xl ${activeBanner !== "none" ? "text-white" : "text-gray-400"}`}
                  />
                </div>
                <div className="min-w-0">
                  <p
                    className={`font-bold text-xs sm:text-sm truncate ${activeBanner !== "none" ? "text-red-700" : "text-gray-500"}`}
                  >
                    {activeBannerLabel()}
                  </p>
                  <p className="text-xs text-gray-400 hidden sm:block">
                    {activeBanner !== "none"
                      ? `Displaying in your ${streamSoftware === "obs" ? "OBS" : "vMix"} browser source`
                      : "Select a banner below to show it"}
                  </p>
                </div>
              </div>
              {activeBanner !== "none" && (
                <button
                  onClick={() => handleBanner("none")}
                  disabled={!iAmStreaming || bannerBusy}
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold text-red-600 bg-white border border-red-200 px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
                >
                  <i className="ri-close-line" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>

            {/* ═════ ADMIN VIEW ═════ */}
            {isAdmin && (
              <div className="space-y-6">
                {/* Free skeletal overlay */}
                {!hasAnyBundle && (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 sm:px-5 py-4 flex items-start gap-3">
                      <i className="ri-bar-chart-box-line text-gray-400 text-xl flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold text-gray-700 text-sm">
                          Free: Basic Score Overlay
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          A plain score bar is available for free. Purchase a
                          bundle to unlock full overlays.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                      <BannerCard
                        icon="ri-bar-chart-2-line"
                        title="Score Overlay"
                        desc="Live score, batters, bowler and current over — plain display, always free."
                        active={activeBanner === "tpl-skeletal"}
                        canActivate={iAmStreaming}
                        lockedReason="Start streaming first"
                        onToggle={() => handleBanner("tpl-skeletal")}
                        previewBg="linear-gradient(135deg,#374151,#111827)"
                        badge="FREE"
                        onPreview={() =>
                          openPreview(
                            "tpl-skeletal",
                            "Score Overlay (Free)",
                            "linear-gradient(135deg,#374151,#111827)",
                          )
                        }
                      />
                    </div>
                  </div>
                )}

                {/* Bundle overlay tabs */}
                {(hasBasicBundle ||
                  hasGlassBundle ||
                  hasMaterialBundle ||
                  hasAeroBundle) && (
                  <div className="space-y-4">
                    {renderBundleTabs(true)}
                    {overlayTab === "basic" &&
                      renderBannerGrid(
                        INCLUDED_BANNERS_ADMIN,
                        hasBasicBundle,
                        "IPL Bundle",
                        true,
                      )}
                    {overlayTab === "glass" &&
                      renderBannerGrid(
                        GLASS_BUNDLE_BANNERS,
                        hasGlassBundle,
                        "WPL Bundle",
                        true,
                      )}
                    {overlayTab === "material" &&
                      renderBannerGrid(
                        MATERIAL_BUNDLE_BANNERS,
                        hasMaterialBundle,
                        "Champions Trophy Bundle",
                        true,
                      )}
                    {overlayTab === "aero" &&
                      renderBannerGrid(
                        AERO_BUNDLE_BANNERS,
                        hasAeroBundle,
                        "Border-Gavaskar Bundle",
                        true,
                      )}
                  </div>
                )}

                {/* Bundle purchase section */}
                {bundles.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                        <i className="ri-stack-line text-emerald-600 text-sm" />
                      </div>
                      <p className="font-black text-gray-900">Bundles</p>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                        Per match · ₹99
                      </span>
                    </div>

                    {/* Subscription credit status */}
                    {matchSub?.adminHasSubscription && !matchSub?.subscriptionUnlockedBundleId && (
                      <div className="mb-4 flex items-center gap-4 bg-white border border-[#1E88E5]/20 rounded-2xl px-4 py-3.5 shadow-sm">
                        <div className="w-9 h-9 rounded-xl bg-[#EBF5FB] flex items-center justify-center flex-shrink-0">
                          <i className="ri-vip-crown-line text-[#1E88E5] text-base" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm">1 bundle included with your plan</p>
                          <p className="text-xs text-gray-500 mt-0.5">Choose any bundle to unlock for this match. This choice is permanent.</p>
                        </div>
                        <span className="flex-shrink-0 text-[10px] font-black text-[#1E88E5] bg-[#EBF5FB] border border-[#1E88E5]/20 px-2.5 py-1 rounded-full uppercase tracking-wide">
                          1 credit
                        </span>
                      </div>
                    )}
                    {matchSub?.adminHasSubscription && matchSub?.subscriptionUnlockedBundleId && (
                      <div className="mb-4 flex items-center gap-3 bg-white border border-emerald-200 rounded-2xl px-4 py-3 shadow-sm">
                        <i className="ri-checkbox-circle-fill text-emerald-500 text-xl flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-900 font-bold">
                            {bundles.find(b => b.id === matchSub.subscriptionUnlockedBundleId)?.name ?? matchSub.subscriptionUnlockedBundleId} unlocked
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">Your subscription credit has been used for this match.</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {bundles.map((bundle) => {
                        const isOwned = (
                          matchSub?.purchasedBundleIds ?? []
                        ).includes(bundle.id);
                        const isFreeWithSubscription =
                          matchSub?.subscriptionUnlockedBundleId === bundle.id;
                        const canUnlockFree =
                          matchSub?.adminHasSubscription &&
                          !matchSub?.subscriptionUnlockedBundleId &&
                          !isOwned;
                        const justBought = successBundleId === bundle.id;
                        return (
                          <div
                            key={bundle.id}
                            className={`rounded-2xl border overflow-hidden transition-all duration-300 relative
                              ${isFreeWithSubscription ? "border-[#1E88E5]/30 shadow-sm shadow-blue-50" : isOwned ? "border-emerald-200" : "border-gray-100 hover:border-gray-200 hover:shadow-md"}`}
                          >
                            {justBought && (
                              <div className="absolute inset-0 z-10 bg-emerald-500/90 backdrop-blur-sm flex flex-col items-center justify-center text-white rounded-2xl">
                                <i className="ri-checkbox-circle-fill text-4xl mb-1" />
                                <p className="font-black text-sm uppercase tracking-wider">Unlocked</p>
                              </div>
                            )}

                            {/* Card header */}
                            <div className="h-12 w-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center px-4 justify-between">
                              <span className="text-white text-[10px] font-black tracking-widest uppercase opacity-80">
                                {bundle.name}
                              </span>
                              {isFreeWithSubscription && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full">
                                  <i className="ri-checkbox-circle-fill text-xs" />
                                  Included
                                </span>
                              )}
                              {canUnlockFree && (
                                <span className="text-[10px] font-bold text-white/90 bg-white/20 px-2 py-0.5 rounded-full">
                                  Included in plan
                                </span>
                              )}
                            </div>

                            <div className="p-4 bg-white">
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="min-w-0">
                                  <p className="font-bold text-gray-900 text-sm leading-tight">{bundle.name}</p>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setInfoBundleId(bundle.id); }}
                                    className="text-[11px] text-[#1E88E5] font-semibold hover:underline mt-0.5 flex items-center gap-1"
                                  >
                                    <i className="ri-eye-line text-xs" />
                                    {bundle.bannerKeys?.length ?? 8} overlays
                                  </button>
                                </div>
                                {isFreeWithSubscription ? (
                                  <span className="flex-shrink-0 text-[10px] font-bold text-[#1E88E5] bg-[#EBF5FB] border border-[#1E88E5]/20 px-2 py-0.5 rounded-full">
                                    Plan benefit
                                  </span>
                                ) : isOwned ? (
                                  <span className="flex-shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    Purchased
                                  </span>
                                ) : (
                                  <div className="flex-shrink-0 text-right">
                                    {bundle.originalPrice && (
                                      <p className="text-[10px] text-gray-400 line-through leading-none">₹{bundle.originalPrice}</p>
                                    )}
                                    <span className="text-base font-black text-gray-900">₹{bundle.price}</span>
                                  </div>
                                )}
                              </div>

                              <ul className="space-y-1 mb-4">
                                {bundle.features.slice(0, 3).map((f, i) => (
                                  <li key={i} className="flex items-center gap-2 text-[11px] text-gray-500">
                                    <i className="ri-check-line text-emerald-500 flex-shrink-0" />
                                    {f}
                                  </li>
                                ))}
                              </ul>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => setInfoBundleId(bundle.id)}
                                  className="py-2 px-3 rounded-xl text-xs font-semibold border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors flex items-center gap-1.5"
                                >
                                  <i className="ri-list-check-2 text-xs" />
                                  Details
                                </button>
                                {isOwned || isFreeWithSubscription ? (
                                  <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-50 text-xs font-semibold text-gray-400">
                                    <i className="ri-checkbox-circle-line text-emerald-400" />
                                    Active
                                  </div>
                                ) : canUnlockFree ? (
                                  <button
                                    onClick={() => setConfirmUnlockBundle(bundle)}
                                    disabled={!!freeUnlockBusy}
                                    className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#1E88E5] hover:bg-[#1565C0] text-white transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                  >
                                    {freeUnlockBusy === bundle.id ? (
                                      <i className="ri-loader-4-line animate-spin" />
                                    ) : (
                                      <i className="ri-vip-crown-line" />
                                    )}
                                    Use plan credit
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setCheckoutBundle(bundle)}
                                    className="flex-1 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-md transition-all flex items-center justify-center gap-1.5"
                                  >
                                    <i className="ri-qr-code-line" />
                                    Buy — ₹{bundle.price}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Premium Add-ons */}
                <div>
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                      <i className="ri-vip-crown-line text-amber-600 text-sm" />
                    </div>
                    <p className="font-black text-gray-900">Premium Add-ons</p>
                    <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                      Per match
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {templates.map((tpl) => {
                      const isOwned =
                        matchSub?.purchasedTemplateIds.includes(tpl.id) ??
                        false;
                      const isActive = activeBanner === tpl.id;
                      const justBought = successAddonId === tpl.id;
                      return (
                        <div
                          key={tpl.id}
                          className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 relative ${isActive ? "border-[#34B8FF] shadow-xl shadow-blue-100" : isOwned ? "border-gray-200 hover:border-blue-200 hover:shadow-md" : "border-gray-100"}`}
                        >
                          {justBought && (
                            <div className="absolute inset-0 z-10 bg-green-500/90 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                              <i className="ri-checkbox-circle-fill text-4xl mb-1" />
                              <p className="font-black text-sm uppercase tracking-wider">
                                Unlocked!
                              </p>
                            </div>
                          )}
                          <div
                            className="h-14 w-full relative"
                            style={{ background: tpl.previewGradient }}
                          >
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="bg-black/25 backdrop-blur-sm text-white text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full">
                                Stream Overlay
                              </span>
                            </div>
                            {isActive && (
                              <div className="absolute top-1.5 left-2 flex items-center gap-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                                ON AIR
                              </div>
                            )}
                            <button
                              onClick={() =>
                                openPreview(
                                  tpl.id,
                                  tpl.name,
                                  tpl.previewGradient ?? "",
                                )
                              }
                              className="absolute top-1.5 right-2 flex items-center gap-1 bg-black/40 hover:bg-black/60 text-white text-[9px] font-bold px-2 py-1 rounded-full transition-colors backdrop-blur-sm"
                            >
                              <i className="ri-eye-line text-xs" />
                              Preview
                            </button>
                          </div>
                          <div className="p-4 bg-white">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <p className="font-black text-gray-900 text-sm">
                                  {tpl.name}
                                </p>
                                <span
                                  className={`text-[9px] font-black border px-2 py-0.5 rounded-full inline-block mt-0.5 ${tpl.tier === "elite" ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}
                                >
                                  {tpl.tier.toUpperCase()}
                                </span>
                              </div>
                              {isOwned ? (
                                <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex-shrink-0">
                                  ✓ Owned
                                </span>
                              ) : (
                                <div className="flex-shrink-0 text-right">
                                  {tpl.originalPrice && (
                                    <p className="text-[10px] text-gray-400 line-through leading-none">₹{tpl.originalPrice}</p>
                                  )}
                                  <span className="text-sm font-black text-gray-900">₹{tpl.price}</span>
                                </div>
                              )}
                            </div>
                            <ul className="space-y-0.5 mb-3">
                              {tpl.features.slice(0, 3).map((f, i) => (
                                <li
                                  key={i}
                                  className="flex items-center gap-1.5 text-[11px] text-gray-500"
                                >
                                  <i className="ri-check-line text-[#34B8FF] flex-shrink-0" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                            {isOwned && tpl.id === "tpl-pro-4" ? (
                              <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                                <span className="text-amber-500 text-sm flex-shrink-0">
                                  ⬡
                                </span>
                                <p className="text-[11px] text-amber-700 font-medium leading-tight">
                                  Persistent overlay — configure in the branding
                                  panel.
                                </p>
                              </div>
                            ) : isOwned ? (
                              <button
                                onClick={() => handleBanner(tpl.id as any)}
                                disabled={!iAmStreaming}
                                className={`w-full py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${isActive ? "bg-red-50 text-red-500 border border-red-200" : "bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white hover:shadow-md"}`}
                              >
                                {isActive
                                  ? "Hide Overlay"
                                  : !iAmStreaming
                                    ? "Start streaming first"
                                    : "Activate Overlay"}
                              </button>
                            ) : (
                              <button
                                onClick={() => setCheckoutAddon(tpl)}
                                className="w-full py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-white hover:shadow-md transition-all flex items-center justify-center gap-1.5"
                              >
                                <i className="ri-qr-code-line" />
                                Buy — ₹{tpl.price}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ═════ OPERATOR VIEW ═════ */}
            {isOperator && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 sm:px-5 py-4 flex items-start gap-3">
                  <i className="ri-user-settings-line text-[#1E88E5] text-xl flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#1565C0] text-sm">
                      You are an operator on this match
                    </p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      You can stream and activate available overlays. Bundles
                      are purchased by the match admin.
                    </p>
                  </div>
                </div>

                {!hasAnyBundle && (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 sm:px-5 py-3 flex items-center gap-3">
                      <i className="ri-bar-chart-box-line text-gray-400 text-lg flex-shrink-0" />
                      <p className="text-xs text-gray-500">
                        Only the free score overlay is available. The match
                        admin can purchase bundles.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                      <BannerCard
                        icon="ri-bar-chart-2-line"
                        title="Score Overlay"
                        desc="Live score, batters, bowler and current over — plain display, always free."
                        active={activeBanner === "tpl-skeletal"}
                        canActivate={iAmStreaming}
                        lockedReason="Start streaming first"
                        onToggle={() => handleBanner("tpl-skeletal")}
                        previewBg="linear-gradient(135deg,#374151,#111827)"
                        badge="FREE"
                        onPreview={() =>
                          openPreview(
                            "tpl-skeletal",
                            "Score Overlay (Free)",
                            "linear-gradient(135deg,#374151,#111827)",
                          )
                        }
                      />
                    </div>
                  </div>
                )}

                {(hasBasicBundle || hasGlassBundle) && (
                  <div className="space-y-4">
                    {renderBundleTabs(false)}
                    {overlayTab === "basic" &&
                      renderBannerGrid(
                        INCLUDED_BANNERS_ADMIN,
                        hasBasicBundle,
                        "IPL Bundle",
                        false,
                      )}
                    {overlayTab === "glass" &&
                      renderBannerGrid(
                        GLASS_BUNDLE_BANNERS,
                        hasGlassBundle,
                        "WPL Bundle",
                        false,
                      )}
                  </div>
                )}

                {purchasedTemplates.length > 0 ? (
                  <div>
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                        <i className="ri-vip-crown-line text-amber-600 text-sm" />
                      </div>
                      <p className="font-black text-gray-900">
                        Premium Overlays
                      </p>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        Purchased by match admin
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {purchasedTemplates.map((tpl) => (
                        <div
                          key={tpl.id}
                          className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 ${activeBanner === tpl.id ? "border-[#34B8FF] shadow-xl shadow-blue-100" : "border-gray-200 hover:border-blue-200 hover:shadow-md"}`}
                        >
                          <div
                            className="h-14 w-full relative"
                            style={{ background: tpl.previewGradient }}
                          >
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="bg-black/25 text-white text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full backdrop-blur-sm">
                                Stream Overlay
                              </span>
                            </div>
                            {activeBanner === tpl.id && (
                              <div className="absolute top-1.5 left-2 flex items-center gap-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                                ON AIR
                              </div>
                            )}
                            <button
                              onClick={() =>
                                openPreview(
                                  tpl.id,
                                  tpl.name,
                                  tpl.previewGradient ?? "",
                                )
                              }
                              className="absolute top-1.5 right-2 flex items-center gap-1 bg-black/40 hover:bg-black/60 text-white text-[9px] font-bold px-2 py-1 rounded-full transition-colors backdrop-blur-sm"
                            >
                              <i className="ri-eye-line text-xs" />
                              Preview
                            </button>
                          </div>
                          <div className="p-4 bg-white">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div>
                                <p className="font-black text-gray-900 text-sm">
                                  {tpl.name}
                                </p>
                                <span
                                  className={`text-[9px] font-black border px-2 py-0.5 rounded-full inline-block mt-0.5 ${tpl.tier === "elite" ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}
                                >
                                  {tpl.tier.toUpperCase()}
                                </span>
                              </div>
                              {tpl.id === "tpl-pro-4" ? (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                  ⬡ Always On
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                                  ✓ Available
                                </span>
                              )}
                            </div>
                            {tpl.id === "tpl-pro-4" ? (
                              <div className="mt-2 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                                <span className="text-amber-500 text-sm">
                                  ⬡
                                </span>
                                <p className="text-[11px] text-amber-700 font-medium leading-tight">
                                  Persistent overlay — always visible. Configure
                                  in the branding panel.
                                </p>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleBanner(tpl.id as any)}
                                disabled={!iAmStreaming}
                                className={`w-full py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-2 ${activeBanner === tpl.id ? "bg-red-50 text-red-500 border border-red-200" : "bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white hover:shadow-md"}`}
                              >
                                {activeBanner === tpl.id
                                  ? "Hide Overlay"
                                  : !iAmStreaming
                                    ? "Start streaming first"
                                    : "Activate Overlay"}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : !hasAnyBundle ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-8 text-center">
                    <i className="ri-layout-top-2-line text-gray-200 text-4xl block mb-3" />
                    <p className="font-bold text-gray-400 text-sm">
                      No premium overlays for this match
                    </p>
                    <p className="text-xs text-gray-300 mt-1">
                      The match admin can purchase premium overlay templates.
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </main>
        </div>
      </div>

      <link
        href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css"
        rel="stylesheet"
      />
    </div>
  );
}
