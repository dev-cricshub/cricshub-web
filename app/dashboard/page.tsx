"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchUserMatches, fetchUserSubscription } from "@/lib/api";

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

const initials = (n: string) => {
  if (!n) return "";
  return n
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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
// TEAM AVATAR
// ═══════════════════════════════════════════════════════════

function TeamAvatar({
  name,
  logoPath,
  size = "md",
  gradient = "from-[#34B8FF] to-[#1E88E5]",
}: {
  name: string;
  logoPath?: string | null;
  size?: "sm" | "md" | "lg";
  gradient?: string;
}) {
  const sz =
    size === "sm"
      ? "w-8 h-8 text-xs"
      : size === "lg"
        ? "w-14 h-14 text-base"
        : "w-11 h-11 text-sm";

  if (logoPath) {
    return (
      <div
        className={`${sz} rounded-xl overflow-hidden shadow-sm flex-shrink-0 relative bg-white`}
      >
        <Image src={logoPath} alt={name} fill className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`${sz} rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center font-black text-white shadow-sm flex-shrink-0`}
    >
      {initials(name)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ROLE BADGE
// ═══════════════════════════════════════════════════════════

function RoleBadge({ role }: { role: MatchRole }) {
  return role === "admin" ? (
    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap">
      <i className="ri-shield-star-line text-xs" />
      Admin
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 bg-blue-50 text-[#1E88E5] border border-blue-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap">
      <i className="ri-user-settings-line text-xs" />
      Operator
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
// LIVE MATCH CARD
// ═══════════════════════════════════════════════════════════

function LiveMatchCard({ match }: { match: MatchWithRole }) {
  const isAdmin = match.role === "admin";

  return (
    <div className="relative bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Live pulse strip */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 via-orange-400 to-red-500 animate-pulse" />

      {/* Header */}
      <div className="px-4 sm:px-5 pt-4 pb-3 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center gap-1.5 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
              Live
            </span>
            <span className="text-white/80 text-xs font-medium truncate">
              {match.tournamentResponse?.name ?? "Individual Match"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {match.stage && (
              <span className="text-white/60 text-[10px] font-semibold bg-white/15 px-2 py-0.5 rounded-full hidden min-[480px]:inline-flex">
                {match.stage}
              </span>
            )}
            <RoleBadge role={match.role} />
          </div>
        </div>
      </div>

      {/* Teams + Score */}
      <div className="px-4 sm:px-5 py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            <TeamAvatar name={match.team1.name} size="lg" />
            <p className="text-xs sm:text-sm font-bold text-gray-900 text-center leading-tight line-clamp-2">
              {match.team1.name}
            </p>
            {match.team1Score != null && (
              <span className="text-xl sm:text-2xl font-black text-[#1E88E5]">
                {match.team1Score}
              </span>
            )}
          </div>
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <span className="text-xs font-black text-gray-300 tracking-widest">
              VS
            </span>
            <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-200 to-transparent" />
          </div>
          <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            <TeamAvatar
              name={match.team2.name}
              size="lg"
              gradient="from-purple-400 to-purple-600"
            />
            <p className="text-xs sm:text-sm font-bold text-gray-900 text-center leading-tight line-clamp-2">
              {match.team2.name}
            </p>
            {match.team2Score != null && (
              <span className="text-xl sm:text-2xl font-black text-[#1E88E5]">
                {match.team2Score}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-3 mt-3 text-xs text-gray-400 flex-wrap">
          <span className="flex items-center gap-1 min-w-0">
            <i className="ri-map-pin-line text-[#34B8FF] flex-shrink-0" />
            <span className="truncate max-w-[120px]">
              {match.venue || "Venue TBD"}
            </span>
          </span>
          <span className="text-gray-200">·</span>
          <span className="flex items-center gap-1 flex-shrink-0">
            <i className="ri-time-line text-[#34B8FF]" />
            {fmt12(match.matchTime)}
          </span>
          {isAdmin && (
            <>
              <span className="text-gray-200">·</span>
              <span className="flex items-center gap-1 flex-shrink-0">
                <i className="ri-team-line text-amber-400" />
                {match.matchOps.length} op
                {match.matchOps.length !== 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 sm:px-5 pb-5">
        <Link
          href={`/stream/${match.id}`}
          className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white font-bold text-sm rounded-xl hover:shadow-lg hover:shadow-blue-200 hover:scale-[1.02] transition-all"
        >
          <i className="ri-live-line text-base animate-pulse" />
          {isAdmin ? "Go Live / Manage Stream" : "Go Live"}
        </Link>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// UPCOMING MATCH CARD
// ═══════════════════════════════════════════════════════════

function UpcomingMatchCard({ match }: { match: MatchWithRole }) {
  const days = daysUntil(match.matchDate);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5]" />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-gray-400 font-medium truncate">
              {match.tournamentResponse?.name ?? "Individual Match"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap ${days <= 1 ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-600"}`}
            >
              {days <= 0 ? "Today" : days === 1 ? "Tomorrow" : `${days}d away`}
            </span>
            <RoleBadge role={match.role} />
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center gap-2 sm:gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <TeamAvatar name={match.team1.name} size="sm" />
            <p className="text-sm font-bold text-gray-800 truncate">
              {match.team1.name}
            </p>
          </div>
          <span className="text-xs font-black text-gray-300 flex-shrink-0">
            VS
          </span>
          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            <p className="text-sm font-bold text-gray-800 truncate text-right">
              {match.team2.name}
            </p>
            <TeamAvatar
              name={match.team2.name}
              size="sm"
              gradient="from-purple-400 to-purple-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-400 flex-wrap mb-3 pt-2.5 border-t border-gray-50">
          <span className="flex items-center gap-1 flex-shrink-0">
            <i className="ri-calendar-line text-[#34B8FF]" />
            {fmtDate(match.matchDate)}
          </span>
          <span className="flex items-center gap-1 flex-shrink-0">
            <i className="ri-time-line text-[#34B8FF]" />
            {fmt12(match.matchTime)}
          </span>
          {match.venue && (
            <span className="flex items-center gap-1 min-w-0">
              <i className="ri-map-pin-line text-[#34B8FF] flex-shrink-0" />
              <span className="truncate">{match.venue}</span>
            </span>
          )}
        </div>

        {/* Actions */}
        <Link
          href={`/stream/${match.id}`}
          className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white text-xs font-bold rounded-xl hover:shadow-md hover:shadow-blue-200 transition-all"
        >
          <i className="ri-broadcast-line" />
          Open Stream Dashboard
        </Link>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAST MATCH CARD
// ═══════════════════════════════════════════════════════════

function PastMatchCard({ match }: { match: MatchWithRole }) {
  const team1Won = match.winner === match.team1.name;
  const team2Won = match.winner === match.team2.name;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-gray-200 to-gray-300" />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3 gap-2">
          <span className="text-xs text-gray-400 font-medium truncate mr-2">
            {match.tournamentResponse?.name ?? "Individual Match"}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <RoleBadge role={match.role} />
            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full whitespace-nowrap">
              Completed
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 flex-1 min-w-0 ${team1Won ? "opacity-100" : "opacity-50"}`}
          >
            <TeamAvatar name={match.team1.name} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">
                {match.team1.name}
              </p>
              {match.team1Score != null && (
                <p
                  className={`text-lg font-black ${team1Won ? "text-[#1E88E5]" : "text-gray-400"}`}
                >
                  {match.team1Score}
                </p>
              )}
            </div>
          </div>
          <div className="text-center flex-shrink-0 px-1">
            {match.winner ? (
              <i className="ri-trophy-fill text-amber-400 text-xl" />
            ) : (
              <span className="text-xs font-black text-gray-300">VS</span>
            )}
          </div>
          <div
            className={`flex items-center gap-2 flex-1 min-w-0 justify-end ${team2Won ? "opacity-100" : "opacity-50"}`}
          >
            <div className="min-w-0 text-right">
              <p className="text-sm font-bold text-gray-800 truncate">
                {match.team2.name}
              </p>
              {match.team2Score != null && (
                <p
                  className={`text-lg font-black ${team2Won ? "text-[#1E88E5]" : "text-gray-400"}`}
                >
                  {match.team2Score}
                </p>
              )}
            </div>
            <TeamAvatar
              name={match.team2.name}
              size="sm"
              gradient="from-purple-400 to-purple-600"
            />
          </div>
        </div>

        {match.winner && (
          <p className="text-center text-xs font-bold text-amber-600 mt-2 bg-amber-50 rounded-lg py-1.5">
            🏆 {match.winner} won
          </p>
        )}

        <div className="flex items-center gap-2 sm:gap-3 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400 flex-wrap">
          <span className="flex items-center gap-1 flex-shrink-0">
            <i className="ri-calendar-line text-gray-300" />
            {fmtDate(match.matchDate)}
          </span>
          {match.venue && (
            <span className="flex items-center gap-1 min-w-0">
              <i className="ri-map-pin-line text-gray-300 flex-shrink-0" />
              <span className="truncate">{match.venue}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SKELETON
// ═══════════════════════════════════════════════════════════

function Skeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse ${tall ? "h-72" : "h-48"}`}
    >
      <div className="h-1 bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-1/4" />
        </div>
        <div className="flex items-center gap-3 justify-between">
          <div className="flex flex-col items-center gap-2">
            <div className="w-11 h-11 rounded-xl bg-gray-100" />
            <div className="h-3 bg-gray-100 rounded w-16" />
          </div>
          <div className="h-3 bg-gray-100 rounded w-6" />
          <div className="flex flex-col items-center gap-2">
            <div className="w-11 h-11 rounded-xl bg-gray-100" />
            <div className="h-3 bg-gray-100 rounded w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════

function SectionHeader({
  icon,
  title,
  count,
  accentColor = "blue",
}: {
  icon: string;
  title: string;
  count?: number;
  accentColor?: "blue" | "red" | "amber" | "gray";
}) {
  const colors = {
    blue: "from-[#34B8FF] to-[#1E88E5]",
    red: "from-red-500 to-red-600",
    amber: "from-amber-400 to-amber-500",
    gray: "from-gray-400 to-gray-500",
  };
  const countColors = {
    blue: "bg-blue-50 text-[#1E88E5]",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-700",
    gray: "bg-gray-100 text-gray-500",
  };
  return (
    <div className="flex items-center gap-3 mb-5">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${colors[accentColor]} flex-shrink-0`}
      >
        <i className={`${icon} text-white text-base`} />
      </div>
      <h2 className="font-black text-gray-900 text-lg">{title}</h2>
      {count !== undefined && (
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full ${countColors[accentColor]}`}
        >
          {count}
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════

function StatCard({
  icon,
  label,
  value,
  gradient,
}: {
  icon: string;
  label: string;
  value: number;
  gradient: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
      <div
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm flex-shrink-0`}
      >
        <i className={`${icon} text-lg sm:text-xl text-white`} />
      </div>
      <div className="min-w-0">
        <p className="text-xl sm:text-2xl font-black text-gray-900">{value}</p>
        <p className="text-[11px] sm:text-xs text-gray-400 font-medium leading-tight">
          {label}
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export default function DashboardPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [matches, setMatches] = useState<MatchWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "admin" | "operator">(
    "all",
  );
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

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 flex-shrink-0"
          >
            <Image
              src="/images/iconLogo.png"
              alt="Cricshub"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <Image
              src="/images/textLogo.png"
              alt="Cricshub"
              width={88}
              height={26}
              className="object-contain hidden sm:block"
            />
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Plans link — icon only on mobile */}
            <Link
              href="/pricing"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1E88E5] font-semibold transition-colors p-2 sm:px-3 sm:py-2 rounded-xl hover:bg-blue-50"
            >
              <i className="ri-vip-crown-line text-base" />
              <span className="hidden sm:inline">Plans</span>
            </Link>

            {/* Subscription badge — hidden on very small screens */}
            {user?.hasSubscription ? (
              <span className="hidden min-[480px]:flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-full flex-shrink-0">
                <i className="ri-checkbox-circle-fill" />
                <span className="hidden sm:inline">Active Plan</span>
              </span>
            ) : (
              <Link
                href="/pricing"
                className="hidden min-[480px]:flex items-center gap-1.5 text-xs font-bold text-[#1E88E5] bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-full hover:bg-blue-100 transition-colors flex-shrink-0"
              >
                <i className="ri-gift-line" />
                <span className="hidden sm:inline">Get Bundles</span>
              </Link>
            )}

            {/* Profile button */}
            <Link
              href="/profile"
              className="flex items-center gap-2 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white px-3 sm:px-4 py-2 rounded-full text-sm font-bold hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 transition-all cursor-pointer flex-shrink-0"
            >
              <i className="ri-user-line" />
              <span className="hidden sm:block max-w-[100px] truncate">
                {user?.name ?? "…"}
              </span>
            </Link>

            {/* Logout */}
            <button
              onClick={async () => {
                await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/api/v1/auth/logout`,
                  { method: "POST", credentials: "include" },
                ).catch(() => {});
                localStorage.removeItem("userUUID");
                localStorage.removeItem("userName");
                localStorage.removeItem("hasSubscription");
                document.cookie = "sessionActive=; path=/; Max-Age=0";
                window.location.href = "/";
              }}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex-shrink-0"
              title="Logout"
            >
              <i className="ri-logout-circle-line text-lg sm:text-xl" />
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8 max-w-6xl space-y-5 sm:space-y-8">
        {/* Welcome hero */}
        <div className="relative bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] rounded-2xl sm:rounded-3xl px-5 sm:px-8 py-6 sm:py-8 overflow-hidden shadow-xl shadow-blue-200">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/10" />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-white/70 text-xs sm:text-sm font-semibold mb-1">
                  {greeting} 👋
                </p>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-3 truncate">
                  {user?.name ?? "…"}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  {adminLive > 0 && (
                    <span className="inline-flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
                      {adminLive} Live as Admin
                    </span>
                  )}
                  {operatorLive > 0 && (
                    <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                      {operatorLive} Live as Operator
                    </span>
                  )}
                  {!user?.hasSubscription && (
                    <Link
                      href="/pricing"
                      className="inline-flex items-center gap-1.5 bg-amber-400 text-amber-900 text-xs font-black px-3 py-1.5 rounded-full hover:bg-amber-300 transition-colors"
                    >
                      <i className="ri-gift-line" />
                      <span className="hidden min-[480px]:inline">
                        Subscribe for{" "}
                      </span>
                      overlays
                    </Link>
                  )}
                </div>
              </div>
              {/* Admin/Operator counts — visible on sm+ */}
              <div className="hidden sm:flex flex-col items-end gap-2 text-white/60 text-xs font-semibold flex-shrink-0">
                <span>
                  <strong className="text-white font-black text-lg">
                    {adminMatches.length}
                  </strong>{" "}
                  as Admin
                </span>
                <span>
                  <strong className="text-white font-black text-lg">
                    {operatorMatches.length}
                  </strong>{" "}
                  as Operator
                </span>
              </div>
            </div>
            {/* Condensed counts for mobile */}
            <div className="flex sm:hidden items-center gap-3 mt-3 pt-3 border-t border-white/20 text-white/70 text-xs font-semibold">
              <span>
                <strong className="text-white font-black">
                  {adminMatches.length}
                </strong>{" "}
                Admin
              </span>
              <span className="text-white/30">·</span>
              <span>
                <strong className="text-white font-black">
                  {operatorMatches.length}
                </strong>{" "}
                Operator
              </span>
              <span className="text-white/30">·</span>
              <span>
                <strong className="text-white font-black">
                  {matches.length}
                </strong>{" "}
                Total
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              icon="ri-live-line"
              label="Live Now"
              value={matches.filter((m) => m.status === "Live").length}
              gradient="from-red-400 to-red-600"
            />
            <StatCard
              icon="ri-calendar-event-line"
              label="Upcoming"
              value={matches.filter((m) => m.status === "Upcoming").length}
              gradient="from-[#34B8FF] to-[#1E88E5]"
            />
            <StatCard
              icon="ri-shield-star-line"
              label="Admin Matches"
              value={adminMatches.length}
              gradient="from-amber-400 to-amber-500"
            />
            <StatCard
              icon="ri-user-settings-line"
              label="As Operator"
              value={operatorMatches.length}
              gradient="from-purple-400 to-purple-600"
            />
          </div>
        )}

        {/* Role filter tabs — full width, equal columns, no scroll */}
        <div className="bg-white border border-gray-100 shadow-sm p-1.5 rounded-2xl grid grid-cols-3 gap-1.5">
          {[
            {
              key: "all",
              label: "All",
              fullLabel: "All Matches",
              count: allMatches.length,
            },
            {
              key: "admin",
              label: "Admin",
              fullLabel: "Admin",
              count: adminMatches.length,
              icon: "ri-shield-star-line",
            },
            {
              key: "operator",
              label: "Operator",
              fullLabel: "Operator",
              count: operatorMatches.length,
              icon: "ri-user-settings-line",
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 min-w-0
                ${activeTab === tab.key ? "bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white shadow-md" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}
            >
              {tab.icon && (
                <i className={`${tab.icon} text-sm flex-shrink-0`} />
              )}
              <span className="truncate min-[480px]:inline hidden">
                {tab.fullLabel}
              </span>
              <span className="truncate min-[480px]:hidden">{tab.label}</span>
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 ${activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Subscription upsell */}
        {!user?.hasSubscription &&
          adminMatches.length > 0 &&
          activeTab !== "operator" && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                  <i className="ri-gift-line text-[#34B8FF] text-lg" />
                </div>
                <div>
                  <p className="font-bold text-blue-900 text-sm">
                    Unlock polished overlays for your matches
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Stream for free with the score overlay, or buy a Basic
                    Bundle (₹99/match) for 8 professional banners. Subscribe to
                    auto-unlock them for every match.
                  </p>
                </div>
              </div>
              <Link
                href="/pricing"
                className="flex-shrink-0 flex items-center gap-2 bg-[#1E88E5] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#1565C0] transition-colors shadow-md w-full sm:w-auto justify-center"
              >
                <i className="ri-vip-crown-line" />
                View Plans
              </Link>
            </div>
          )}

        {/* Live matches */}
        <section>
          <SectionHeader
            icon="ri-live-line"
            title="Live Matches"
            count={liveMatches.length}
            accentColor="red"
          />
          {loading ? (
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
              <Skeleton tall />
              <Skeleton tall />
            </div>
          ) : liveMatches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-10 sm:py-12 text-center">
              <i className="ri-live-line text-gray-200 text-4xl block mb-3" />
              <p className="font-bold text-gray-400 text-sm">
                No live matches right now
              </p>
              <p className="text-gray-300 text-xs mt-1 px-4">
                {activeTab === "operator"
                  ? "You haven't been assigned as operator to any live match"
                  : "Matches you manage or are assigned to will appear here"}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
              {liveMatches.map((m) => (
                <LiveMatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </section>

        {/* Upcoming matches */}
        <section>
          <SectionHeader
            icon="ri-calendar-event-line"
            title="Upcoming Matches"
            count={upcomingMatches.length}
            accentColor="blue"
          />
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </div>
          ) : upcomingMatches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-10 sm:py-12 text-center">
              <i className="ri-calendar-event-line text-gray-200 text-4xl block mb-3" />
              <p className="font-bold text-gray-400 text-sm">
                No upcoming matches
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {upcomingMatches.map((m) => (
                <UpcomingMatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </section>

        {/* Past matches */}
        <section className="pb-8">
          <SectionHeader
            icon="ri-history-line"
            title="Past Matches"
            count={pastMatches.length}
            accentColor="gray"
          />
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </div>
          ) : pastMatches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-10 sm:py-12 text-center">
              <i className="ri-history-line text-gray-200 text-4xl block mb-3" />
              <p className="font-bold text-gray-400 text-sm">
                No completed matches yet
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {pastMatches.map((m) => (
                <PastMatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </section>
      </div>

      <link
        href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css"
        rel="stylesheet"
      />
    </div>
  );
}
