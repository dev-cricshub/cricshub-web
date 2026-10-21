"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import ThemeConfigPanel from "@/app/components/overlays/ThemeConfigPanel";
import { fetchBrandingConfig, saveBrandingConfig } from "@/lib/brandingConfig";
import {
  ThemeConfig,
  loadThemeConfig,
  saveThemeConfig,
  encodeThemeConfig,
  hasOverrides,
} from "@/lib/themeConfig";
import { DEFAULT_BRANDING_CONFIG } from "@/app/overlays/premium/matchAddOn/BrandingOverlay";
import { useObs } from "@/hooks/useObs";
import { useVmix } from "@/hooks/useVmix";
import ConnectionSettingsPanel from "@/app/components/streaming/ConnectionSettingsPanel";
import ObsControlPanel from "@/app/components/streaming/obs/ObsControlPanel";
import VmixControlPanel from "@/app/components/streaming/vmix/VmixControlPanel";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  IconTile,
  LiveBadge,
  LiveDot,
  Modal,
  SectionTitle,
  Skeleton,
  Tabs,
  cn,
  useToast,
} from "@/app/components/ui";
import type { TabItem } from "@/app/components/ui";
import { AppHeader } from "@/app/components/layout/AppHeader";
import { loginHref } from "@/lib/session";

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
/** Gold highlight chip (free / owned / elite / admin) — mirrors Badge; ui/Badge has no gold tone yet. */
function GoldBadge({
  icon,
  size = "sm",
  className,
  children,
}: {
  icon?: string;
  size?: "xs" | "sm";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-gold/15 font-medium text-gold ring-1 ring-inset ring-gold/30",
        size === "xs" ? "px-1.5 py-px text-2xs" : "px-2 py-0.5 text-xs",
        className,
      )}
    >
      {icon && <i className={cn(icon, "text-[1.05em] leading-none")} aria-hidden />}
      {children}
    </span>
  );
}
const GOLD_TILE =
  "inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gold/15 text-base text-gold";
const ballBg = (b: string) =>
  b === "W"
    ? "bg-live text-white"
    : b === "4"
      ? "bg-brand/15 text-brand ring-1 ring-inset ring-brand/30"
      : b === "6"
        ? "bg-primary text-primary-fg"
        : b === "0"
          ? "bg-surface-2 text-fg-subtle ring-1 ring-inset ring-line"
          : "bg-surface-3 text-fg";
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
// LOCAL UI HELPERS (presentation only)
// ═══════════════════════════════════════════════════════════

