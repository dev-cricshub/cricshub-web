"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchUserMatches, fetchUserSubscription } from "@/lib/api";
import { AppHeader } from "@/app/components/layout/AppHeader";
import {
  Alert,
  Avatar,
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  LiveBadge,
  LiveDot,
  PageHeader,
  SectionTitle,
  Skeleton,
  StatTile,
  Tabs,
  cn,
} from "@/app/components/ui";

// ═══════════════════════════════════════════════════════════
// TYPES — mirroring MatchResponse.java exactly
// ═══════════════════════════════════════════════════════════

interface PlyrSrchDto {
  id: string;
  name: string;
}
interface TeamRes {
  id: string;
  name: string;
  logoPath: string | null;
  creator: PlyrSrchDto;
  captain: PlyrSrchDto | null;
  players: PlyrSrchDto[];
  inviteToken: string;
}
interface TournamentResponse {
  id: string;
  name: string;
}
interface MatchResponse {
  id: string;
  tournamentResponse: TournamentResponse | null;
  team1: TeamRes;
  team2: TeamRes;
  creatorName: PlyrSrchDto;
  matchDate: string;
  matchTime: string;
  venue: string;
  status: string;
  stage: string | null;
  team1Score: number | null;
  team2Score: number | null;
  winner: string | null;
  matchOps: string[];
  currentScorer: string | null;
  creatorId: string;
  adminHasSubscription: boolean;
}
interface CurrentUser {
  id: string;
  name: string;
  phone: string;
  hasSubscription: boolean;
}

// Per-match role derived client-side
type MatchRole = "admin" | "operator";
interface MatchWithRole extends MatchResponse {
  role: MatchRole;
}

// ═══════════════════════════════════════════════════════════
// AUTH HELPERS — replace with real SSO/session
// ═══════════════════════════════════════════════════════════

function getCurrentUser(): CurrentUser | null {
  if (typeof window === "undefined") return null;
  const id = localStorage.getItem("userUUID");
  if (!id) return null;
  return {
    id,
    name: localStorage.getItem("userName") ?? "User",
    phone: localStorage.getItem("userPhone") ?? "",
    hasSubscription: localStorage.getItem("hasSubscription") === "true",
  };
}

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


const daysUntil = (d: string | number[]) => {
  if (!d) return 0;
  const dateObj = Array.isArray(d)
    ? new Date(d[0], d[1] - 1, d[2])
    : new Date(d);
  return Math.ceil((dateObj.getTime() - Date.now()) / 86400000);
};

function classifyMatches(
  matches: MatchResponse[],
  userId: string,
): MatchWithRole[] {
  return matches.map((m) => ({
    ...m,
    role: m.creatorId === userId ? "admin" : "operator",
  }));
}

// ═══════════════════════════════════════════════════════════
// SMALL PIECES
// ═══════════════════════════════════════════════════════════

function RoleBadge({ role }: { role: MatchRole }) {
  return role === "admin" ? (
    <Badge tone="warning" icon="ri-shield-star-line" size="xs">
      Admin
    </Badge>
  ) : (
    <Badge tone="primary" icon="ri-user-settings-line" size="xs">
      Operator
    </Badge>
  );
}

function MetaItem({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="flex min-w-0 items-center gap-1">
      <i className={cn(icon, "flex-shrink-0 text-fg-subtle")} aria-hidden />
      <span className="truncate">{children}</span>
    </span>
  );
}

