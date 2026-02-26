'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════
// TYPES  — mirroring MatchResponse.java + DTOs exactly
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
  matchDate: string;          // LocalDate → ISO string "YYYY-MM-DD"
  matchTime: string;          // LocalTime → "HH:mm:ss.SSSSSS"
  venue: string;
  status: string;             // "Live" | "Upcoming" | "Completed"
  stage: string | null;
  team1Score: number | null;
  team2Score: number | null;
  winner: string | null;
  matchOps: string[];         // list of user UUID strings
  currentScorer: string | null;
}

interface CurrentUser {
  id: string;
  name: string;
  phone: string;
}

// ═══════════════════════════════════════════════════════════
// AUTH HELPERS  — placeholder, wire to real SSO/session later
// ═══════════════════════════════════════════════════════════

function getCurrentUser(): CurrentUser | null {
  // TODO: Replace with your real auth context / SSO session check
  // When integrating SSO, read the JWT from your session store and
  // decode it to get user info, or call GET /api/v1/auth/me
  if (typeof window === 'undefined') return null;
  const id = localStorage.getItem('userUUID');
  const name = localStorage.getItem('userName') ?? 'Operator';
  const phone = localStorage.getItem('userPhone') ?? '';
  if (!id) return null;
  return { id, name, phone };
}

function getAuthToken(): string | null {
  // TODO: Replace with your real token retrieval (SSO/cookie/context)
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('jwtToken');
}

// ═══════════════════════════════════════════════════════════
// PLACEHOLDER API CALLS  — swap URLs when backend is ready
// ═══════════════════════════════════════════════════════════

