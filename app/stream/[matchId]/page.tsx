'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

// ═══════════════════════════════════════════════════════════
// TYPES — exact mirror of MatchState.java + MatchResponse
// ═══════════════════════════════════════════════════════════

interface PlayerDetails { playerId: string; name: string; }
interface WicketDetails { dismissalType: string; bowlerId: PlayerDetails | null; catcherId: PlayerDetails | null; runOutMakerId: PlayerDetails | null; overNumber: number; ballNumber: number; }
interface Extras { wide: number; noBall: number; bye: number; legBye: number; penalty: number; }
interface PlayerStats {
    playerId: string; name: string;
    runs: number; ballsFaced: number; fours: number; sixes: number; strikeRate: number;
    wicketDetails: WicketDetails | null;
    overs: number; ballsBowled: number; runsConceded: number; wicketsTaken: number; economyRate: number;
}
interface TeamDetails { name: string; logoUrl: string | null; playingXI: PlayerStats[]; captainId: string | null; score: number; wickets: number; overs: number; ballsPlayed: number; extras: Extras | null; }
interface MatchState {
    matchId: string; tournamentId: string | null;
    team1: TeamDetails; team2: TeamDetails;
    tossWinner: string; choice: string;
    isFirstInnings: boolean; completedOvers: number; totalOvers: number;
    matchComplete: boolean; winner: string | null; winBy: string | null;
    battingFirst: TeamDetails | null; battingSecond: TeamDetails | null;
    currentStriker: PlayerDetails | null; currentNonStriker: PlayerDetails | null; currentBowler: PlayerDetails | null;
    currentOverBalls: string[];                  // derived: shortBallOutcome strings
    team1BattingOrder: PlayerStats[]; team2BattingOrder: PlayerStats[];
}
interface MatchInfo {
    id: string; venue: string; matchDate: string; matchTime: string;
    stage: string | null; status: string; overs: number;
    tournamentName: string | null;
    team1: { id: string; name: string; logoPath: string | null };
    team2: { id: string; name: string; logoPath: string | null };
}
interface StreamSession { isLocked: boolean; lockedByUserId: string | null; lockedByName: string | null; }
interface Subscription { hasSubscription: boolean; ownedTemplateIds: string[]; }

export type BannerType = 'none' | 'main' | 'playingXI_bat' | 'playingXI_bowl' | 'score';

// ═══════════════════════════════════════════════════════════
// PLACEHOLDER API CALLS
// ═══════════════════════════════════════════════════════════

async function fetchMatchInfo(matchId: string): Promise<MatchInfo> {
    // TODO: GET /api/v1/matches/{matchId}
    await new Promise(r => setTimeout(r, 500));
    return {
        id: matchId, venue: 'Jharkhand State Cricket Stadium',
        matchDate: '2026-02-26', matchTime: '14:30:00',
        stage: 'Final', status: 'Live', overs: 20,
        tournamentName: 'Ranchi Premier League 2025',
        team1: { id: 't1', name: 'Mumbai XI', logoPath: null },
        team2: { id: 't2', name: 'Delhi Strikers', logoPath: null },
    };
}

async function fetchMatchState(matchId: string): Promise<MatchState> {
    // TODO: GET /api/v1/matches/matchstate/{matchId}
    // Replace interval-polling below with WebSocket once backend stream entity is ready:
    //   const stompClient = new Client({ brokerURL: 'ws://your-api/ws' });
    //   stompClient.subscribe(`/topic/match/${matchId}`, msg => setMatchState(JSON.parse(msg.body)));
    await new Promise(r => setTimeout(r, 300));
    const xi = (pfx: string): PlayerStats[] => Array.from({ length: 11 }, (_, i) => ({
        playerId: `${pfx}${i}`, name: `Player ${i + 1}`,
        runs: 20 + i * 9, ballsFaced: 18 + i * 6,
        fours: i % 4, sixes: i % 2, strikeRate: 110 + i * 5,
        wicketDetails: i < 4 ? { dismissalType: ['Bowled', 'Caught', 'LBW', 'Run Out'][i], bowlerId: null, catcherId: null, runOutMakerId: null, overNumber: i + 1, ballNumber: i + 3 } : null,
        overs: i < 5 ? i + 1 : 0, ballsBowled: i < 5 ? (i + 1) * 6 : 0,
        runsConceded: i < 5 ? (i + 1) * 9 : 0, wicketsTaken: i < 5 ? i % 3 : 0,
        economyRate: i < 5 ? 7.2 + i * 0.4 : 0,
    }));
    const t1 = { name: 'Mumbai XI', logoUrl: null, playingXI: xi('mum'), captainId: null, score: 148, wickets: 5, overs: 20, ballsPlayed: 120, extras: { wide: 4, noBall: 1, bye: 2, legBye: 1, penalty: 0 } };
    const t2 = { name: 'Delhi Strikers', logoUrl: null, playingXI: xi('del'), captainId: null, score: 132, wickets: 7, overs: 18.2, ballsPlayed: 110, extras: { wide: 3, noBall: 0, bye: 1, legBye: 2, penalty: 0 } };
    return {
        matchId, tournamentId: null,
        team1: t1, team2: t2,
        tossWinner: 'Mumbai XI', choice: 'Bat',
        isFirstInnings: false, completedOvers: 18, totalOvers: 20,
        matchComplete: false, winner: null, winBy: null,
        battingFirst: t1, battingSecond: t2,
        currentStriker: { playerId: 'del4', name: 'Player 5' },
        currentNonStriker: { playerId: 'del5', name: 'Player 6' },
        currentBowler: { playerId: 'mum7', name: 'Player 8' },
        currentOverBalls: ['1', '0', 'W', '4', '2'],
        team1BattingOrder: xi('mum'), team2BattingOrder: xi('del'),
    };
}