function TeamRow({
  team,
  score,
  dimmed,
  winner,
}: {
  team: TeamRes;
  score?: number | null;
  dimmed?: boolean;
  winner?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", dimmed && "opacity-55")}>
      <Avatar name={team.name} src={team.logoPath} size="sm" />
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{team.name}</p>
      {winner && <i className="ri-trophy-fill text-warning" aria-label="Winner" />}
      {score != null && (
        <span className="font-mono text-base font-semibold tabular-nums text-fg">{score}</span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LIVE MATCH CARD
// ═══════════════════════════════════════════════════════════

function LiveMatchCard({ match }: { match: MatchWithRole }) {
  const isAdmin = match.role === "admin";

  return (
    <Card padding="none" className="relative overflow-hidden ring-1 ring-live/25 animate-fade-up">
      <span className="absolute inset-x-0 top-0 h-0.5 bg-live" aria-hidden />
      <div className="flex items-center justify-between gap-2 px-5 pt-4">
        <div className="flex min-w-0 items-center gap-2">
          <LiveBadge />
          <span className="truncate text-xs text-fg-muted">
            {match.tournamentResponse?.name ?? "Individual Match"}
          </span>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          {match.stage && (
            <Badge tone="neutral" size="xs" className="hidden min-[480px]:inline-flex">
              {match.stage}
            </Badge>
          )}
          <RoleBadge role={match.role} />
        </div>
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 py-5">
        {[match.team1, match.team2].map((team, i) => {
          const score = i === 0 ? match.team1Score : match.team2Score;
          return (
            <div key={team.id ?? i} className={cn("flex min-w-0 flex-col items-center gap-2 text-center", i === 1 && "col-start-3")}>
              <Avatar name={team.name} src={team.logoPath} size="lg" />
              <p className="line-clamp-2 text-sm font-medium leading-tight text-fg">{team.name}</p>
              <span className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-fg">
                {score ?? "–"}
              </span>
            </div>
          );
        })}
        <span className="col-start-2 row-start-1 text-xs font-medium uppercase tracking-widest text-fg-subtle">vs</span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-line px-5 py-3 text-xs text-fg-muted">
        <MetaItem icon="ri-map-pin-line">{match.venue || "Venue TBD"}</MetaItem>
        <MetaItem icon="ri-time-line">{fmt12(match.matchTime)}</MetaItem>
        {isAdmin && (
          <MetaItem icon="ri-team-line">
            {match.matchOps.length} operator{match.matchOps.length !== 1 ? "s" : ""}
          </MetaItem>
        )}
      </div>

      <div className="px-5 pb-5">
        <ButtonLink href={`/stream/${match.id}`} variant="live" block size="md" icon="ri-broadcast-line">
          {isAdmin ? "Go live / Manage stream" : "Go live"}
        </ButtonLink>
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// UPCOMING MATCH CARD
// ═══════════════════════════════════════════════════════════

function UpcomingMatchCard({ match }: { match: MatchWithRole }) {
  const days = daysUntil(match.matchDate);

  return (
    <Card padding="none" interactive className="flex flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <span className="truncate text-xs text-fg-muted">
          {match.tournamentResponse?.name ?? "Individual Match"}
        </span>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <Badge tone={days <= 1 ? "warning" : "neutral"} size="xs" icon="ri-calendar-event-line">
            {days <= 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`}
          </Badge>
          <RoleBadge role={match.role} />
        </div>
      </div>

      <div className="space-y-2.5 px-4 py-4">
        <TeamRow team={match.team1} />
        <TeamRow team={match.team2} />
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line px-4 py-3 text-xs text-fg-muted">
        <MetaItem icon="ri-calendar-line">{fmtDate(match.matchDate)}</MetaItem>
        <MetaItem icon="ri-time-line">{fmt12(match.matchTime)}</MetaItem>
        {match.venue && <MetaItem icon="ri-map-pin-line">{match.venue}</MetaItem>}
      </div>

      <div className="px-4 pb-4">
        <ButtonLink href={`/stream/${match.id}`} variant="outline" block size="sm" icon="ri-broadcast-line">
          Open Stream Studio
        </ButtonLink>
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// PAST MATCH CARD
// ═══════════════════════════════════════════════════════════

function PastMatchCard({ match }: { match: MatchWithRole }) {
  const team1Won = match.winner === match.team1.name;
  const team2Won = match.winner === match.team2.name;

  return (
    <Card padding="none" className="flex flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <span className="truncate text-xs text-fg-muted">
          {match.tournamentResponse?.name ?? "Individual Match"}
        </span>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <RoleBadge role={match.role} />
          <Badge tone="neutral" size="xs">
            Completed
          </Badge>
        </div>
      </div>

      <div className="space-y-2.5 px-4 py-4">
        <TeamRow team={match.team1} score={match.team1Score} winner={team1Won} dimmed={!!match.winner && !team1Won} />
        <TeamRow team={match.team2} score={match.team2Score} winner={team2Won} dimmed={!!match.winner && !team2Won} />
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line px-4 py-3 text-xs text-fg-muted">
        {match.winner && (
          <span className="font-medium text-warning-soft-fg">{match.winner} won</span>
        )}
        <MetaItem icon="ri-calendar-line">{fmtDate(match.matchDate)}</MetaItem>
        {match.venue && <MetaItem icon="ri-map-pin-line">{match.venue}</MetaItem>}
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// SKELETON
// ═══════════════════════════════════════════════════════════

function CardSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <Card padding="none" className={cn("p-4", tall ? "h-72" : "h-52")}>
      <div className="flex justify-between">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
      <div className="mt-5 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-xl" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-xl" />
          <Skeleton className="h-3 w-2/5" />
        </div>
      </div>
      <Skeleton className="mt-6 h-8 w-full rounded-lg" />
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

type RoleTab = "all" | "admin" | "operator";

export default function DashboardPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [matches, setMatches] = useState<MatchWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [activeTab, setActiveTab] = useState<RoleTab>("all");
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(
      h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening",
    );
  }, []);

  useEffect(() => {
    const initUser = async () => {
      const u = getCurrentUser();
      if (!u) {
        window.location.href = "/";
        return;
      }

      try {
        const subData = await fetchUserSubscription(u.id);
        u.hasSubscription = subData?.hasSubscription ?? false;
        localStorage.setItem("hasSubscription", String(u.hasSubscription));
      } catch (error) {
        console.error("Failed to verify subscription:", error);
        u.hasSubscription = false;
      }

      setUser(u);
    };

    initUser();
  }, []);

  const loadMatches = useCallback(async (userId: string) => {
    try {
      const rawMatches = await fetchUserMatches(userId);
      setMatches(classifyMatches(rawMatches, userId));
    } catch (error) {
      console.error("Failed to load matches:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadMatches(user.id);
  }, [user, loadMatches]);

  // Auto-refresh live matches every 30s
  useEffect(() => {
    if (!user) return;
    pollRef.current = setInterval(() => loadMatches(user.id), 30000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user, loadMatches]);

  // Sort helper — normalises matchDate/matchTime (array or string) to a timestamp
  const toTs = (m: MatchWithRole): number => {
    const dateArr = m.matchDate as any;
    const d = Array.isArray(dateArr)
      ? new Date(dateArr[0], dateArr[1] - 1, dateArr[2])
      : new Date(dateArr as string);
    if (m.matchTime) {
      const t = m.matchTime as any;
      const [h, min] = Array.isArray(t)
        ? [t[0], t[1] ?? 0]
        : (t as string).split(":").map(Number);
      d.setHours(h, min);
    }
    return d.getTime();
  };

  // Derived match lists
  const allMatches = matches;
  const adminMatches = matches.filter((m) => m.role === "admin");
  const operatorMatches = matches.filter((m) => m.role === "operator");

  const displayed =
    activeTab === "all"
      ? allMatches
      : activeTab === "admin"
        ? adminMatches
        : operatorMatches;

  // Live: most recently started first; Upcoming: soonest first; Past: most recent first
  const liveMatches = displayed
    .filter((m) => m.status === "Live")
    .sort((a, b) => toTs(b) - toTs(a));
  const upcomingMatches = displayed
    .filter((m) => m.status === "Upcoming")
    .sort((a, b) => toTs(a) - toTs(b));
  const pastMatches = displayed
    .filter((m) => m.status === "Completed")
    .sort((a, b) => toTs(b) - toTs(a));

  const adminLive = matches.filter(
    (m) => m.role === "admin" && m.status === "Live",
  ).length;
  const operatorLive = matches.filter(
    (m) => m.role === "operator" && m.status === "Live",
  ).length;

  const headerUser = user
    ? { id: user.id, name: user.name, hasSubscription: user.hasSubscription }
    : null;

  return (
    <>
      <AppHeader user={headerUser} />

      <main className="container-page space-y-8 py-6 sm:space-y-10 sm:py-10">
        {/* Greeting */}
        <PageHeader
          eyebrow={greeting ? `${greeting},` : " "}
          title={user?.name ?? <Skeleton className="h-8 w-48" />}
          description={
            adminLive + operatorLive > 0 ? (
              <span className="flex flex-wrap items-center gap-2 pt-1">
                {adminLive > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-live">
                    <LiveDot />
                    <span className="font-medium">{adminLive} live as admin</span>
                  </span>
                )}
                {operatorLive > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-live">
                    <LiveDot />
                    <span className="font-medium">{operatorLive} live as operator</span>
                  </span>
                )}
              </span>
            ) : (
              "Your matches, streams and overlays in one place."
            )
          }
          actions={
            user?.hasSubscription ? (
              <Badge tone="success" icon="ri-checkbox-circle-fill">
                Active plan
              </Badge>
            ) : user ? (
              <ButtonLink href="/pricing" variant="outline" size="sm" icon="ri-vip-crown-line">
                Get overlay bundles
              </ButtonLink>
            ) : null
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatTile
            label="Live now"
            icon="ri-live-line"
            tone="live"
            loading={loading}
            value={matches.filter((m) => m.status === "Live").length}
          />
          <StatTile
            label="Upcoming"
            icon="ri-calendar-event-line"
            tone="primary"
            loading={loading}
            value={matches.filter((m) => m.status === "Upcoming").length}
          />
          <StatTile
            label="Matches as admin"
            icon="ri-shield-star-line"
            tone="warning"
            loading={loading}
            value={adminMatches.length}
          />
          <StatTile
            label="Matches as operator"
            icon="ri-user-settings-line"
            loading={loading}
            value={operatorMatches.length}
          />
        </div>

        {/* Role filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs<RoleTab>
            ariaLabel="Filter matches by role"
            value={activeTab}
            onChange={setActiveTab}
            items={[
              { key: "all", label: "All", count: allMatches.length },
              { key: "admin", label: "Admin", icon: "ri-shield-star-line", count: adminMatches.length },
              { key: "operator", label: "Operator", icon: "ri-user-settings-line", count: operatorMatches.length },
            ]}
          />
          <p className="flex items-center gap-1.5 text-xs text-fg-subtle">
            <i className="ri-refresh-line" aria-hidden />
            Refreshes every 30 seconds
          </p>
        </div>

        {/* Subscription upsell */}
        {!user?.hasSubscription &&
          adminMatches.length > 0 &&
          activeTab !== "operator" && (
            <Alert
              tone="info"
              icon="ri-gift-line"
              title="Unlock polished overlays for your matches"
              action={
                <ButtonLink href="/pricing" size="sm" icon="ri-vip-crown-line" className="w-full sm:w-auto">
                  View plans
                </ButtonLink>
              }
            >
              Stream for free with the score overlay, or buy an IPL Bundle (₹99/match) for 8
              professional banners. Subscribe to auto-unlock them for every match.
            </Alert>
          )}

        {/* Live matches */}
        <section aria-labelledby="live-heading">
          <SectionTitle
            id="live-heading"
            title="Live matches"
            count={loading ? undefined : liveMatches.length}
            icon={<span className="text-live"><LiveDot /></span>}
          />
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <CardSkeleton tall />
              <CardSkeleton tall />
            </div>
          ) : liveMatches.length === 0 ? (
            <EmptyState
              compact
              icon="ri-live-line"
              title="No live matches right now"
              description={
                activeTab === "operator"
                  ? "You haven't been assigned as operator to any live match."
                  : "Matches you manage or are assigned to will appear here when they go live."
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {liveMatches.map((m) => (
                <LiveMatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </section>

        {/* Upcoming matches */}
        <section aria-labelledby="upcoming-heading">
          <SectionTitle
            id="upcoming-heading"
            title="Upcoming"
            count={loading ? undefined : upcomingMatches.length}
          />
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : upcomingMatches.length === 0 ? (
            <EmptyState
              compact
              icon="ri-calendar-event-line"
              title="No upcoming matches"
              description="Create a match in the CricsHub app and it will show up here."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingMatches.map((m) => (
                <UpcomingMatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </section>

        {/* Past matches */}
        <section aria-labelledby="past-heading" className="pb-6">
          <SectionTitle
            id="past-heading"
            title="Past matches"
            count={loading ? undefined : pastMatches.length}
          />
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : pastMatches.length === 0 ? (
            <EmptyState compact icon="ri-history-line" title="No completed matches yet" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pastMatches.map((m) => (
                <PastMatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