/** Small chip that sits on top of an overlay swatch (previewBg is broadcast data). */
function SwatchPreviewButton({
  onClick,
  label,
}: {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Preview ${label}`}
      className="absolute right-2 top-2 z-10 inline-flex h-7 items-center gap-1 rounded-full bg-black/55 px-2.5 text-2xs font-medium text-white backdrop-blur-sm transition-colors duration-150 hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
    >
      <i className="ri-eye-line text-xs" aria-hidden />
      Preview
    </button>
  );
}

/** Collapsible sidebar section wrapping a config panel. */
function CollapsibleSection({
  id,
  title,
  icon,
  open,
  onToggle,
  indicator,
  children,
}: {
  id: string;
  title: string;
  icon: string;
  open: boolean;
  onToggle: () => void;
  indicator?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card padding="none" className="overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <IconTile icon={icon} tone="neutral" size="sm" />
          <span className="truncate text-sm font-medium text-fg">{title}</span>
          {indicator}
        </span>
        <i
          className={cn(
            "ri-arrow-down-s-line text-lg text-fg-subtle transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open && (
        <div id={`${id}-panel`} className="border-t border-line animate-fade-in">
          {children}
        </div>
      )}
    </Card>
  );
}

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
    <Modal
      open
      onClose={onClose}
      size="full"
      title={bannerTitle}
      description="Live preview · 1920×1080 · sample data"
      icon={
        <span
          className="mt-0.5 h-9 w-9 flex-shrink-0 rounded-lg ring-1 ring-inset ring-line"
          style={{ background: previewBg }}
          aria-hidden
        />
      }
      footer={
        <>
          <p className="mr-auto hidden text-xs text-fg-subtle sm:block">
            Preview uses sample data — the live overlay shows real match data.
          </p>
          <ButtonLink
            href={previewUrl}
            external
            variant="outline"
            size="sm"
            icon="ri-external-link-line"
          >
            Open full size
          </ButtonLink>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Close preview
          </Button>
        </>
      }
    >
      {/* 16:9 broadcast stage */}
      <div
        className="relative w-full overflow-hidden rounded-xl bg-black ring-1 ring-line"
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
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/40">
            <i className="ri-loader-4-line animate-spin text-3xl text-white/70" aria-hidden />
            <p className="text-sm font-medium text-white/70">Loading overlay preview…</p>
          </div>
        )}
        <iframe
          src={previewUrl}
          title={`${bannerTitle} preview`}
          className="absolute inset-0 h-full w-full"
          style={{
            border: "none",
            opacity: iframeLoaded ? 1 : 0,
            transition: "opacity 0.3s",
          }}
          onLoad={() => setIframeLoaded(true)}
          allow="autoplay"
        />
      </div>
      <p className="mt-3 text-xs text-fg-subtle sm:hidden">
        Preview uses sample data — the live overlay shows real match data.
      </p>
    </Modal>
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
      <Card padding="sm">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Live score</p>
          <Badge tone="neutral" icon="ri-time-line" size="xs">
            Not started
          </Badge>
        </div>
        <p className="mt-3 text-sm text-fg-muted">
          Match not started yet. The score appears here once the first ball is bowled.
        </p>
      </Card>
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
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <p className="eyebrow">Live score</p>
        <LiveBadge />
      </div>
      <div className="space-y-3 px-4 py-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-fg">{bat.name}</p>
            <p className="mt-1 text-xs text-fg-subtle">
              <span className="font-display text-base font-bold tabular-nums leading-none text-fg-muted">
                {bat.overs}
              </span>{" "}
              ov · CRR <span className="font-mono tabular-nums">{crr}</span>
            </p>
          </div>
          <p className="font-display text-4xl font-bold tabular-nums leading-none text-fg">
            {bat.score}
            <span className="text-fg-subtle">/</span>
            {bat.wickets}
          </p>
        </div>
        {state.currentOverBalls?.length > 0 && (
          <div>
            <p className="mb-1.5 text-2xs font-medium uppercase tracking-wider text-fg-subtle">
              This over
            </p>
            <div className="flex flex-wrap gap-1.5">
              {state.currentOverBalls.map((b, i) => (
                <span
                  key={i}
                  className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-2xs font-semibold tabular-nums ${ballBg(b)}`}
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
          <div className="space-y-1.5 border-t border-line pt-3">
            {[
              { p: state.currentStriker, s: stS },
              { p: state.currentNonStriker, s: nsS },
            ]
              .filter((x) => x.p)
              .map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <span className="flex min-w-0 items-center gap-1.5 font-medium text-fg">
                    {i === 0 ? (
                      <i className="ri-arrow-right-s-fill text-primary" aria-label="On strike" />
                    ) : (
                      <span className="w-[1em]" aria-hidden />
                    )}
                    <span className="truncate">{item.p?.name}</span>
                  </span>
                  {item.s ? (
                    <span className="font-mono tabular-nums text-fg-muted">
                      {item.s.runs}({item.s.ballsFaced})
                    </span>
                  ) : (
                    <span className="font-mono tabular-nums text-fg-muted">0(0)</span>
                  )}
                </div>
              ))}
            {state.currentBowler && (
              <div className="mt-2 flex items-center justify-between gap-2 border-t border-dashed border-line pt-2 text-xs">
                <span className="flex min-w-0 items-center gap-1.5 font-medium text-fg">
                  <i className="ri-focus-3-line text-fg-subtle" aria-label="Bowling" />
                  <span className="truncate">{state.currentBowler.name}</span>
                </span>
                {bowS ? (
                  <span className="font-mono tabular-nums text-fg-muted">
                    {bowS.wicketsTaken}-{bowS.runsConceded} ({fmtOv(bowS.overs)}
                    )
                  </span>
                ) : (
                  <span className="font-mono tabular-nums text-fg-muted">0-0 (0)</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
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
      className={cn(
        "group relative flex select-none flex-col overflow-hidden rounded-card border bg-surface transition-[border-color,box-shadow,transform] duration-200 ease-out",
        active && "border-primary bg-primary-soft/40 shadow-raised ring-2 ring-primary",
        !active && canActivate && "border-line shadow-card hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised",
        !canActivate && "border-line shadow-xs",
      )}
    >
      <button
        type="button"
        onClick={() => canActivate && onToggle()}
        disabled={!canActivate}
        aria-pressed={active}
        className={cn(
          "flex flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          canActivate ? "cursor-pointer active:scale-[0.99]" : "cursor-not-allowed",
          "transition-transform duration-150",
        )}
      >
        {/* Preview colour bar (broadcast data) */}
        {previewBg && (
          <div
            className={cn(
              "relative h-14 w-full flex-shrink-0 border-b border-line",
              !canActivate && "opacity-70 saturate-50",
            )}
            style={{ background: previewBg }}
          >
            {active && <LiveBadge label="On air" className="absolute left-2.5 top-2.5 shadow-xs" />}
          </div>
        )}

        {/* Body */}
        <div className="flex flex-1 flex-col gap-3 p-3.5 sm:p-4">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-base transition-colors",
                active ? "bg-primary text-primary-fg" : "bg-surface-2 text-fg-muted ring-1 ring-inset ring-line",
              )}
            >
              <i className={icon} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-2xs font-medium uppercase tracking-wider text-fg-subtle">
                  {title}
                </p>
                {badge && (
                  <GoldBadge size="xs">{badge}</GoldBadge>
                )}
              </div>
              {teamName && (
                <p className="mt-0.5 truncate text-sm font-semibold leading-tight text-fg">
                  {teamName}
                </p>
              )}
              <p className="mt-1 text-xs leading-relaxed text-fg-muted">{desc}</p>
            </div>
          </div>

          {/* Action affordance */}
          <div className="mt-auto">
            {!canActivate ? (
              <span className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-surface-2 text-xs font-medium text-fg-subtle">
                <i className="ri-lock-line" aria-hidden />
                {lockedReason ?? "Unavailable"}
              </span>
            ) : active ? (
              <span className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-line-strong bg-surface text-sm font-medium text-fg shadow-xs transition-colors group-hover:border-danger/50 group-hover:bg-danger-soft group-hover:text-danger-soft-fg">
                <i className="ri-stop-circle-line" aria-hidden />
                Hide banner
              </span>
            ) : (
              <span className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-primary-soft text-sm font-medium text-primary-soft-fg ring-1 ring-inset ring-primary/25 transition-colors duration-150 group-hover:bg-primary group-hover:text-primary-fg group-hover:ring-primary">
                <i className="ri-play-circle-line" aria-hidden />
                Show banner
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Preview button sits above the toggle surface */}
      {onPreview && (
        <SwatchPreviewButton
          label={teamName ? `${title} — ${teamName}` : title}
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
        />
      )}
    </div>
  );
}

const SOFTWARE_STEPS: Record<"obs" | "vmix", string[]> = {
  obs: ["Add Source", "Browser", "Paste URL", "1920×1080", "Allow transparency"],
  vmix: ["Add Input", "Web Browser", "Paste URL", "1920×1080"],
};

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
      <Card padding="none" className={cn("overflow-hidden", streaming && "border-live/40")}>
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <p className="eyebrow">Stream control</p>
          {streaming ? (
            <LiveBadge label="On air" />
          ) : lockedByOther ? (
            <Badge tone="warning" icon="ri-lock-line" size="xs">
              Locked
            </Badge>
          ) : (
            <Badge tone="neutral" size="xs">
              Offline
            </Badge>
          )}
        </div>

        <div className="space-y-4 p-4">
          {/* Software selector */}
          <div>
            <p className="mb-2 text-2xs font-medium uppercase tracking-wider text-fg-subtle">
              Streaming software
            </p>
            <Tabs
              block
              ariaLabel="Streaming software"
              value={streamSoftware}
              onChange={onSoftwareChange}
              items={[
                { key: "obs", label: "OBS Studio", icon: "ri-camera-line" },
                { key: "vmix", label: "vMix", icon: "ri-vidicon-line" },
              ]}
            />
          </div>

          {!canStream ? (
            <div className="py-2 text-center">
              <IconTile icon="ri-vip-crown-line" tone="warning" size="lg" className="mx-auto mb-3" />
              <p className="text-sm font-semibold text-fg">Streaming dashboard locked</p>
              <p className="mb-4 mt-1 text-xs leading-relaxed text-fg-muted">{lockedReason}</p>
              <ButtonLink href="/pricing" icon="ri-vip-crown-line">
                View plans
              </ButtonLink>
            </div>
          ) : lockedByOther ? (
            <div className="flex items-start gap-3 rounded-xl border border-warning/25 bg-warning-soft px-3.5 py-3 text-warning-soft-fg">
              <i className="ri-lock-2-line mt-0.5 text-lg leading-none" aria-hidden />
              <div className="min-w-0 text-sm">
                <p className="font-semibold">Stream is active</p>
                <p className="mt-0.5 opacity-90">
                  <strong className="font-semibold">{session.lockedByName}</strong> is currently streaming.
                </p>
              </div>
            </div>
          ) : !streaming ? (
            <div className="space-y-3">
              <ol className="space-y-2 rounded-xl border border-line bg-surface-2 p-3 text-xs text-fg-muted">
                <li className="flex gap-2.5">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-surface font-mono text-2xs font-semibold text-fg ring-1 ring-line">
                    1
                  </span>
                  <span className="pt-0.5">Copy the URL below and add it as a Browser Source in {swLabel}</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-surface font-mono text-2xs font-semibold text-fg ring-1 ring-line">
                    2
                  </span>
                  <span className="pt-0.5">Click &quot;Start streaming&quot; to take control</span>
                </li>
              </ol>
              <Button
                variant="live"
                size="lg"
                block
                icon="ri-live-line"
                loading={claimBusy}
                onClick={onClaim}
              >
                {claimBusy ? "Claiming…" : "Start streaming"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div
                className="flex items-center gap-3 rounded-xl bg-live px-4 py-3 text-white"
                role="status"
              >
                <LiveDot className="h-2.5 w-2.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">You are live</p>
                  <p className="text-xs text-white/80">{swLabel} is capturing your overlay</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="md"
                block
                icon="ri-stop-circle-line"
                onClick={onRelease}
              >
                Release stream
              </Button>
            </div>
          )}
        </div>
      </Card>

      {canStream && (
        <Card padding="sm">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="eyebrow">Browser source URL</p>
            <Link
              href={overlayUrl}
              target="_blank"
              className="inline-flex items-center gap-1 rounded text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Open
              <i className="ri-external-link-line" aria-hidden />
            </Link>
          </div>
          <div className="flex gap-2">
            <div
              className="flex h-9 min-w-0 flex-1 items-center rounded-lg border border-line bg-surface-2 px-3 font-mono text-xs text-fg-muted"
              title={overlayUrl}
            >
              <span className="truncate">{overlayUrl}</span>
            </div>
            <Button
              size="sm"
              variant={copied ? "secondary" : "outline"}
              icon={copied ? "ri-check-line" : "ri-file-copy-line"}
              onClick={onCopy}
              className="h-9 flex-shrink-0"
              aria-label={copied ? "Copied overlay URL" : "Copy overlay URL"}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <ol
            className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-1 text-2xs text-fg-subtle"
            aria-label={`${swLabel} setup steps`}
          >
            <li className="font-medium text-fg-muted">{swLabel}</li>
            {SOFTWARE_STEPS[streamSoftware].map((s) => (
              <li key={s} className="flex items-center gap-1">
                <i className="ri-arrow-right-s-line" aria-hidden />
                {s}
              </li>
            ))}
          </ol>
        </Card>
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
    <Modal
      open
      onClose={onClose}
      size="2xl"
      icon={<IconTile icon="ri-stack-line" tone="primary" />}
      title={bundle.name}
      description={
        <span className="font-mono tabular-nums">
          {cards.length} overlays · ₹{bundle.price}/match
        </span>
      }
      footer={
        <>
          <p className="mr-auto hidden text-xs text-fg-subtle sm:block">
            All overlays update in real time.
          </p>
          <Button onClick={onClose}>Got it</Button>
        </>
      }
    >
      {bundle.description && (
        <p className="mb-4 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-fg-muted">
          {bundle.description}
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.key}
            className="overflow-hidden rounded-xl border border-line bg-surface shadow-xs transition-[border-color,box-shadow] duration-200 hover:border-line-strong hover:shadow-card"
          >
            <div
              className="relative h-16 w-full border-b border-line sm:h-20"
              style={{ background: card.previewBg }}
            >
              <SwatchPreviewButton
                label={card.title}
                onClick={() => onPreview(card.key, card.title, card.previewBg)}
              />
            </div>
            <div className="p-3 sm:p-4">
              <div className="mb-1.5 flex items-start gap-2">
                <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xs text-fg-muted ring-1 ring-inset ring-line">
                  <i className={card.icon} aria-hidden />
                </span>
                <div className="flex min-w-0 flex-wrap items-center gap-1.5 pt-1">
                  <p className="text-sm font-semibold leading-tight text-fg">{card.title}</p>
                  {card.teamLabel && (
                    <Badge tone="primary" size="xs">
                      {card.teamLabel}
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-xs leading-relaxed text-fg-muted">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </Modal>
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
    <Modal
      open
      onClose={onCancel}
      size="md"
      icon={<IconTile icon="ri-vip-crown-line" tone="primary" />}
      title={`Unlock ${bundle.name}`}
      description="Subscription perk"
      footer={
        <>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm} icon="ri-lock-unlock-line">
            Confirm unlock
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert tone="warning">
          Your subscription includes <strong className="font-semibold">one free bundle per match.</strong>{" "}
          Once you choose {bundle.name}, this cannot be changed for this match.
        </Alert>

        <div>
          <p className="eyebrow mb-2">What you&apos;re unlocking</p>
          <div className="rounded-xl border border-line bg-surface-2 px-4 py-3">
            <p className="text-sm font-semibold text-fg">{bundle.name}</p>
            <p className="mt-0.5 text-xs text-fg-muted">{bundle.description}</p>
            <ul className="mt-2.5 space-y-1">
              {bundle.features.slice(0, 4).map((f, i) => (
                <li key={i} className="flex items-center gap-1.5 text-xs text-fg-muted">
                  <i className="ri-check-line flex-shrink-0 text-success" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Modal>
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
  const [themeOpen, setThemeOpen] = useState(false);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>({});
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
      window.location.href = loginHref(window.location.pathname);
      return;
    }
    setCurrentUser({
      id: userId,
      name: localStorage.getItem("userName") ?? "User",
    });
  }, []);

  const [overlayUrl, setOverlayUrl] = useState("");
  const [streamSoftware, setStreamSoftware] = useState<"obs" | "vmix">("obs");

  // Load saved theme config from localStorage on mount
  useEffect(() => {
    setThemeConfig(loadThemeConfig(matchId));
  }, [matchId]);

  // Rebuild overlay URL whenever matchId or themeConfig changes
  useEffect(() => {
    const base = `${window.location.origin}/overlay/${matchId}`;
    if (!hasOverrides(themeConfig)) {
      setOverlayUrl(base);
    } else {
      setOverlayUrl(`${base}?tc=${encodeURIComponent(encodeThemeConfig(themeConfig))}`);
    }
  }, [matchId, themeConfig]);

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


  // ── Presentation-only: toast feedback + mobile drawer keyboard handling ──
  const toast = useToast();
  const sidebarCloseRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!sidebarOpen) return;
    const raf = requestAnimationFrame(() => sidebarCloseRef.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
    };
  }, [sidebarOpen]);

  if (loading)
    return (
      <div className="min-h-screen bg-canvas">
        <AppHeader showNav={false} context={<span className="font-medium text-fg">Stream Studio</span>} />
        <div className="container-page py-6 sm:py-8" role="status" aria-live="polite">
          <span className="sr-only">Loading stream studio…</span>
          <div className="flex gap-6">
            <div className="hidden w-[320px] flex-shrink-0 space-y-4 lg:block" aria-hidden>
              <Skeleton className="h-40 rounded-card" />
              <Skeleton className="h-72 rounded-card" />
              <Skeleton className="h-32 rounded-card" />
            </div>
            <div className="min-w-0 flex-1 space-y-5" aria-hidden>
              <div className="flex items-center gap-3 rounded-card border border-line bg-surface p-4 shadow-card">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-lg text-primary-soft-fg">
                  <i className="ri-broadcast-line animate-pulse" />
                </span>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-fg">Loading stream studio…</p>
                  <Skeleton className="h-3 w-40 rounded" />
                </div>
              </div>
              <Skeleton className="h-9 w-64 rounded-xl" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-52 rounded-card" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );

  if (isUnauthorized)
    return (
      <div className="min-h-screen bg-canvas">
        <AppHeader showNav={false} context={<span className="font-medium text-fg">Stream Studio</span>} />
        <div className="container-page flex justify-center py-16 sm:py-24">
          <Card padding="lg" className="w-full max-w-md text-center animate-fade-up">
            <IconTile icon="ri-shield-keyhole-line" tone="danger" size="lg" className="mx-auto mb-5" />
            <h1 className="text-2xl font-semibold tracking-tight text-fg">Access denied</h1>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              You do not have permission to view the streaming dashboard for this
              match. Ask the match admin to add you as an operator.
            </p>
            <ButtonLink href="/stream" variant="outline" block className="mt-7" icon="ri-arrow-left-line">
              Back to my matches
            </ButtonLink>
          </Card>
        </div>
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
      return `Score Overlay (Free) is live on ${swLabel}`;
    if (activeBanner === "main") return `Main Match Banner is live on ${swLabel}`;
    if (activeBanner === "playingXI_bat_team1")
      return `Batting XI — ${matchState?.team1?.name ?? "Team 1"} is live`;
    if (activeBanner === "playingXI_bat_team2")
      return `Batting XI — ${matchState?.team2?.name ?? "Team 2"} is live`;
    if (activeBanner === "playingXI_bowl_team1")
      return `Bowling XI — ${matchState?.team1?.name ?? "Team 1"} is live`;
    if (activeBanner === "playingXI_bowl_team2")
      return `Bowling XI — ${matchState?.team2?.name ?? "Team 2"} is live`;
    if (activeBanner === "playingXI_combined")
      return `Playing XI — Both Teams is live on ${swLabel}`;
    if (activeBanner === "score") return `Score Overlay is live on ${swLabel}`;
    if (activeBanner === "summary") return `Match Summary is live on ${swLabel}`;
    if (activeBanner.startsWith("glass_"))
      return `Glass ${activeBanner.replace("glass_", "")} is live`;
    if (activeBanner.startsWith("material_"))
      return `Material ${activeBanner.replace("material_", "")} is live`;
    if (activeBanner.startsWith("aero_"))
      return `Aero ${activeBanner.replace("aero_", "")} is live`;
    return `${templates.find((t) => t.id === activeBanner)?.name ?? "Premium Overlay"} is live on ${swLabel}`;
  };

  // Presentation-only: copy with toast feedback (copy logic unchanged)
  const handleCopyOverlayUrl = () => {
    copyOverlayUrl();
    toast("Overlay URL copied", {
      tone: "success",
      description: `Add it as a Browser Source in ${swLabel}.`,
    });
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
  const ownedMark = (text: string) => (
    <span className="ml-1 inline-flex items-center rounded-full bg-gold/15 px-1 py-px text-2xs font-semibold text-gold ring-1 ring-inset ring-gold/30 sm:px-1.5">
      <i className="ri-check-line sm:hidden" aria-hidden />
      <span className="sr-only sm:not-sr-only">{text}</span>
    </span>
  );
  const renderBundleTabs = (showMaterialAero: boolean) => {
    const items: TabItem<"basic" | "glass" | "material" | "aero">[] = [
      {
        key: "basic",
        icon: "ri-gift-line",
        label: (
          <>
            IPL
            {hasBasicBundle &&
              ownedMark(
                matchSub?.subscriptionUnlockedBundleId === "bundle-basic" ? "Free" : "Owned",
              )}
          </>
        ),
      },
      {
        key: "glass",
        icon: "ri-contrast-2-line",
        label: (
          <>
            WPL
            {hasGlassBundle && ownedMark("Owned")}
          </>
        ),
      },
    ];
    if (showMaterialAero) {
      items.push(
        {
          key: "material",
          icon: "ri-tv-2-line",
          label: (
            <>
              CT
              {hasMaterialBundle && ownedMark("Owned")}
            </>
          ),
        },
        {
          key: "aero",
          icon: "ri-cloud-line",
          label: (
            <>
              BGT
              {hasAeroBundle && ownedMark("Owned")}
            </>
          ),
        },
      );
    }
    return (
      <Tabs
        items={items}
        value={overlayTab}
        onChange={setOverlayTab}
        ariaLabel="Overlay bundles"
        idPrefix="overlay-bundle"
      />
    );
  };

  const renderLockedTabState = (bundleName: string, forAdmin: boolean) => (
    <EmptyState
      compact
      icon="ri-lock-line"
      title={`${bundleName} not ${forAdmin ? "purchased" : "available for this match"}`}
      description={
        forAdmin
          ? "Purchase from the Bundles section below."
          : "The match admin has not purchased this bundle."
      }
    />
  );

  const renderBannerGrid = (
    banners: typeof INCLUDED_BANNERS_ADMIN,
    hasBundle: boolean,
    bundleName: string,
    forAdmin: boolean,
  ) => {
    if (!hasBundle) return renderLockedTabState(bundleName, forAdmin);
    return (
      <div className="grid grid-cols-1 gap-3 animate-fade-in sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
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

  const isOnAir = activeBanner !== "none";

  return (
    <div className="min-h-screen bg-canvas">
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
          className="fixed inset-0 z-[45] bg-canvas/70 backdrop-blur-[2px] animate-fade-in lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Header */}
      <AppHeader
        showNav={false}
        leading={
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon="ri-layout-left-line"
            aria-label={sidebarOpen ? "Close match panel" : "Open match panel"}
            aria-expanded={sidebarOpen}
            aria-controls="stream-sidebar"
            onClick={() => setSidebarOpen(true)}
            className="-ml-1.5 lg:hidden"
          />
        }
        context={
          <span className="flex min-w-0 items-center gap-2">
            <span className="font-medium text-fg">Stream Studio</span>
            {matchInfo && (
              <>
                <span className="text-fg-subtle" aria-hidden>
                  ·
                </span>
                <span className="truncate">
                  {matchInfo.team1.name} vs {matchInfo.team2.name}
                </span>
              </>
            )}
          </span>
        }
        trailing={
          <>
            <ButtonLink
              href="/stream"
              variant="ghost"
              size="sm"
              icon="ri-arrow-left-line"
              className="hidden xl:inline-flex"
            >
              All matches
            </ButtonLink>
            {matchRole === "admin" && (
              <GoldBadge icon="ri-shield-star-line" className="hidden sm:inline-flex">
                Admin
              </GoldBadge>
            )}
            {matchRole === "operator" && (
              <Badge tone="primary" icon="ri-user-settings-line" className="hidden sm:inline-flex">
                Operator
              </Badge>
            )}
            {iAmStreaming ? (
              <>
                <LiveBadge label="Streaming" className="hidden py-1 sm:inline-flex" />
                <LiveBadge className="py-1 sm:hidden" />
              </>
            ) : session.isLocked && !iAmStreaming ? (
              <Badge tone="warning" icon="ri-lock-line">
                <span className="hidden max-w-[160px] truncate sm:inline">
                  Locked · {session.lockedByName}
                </span>
                <span className="sm:hidden">Locked</span>
              </Badge>
            ) : null}
          </>
        }
      />

      <div className="container-page py-4 sm:py-6 lg:py-8">
        <div className="relative flex gap-6 xl:gap-8">
          {/* ══ LEFT SIDEBAR — sticky column on desktop, drawer on mobile ══ */}
          <aside
            id="stream-sidebar"
            aria-label="Match and stream controls"
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-[320px] max-w-[88vw] flex-shrink-0 overflow-y-auto overscroll-contain border-r border-line bg-canvas px-4 pt-4 shadow-overlay",
              "transition-[transform,visibility] duration-300 ease-out",
              "lg:sticky lg:bottom-auto lg:left-auto lg:top-24 lg:z-auto lg:max-h-[calc(100dvh-7.5rem)] lg:w-[320px] lg:max-w-none lg:self-start lg:border-0 lg:bg-transparent lg:px-0.5 lg:pt-0 lg:shadow-none",
              sidebarOpen
                ? "visible translate-x-0"
                : "invisible -translate-x-full lg:visible lg:translate-x-0",
            )}
          >
            {/* Mobile drawer header */}
            <div className="sticky top-0 z-10 -mx-4 mb-4 flex items-center justify-between border-b border-line bg-canvas/95 px-4 pb-3 backdrop-blur lg:hidden">
              <p className="text-base font-semibold tracking-tight text-fg">Match &amp; stream</p>
              <Button
                ref={sidebarCloseRef}
                variant="ghost"
                size="sm"
                iconOnly
                icon="ri-close-line"
                aria-label="Close match panel"
                onClick={() => setSidebarOpen(false)}
              />
            </div>

            <div className="space-y-4 pb-8">
              {matchInfo && (
                <Card padding="none" className="overflow-hidden">
                  <div className="border-b border-line px-4 pb-3.5 pt-4">
                    <div className="mb-1.5 flex items-start justify-between gap-2">
                      <p className="eyebrow min-w-0">
                        {matchInfo.tournamentName ?? "Match"}
                      </p>
                      {matchInfo.stage && (
                        <Badge tone="neutral" size="xs" className="uppercase">
                          {matchInfo.stage}
                        </Badge>
                      )}
                    </div>
                    <h1 className="font-display text-2xl font-bold uppercase leading-none text-fg">
                      {matchInfo.team1.name}{" "}
                      <span className="text-base font-semibold text-fg-subtle">vs</span>{" "}
                      {matchInfo.team2.name}
                    </h1>
                  </div>
                  <dl className="space-y-2 px-4 py-3.5 text-sm text-fg-muted">
                    {[
                      { icon: "ri-map-pin-line", label: "Venue", text: matchInfo.venue },
                      {
                        icon: "ri-calendar-line",
                        label: "Date",
                        text: fmtDate(matchInfo.matchDate),
                      },
                      {
                        icon: "ri-time-line",
                        label: "Time",
                        text: `${fmt12(matchInfo.matchTime)} · ${matchInfo.overs} overs`,
                      },
                    ].map((r, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <dt className="flex-shrink-0">
                          <i className={`${r.icon} text-fg-subtle`} aria-hidden />
                          <span className="sr-only">{r.label}</span>
                        </dt>
                        <dd className="truncate">{r.text}</dd>
                      </div>
                    ))}
                  </dl>
                </Card>
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
                onCopy={handleCopyOverlayUrl}
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
                <CollapsibleSection
                  id="branding-config"
                  title="Branding config"
                  icon="ri-copyright-line"
                  open={brandingOpen}
                  onToggle={() => setBrandingOpen((v) => !v)}
                >
                  <BrandingConfigPanel
                    config={brandingConfig}
                    onChange={setBrandingConfig}
                    onSave={async (cfg) => {
                      const ok = await saveBrandingConfig(matchId, cfg);
                      if (!ok) alert("Failed to save branding config.");
                    }}
                  />
                </CollapsibleSection>
              )}

              {/* ── Theme Colour Customisation (shown when any bundle is purchased) ── */}
              {(matchSub?.purchasedBundleIds ?? []).length > 0 && (
                <CollapsibleSection
                  id="overlay-colours"
                  title="Overlay colours"
                  icon="ri-palette-line"
                  open={themeOpen}
                  onToggle={() => setThemeOpen((v) => !v)}
                  indicator={
                    hasOverrides(themeConfig) ? (
                      <Badge tone="warning" size="xs">
                        Custom
                      </Badge>
                    ) : undefined
                  }
                >
                  <ThemeConfigPanel
                    config={themeConfig}
                    onChange={(cfg) => {
                      setThemeConfig(cfg);
                      saveThemeConfig(matchId, cfg);
                    }}
                  />
                </CollapsibleSection>
              )}

              {matchSub?.purchasedTemplateIds.includes("tpl-pro-5") && (
                <CollapsibleSection
                  id="media-reel"
                  title="Media reel"
                  icon="ri-film-line"
                  open={mediaReelOpen}
                  onToggle={() => setMediaReelOpen((v) => !v)}
                >
                  <MediaAssetsPanel
                    matchId={matchId}
                    userId={currentUser.id}
                  />
                </CollapsibleSection>
              )}
            </div>
          </aside>

          {/* ══ MAIN PANEL ══ */}
          <main className="min-w-0 flex-1 space-y-6 sm:space-y-8">
            <div className="space-y-3">
              {/* Mobile: quick access to match + stream controls (sidebar drawer) */}
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-expanded={sidebarOpen}
                aria-controls="stream-sidebar"
                className="flex w-full items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 text-left shadow-card transition-colors duration-150 hover:border-line-strong active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
              >
                <IconTile icon="ri-live-line" tone={iAmStreaming ? "danger" : "neutral"} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-fg">
                    {matchInfo
                      ? `${matchInfo.team1.name} vs ${matchInfo.team2.name}`
                      : "Stream Studio"}
                  </span>
                  <span className="block text-xs text-fg-muted">
                    {iAmStreaming
                      ? "You are live · stream controls"
                      : session.isLocked
                        ? `Locked by ${session.lockedByName ?? "another operator"}`
                        : "Stream controls, OBS/vMix & live score"}
                  </span>
                </span>
                <i className="ri-arrow-right-s-line text-lg text-fg-subtle" aria-hidden />
              </button>

              {/* Active banner status bar */}
              <div
                className={cn(
                  "relative flex items-center justify-between gap-3 overflow-hidden rounded-card border bg-surface px-4 py-3 shadow-card transition-[border-color,box-shadow] duration-300 sm:px-5 sm:py-4",
                  isOnAir ? "border-live/50 ring-1 ring-live/20" : "border-line",
                )}
              >
                {isOnAir && <span className="absolute inset-y-0 left-0 w-1 bg-live" aria-hidden />}
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg transition-colors",
                      isOnAir ? "bg-live text-white" : "bg-surface-2 text-fg-subtle ring-1 ring-inset ring-line",
                    )}
                  >
                    <i className="ri-broadcast-line" aria-hidden />
                  </span>
                  <div className="min-w-0" aria-live="polite">
                    <div className="flex items-center gap-2">
                      {isOnAir && <LiveBadge label="On air" className="hidden flex-shrink-0 sm:inline-flex" />}
                      <p
                        className={cn(
                          "line-clamp-2 text-sm font-medium sm:truncate",
                          isOnAir ? "text-fg" : "text-fg-muted",
                        )}
                      >
                        {activeBannerLabel()}
                      </p>
                    </div>
                    <p className="mt-0.5 hidden text-xs text-fg-subtle sm:block">
                      {activeBanner !== "none"
                        ? `Displaying in your ${streamSoftware === "obs" ? "OBS" : "vMix"} browser source`
                        : "Select a banner below to show it"}
                    </p>
                  </div>
                </div>
                {activeBanner !== "none" && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon="ri-close-line"
                    onClick={() => handleBanner("none")}
                    disabled={!iAmStreaming || bannerBusy}
                    aria-label="Clear active banner"
                    className="flex-shrink-0"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Load failure (no match data and no role resolved) */}
            {!matchRole && (
              <EmptyState
                icon="ri-wifi-off-line"
                title="Couldn't load this match"
                description="The stream studio couldn't reach the server. Check your connection and try again."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button icon="ri-refresh-line" onClick={() => window.location.reload()}>
                      Retry
                    </Button>
                    <ButtonLink href="/stream" variant="outline">
                      Back to my matches
                    </ButtonLink>
                  </div>
                }
              />
            )}

            {/* ═════ ADMIN VIEW ═════ */}
            {isAdmin && (
              <div className="space-y-8">
                {/* Free skeletal overlay */}
                {!hasAnyBundle && (
                  <section className="space-y-4">
                    <Alert tone="info" icon="ri-bar-chart-box-line" title="Free: Basic Score Overlay">
                      A plain score bar is available for free. Purchase a
                      bundle to unlock full overlays.
                    </Alert>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
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
                  </section>
                )}

                {/* Bundle overlay tabs */}
                {(hasBasicBundle ||
                  hasGlassBundle ||
                  hasMaterialBundle ||
                  hasAeroBundle) && (
                  <section className="space-y-4">
                    <SectionTitle
                      className="mb-0"
                      title="Overlays"
                      description={
                        iAmStreaming
                          ? "Tap a card to put it on air. Tap again to hide it."
                          : "Start streaming to put overlays on air."
                      }
                    />
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
                  </section>
                )}

                {/* Bundle purchase section */}
                {bundles.length > 0 && (
                  <section>
                    <SectionTitle
                      title="Bundles"
                      icon={<IconTile icon="ri-stack-line" tone="primary" size="sm" />}
                      action={
                        <Badge tone="neutral">
                          Per match · <span className="font-mono tabular-nums">₹99</span>
                        </Badge>
                      }
                    />

                    {/* Subscription credit status */}
                    {matchSub?.adminHasSubscription && !matchSub?.subscriptionUnlockedBundleId && (
                      <Alert
                        tone="info"
                        icon="ri-vip-crown-line"
                        title="1 bundle included with your plan"
                        className="mb-4"
                        action={
                          <Badge tone="primary" className="uppercase tracking-wide">
                            1 credit
                          </Badge>
                        }
                      >
                        Choose any bundle to unlock for this match. This choice is permanent.
                      </Alert>
                    )}
                    {matchSub?.adminHasSubscription && matchSub?.subscriptionUnlockedBundleId && (
                      <Alert
                        tone="success"
                        icon="ri-checkbox-circle-fill"
                        className="mb-4"
                        title={`${bundles.find(b => b.id === matchSub.subscriptionUnlockedBundleId)?.name ?? matchSub.subscriptionUnlockedBundleId} unlocked`}
                      >
                        Your subscription credit has been used for this match.
                      </Alert>
                    )}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
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
                          <Card
                            key={bundle.id}
                            padding="none"
                            className={cn(
                              "relative flex flex-col overflow-hidden transition-[border-color,box-shadow] duration-200",
                              isFreeWithSubscription
                                ? "border-primary/40"
                                : isOwned
                                  ? "border-success/40"
                                  : "hover:border-line-strong hover:shadow-raised",
                            )}
                          >
                            {justBought && (
                              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-card bg-success/95 text-white animate-fade-in">
                                <i className="ri-checkbox-circle-fill mb-1 text-4xl animate-pop" aria-hidden />
                                <p className="text-sm font-semibold uppercase tracking-wider">Unlocked</p>
                              </div>
                            )}

                            <div className="flex flex-1 flex-col p-4">
                              <div className="mb-3 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <p className="text-sm font-semibold leading-tight text-fg">{bundle.name}</p>
                                    {canUnlockFree && (
                                      <Badge tone="primary" size="xs">
                                        Included in plan
                                      </Badge>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setInfoBundleId(bundle.id); }}
                                    className="mt-1 inline-flex items-center gap-1 rounded text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  >
                                    <i className="ri-eye-line" aria-hidden />
                                    {bundle.bannerKeys?.length ?? 8} overlays
                                  </button>
                                </div>
                                {isFreeWithSubscription ? (
                                  <Badge tone="primary" icon="ri-vip-crown-line" className="flex-shrink-0">
                                    Plan benefit
                                  </Badge>
                                ) : isOwned ? (
                                  <Badge tone="success" icon="ri-check-line" className="flex-shrink-0">
                                    Purchased
                                  </Badge>
                                ) : (
                                  <div className="flex-shrink-0 text-right font-mono tabular-nums">
                                    {bundle.originalPrice && (
                                      <p className="text-2xs leading-none text-fg-subtle line-through">₹{bundle.originalPrice}</p>
                                    )}
                                    <span className="font-display text-2xl font-bold leading-none text-fg">₹{bundle.price}</span>
                                  </div>
                                )}
                              </div>

                              <ul className="mb-4 space-y-1">
                                {bundle.features.slice(0, 3).map((f, i) => (
                                  <li key={i} className="flex items-center gap-2 text-xs text-fg-muted">
                                    <i className="ri-check-line flex-shrink-0 text-success" aria-hidden />
                                    {f}
                                  </li>
                                ))}
                              </ul>

                              <div className="mt-auto flex gap-2">
                                <Button
                                  variant="outline"
                                  icon="ri-list-check-2"
                                  onClick={() => setInfoBundleId(bundle.id)}
                                >
                                  Details
                                </Button>
                                {isOwned || isFreeWithSubscription ? (
                                  <span className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-success-soft text-sm font-medium text-success-soft-fg">
                                    <i className="ri-checkbox-circle-line" aria-hidden />
                                    Active
                                  </span>
                                ) : canUnlockFree ? (
                                  <Button
                                    className="flex-1"
                                    onClick={() => setConfirmUnlockBundle(bundle)}
                                    disabled={!!freeUnlockBusy}
                                    icon={freeUnlockBusy === bundle.id ? "ri-loader-4-line animate-spin" : "ri-vip-crown-line"}
                                  >
                                    Use plan credit
                                  </Button>
                                ) : (
                                  <Button
                                    className="flex-1"
                                    icon="ri-qr-code-line"
                                    onClick={() => setCheckoutBundle(bundle)}
                                  >
                                    Buy — <span className="font-mono tabular-nums">₹{bundle.price}</span>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Premium Add-ons */}
                <section>
                  <SectionTitle
                    title="Premium add-ons"
                    icon={<span className={GOLD_TILE}><i className="ri-vip-crown-line" aria-hidden /></span>}
                    action={<Badge tone="neutral">Per match</Badge>}
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    {templates.map((tpl) => {
                      const isOwned =
                        matchSub?.purchasedTemplateIds.includes(tpl.id) ??
                        false;
                      const isActive = activeBanner === tpl.id;
                      const justBought = successAddonId === tpl.id;
                      return (
                        <div
                          key={tpl.id}
                          className={cn(
                            "relative flex flex-col overflow-hidden rounded-card border bg-surface transition-[border-color,box-shadow] duration-200",
                            isActive
                              ? "border-primary bg-primary-soft/40 shadow-raised ring-2 ring-primary"
                              : isOwned
                                ? "border-line shadow-card hover:border-line-strong hover:shadow-raised"
                                : "border-line shadow-card",
                          )}
                        >
                          {justBought && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-success/95 text-white animate-fade-in">
                              <i className="ri-checkbox-circle-fill mb-1 text-4xl animate-pop" aria-hidden />
                              <p className="text-sm font-semibold uppercase tracking-wider">
                                Unlocked
                              </p>
                            </div>
                          )}
                          <div
                            className="relative h-16 w-full border-b border-line"
                            style={{ background: tpl.previewGradient }}
                          >
                            {isActive && (
                              <LiveBadge label="On air" className="absolute left-2.5 top-2.5 shadow-xs" />
                            )}
                            <SwatchPreviewButton
                              label={tpl.name}
                              onClick={() =>
                                openPreview(
                                  tpl.id,
                                  tpl.name,
                                  tpl.previewGradient ?? "",
                                )
                              }
                            />
                          </div>
                          <div className="flex flex-1 flex-col p-4">
                            <div className="mb-2 flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-fg">
                                  {tpl.name}
                                </p>
                                {tpl.tier === "elite" ? (
                                  <GoldBadge size="xs" className="mt-1 uppercase tracking-wide">
                                    {tpl.tier}
                                  </GoldBadge>
                                ) : (
                                  <Badge tone="outline" size="xs" className="mt-1 uppercase tracking-wide">
                                    {tpl.tier}
                                  </Badge>
                                )}
                              </div>
                              {isOwned ? (
                                <Badge tone="success" icon="ri-check-line" className="flex-shrink-0">
                                  Owned
                                </Badge>
                              ) : (
                                <div className="flex-shrink-0 text-right font-mono tabular-nums">
                                  {tpl.originalPrice && (
                                    <p className="text-2xs leading-none text-fg-subtle line-through">₹{tpl.originalPrice}</p>
                                  )}
                                  <span className="font-display text-2xl font-bold leading-none text-fg">₹{tpl.price}</span>
                                </div>
                              )}
                            </div>
                            <ul className="mb-4 space-y-1">
                              {tpl.features.slice(0, 3).map((f, i) => (
                                <li
                                  key={i}
                                  className="flex items-center gap-1.5 text-xs text-fg-muted"
                                >
                                  <i className="ri-check-line flex-shrink-0 text-primary" aria-hidden />
                                  {f}
                                </li>
                              ))}
                            </ul>
                            <div className="mt-auto">
                              {isOwned && tpl.id === "tpl-pro-4" ? (
                                <div className="flex items-center gap-2 rounded-lg border border-warning/25 bg-warning-soft px-3 py-2 text-warning-soft-fg">
                                  <i className="ri-pushpin-line flex-shrink-0" aria-hidden />
                                  <p className="text-xs font-medium leading-tight">
                                    Persistent overlay — configure in the branding
                                    panel.
                                  </p>
                                </div>
                              ) : isOwned ? (
                                <Button
                                  block
                                  onClick={() => handleBanner(tpl.id as any)}
                                  disabled={!iAmStreaming}
                                  variant={isActive ? "outline" : "primary"}
                                  icon={
                                    isActive
                                      ? "ri-stop-circle-line"
                                      : !iAmStreaming
                                        ? "ri-lock-line"
                                        : "ri-play-circle-line"
                                  }
                                >
                                  {isActive
                                    ? "Hide overlay"
                                    : !iAmStreaming
                                      ? "Start streaming first"
                                      : "Activate overlay"}
                                </Button>
                              ) : (
                                <Button
                                  block
                                  variant="outline"
                                  icon="ri-qr-code-line"
                                  onClick={() => setCheckoutAddon(tpl)}
                                >
                                  Buy — <span className="font-mono tabular-nums">₹{tpl.price}</span>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {/* ═════ OPERATOR VIEW ═════ */}
            {isOperator && (
              <div className="space-y-8">
                <Alert tone="info" icon="ri-user-settings-line" title="You are an operator on this match">
                  You can stream and activate available overlays. Bundles
                  are purchased by the match admin.
                </Alert>

                {!hasAnyBundle && (
                  <section className="space-y-4">
                    <p className="flex items-center gap-2 text-sm text-fg-muted">
                      <i className="ri-bar-chart-box-line text-fg-subtle" aria-hidden />
                      Only the free score overlay is available. The match
                      admin can purchase bundles.
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
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
                  </section>
                )}

                {(hasBasicBundle || hasGlassBundle) && (
                  <section className="space-y-4">
                    <SectionTitle
                      className="mb-0"
                      title="Overlays"
                      description={
                        iAmStreaming
                          ? "Tap a card to put it on air. Tap again to hide it."
                          : "Start streaming to put overlays on air."
                      }
                    />
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
                  </section>
                )}

                {purchasedTemplates.length > 0 ? (
                  <section>
                    <SectionTitle
                      title="Premium overlays"
                      icon={<span className={GOLD_TILE}><i className="ri-vip-crown-line" aria-hidden /></span>}
                      action={<Badge tone="neutral">Purchased by match admin</Badge>}
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                      {purchasedTemplates.map((tpl) => (
                        <div
                          key={tpl.id}
                          className={cn(
                            "relative flex flex-col overflow-hidden rounded-card border bg-surface transition-[border-color,box-shadow] duration-200",
                            activeBanner === tpl.id
                              ? "border-primary bg-primary-soft/40 shadow-raised ring-2 ring-primary"
                              : "border-line shadow-card hover:border-line-strong hover:shadow-raised",
                          )}
                        >
                          <div
                            className="relative h-16 w-full border-b border-line"
                            style={{ background: tpl.previewGradient }}
                          >
                            {activeBanner === tpl.id && (
                              <LiveBadge label="On air" className="absolute left-2.5 top-2.5 shadow-xs" />
                            )}
                            <SwatchPreviewButton
                              label={tpl.name}
                              onClick={() =>
                                openPreview(
                                  tpl.id,
                                  tpl.name,
                                  tpl.previewGradient ?? "",
                                )
                              }
                            />
                          </div>
                          <div className="flex flex-1 flex-col p-4">
                            <div className="mb-3 flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-fg">
                                  {tpl.name}
                                </p>
                                {tpl.tier === "elite" ? (
                                  <GoldBadge size="xs" className="mt-1 uppercase tracking-wide">
                                    {tpl.tier}
                                  </GoldBadge>
                                ) : (
                                  <Badge tone="outline" size="xs" className="mt-1 uppercase tracking-wide">
                                    {tpl.tier}
                                  </Badge>
                                )}
                              </div>
                              {tpl.id === "tpl-pro-4" ? (
                                <Badge tone="warning" icon="ri-pushpin-line" className="flex-shrink-0">
                                  Always on
                                </Badge>
                              ) : (
                                <Badge tone="success" icon="ri-check-line" className="flex-shrink-0">
                                  Available
                                </Badge>
                              )}
                            </div>
                            <div className="mt-auto">
                              {tpl.id === "tpl-pro-4" ? (
                                <div className="flex items-center gap-2 rounded-lg border border-warning/25 bg-warning-soft px-3 py-2 text-warning-soft-fg">
                                  <i className="ri-pushpin-line flex-shrink-0" aria-hidden />
                                  <p className="text-xs font-medium leading-tight">
                                    Persistent overlay — always visible. Configure
                                    in the branding panel.
                                  </p>
                                </div>
                              ) : (
                                <Button
                                  block
                                  onClick={() => handleBanner(tpl.id as any)}
                                  disabled={!iAmStreaming}
                                  variant={activeBanner === tpl.id ? "outline" : "primary"}
                                  icon={
                                    activeBanner === tpl.id
                                      ? "ri-stop-circle-line"
                                      : !iAmStreaming
                                        ? "ri-lock-line"
                                        : "ri-play-circle-line"
                                  }
                                >
                                  {activeBanner === tpl.id
                                    ? "Hide overlay"
                                    : !iAmStreaming
                                      ? "Start streaming first"
                                      : "Activate overlay"}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : !hasAnyBundle ? (
                  <EmptyState
                    icon="ri-layout-top-2-line"
                    title="No premium overlays for this match"
                    description="The match admin can purchase premium overlay templates."
                  />
                ) : null}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
