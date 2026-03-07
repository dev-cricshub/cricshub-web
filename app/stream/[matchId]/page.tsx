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
  fetchStreamState,
} from "@/lib/api";
import { useMatchWebSocket } from "@/hooks/useMatchWebSocket";
import UpiCheckoutModal from "@/app/components/UpiCheckoutModal";
import BrandingConfigPanel from "@/app/components/overlays/BrandingConfigPanel";
import { fetchBrandingConfig, saveBrandingConfig } from "@/lib/brandingConfig";
import { DEFAULT_BRANDING_CONFIG } from "@/app/overlays/premium/matchAddOn/BrandingOverlay";

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

// ── 'summary' added as 5th included banner ──
export type BannerType =
  | "none"
  | "main"
  | "playingXI_bat"
  | "playingXI_bowl"
  | "score"
  | "summary"
  | string;
type MatchRole = "admin" | "operator";

interface MatchSubscription {
  adminHasSubscription: boolean;
  purchasedTemplateIds: string[];
}

interface AddOnTemplate {
  id: string;
  name: string;
  tier: "pro" | "elite";
  price: number;
  features: string[];
  previewGradient?: string;
}

// ═══════════════════════════════════════════════════════════
// CLIENT-SIDE VISUAL MAPPING
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
const fmtSR = (v: number) => (v > 0 ? v.toFixed(1) : "—");
const fmtEcon = (v: number) => (v > 0 ? v.toFixed(2) : "—");
const fmtOv = (v: number) => (v > 0 ? v.toFixed(1) : "0.0");
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
  desc,
  active,
  canActivate,
  lockedReason,
  onToggle,
  previewBg,
  badge,
}: {
  icon: string;
  title: string;
  desc: string;
  active: boolean;
  canActivate: boolean;
  lockedReason?: string;
  onToggle: () => void;
  previewBg?: string;
  badge?: string;
}) {
  return (
    <div
      onClick={() => canActivate && onToggle()}
      className={`relative rounded-2xl border-2 overflow-hidden transition-all duration-300 select-none
        ${active ? "border-[#34B8FF] shadow-xl shadow-blue-100 bg-blue-50 cursor-pointer" : ""}
        ${!active && canActivate ? "border-gray-100 bg-white cursor-pointer hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5" : ""}
        ${!canActivate ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed" : ""}`}
    >
      {active && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#34B8FF] via-blue-300 to-[#34B8FF] animate-pulse" />
      )}
      {previewBg && (
        <div className="h-10 w-full relative" style={{ background: previewBg }}>
          {active && (
            <div className="absolute top-1.5 left-2 flex items-center gap-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
              <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
              ON AIR
            </div>
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? "bg-gradient-to-br from-[#34B8FF] to-[#1E88E5]" : "bg-gray-100"}`}
          >
            <i
              className={`${icon} text-lg ${active ? "text-white" : "text-gray-500"}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p
                className={`font-bold text-sm ${active ? "text-[#1E88E5]" : "text-gray-900"}`}
              >
                {title}
              </p>
              {badge && (
                <span className="text-[9px] font-black bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mt-0.5">
              {desc}
            </p>
          </div>
        </div>
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
  obsUrl,
  copied,
  onCopy,
  currentUserId,
}: {
  session: StreamSession;
  streaming: boolean;
  claimBusy: boolean;
  canStream: boolean;
  lockedReason?: string;
  onClaim: () => void;
  onRelease: () => void;
  obsUrl: string;
  copied: boolean;
  onCopy: () => void;
  currentUserId: string;
}) {
  const lockedByOther =
    session.isLocked && session.lockedByUserId !== currentUserId;
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
          Stream Control
        </p>
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
              They must release the stream first.
            </p>
          </div>
        ) : !streaming ? (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 space-y-1">
              <p className="font-bold">Before you start:</p>
              <p>① Copy the OBS URL below & add as Browser Source</p>
              <p>② Click "Start Streaming" to take control</p>
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
                  OBS is capturing your overlay
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
              OBS Browser Source URL
            </p>
            <Link
              href={obsUrl}
              target="_blank"
              className="text-[10px] text-[#34B8FF] font-semibold hover:underline"
            >
              Preview <i className="ri-external-link-line" />
            </Link>
          </div>
          <div className="flex gap-2 mb-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-500 font-mono truncate">
              {obsUrl}
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
            OBS → Add Source → Browser → paste URL → 1920×1080 → ✅ Allow
            transparency
          </p>
        </div>
      )}
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
  const [brandingConfig, setBrandingConfig] = useState(DEFAULT_BRANDING_CONFIG);
  // Load on branding overlay config on mount
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

  const [obsUrl, setObsUrl] = useState("");
  useEffect(() => {
    setObsUrl(`${window.location.origin}/obs/${matchId}`);
  }, [matchId]);

  const matchRole: MatchRole | null = matchInfo
    ? matchInfo.creatorId === currentUser.id
      ? "admin"
      : "operator"
    : null;
  const isAdmin = matchRole === "admin";
  const isOperator = matchRole === "operator";
  const iAmStreaming =
    session.isLocked && session.lockedByUserId === currentUser.id;
  const canStream = matchSub?.adminHasSubscription ?? false;
  const streamLockReason = isAdmin
    ? "Subscribe to unlock the streaming dashboard for your matches."
    : "The match admin needs an active subscription to enable streaming.";

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
      fetchStreamState(matchId),
    ])
      .then(([rawMatch, state, sess, sub, tpls, streamState]) => {
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
    const next = activeBanner === banner ? "none" : banner;
    const isPremium = next.startsWith("tpl-");
    await pushActiveBanner(
      matchId,
      currentUser.id,
      isPremium ? "premium" : next,
      isPremium ? next : null,
    );
    setActiveBanner(next);
    setBannerBusy(false);
  };

  const copyObs = () => {
    navigator.clipboard.writeText(obsUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  // ── Helper: label for active banner status bar ──
  const activeBannerLabel = () => {
    if (activeBanner === "none")
      return "No banner active — OBS overlay is clear";
    if (activeBanner === "main") return "📺 Main Match Banner is live on OBS";
    if (activeBanner === "playingXI_bat")
      return "🏏 Batting XI Banner is live on OBS";
    if (activeBanner === "playingXI_bowl")
      return "🎳 Bowling XI Banner is live on OBS";
    if (activeBanner === "score") return "📊 Score Overlay is live on OBS";
    if (activeBanner === "summary") return "📋 Match Summary is live on OBS";
    return `✨ ${templates.find((t) => t.id === activeBanner)?.name ?? "Premium Overlay"} is live on OBS`;
  };

  // ── Shared banner list for included banners ──
  const INCLUDED_BANNERS_ADMIN = [
    {
      icon: "ri-layout-top-2-line",
      title: "Main Match Banner",
      desc: "Tournament, teams, venue, date and toss result.",
      key: "main",
      previewBg: "linear-gradient(135deg,#34B8FF,#1E88E5)",
    },
    {
      icon: "ri-group-line",
      title: "Batting XI",
      desc: "Full batting lineup with live runs and dismissal info.",
      key: "playingXI_bat",
      previewBg: "linear-gradient(135deg,#00b4d8,#0077b6)",
    },
    {
      icon: "ri-group-2-line",
      title: "Bowling XI",
      desc: "Bowling lineup with overs, wickets and economy.",
      key: "playingXI_bowl",
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
      desc: "Top batters & bowlers from both teams. Shows required or result at bottom.",
      key: "summary",
      previewBg: "linear-gradient(135deg,#E2B94B,#8B6914)",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
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
            // Refresh subscription status to include newly unlocked template
            try {
              const updated = await fetchMatchSubscription(matchId);
              setMatchSub(updated);
              if (checkoutAddon) {
                setSuccessAddonId(checkoutAddon.id);
                setTimeout(() => setSuccessAddonId(null), 3000);
              }
            } catch (e) {
              console.error("Failed to refresh subscription after payment:", e);
            }
          }}
        />
      )}

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 font-semibold transition-colors"
            >
              <i className="ri-arrow-left-line" />
              Dashboard
            </Link>
            <span className="text-gray-200 hidden sm:block">|</span>
            <div className="hidden sm:flex items-center gap-2">
              <Image
                src="/images/iconLogo.png"
                alt="Cricshub"
                width={26}
                height={26}
                className="rounded-md"
              />
              <span className="font-black text-gray-900 text-sm">
                Stream Studio
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {matchRole && (
              <span
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${matchRole === "admin" ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-blue-50 text-[#1E88E5] border border-blue-200"}`}
              >
                <i
                  className={
                    matchRole === "admin"
                      ? "ri-shield-star-line"
                      : "ri-user-settings-line"
                  }
                />
                {matchRole === "admin" ? "Match Admin" : "Operator"}
              </span>
            )}
            {iAmStreaming ? (
              <span className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping inline-block" />
                STREAMING
              </span>
            ) : session.isLocked && !iAmStreaming ? (
              <span className="flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-200">
                <i className="ri-lock-line" />
                Locked · {session.lockedByName}
              </span>
            ) : null}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          {/* ══ LEFT SIDEBAR ══ */}
          <div className="space-y-5">
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
                      <i className={`${r.icon} text-[#34B8FF] flex-shrink-0`} />
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
              obsUrl={obsUrl}
              copied={copied}
              onCopy={copyObs}
              currentUserId={currentUser.id}
            />
            {matchState && <ScoreLive state={matchState} />}
            {matchSub?.purchasedTemplateIds.includes("tpl-pro-4") && (
              <BrandingConfigPanel
                config={brandingConfig}
                onChange={setBrandingConfig}
                onSave={async (cfg) => {
                  const ok = await saveBrandingConfig(matchId, cfg);
                  if (!ok)
                    alert(
                      "Failed to save branding config. Make sure you are the match admin or active streamer.",
                    );
                }}
              />
            )}
          </div>

          {/* ══ MAIN PANEL ══ */}
          <div className="space-y-6">
            {/* Active banner status bar */}
            <div
              className={`rounded-2xl border-2 px-5 py-4 flex items-center justify-between gap-4 transition-all duration-300 ${activeBanner !== "none" ? "border-red-200 bg-red-50" : "border-gray-100 bg-white"}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${activeBanner !== "none" ? "bg-red-500" : "bg-gray-100"}`}
                >
                  <i
                    className={`ri-broadcast-line text-xl ${activeBanner !== "none" ? "text-white" : "text-gray-400"}`}
                  />
                </div>
                <div>
                  <p
                    className={`font-bold text-sm ${activeBanner !== "none" ? "text-red-700" : "text-gray-500"}`}
                  >
                    {activeBannerLabel()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {activeBanner !== "none"
                      ? "Displaying in your OBS browser source"
                      : "Select a banner below to show it"}
                  </p>
                </div>
              </div>
              {activeBanner !== "none" && (
                <button
                  onClick={() => handleBanner("none")}
                  disabled={!iAmStreaming || bannerBusy}
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold text-red-600 bg-white border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
                >
                  <i className="ri-close-line" />
                  Clear
                </button>
              )}
            </div>

            {/* ═════ ADMIN VIEW ═════ */}
            {isAdmin && (
              <div className="space-y-6">
                {!matchSub?.adminHasSubscription && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
                    <i className="ri-information-line text-amber-500 text-xl flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-amber-800 text-sm">
                        Subscribe to unlock all streaming features
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5 mb-3">
                        As the match admin, you need an active subscription to
                        use the streaming dashboard.
                      </p>
                      <Link
                        href="/pricing"
                        className="inline-flex items-center gap-2 bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-amber-600 transition-colors"
                      >
                        <i className="ri-vip-crown-line" />
                        View Plans
                      </Link>
                    </div>
                  </div>
                )}

                {/* ── Included banners (now 5) ── */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                      <i className="ri-gift-line text-[#34B8FF] text-sm" />
                    </div>
                    <p className="font-black text-gray-900">Included Banners</p>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      With subscription
                    </span>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {INCLUDED_BANNERS_ADMIN.map((b) => (
                      <BannerCard
                        key={b.key}
                        icon={b.icon}
                        title={b.title}
                        desc={b.desc}
                        active={activeBanner === b.key}
                        canActivate={
                          iAmStreaming &&
                          (matchSub?.adminHasSubscription ?? false)
                        }
                        lockedReason={
                          !matchSub?.adminHasSubscription
                            ? "Subscription required"
                            : "Start streaming first"
                        }
                        onToggle={() => handleBanner(b.key as BannerType)}
                        previewBg={b.previewBg}
                      />
                    ))}
                  </div>
                </div>

                {/* Premium Add-ons */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                      <i className="ri-vip-crown-line text-amber-600 text-sm" />
                    </div>
                    <p className="font-black text-gray-900">Premium Add-ons</p>
                    <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                      Per match purchase
                    </span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
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
                                OBS Overlay
                              </span>
                            </div>
                            {isActive && (
                              <div className="absolute top-1.5 left-2 flex items-center gap-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                                ON AIR
                              </div>
                            )}
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
                                <span className="text-sm font-black text-gray-900 flex-shrink-0">
                                  ₹{tpl.price}
                                </span>
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
                                <span className="text-amber-500 text-sm flex-shrink-0">⬡</span>
                                <p className="text-[11px] text-amber-700 font-medium leading-tight">
                                  Persistent overlay — configure in the branding panel.
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
                                Buy via UPI — ₹{tpl.price}
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
                <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 flex items-start gap-3">
                  <i className="ri-user-settings-line text-[#1E88E5] text-xl flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#1565C0] text-sm">
                      You are an operator on this match
                    </p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      You can stream and activate available banners. Premium
                      overlays are managed by the match admin.
                    </p>
                  </div>
                </div>

                {!matchSub?.adminHasSubscription && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
                    <i className="ri-information-line text-amber-500 text-xl flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-800 text-sm">
                        Streaming not available for this match
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        The match admin hasn't subscribed yet.
                      </p>
                    </div>
                  </div>
                )}

                {matchSub?.adminHasSubscription && (
                  <>
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                          <i className="ri-gift-line text-[#34B8FF] text-sm" />
                        </div>
                        <p className="font-black text-gray-900">
                          Available Banners
                        </p>
                      </div>
                      {/* Operator sees same 5 banners */}
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {INCLUDED_BANNERS_ADMIN.map((b) => (
                          <BannerCard
                            key={b.key}
                            icon={b.icon}
                            title={b.title}
                            desc={b.desc}
                            active={activeBanner === b.key}
                            canActivate={iAmStreaming}
                            lockedReason="Start streaming first"
                            onToggle={() => handleBanner(b.key as BannerType)}
                            previewBg={b.previewBg}
                          />
                        ))}
                      </div>
                    </div>

                    {purchasedTemplates.length > 0 ? (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
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
                        <div className="grid md:grid-cols-2 gap-4">
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
                                    OBS Overlay
                                  </span>
                                </div>
                                {activeBanner === tpl.id && (
                                  <div className="absolute top-1.5 left-2 flex items-center gap-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                    <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                                    ON AIR
                                  </div>
                                )}
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
                                    <span className="text-amber-500 text-sm">⬡</span>
                                    <p className="text-[11px] text-amber-700 font-medium leading-tight">
                                      Persistent overlay — always visible on stream. Configure it in the branding panel above.
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
                    ) : (
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-8 text-center">
                        <i className="ri-layout-top-2-line text-gray-200 text-4xl block mb-3" />
                        <p className="font-bold text-gray-400 text-sm">
                          No premium overlays for this match
                        </p>
                        <p className="text-xs text-gray-300 mt-1">
                          The match admin can purchase premium overlay templates
                          from their streaming dashboard.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <link
        href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css"
        rel="stylesheet"
      />
    </div>
  );
}