async function fetchLiveMatches(): Promise<MatchResponse[]> {
  // TODO: GET /api/v1/matches/status?status=Live
  // const token = getAuthToken();
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/matches/status?status=Live`, {
  //   headers: { Authorization: `Bearer ${token}` },
  // });
  // const json = await res.json();
  // return json.data as MatchResponse[];

  await new Promise(r => setTimeout(r, 800));
  return [
    {
      id: 'match-live-1',
      tournamentResponse: { id: 't1', name: 'Ranchi Premier League 2025' },
      team1: { id: 'team-1', name: 'Mumbai XI', logoPath: null, creator: { id: 'u1', name: 'Rahul' }, captain: null, players: [], inviteToken: '' },
      team2: { id: 'team-2', name: 'Delhi Strikers', logoPath: null, creator: { id: 'u2', name: 'Amit' }, captain: null, players: [], inviteToken: '' },
      creatorName: { id: 'u1', name: 'Rahul' },
      matchDate: '2026-02-26', matchTime: '14:30:00.000000',
      venue: 'Jharkhand State Cricket Stadium', status: 'Live',
      stage: 'Final', team1Score: 148, team2Score: 132,
      winner: null,
      matchOps: ['__CURRENT_USER_ID__'],   // replaced at runtime with real userId
      currentScorer: '__CURRENT_USER_ID__',
    },
    {
      id: 'match-live-2',
      tournamentResponse: { id: 't2', name: 'City T20 Cup' },
      team1: { id: 'team-3', name: 'Chennai Hawks', logoPath: null, creator: { id: 'u3', name: 'Suresh' }, captain: null, players: [], inviteToken: '' },
      team2: { id: 'team-4', name: 'Kolkata Knights', logoPath: null, creator: { id: 'u4', name: 'Dev' }, captain: null, players: [], inviteToken: '' },
      creatorName: { id: 'u3', name: 'Suresh' },
      matchDate: '2026-02-26', matchTime: '10:00:00.000000',
      venue: 'Salt Lake Stadium', status: 'Live',
      stage: 'Semi Final', team1Score: 89, team2Score: 76,
      winner: null,
      matchOps: ['other-user-uuid'],  // user is NOT operator → won't show
      currentScorer: 'other-user-uuid',
    },
  ];
}

async function fetchUpcomingMatches(): Promise<MatchResponse[]> {
  // TODO: GET /api/v1/matches/status?status=Upcoming
  // const token = getAuthToken();
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/matches/status?status=Upcoming`, {
  //   headers: { Authorization: `Bearer ${token}` },
  // });
  // const json = await res.json();
  // return json.data as MatchResponse[];

  await new Promise(r => setTimeout(r, 600));
  return [
    {
      id: 'match-up-1',
      tournamentResponse: { id: 't1', name: 'Ranchi Premier League 2025' },
      team1: { id: 'team-5', name: 'Hyderabad Royals', logoPath: null, creator: { id: 'u5', name: 'Vikram' }, captain: null, players: [], inviteToken: '' },
      team2: { id: 'team-6', name: 'Bangalore Bulls', logoPath: null, creator: { id: 'u6', name: 'Nikhil' }, captain: null, players: [], inviteToken: '' },
      creatorName: { id: 'u5', name: 'Vikram' },
      matchDate: '2026-02-28', matchTime: '09:00:00.000000',
      venue: 'Rajiv Gandhi Stadium', status: 'Upcoming',
      stage: 'Quarter Final', team1Score: null, team2Score: null,
      winner: null,
      matchOps: ['__CURRENT_USER_ID__'],
      currentScorer: null,
    },
    {
      id: 'match-up-2',
      tournamentResponse: null,
      team1: { id: 'team-7', name: 'Rising Stars', logoPath: null, creator: { id: 'u7', name: 'Priya' }, captain: null, players: [], inviteToken: '' },
      team2: { id: 'team-8', name: 'Thunder Bolts', logoPath: null, creator: { id: 'u8', name: 'Karan' }, captain: null, players: [], inviteToken: '' },
      creatorName: { id: 'u7', name: 'Priya' },
      matchDate: '2026-03-02', matchTime: '15:00:00.000000',
      venue: 'Local Ground, Ranchi', status: 'Upcoming',
      stage: null, team1Score: null, team2Score: null,
      winner: null,
      matchOps: ['__CURRENT_USER_ID__'],
      currentScorer: null,
    },
  ];
}

async function fetchPastMatches(): Promise<MatchResponse[]> {
  // TODO: GET /api/v1/matches/status?status=Completed
  // const token = getAuthToken();
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/matches/status?status=Completed`, {
  //   headers: { Authorization: `Bearer ${token}` },
  // });
  // const json = await res.json();
  // return json.data as MatchResponse[];

  await new Promise(r => setTimeout(r, 600));
  return [
    {
      id: 'match-past-1',
      tournamentResponse: { id: 't3', name: 'Winter Classic 2025' },
      team1: { id: 'team-9', name: 'Sunrise FC', logoPath: null, creator: { id: 'u9', name: 'Arjun' }, captain: null, players: [], inviteToken: '' },
      team2: { id: 'team-10', name: 'Monsoon XI', logoPath: null, creator: { id: 'u10', name: 'Raj' }, captain: null, players: [], inviteToken: '' },
      creatorName: { id: 'u9', name: 'Arjun' },
      matchDate: '2026-02-20', matchTime: '11:00:00.000000',
      venue: 'Cricshub Ground A', status: 'Completed',
      stage: 'Group Stage', team1Score: 167, team2Score: 142,
      winner: 'Sunrise FC',
      matchOps: ['__CURRENT_USER_ID__'],
      currentScorer: null,
    },
    {
      id: 'match-past-2',
      tournamentResponse: { id: 't3', name: 'Winter Classic 2025' },
      team1: { id: 'team-11', name: 'Golden Eagles', logoPath: null, creator: { id: 'u11', name: 'Shyam' }, captain: null, players: [], inviteToken: '' },
      team2: { id: 'team-12', name: 'Silver Foxes', logoPath: null, creator: { id: 'u12', name: 'Tara' }, captain: null, players: [], inviteToken: '' },
      creatorName: { id: 'u11', name: 'Shyam' },
      matchDate: '2026-02-18', matchTime: '14:00:00.000000',
      venue: 'Indoor Arena, Ranchi', status: 'Completed',
      stage: 'Group Stage', team1Score: 201, team2Score: 198,
      winner: 'Golden Eagles',
      matchOps: ['__CURRENT_USER_ID__'],
      currentScorer: null,
    },
  ];
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function formatMatchDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatMatchTime(timeStr: string): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function getTeamInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// Replace placeholder userId in mock data with real userId
function hydrateMockData(matches: MatchResponse[], userId: string): MatchResponse[] {
  return matches.map(m => ({
    ...m,
    matchOps: m.matchOps.map(op => op === '__CURRENT_USER_ID__' ? userId : op),
    currentScorer: m.currentScorer === '__CURRENT_USER_ID__' ? userId : m.currentScorer,
  }));
}

// ═══════════════════════════════════════════════════════════
// TEAM AVATAR
// ═══════════════════════════════════════════════════════════

function TeamAvatar({ team, size = 'md' }: { team: TeamRes; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-11 h-11 text-sm', lg: 'w-14 h-14 text-base' };
  if (team.logoPath) {
    return (
      <img
        src={team.logoPath}
        alt={team.name}
        className={`${sizes[size]} rounded-full object-cover border-2 border-white shadow`}
      />
    );
  }
  // Generate a consistent colour from team name
  const colours = ['from-blue-400 to-blue-600', 'from-red-400 to-red-600', 'from-green-400 to-green-600',
    'from-amber-400 to-amber-600', 'from-purple-400 to-purple-600', 'from-pink-400 to-pink-600',
    'from-teal-400 to-teal-600', 'from-orange-400 to-orange-600'];
  const colour = colours[team.name.charCodeAt(0) % colours.length];
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${colour} flex items-center justify-center border-2 border-white shadow font-black text-white`}>
      {getTeamInitials(team.name)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LIVE MATCH CARD  (operator only — has Go Live button)
// ═══════════════════════════════════════════════════════════

function LiveMatchCard({ match }: { match: MatchResponse }) {
  const [streamPressed, setStreamPressed] = useState(false);

  const handleGoLive = () => {
    // Navigate to the streaming dashboard for this match
    window.location.href = `/stream/${match.id}`;
  };

  return (
    <div className="relative group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Live indicator strip */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-400 to-red-500 animate-pulse" />

      {/* Tournament + stage */}
      <div className="px-5 pt-4 pb-3 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center gap-1.5 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
              Live
            </span>
            <span className="text-white/80 text-xs font-medium truncate">
              {match.tournamentResponse?.name ?? 'Individual Match'}
            </span>
          </div>
          {match.stage && (
            <span className="text-white/60 text-[10px] font-semibold bg-white/15 px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
              {match.stage}
            </span>
          )}
        </div>
      </div>

      {/* Match body */}
      <div className="px-5 py-4">
        {/* Teams vs scores */}
        <div className="flex items-center justify-between gap-3">
          {/* Team 1 */}
          <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            <TeamAvatar team={match.team1} size="lg" />
            <p className="text-sm font-bold text-gray-900 text-center leading-tight line-clamp-2">{match.team1.name}</p>
            {match.team1Score != null && (
              <span className="text-2xl font-black text-[#1E88E5]">{match.team1Score}</span>
            )}
          </div>

          {/* VS divider */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <span className="text-xs font-black text-gray-300 tracking-widest">VS</span>
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-gray-200 to-transparent" />
          </div>

          {/* Team 2 */}
          <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            <TeamAvatar team={match.team2} size="lg" />
            <p className="text-sm font-bold text-gray-900 text-center leading-tight line-clamp-2">{match.team2.name}</p>
            {match.team2Score != null && (
              <span className="text-2xl font-black text-[#1E88E5]">{match.team2Score}</span>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-center gap-3 mt-3 text-xs text-gray-400 flex-wrap">
          <span className="flex items-center gap-1">
            <i className="ri-map-pin-line text-[#34B8FF]" />
            {match.venue || 'Venue TBD'}
          </span>
          <span className="text-gray-200">·</span>
          <span className="flex items-center gap-1">
            <i className="ri-time-line text-[#34B8FF]" />
            {formatMatchTime(match.matchTime)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex gap-2">
        {/* Go Live — primary CTA */}
        <button
          onClick={handleGoLive}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-300
            ${streamPressed
              ? 'bg-green-500 text-white scale-95'
              : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:shadow-red-200 hover:scale-[1.02] active:scale-95'
            }`}
        >
          {streamPressed ? (
            <><i className="ri-checkbox-circle-fill text-base" />Going Live!</>
          ) : (
            <><i className="ri-live-line text-base animate-pulse" />Go Live</>
          )}
        </button>

        {/* Score match */}
        <Link href={`/scoring/${match.id}`}
          className="flex items-center justify-center gap-1.5 px-4 py-3 bg-[#34B8FF]/10 text-[#1E88E5] font-bold text-sm rounded-xl hover:bg-[#34B8FF]/20 transition-colors border border-[#34B8FF]/20"
        >
          <i className="ri-bar-chart-line text-base" />
          Score
        </Link>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// UPCOMING MATCH CARD
// ═══════════════════════════════════════════════════════════

function UpcomingMatchCard({ match }: { match: MatchResponse }) {
  // Days until match
  const daysUntil = Math.ceil((new Date(match.matchDate).getTime() - Date.now()) / 86400000);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
      {/* Top strip */}
      <div className="h-1 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5]" />

      <div className="p-4">
        {/* Tournament + countdown */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400 font-medium truncate mr-2">
            {match.tournamentResponse?.name ?? 'Individual Match'}
          </span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${daysUntil <= 1 ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-600'
            }`}>
            {daysUntil <= 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d away`}
          </span>
        </div>

        {/* Teams */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <TeamAvatar team={match.team1} size="sm" />
            <p className="text-sm font-bold text-gray-800 truncate">{match.team1.name}</p>
          </div>
          <span className="text-xs font-black text-gray-300 flex-shrink-0">VS</span>
          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            <p className="text-sm font-bold text-gray-800 truncate text-right">{match.team2.name}</p>
            <TeamAvatar team={match.team2} size="sm" />
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400 flex-wrap">
          <span className="flex items-center gap-1">
            <i className="ri-calendar-line text-[#34B8FF]" />
            {formatMatchDate(match.matchDate)}
          </span>
          <span className="flex items-center gap-1">
            <i className="ri-time-line text-[#34B8FF]" />
            {formatMatchTime(match.matchTime)}
          </span>
          {match.venue && (
            <span className="flex items-center gap-1 truncate">
              <i className="ri-map-pin-line text-[#34B8FF]" />
              {match.venue}
            </span>
          )}
        </div>

        {/* Setup button */}
        <Link href={`/scoring/${match.id}`}
          className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white text-xs font-bold rounded-xl hover:shadow-md hover:shadow-blue-200 transition-all duration-300 hover:scale-[1.01]"
        >
          <i className="ri-settings-3-line" />Setup Match
        </Link>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAST MATCH CARD
// ═══════════════════════════════════════════════════════════

function PastMatchCard({ match }: { match: MatchResponse }) {
  const team1Won = match.winner === match.team1.name;
  const team2Won = match.winner === match.team2.name;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-gray-200 to-gray-300" />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400 font-medium truncate mr-2">
            {match.tournamentResponse?.name ?? 'Individual Match'}
          </span>
          <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">
            Completed
          </span>
        </div>

        {/* Teams + scores */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 flex-1 min-w-0 ${team1Won ? 'opacity-100' : 'opacity-50'}`}>
            <TeamAvatar team={match.team1} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">{match.team1.name}</p>
              {match.team1Score != null && (
                <p className={`text-lg font-black ${team1Won ? 'text-[#1E88E5]' : 'text-gray-400'}`}>{match.team1Score}</p>
              )}
            </div>
          </div>

          <div className="text-center flex-shrink-0 px-1">
            {match.winner ? (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[9px] text-gray-300 font-bold uppercase tracking-wider">Winner</span>
                <i className="ri-trophy-fill text-amber-400 text-lg" />
              </div>
            ) : (
              <span className="text-xs font-black text-gray-300">VS</span>
            )}
          </div>

          <div className={`flex items-center gap-2 flex-1 min-w-0 justify-end ${team2Won ? 'opacity-100' : 'opacity-50'}`}>
            <div className="min-w-0 text-right">
              <p className="text-sm font-bold text-gray-800 truncate">{match.team2.name}</p>
              {match.team2Score != null && (
                <p className={`text-lg font-black ${team2Won ? 'text-[#1E88E5]' : 'text-gray-400'}`}>{match.team2Score}</p>
              )}
            </div>
            <TeamAvatar team={match.team2} size="sm" />
          </div>
        </div>

        {match.winner && (
          <p className="text-center text-xs font-bold text-amber-600 mt-2 bg-amber-50 rounded-lg py-1.5">
            🏆 {match.winner} won
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <i className="ri-calendar-line text-gray-300" />{formatMatchDate(match.matchDate)}
          </span>
          {match.venue && (
            <span className="flex items-center gap-1 truncate">
              <i className="ri-map-pin-line text-gray-300" />{match.venue}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SKELETON LOADER
// ═══════════════════════════════════════════════════════════

function SkeletonCard({ tall = false }: { tall?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse ${tall ? 'h-64' : 'h-44'}`}>
      <div className="h-1 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-1/4" />
        </div>
        <div className="flex items-center gap-3 justify-between">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-gray-100" />
            <div className="h-3 bg-gray-100 rounded w-16" />
            <div className="h-5 bg-gray-100 rounded w-10" />
          </div>
          <div className="h-3 bg-gray-100 rounded w-6" />
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-gray-100" />
            <div className="h-3 bg-gray-100 rounded w-16" />
            <div className="h-5 bg-gray-100 rounded w-10" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════

function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
        <i className={`${icon} text-3xl text-gray-300`} />
      </div>
      <p className="font-bold text-gray-500 text-sm">{title}</p>
      <p className="text-gray-400 text-xs mt-1">{subtitle}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm flex-shrink-0`}>
        <i className={`${icon} text-xl text-white`} />
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900">{value}</p>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════

function SectionHeader({ icon, title, count, accent = false }: { icon: string; title: string; count?: number; accent?: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent ? 'bg-red-500' : 'bg-gradient-to-br from-[#34B8FF] to-[#1E88E5]'}`}>
        <i className={`${icon} text-white text-base`} />
      </div>
      <h2 className="font-black text-gray-900 text-lg">{title}</h2>
      {count !== undefined && (
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ml-1 ${accent ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-[#1E88E5]'}`}>
          {count}
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════

export default function DashboardPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [liveMatches, setLiveMatches] = useState<MatchResponse[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<MatchResponse[]>([]);
  const [pastMatches, setPastMatches] = useState<MatchResponse[]>([]);
  const [loadingLive, setLoadingLive] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [loadingPast, setLoadingPast] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [refreshingLive, setRefreshingLive] = useState(false);

  // Greeting based on time of day
  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good morning');
    else if (h < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Auth check
  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      // TODO: Redirect to login if no session
      // router.push('/login');
      // For now, use a mock user so the page renders
      setUser({ id: 'mock-user-uuid', name: 'Demo Operator', phone: '+91 9000000000' });
    } else {
      setUser(u);
    }
  }, []);

  // Fetch all matches once we have the user
  const loadAllMatches = useCallback(async (userId: string, showLoadingSpinners = true) => {
    if (showLoadingSpinners) {
      setLoadingLive(true); setLoadingUpcoming(true); setLoadingPast(true);
    }

    const [live, upcoming, past] = await Promise.all([
      fetchLiveMatches(),
      fetchUpcomingMatches(),
      fetchPastMatches(),
    ]);

    // Hydrate mock data with the real userId, then filter by matchOps
    const myLive = hydrateMockData(live, userId).filter(m => m.matchOps.includes(userId));
    const myUpcoming = hydrateMockData(upcoming, userId).filter(m => m.matchOps.includes(userId));
    const myPast = hydrateMockData(past, userId).filter(m => m.matchOps.includes(userId));

    setLiveMatches(myLive);
    setUpcomingMatches(myUpcoming);
    setPastMatches(myPast);
    setLoadingLive(false); setLoadingUpcoming(false); setLoadingPast(false);
    setRefreshingLive(false);
  }, []);

  useEffect(() => {
    if (user) loadAllMatches(user.id);
  }, [user, loadAllMatches]);

  // Auto-refresh live matches every 30s
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      setRefreshingLive(true);
      const live = await fetchLiveMatches();
      const myLive = hydrateMockData(live, user.id).filter(m => m.matchOps.includes(user.id));
      setLiveMatches(myLive);
      setRefreshingLive(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const totalMatches = liveMatches.length + upcomingMatches.length + pastMatches.length;

  return (
    <div className="min-h-screen bg-[#F8F9FA]">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/images/iconLogo.png" alt="Cricshub" width={34} height={34} className="rounded-lg" />
            <Image src="/images/textLogo.png" alt="Cricshub" width={88} height={26} className="object-contain hidden sm:block" />
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/pricing" className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1E88E5] font-semibold transition-colors px-3 py-2 rounded-xl hover:bg-blue-50">
              <i className="ri-vip-crown-line" />Plans
            </Link>
            {/* User avatar */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white px-4 py-2 rounded-full text-sm font-bold">
              <i className="ri-user-line" />
              <span className="hidden sm:block">{user?.name ?? '...'}</span>
            </div>
            <button
              onClick={() => {
                // TODO: Clear auth tokens and redirect to home
                // localStorage.removeItem('jwtToken'); localStorage.removeItem('userUUID');
                // router.push('/');
                console.log('[PLACEHOLDER] Logout');
              }}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Logout"
            >
              <i className="ri-logout-circle-line text-xl" />
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-6xl space-y-10">

        {/* ── Welcome Header ── */}
        <div className="relative bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] rounded-3xl px-8 py-8 overflow-hidden shadow-xl shadow-blue-200">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute top-4 right-32 w-16 h-16 rounded-full bg-white/5" />

          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-white/70 text-sm font-semibold mb-1">
                {greeting} 👋
              </p>
              <h1 className="text-2xl md:text-3xl font-black text-white mb-2">
                {user?.name ?? 'Loading...'}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  <i className="ri-shield-star-line" />Match Operator
                </span>
                {liveMatches.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
                    {liveMatches.length} Live Match{liveMatches.length > 1 ? 'es' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Cricket ball decoration */}
            <div className="hidden md:flex w-20 h-20 rounded-full bg-white/15 items-center justify-center">
              <i className="ri-football-line text-5xl text-white/60" />
            </div>
          </div>
        </div>

        {/* ── Quick Stats ── */}
        {!loadingLive && !loadingUpcoming && !loadingPast && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon="ri-live-line" label="Live Now" value={liveMatches.length} color="from-red-400 to-red-600" />
            <StatCard icon="ri-calendar-event-line" label="Upcoming" value={upcomingMatches.length} color="from-[#34B8FF] to-[#1E88E5]" />
            <StatCard icon="ri-history-line" label="Past Matches" value={pastMatches.length} color="from-gray-400 to-gray-600" />
            <StatCard icon="ri-bar-chart-grouped-line" label="Total as Operator" value={totalMatches} color="from-purple-400 to-purple-600" />
          </div>
        )}

        {/* ── LIVE MATCHES (Operator only) ── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <SectionHeader
              icon="ri-live-line"
              title="Live Matches"
              count={liveMatches.length}
              accent
            />
            {refreshingLive && (
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <i className="ri-loader-4-line animate-spin" />Refreshing…
              </span>
            )}
          </div>

          {loadingLive ? (
            <div className="grid md:grid-cols-2 gap-5">
              <SkeletonCard tall /><SkeletonCard tall />
            </div>
          ) : liveMatches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <EmptyState
                icon="ri-live-line"
                title="No live matches right now"
                subtitle="You'll see matches here when you're assigned as an Operator and a match goes live"
              />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {liveMatches.map(m => <LiveMatchCard key={m.id} match={m} />)}
            </div>
          )}
        </section>

        {/* ── UPCOMING MATCHES ── */}
        <section>
          <SectionHeader icon="ri-calendar-event-line" title="Upcoming Matches" count={upcomingMatches.length} />

          {loadingUpcoming ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
            </div>
          ) : upcomingMatches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <EmptyState
                icon="ri-calendar-event-line"
                title="No upcoming matches scheduled"
                subtitle="Matches where you're listed as an Operator will appear here"
              />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingMatches.map(m => <UpcomingMatchCard key={m.id} match={m} />)}
            </div>
          )}
        </section>

        {/* ── PAST MATCHES ── */}
        <section>
          <SectionHeader icon="ri-history-line" title="Past Matches" count={pastMatches.length} />

          {loadingPast ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
            </div>
          ) : pastMatches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <EmptyState
                icon="ri-history-line"
                title="No past matches found"
                subtitle="Your completed operator matches will appear here"
              />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastMatches.map(m => <PastMatchCard key={m.id} match={m} />)}
            </div>
          )}
        </section>

        {/* ── Quick Links ── */}
        <section className="pb-8">
          <SectionHeader icon="ri-apps-line" title="Quick Actions" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: 'ri-vip-crown-line', label: 'Upgrade Plan', href: '/pricing', color: 'from-purple-400 to-purple-600' },
              { icon: 'ri-trophy-line', label: 'Tournaments', href: '/tournaments', color: 'from-amber-400 to-amber-600' },
              { icon: 'ri-team-line', label: 'My Teams', href: '/teams', color: 'from-green-400 to-green-600' },
              { icon: 'ri-customer-service-2-line', label: 'Support', href: '/contact-us', color: 'from-[#34B8FF] to-[#1E88E5]' },
            ].map(action => (
              <Link key={action.label} href={action.href}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                  <i className={`${action.icon} text-xl text-white`} />
                </div>
                <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors text-center">{action.label}</span>
              </Link>
            ))}
          </div>
        </section>

      </div>

      <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet" />
    </div>
  );
}