async function fetchStreamSession(matchId: string): Promise<StreamSession> {
    // TODO: GET /api/v1/stream/{matchId}/session
    await new Promise(r => setTimeout(r, 200));
    return { isLocked: false, lockedByUserId: null, lockedByName: null };
}

async function claimStreamLock(matchId: string, userId: string): Promise<{ success: boolean }> {
    // TODO: POST /api/v1/stream/{matchId}/claim   body: { userId }
    // Returns 409 Conflict if another operator already holds the lock
    console.log('[PLACEHOLDER] claimStreamLock', { matchId, userId });
    await new Promise(r => setTimeout(r, 400));
    return { success: true };
}

async function releaseStreamLock(matchId: string, userId: string): Promise<void> {
    // TODO: POST /api/v1/stream/{matchId}/release  body: { userId }
    console.log('[PLACEHOLDER] releaseStreamLock', { matchId, userId });
    await new Promise(r => setTimeout(r, 200));
}

async function pushActiveBanner(matchId: string, banner: BannerType, templateId: string | null): Promise<void> {
    // TODO: POST /api/v1/stream/{matchId}/banner  body: { banner, templateId }
    // The OBS overlay page polls this endpoint and re-renders when it changes
    console.log('[PLACEHOLDER] pushActiveBanner', { matchId, banner, templateId });
    await new Promise(r => setTimeout(r, 150));
}

async function fetchSubscription(userId: string): Promise<Subscription> {
    // TODO: GET /api/v1/subscriptions/user/{userId}
    console.log('[PLACEHOLDER] fetchSubscription', userId);
    await new Promise(r => setTimeout(r, 250));
    return { hasSubscription: true, ownedTemplateIds: ['tpl-b1', 'tpl-p1'] };
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

const fmt12 = (t: string) => { if (!t) return ''; const [h, m] = t.split(':'); const hr = parseInt(h); return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`; };
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const initials = (n: string) => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
const ballBg = (b: string) => b === 'W' ? 'bg-red-500 text-white' : b === '4' ? 'bg-blue-500 text-white' : b === '6' ? 'bg-purple-500 text-white' : b === '0' ? 'bg-gray-100 text-gray-500' : 'bg-emerald-500 text-white';

function getBattingTeam(s: MatchState): TeamDetails {
    if (!s.battingFirst) return s.team1;
    return s.isFirstInnings
        ? (s.battingFirst.name === s.team1.name ? s.team1 : s.team2)
        : (s.battingFirst.name === s.team1.name ? s.team2 : s.team1);
}
function getBowlingTeam(s: MatchState): TeamDetails {
    const bat = getBattingTeam(s);
    return bat.name === s.team1.name ? s.team2 : s.team1;
}

// ═══════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════

function TeamAvatar({ name, size = 'md', gradient = 'from-[#34B8FF] to-[#1E88E5]' }: { name: string; size?: 'sm' | 'md' | 'lg'; gradient?: string }) {
    const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-14 h-14 text-base' : 'w-11 h-11 text-sm';
    return (
        <div className={`${sz} rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center font-black text-white shadow-sm flex-shrink-0`}>
            {initials(name)}
        </div>
    );
}

function ScoreLive({ state }: { state: MatchState }) {
    const bat = getBattingTeam(state);
    const bowl = getBowlingTeam(state);
    const crr = bat.overs > 0 ? (bat.score / bat.overs).toFixed(2) : '—';
    const runsNeeded = bat.score - bowl.score + 1;
    const ballsLeft = Math.round((state.totalOvers - bowl.overs) * 6);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Score</p>
                <span className="flex items-center gap-1.5 text-[10px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />LIVE
                </span>
            </div>
            <div className="px-5 py-4 space-y-3">
                {/* Batting */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TeamAvatar name={bat.name} size="sm" />
                        <p className="font-bold text-gray-900 text-sm">{bat.name}</p>
                    </div>
                    <p className="font-black text-2xl text-[#1E88E5]">{bat.score}/{bat.wickets}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{bat.overs} ov</span>
                    <span>·</span>
                    <span>CRR {crr}</span>
                    {!state.isFirstInnings && <><span>·</span><span className="text-amber-600 font-semibold">Need {runsNeeded} off {ballsLeft}</span></>}
                </div>

                {/* Current over balls */}
                {state.currentOverBalls?.length > 0 && (
                    <div>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5">This over</p>
                        <div className="flex gap-1.5 flex-wrap">
                            {state.currentOverBalls.map((b, i) => (
                                <span key={i} className={`w-7 h-7 rounded-full text-[11px] font-black flex items-center justify-center ${ballBg(b)}`}>{b}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Current batters */}
                {(state.currentStriker || state.currentNonStriker) && (
                    <div className="space-y-1 pt-1 border-t border-gray-50">
                        {[state.currentStriker, state.currentNonStriker].filter(Boolean).map((p, i) => {
                            const stats = bat.playingXI.find(ps => ps.playerId === p?.playerId);
                            return (
                                <div key={i} className="flex items-center justify-between text-xs">
                                    <span className="text-gray-700 font-semibold flex items-center gap-1">
                                        {i === 0 && <span className="text-[#34B8FF]">🏏</span>}{p?.name}
                                    </span>
                                    {stats && <span className="text-gray-500 font-mono">{stats.runs}({stats.ballsFaced}) · SR {stats.strikeRate.toFixed(0)}</span>}
                                </div>
                            );
                        })}
                        {state.currentBowler && (
                            <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-50">
                                <span className="text-gray-500 flex items-center gap-1"><span>🎳</span>{state.currentBowler.name}</span>
                                {(() => {
                                    const bs = bowl.playingXI.find(p => p.playerId === state.currentBowler?.playerId);
                                    return bs ? <span className="text-gray-400 font-mono">{bs.overs}ov · {bs.wicketsTaken}w · {bs.runsConceded}r</span> : null;
                                })()}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function BannerCard({ icon, title, desc, active, canUse, locked, lockedReason, onToggle, badge, previewBg }: {
    icon: string; title: string; desc: string;
    active: boolean; canUse: boolean; locked: boolean; lockedReason?: string;
    onToggle: () => void; badge?: string; previewBg?: string;
}) {
    return (
        <div
            onClick={() => canUse && !locked && onToggle()}
            className={`relative rounded-2xl border-2 overflow-hidden transition-all duration-300 select-none
        ${active ? 'border-[#34B8FF] shadow-xl shadow-blue-100 bg-blue-50' : ''}
        ${!active && canUse && !locked ? 'border-gray-100 bg-white cursor-pointer hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5' : ''}
        ${locked || !canUse ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed' : ''}
      `}
        >
            {/* Active pulse top border */}
            {active && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#34B8FF] via-blue-300 to-[#34B8FF] animate-pulse" />}

            {/* Preview strip */}
            {previewBg && (
                <div className="h-12 w-full relative overflow-hidden" style={{ background: previewBg }}>
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <span className="text-white text-[10px] font-black tracking-widest uppercase opacity-70">OBS Preview</span>
                    </div>
                    {active && (
                        <div className="absolute top-1.5 left-2 flex items-center gap-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                            <span className="w-1 h-1 rounded-full bg-white animate-pulse" />ON AIR
                        </div>
                    )}
                </div>
            )}

            <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? 'bg-gradient-to-br from-[#34B8FF] to-[#1E88E5]' : 'bg-gray-100'}`}>
                        <i className={`${icon} text-lg ${active ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className={`font-bold text-sm ${active ? 'text-[#1E88E5]' : 'text-gray-900'}`}>{title}</p>
                            {badge && <span className="text-[9px] font-black bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">{badge}</span>}
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed mt-0.5">{desc}</p>
                    </div>
                </div>

                {locked || !canUse ? (
                    <div className="w-full py-2 rounded-xl bg-gray-100 text-gray-400 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                        <i className="ri-lock-line" />{lockedReason ?? 'Unavailable'}
                    </div>
                ) : active ? (
                    <div className="w-full py-2 rounded-xl bg-red-50 text-red-500 border border-red-200 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                        <i className="ri-stop-circle-line" />Hide Banner
                    </div>
                ) : (
                    <div className="w-full py-2 rounded-xl bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white text-xs font-bold text-center flex items-center justify-center gap-1.5">
                        <i className="ri-play-circle-line" />Show Banner
                    </div>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════

export default function StreamDashboard() {
    const params = useParams();
    const router = useRouter();
    const matchId = params?.matchId as string;

    const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
    const [matchState, setMatchState] = useState<MatchState | null>(null);
    const [session, setSession] = useState<StreamSession>({ isLocked: false, lockedByUserId: null, lockedByName: null });
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [activeBanner, setActiveBanner] = useState<BannerType>('none');
    const [streaming, setStreaming] = useState(false);
    const [loading, setLoading] = useState(true);
    const [claimBusy, setClaimBusy] = useState(false);
    const [bannerBusy, setBannerBusy] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'banners' | 'score'>('banners');
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    // Placeholder auth — replace with real SSO / context
    const currentUser = {
        id: (typeof window !== 'undefined' ? localStorage.getItem('userUUID') : null) ?? 'mock-uuid',
        name: (typeof window !== 'undefined' ? localStorage.getItem('userName') : null) ?? 'Demo Operator',
    };
    const obsUrl = typeof window !== 'undefined' ? `${window.location.origin}/obs/${matchId}` : `/obs/${matchId}`;

    const iAmStreaming = streaming && session.lockedByUserId === currentUser.id;
    const lockedByOther = session.isLocked && session.lockedByUserId !== currentUser.id;
    const hasAccess = subscription?.hasSubscription ?? false;

    // ── Initial load ──
    useEffect(() => {
        if (!matchId) return;
        Promise.all([
            fetchMatchInfo(matchId),
            fetchMatchState(matchId),
            fetchStreamSession(matchId),
            fetchSubscription(currentUser.id),
        ]).then(([info, state, sess, sub]) => {
            setMatchInfo(info); setMatchState(state); setSession(sess); setSubscription(sub);
            if (sess.isLocked && sess.lockedByUserId === currentUser.id) setStreaming(true);
            setLoading(false);
        });
    }, [matchId]);

    // ── Poll match state every 4s ──
    useEffect(() => {
        if (!matchId) return;
        pollRef.current = setInterval(async () => {
            const s = await fetchMatchState(matchId);
            setMatchState(s);
        }, 4000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [matchId]);

    const handleClaimStream = async () => {
        setClaimBusy(true);
        const result = await claimStreamLock(matchId, currentUser.id);
        if (result.success) {
            setSession({ isLocked: true, lockedByUserId: currentUser.id, lockedByName: currentUser.name });
            setStreaming(true);
        } else {
            alert('Could not claim stream — another operator may have just taken it. Please refresh.');
        }
        setClaimBusy(false);
    };

    const handleRelease = async () => {
        await releaseStreamLock(matchId, currentUser.id);
        await pushActiveBanner(matchId, 'none', null);
        setSession({ isLocked: false, lockedByUserId: null, lockedByName: null });
        setStreaming(false); setActiveBanner('none');
    };

    const handleBanner = async (banner: BannerType) => {
        if (!iAmStreaming || bannerBusy) return;
        setBannerBusy(true);
        const next = activeBanner === banner ? 'none' : banner;
        await pushActiveBanner(matchId, next, null);
        setActiveBanner(next);
        setBannerBusy(false);
    };

    const copyObs = () => {
        navigator.clipboard.writeText(obsUrl);
        setCopied(true); setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#34B8FF] to-[#1E88E5] flex items-center justify-center shadow-xl animate-pulse">
                    <i className="ri-live-line text-white text-3xl" />
                </div>
                <p className="font-semibold text-gray-500">Loading stream studio…</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8F9FA]">

            {/* ── Navbar ── */}
            <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 font-semibold transition-colors">
                            <i className="ri-arrow-left-line" />Dashboard
                        </Link>
                        <span className="text-gray-200 hidden sm:block">|</span>
                        <div className="hidden sm:flex items-center gap-2">
                            <Image src="/images/iconLogo.png" alt="Cricshub" width={26} height={26} className="rounded-md" />
                            <span className="font-black text-gray-900 text-sm">Stream Studio</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Status pill */}
                        {iAmStreaming ? (
                            <span className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping inline-block" />
                                STREAMING
                            </span>
                        ) : lockedByOther ? (
                            <span className="flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-200">
                                <i className="ri-lock-line" />Locked · {session.lockedByName}
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1.5 rounded-full">
                                <i className="ri-stop-circle-line" />Offline
                            </span>
                        )}
                        {/* Active banner pill */}
                        {activeBanner !== 'none' && (
                            <span className="flex items-center gap-1 bg-blue-50 text-[#1E88E5] text-xs font-bold px-3 py-1.5 rounded-full border border-blue-100">
                                <i className="ri-layout-top-2-line" />
                                {activeBanner === 'main' ? 'Main Banner' : activeBanner === 'playingXI_bat' ? 'Bat XI' : activeBanner === 'playingXI_bowl' ? 'Bowl XI' : 'Score Overlay'}
                            </span>
                        )}
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-6 py-8 max-w-7xl">
                <div className="grid lg:grid-cols-[320px_1fr] gap-6">

                    {/* ══ LEFT SIDEBAR ══════════════════════════════════ */}
                    <div className="space-y-5">

                        {/* Match info */}
                        {matchInfo && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] px-5 pt-5 pb-4">
                                    {matchInfo.tournamentName && <p className="text-white/70 text-xs font-semibold mb-1">{matchInfo.tournamentName}</p>}
                                    <h1 className="text-white font-black text-base leading-snug">
                                        {matchInfo.team1.name} <span className="text-white/50 font-normal text-sm">vs</span> {matchInfo.team2.name}
                                    </h1>
                                    {matchInfo.stage && (
                                        <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 inline-block uppercase tracking-wide">{matchInfo.stage}</span>
                                    )}
                                </div>
                                <div className="px-5 py-4 space-y-2 text-sm text-gray-600">
                                    {[
                                        { icon: 'ri-map-pin-line', text: matchInfo.venue },
                                        { icon: 'ri-calendar-line', text: fmtDate(matchInfo.matchDate) },
                                        { icon: 'ri-time-line', text: `${fmt12(matchInfo.matchTime)} · ${matchInfo.overs} overs` },
                                    ].map((row, i) => (
                                        <div key={i} className="flex items-center gap-2.5">
                                            <i className={`${row.icon} text-[#34B8FF] flex-shrink-0`} />
                                            <span className="truncate">{row.text}</span>
                                        </div>
                                    ))}
                                    {matchState && (
                                        <div className="flex items-center gap-2.5">
                                            <i className="ri-coin-line text-[#34B8FF] flex-shrink-0" />
                                            <span>{matchState.tossWinner} won toss · chose to {matchState.choice}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Stream control */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Stream Control</p>

                            {!hasAccess ? (
                                /* No subscription */
                                <div className="text-center py-3">
                                    <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-3 border border-amber-100">
                                        <i className="ri-vip-crown-line text-amber-500 text-2xl" />
                                    </div>
                                    <p className="font-bold text-gray-900 text-sm mb-1">Subscription Required</p>
                                    <p className="text-xs text-gray-400 mb-4 leading-relaxed">Upgrade to access the streaming dashboard and banner controls.</p>
                                    <Link href="/pricing" className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:shadow-md transition-all">
                                        <i className="ri-vip-crown-line" />View Plans
                                    </Link>
                                </div>
                            ) : lockedByOther ? (
                                /* Locked by another operator */
                                <div className="text-center py-2">
                                    <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-3 border border-amber-100">
                                        <i className="ri-lock-2-line text-amber-500 text-2xl" />
                                    </div>
                                    <p className="font-bold text-gray-900 text-sm mb-1">Stream is active</p>
                                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                                        <strong className="text-gray-700">{session.lockedByName}</strong> is currently streaming. They need to release the stream before you can take over.
                                    </p>
                                    <button onClick={async () => { const s = await fetchStreamSession(matchId); setSession(s); }}
                                        className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5">
                                        <i className="ri-refresh-line" />Refresh Status
                                    </button>
                                </div>
                            ) : !streaming ? (
                                /* Ready to start */
                                <div className="space-y-4">
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 space-y-1">
                                        <p className="font-bold">Before you start:</p>
                                        <p>① Copy the OBS URL below</p>
                                        <p>② Add it as a Browser Source in OBS (1920×1080)</p>
                                        <p>③ Click "Start Streaming" to take control</p>
                                    </div>
                                    <button onClick={handleClaimStream} disabled={claimBusy}
                                        className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 text-white font-black rounded-xl hover:shadow-lg hover:shadow-red-200 transition-all disabled:opacity-60 flex items-center justify-center gap-2 hover:scale-[1.01]">
                                        {claimBusy
                                            ? <><i className="ri-loader-4-line animate-spin" />Claiming…</>
                                            : <><i className="ri-live-line" />Start Streaming</>}
                                    </button>
                                </div>
                            ) : (
                                /* Currently streaming */
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping flex-shrink-0" />
                                        <div>
                                            <p className="text-red-700 text-sm font-bold">You are live</p>
                                            <p className="text-red-500 text-xs">OBS is capturing your overlay</p>
                                        </div>
                                    </div>
                                    <button onClick={handleRelease}
                                        className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-red-50 hover:text-red-600 transition-all border border-gray-200 flex items-center justify-center gap-1.5">
                                        <i className="ri-stop-circle-line" />Release Stream
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* OBS URL */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">OBS Browser Source URL</p>
                                <Link href={obsUrl} target="_blank" className="text-[10px] text-[#34B8FF] font-semibold hover:underline flex items-center gap-0.5">
                                    Preview <i className="ri-external-link-line" />
                                </Link>
                            </div>
                            <div className="flex gap-2 mb-2">
                                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-500 font-mono truncate">
                                    {obsUrl}
                                </div>
                                <button onClick={copyObs}
                                    className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-[#34B8FF]/10 text-[#1E88E5] border border-[#34B8FF]/20 hover:bg-[#34B8FF]/20'}`}>
                                    {copied ? <><i className="ri-check-line" /> Copied!</> : <><i className="ri-clipboard-line" /> Copy</>}
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-400 leading-relaxed">
                                In OBS: <strong>Add Source → Browser</strong> → paste URL. Set width <strong>1920</strong>, height <strong>1080</strong>, check <strong>transparent background</strong>.
                            </p>
                        </div>

                        {/* Live score */}
                        {matchState && <ScoreLive state={matchState} />}
                    </div>

                    {/* ══ MAIN PANEL ═══════════════════════════════════ */}
                    <div className="space-y-6">

                        {/* Active banner status bar */}
                        <div className={`rounded-2xl border-2 px-5 py-4 flex items-center justify-between gap-4 transition-all duration-300 ${activeBanner !== 'none' ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-white'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${activeBanner !== 'none' ? 'bg-red-500' : 'bg-gray-100'}`}>
                                    <i className={`ri-broadcast-line text-xl ${activeBanner !== 'none' ? 'text-white' : 'text-gray-400'}`} />
                                </div>
                                <div>
                                    <p className={`font-bold text-sm ${activeBanner !== 'none' ? 'text-red-700' : 'text-gray-500'}`}>
                                        {activeBanner === 'none' ? 'No banner active — OBS overlay is clear'
                                            : activeBanner === 'main' ? '📺 Main Match Banner is live on OBS'
                                                : activeBanner === 'playingXI_bat' ? '🏏 Batting XI Banner is live on OBS'
                                                    : activeBanner === 'playingXI_bowl' ? '🎳 Bowling XI Banner is live on OBS'
                                                        : '📊 Score Overlay is live on OBS'}
                                    </p>
                                    <p className="text-xs text-gray-400">{activeBanner !== 'none' ? 'Displaying in your OBS browser source' : 'Click any banner below to show it'}</p>
                                </div>
                            </div>
                            {activeBanner !== 'none' && (
                                <button onClick={() => handleBanner('none')} disabled={!iAmStreaming || bannerBusy}
                                    className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold text-red-600 bg-white border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40">
                                    <i className="ri-close-line" />Clear
                                </button>
                            )}
                        </div>

                        {/* No subscription warning */}
                        {!hasAccess && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
                                <i className="ri-information-line text-amber-500 text-xl flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-amber-800 text-sm">You can stream without overlays</p>
                                    <p className="text-xs text-amber-700 mt-0.5">Banners and overlays require a Cricshub subscription. <Link href="/pricing" className="font-bold underline">View plans →</Link></p>
                                </div>
                            </div>
                        )}

                        {/* Tab switcher */}
                        <div className="flex items-center gap-1 bg-white border border-gray-100 shadow-sm p-1.5 rounded-full w-fit">
                            {[
                                { key: 'banners', icon: 'ri-layout-top-2-line', label: 'Banners & Overlays' },
                                { key: 'score', icon: 'ri-bar-chart-line', label: 'Score Overlay' },
                            ].map(tab => (
                                <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                                    className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all duration-300
                    ${activeTab === tab.key ? 'bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white shadow-md' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}>
                                    <i className={`${tab.icon} text-base`} />{tab.label}
                                </button>
                            ))}
                        </div>

                        {/* ── BANNERS TAB ── */}
                        {activeTab === 'banners' && (
                            <div className="space-y-6">
                                {/* Included with subscription */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center"><i className="ri-gift-line text-[#34B8FF] text-sm" /></div>
                                        <p className="font-black text-gray-900">Included Banners</p>
                                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">With subscription</span>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <BannerCard
                                            icon="ri-layout-top-2-line" title="Main Match Banner"
                                            desc="Full match info — tournament, teams, venue, date, toss result. Perfect for opening a broadcast."
                                            active={activeBanner === 'main'} canUse={hasAccess} locked={!iAmStreaming}
                                            lockedReason={!hasAccess ? 'Subscription required' : 'Start streaming first'}
                                            onToggle={() => handleBanner('main')}
                                            previewBg="linear-gradient(135deg,#34B8FF,#1E88E5)"
                                        />
                                        <BannerCard
                                            icon="ri-group-line" title="Batting XI Banner"
                                            desc="Full batting lineup with live runs, balls faced, and dismissal info per player."
                                            active={activeBanner === 'playingXI_bat'} canUse={hasAccess} locked={!iAmStreaming}
                                            lockedReason={!hasAccess ? 'Subscription required' : 'Start streaming first'}
                                            onToggle={() => handleBanner('playingXI_bat')}
                                            previewBg="linear-gradient(135deg,#00b4d8,#0077b6)"
                                        />
                                        <BannerCard
                                            icon="ri-group-2-line" title="Bowling XI Banner"
                                            desc="Bowling lineup with overs, wickets, runs conceded and economy rate per bowler."
                                            active={activeBanner === 'playingXI_bowl'} canUse={hasAccess} locked={!iAmStreaming}
                                            lockedReason={!hasAccess ? 'Subscription required' : 'Start streaming first'}
                                            onToggle={() => handleBanner('playingXI_bowl')}
                                            previewBg="linear-gradient(135deg,#8E54E9,#4776E6)"
                                        />
                                    </div>
                                </div>

                                {/* Premium add-on templates */}
                                <div>
                                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center"><i className="ri-vip-crown-line text-amber-600 text-sm" /></div>
                                            <p className="font-black text-gray-900">Premium Add-on Templates</p>
                                            <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-bold">Per match purchase</span>
                                        </div>
                                        <Link href="/pricing" className="text-xs text-[#34B8FF] font-bold hover:underline flex items-center gap-1">
                                            Browse all <i className="ri-arrow-right-line" />
                                        </Link>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {[
                                            { id: 'tpl-b1', name: 'Classic Blue Overlay', tier: 'basic', preview: 'linear-gradient(135deg,#34B8FF,#1E88E5)', desc: 'Clean scoreboard with animated score updates and team logos.' },
                                            { id: 'tpl-p1', name: 'Neon Arena Overlay', tier: 'pro', preview: 'linear-gradient(135deg,#00F5A0,#00D9F5)', desc: 'Pro neon overlay with full stats panel and sponsor slot.' },
                                            { id: 'tpl-e1', name: 'Diamond Premium', tier: 'elite', preview: 'linear-gradient(135deg,#8E54E9,#4776E6)', desc: 'Elite full-screen overlay, custom branding, watermark-free.' },
                                        ].map(tpl => {
                                            const owned = subscription?.ownedTemplateIds.includes(tpl.id) ?? false;
                                            return (
                                                <div key={tpl.id} className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 ${owned ? 'border-gray-200 hover:border-blue-200 hover:shadow-md' : 'border-gray-100 opacity-70'}`}>
                                                    <div className="h-14 w-full" style={{ background: tpl.preview }} />
                                                    <div className="p-4 bg-white">
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <div>
                                                                <p className="font-bold text-gray-900 text-sm">{tpl.name}</p>
                                                                <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded-full ${tpl.tier === 'elite' ? 'bg-purple-100 text-purple-700 border-purple-200' : tpl.tier === 'pro' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-sky-100 text-sky-700 border-sky-200'}`}>
                                                                    {tpl.tier.toUpperCase()}
                                                                </span>
                                                            </div>
                                                            {owned
                                                                ? <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex-shrink-0">✓ Owned</span>
                                                                : <Link href="/pricing" className="text-[10px] font-bold text-[#34B8FF] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full flex-shrink-0 hover:bg-blue-100">Buy</Link>
                                                            }
                                                        </div>
                                                        <p className="text-xs text-gray-400 mb-3">{tpl.desc}</p>
                                                        <button disabled={!owned || !iAmStreaming}
                                                            className="w-full py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white hover:shadow-md hover:shadow-blue-200">
                                                            {!owned ? '🔒 Purchase to activate' : !iAmStreaming ? 'Start streaming first' : 'Activate Overlay'}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div className="rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-6 text-center gap-2 min-h-[160px]">
                                            <i className="ri-add-circle-line text-gray-300 text-3xl" />
                                            <p className="text-sm font-bold text-gray-400">More templates</p>
                                            <Link href="/pricing" className="text-xs text-[#34B8FF] font-semibold hover:underline">Browse all →</Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── SCORE OVERLAY TAB ── */}
                        {activeTab === 'score' && (
                            <div className="space-y-5">
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                    <div className="flex items-start justify-between mb-5">
                                        <div>
                                            <h3 className="font-black text-gray-900 text-lg">Live Score Overlay</h3>
                                            <p className="text-sm text-gray-400 mt-1">A persistent bottom-of-screen scoreboard that updates ball by ball automatically. Stays on screen throughout your broadcast.</p>
                                        </div>
                                        {activeBanner === 'score' && (
                                            <span className="flex items-center gap-1.5 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex-shrink-0 ml-3">
                                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping inline-block" />ON AIR
                                            </span>
                                        )}
                                    </div>

                                    {/* Preview mockup */}
                                    {matchState && (
                                        <div className="rounded-xl overflow-hidden bg-gray-900 p-4 mb-5">
                                            <p className="text-[10px] text-gray-500 mb-3 uppercase tracking-wider font-semibold">OBS Preview</p>
                                            <div className="rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,46,82,0.95))', border: '1px solid rgba(52,184,255,0.3)' }}>
                                                <div className="h-0.5 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5]" />
                                                <div className="flex items-stretch px-4 py-3 gap-4">
                                                    {/* Score */}
                                                    {(() => {
                                                        const bat = getBattingTeam(matchState);
                                                        const bowl = getBowlingTeam(matchState);
                                                        const crr = bat.overs > 0 ? (bat.score / bat.overs).toFixed(2) : '0.00';
                                                        return (
                                                            <>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#34B8FF] to-[#1E88E5] flex items-center justify-center text-white font-black text-[10px]">{initials(bat.name)}</div>
                                                                    <div>
                                                                        <p className="text-white/60 text-[9px] uppercase tracking-wider">{bat.name}</p>
                                                                        <p className="text-white font-black text-xl leading-none">{bat.score}/{bat.wickets}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="border-l border-white/10 pl-4 flex flex-col justify-center">
                                                                    <p className="text-[9px] text-white/40 uppercase tracking-wider">CRR</p>
                                                                    <p className="text-[#34B8FF] font-black text-base">{crr}</p>
                                                                </div>
                                                                <div className="border-l border-white/10 pl-4 flex flex-col justify-center gap-0.5">
                                                                    <p className="text-[9px] text-white/40 uppercase tracking-wider mb-1">This over</p>
                                                                    <div className="flex gap-1">
                                                                        {(matchState.currentOverBalls ?? []).slice(-5).map((b, i) => (
                                                                            <span key={i} style={{ background: b === 'W' ? '#ef4444' : b === '4' ? '#3b82f6' : b === '6' ? '#8b5cf6' : b === '0' ? 'rgba(255,255,255,0.15)' : '#22c55e' }}
                                                                                className="w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center text-white">{b}</span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        {activeBanner === 'score' ? (
                                            <button onClick={() => handleBanner('score')} disabled={!iAmStreaming || bannerBusy}
                                                className="flex-1 py-3 rounded-xl bg-red-50 text-red-500 border border-red-200 font-bold text-sm hover:bg-red-100 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                                                <i className="ri-stop-circle-line text-base" />Hide Score Overlay
                                            </button>
                                        ) : (
                                            <button onClick={() => handleBanner('score')} disabled={!iAmStreaming || !hasAccess || bannerBusy}
                                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white font-bold text-sm hover:shadow-lg hover:shadow-blue-200 transition-all disabled:opacity-40 flex items-center justify-center gap-2 hover:scale-[1.01]">
                                                {bannerBusy ? <><i className="ri-loader-4-line animate-spin" />Updating…</> : <><i className="ri-play-circle-line text-base" />Show Score Overlay</>}
                                            </button>
                                        )}
                                    </div>

                                    {(!iAmStreaming || !hasAccess) && (
                                        <p className="text-xs text-center text-gray-400 mt-2">
                                            {!hasAccess ? <>Subscription required · <Link href="/pricing" className="text-[#34B8FF] font-semibold hover:underline">Upgrade</Link></> : 'Click "Start Streaming" first'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet" />
        </div>
    );
}