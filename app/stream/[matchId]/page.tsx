'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface PlayerDetails { playerId: string; name: string; }
interface PlayerStats { playerId: string; name: string; runs: number; ballsFaced: number; fours: number; sixes: number; strikeRate: number; wicketDetails: { dismissalType: string } | null; overs: number; ballsBowled: number; runsConceded: number; wicketsTaken: number; economyRate: number; }
interface TeamDetails { name: string; logoUrl: string | null; playingXI: PlayerStats[]; score: number; wickets: number; overs: number; extras: { wide: number; noBall: number; bye: number; legBye: number; penalty: number } | null; }
interface MatchState { matchId: string; team1: TeamDetails; team2: TeamDetails; tossWinner: string; choice: string; isFirstInnings: boolean; completedOvers: number; totalOvers: number; matchComplete: boolean; winner: string | null; battingFirst: TeamDetails | null; currentStriker: PlayerDetails | null; currentNonStriker: PlayerDetails | null; currentBowler: PlayerDetails | null; currentOverBalls: string[]; }
interface MatchInfo { id: string; venue: string; matchDate: string; matchTime: string; stage: string | null; status: string; overs: number; tournamentName: string | null; team1: { id: string; name: string; logoPath: string | null }; team2: { id: string; name: string; logoPath: string | null }; creatorId: string; matchOps: string[]; }
interface StreamSession { isLocked: boolean; lockedByUserId: string | null; lockedByName: string | null; }

export type BannerType = 'none' | 'main' | 'playingXI_bat' | 'playingXI_bowl' | 'score';
type MatchRole = 'admin' | 'operator';

interface MatchSubscription {
    // Admin's subscription + purchased add-ons for this specific match
    adminHasSubscription: boolean;
    purchasedTemplateIds: string[];  // add-on template IDs the admin bought for this match
}

interface AddOnTemplate {
    id: string; name: string; tier: 'pro' | 'elite';
    price: number; previewGradient: string;
    features: string[];
}

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
        // These come from MatchResponse.creatorName.id and matchOps
        creatorId: 'mock-uuid',   // TODO: map from match.creatorName.id
        matchOps: ['mock-uuid', 'op-uuid-2'],
    };
}

async function fetchMatchState(matchId: string): Promise<MatchState> {
    // TODO: GET /api/v1/matches/matchstate/{matchId}
    await new Promise(r => setTimeout(r, 300));
    const xi = (pfx: string): PlayerStats[] => Array.from({ length: 11 }, (_, i) => ({
        playerId: `${pfx}${i}`, name: `Player ${i + 1}`,
        runs: 20 + i * 9, ballsFaced: 18 + i * 6, fours: i % 4, sixes: i % 2, strikeRate: 110 + i * 5,
        wicketDetails: i < 4 ? { dismissalType: ['Bowled', 'Caught', 'LBW', 'Run Out'][i] } : null,
        overs: i < 5 ? i + 1 : 0, ballsBowled: i < 5 ? (i + 1) * 6 : 0,
        runsConceded: i < 5 ? (i + 1) * 9 : 0, wicketsTaken: i < 5 ? i % 3 : 0, economyRate: i < 5 ? 7.5 : 0,
    }));
    const t1: TeamDetails = { name: 'Mumbai XI', logoUrl: null, playingXI: xi('mum'), score: 148, wickets: 5, overs: 20, extras: { wide: 4, noBall: 1, bye: 2, legBye: 1, penalty: 0 } };
    const t2: TeamDetails = { name: 'Delhi Strikers', logoUrl: null, playingXI: xi('del'), score: 132, wickets: 7, overs: 18.2, extras: { wide: 3, noBall: 0, bye: 1, legBye: 2, penalty: 0 } };
    return {
        matchId, team1: t1, team2: t2,
        tossWinner: 'Mumbai XI', choice: 'Bat',
        isFirstInnings: false, completedOvers: 18, totalOvers: 20,
        matchComplete: false, winner: null,
        battingFirst: t1,
        currentStriker: { playerId: 'del4', name: 'Player 5' },
        currentNonStriker: { playerId: 'del5', name: 'Player 6' },
        currentBowler: { playerId: 'mum7', name: 'Player 8' },
        currentOverBalls: ['1', '0', 'W', '4', '2'],
    };
}

async function fetchStreamSession(matchId: string): Promise<StreamSession> {
    // TODO: GET /api/v1/stream/{matchId}/session
    await new Promise(r => setTimeout(r, 200));
    return { isLocked: false, lockedByUserId: null, lockedByName: null };
}

async function fetchMatchSubscription(matchId: string): Promise<MatchSubscription> {
    // TODO: GET /api/v1/stream/{matchId}/subscription
    // Returns the admin's subscription status + which add-on templates they've purchased for THIS match.
    // Both admin and operators call this — operators use it to see what's available to activate.
    await new Promise(r => setTimeout(r, 250));
    return { adminHasSubscription: true, purchasedTemplateIds: ['tpl-pro-1'] };
}

async function claimStreamLock(matchId: string, userId: string): Promise<{ success: boolean }> {
    // TODO: POST /api/v1/stream/{matchId}/claim  body: { userId }
    console.log('[PLACEHOLDER] claimStreamLock', { matchId, userId });
    await new Promise(r => setTimeout(r, 400));
    return { success: true };
}

async function releaseStreamLock(matchId: string, userId: string): Promise<void> {
    // TODO: POST /api/v1/stream/{matchId}/release  body: { userId }
    console.log('[PLACEHOLDER] releaseStreamLock', { matchId, userId });
}

async function pushActiveBanner(matchId: string, banner: BannerType, templateId: string | null): Promise<void> {
    // TODO: POST /api/v1/stream/{matchId}/banner  body: { banner, templateId }
    console.log('[PLACEHOLDER] pushActiveBanner', { matchId, banner, templateId });
    await new Promise(r => setTimeout(r, 150));
}

// ═══════════════════════════════════════════════════════════
// STATIC DATA
// ═══════════════════════════════════════════════════════════

const ADDON_TEMPLATES: AddOnTemplate[] = [
    { id: 'tpl-pro-1', name: 'Neon Arena', tier: 'pro', price: 99, previewGradient: 'linear-gradient(135deg,#00F5A0,#00D9F5)', features: ['Animated score transitions', 'Sponsor banner slot', 'Neon glow effects'] },
    { id: 'tpl-pro-2', name: 'Amber League', tier: 'pro', price: 129, previewGradient: 'linear-gradient(135deg,#F7971E,#FFD200)', features: ['Gold gradient design', 'Animated wicket flash', 'Watermark-free'] },
    { id: 'tpl-elite-1', name: 'Diamond Premium', tier: 'elite', price: 199, previewGradient: 'linear-gradient(135deg,#8E54E9,#4776E6)', features: ['Full stats dashboard', 'Wagon wheel', 'Custom branding', 'Priority render'] },
    { id: 'tpl-elite-2', name: 'Crimson Grand', tier: 'elite', price: 249, previewGradient: 'linear-gradient(135deg,#FF416C,#FF4B2B)', features: ['Cinematic red theme', 'MOTM highlight card', 'Custom branding'] },
];

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

const fmt12 = (t: string) => { if (!t) return ''; const [h, m] = t.split(':'); const hr = parseInt(h); return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`; };
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const ballBg = (b: string) => b === 'W' ? 'bg-red-500 text-white' : b === '4' ? 'bg-blue-500 text-white' : b === '6' ? 'bg-purple-500 text-white' : b === '0' ? 'bg-gray-100 text-gray-500' : 'bg-emerald-500 text-white';
const getBatTeam = (s: MatchState): TeamDetails => { if (!s.battingFirst) return s.team1; return s.isFirstInnings ? (s.battingFirst.name === s.team1.name ? s.team1 : s.team2) : (s.battingFirst.name === s.team1.name ? s.team2 : s.team1); };
const getBowlTeam = (s: MatchState): TeamDetails => { const bat = getBatTeam(s); return bat.name === s.team1.name ? s.team2 : s.team1; };

// ═══════════════════════════════════════════════════════════
// SCORE LIVE MINI
// ═══════════════════════════════════════════════════════════

function ScoreLive({ state }: { state: MatchState }) {
    const bat = getBatTeam(state);
    const bowl = getBowlTeam(state);
    const crr = bat.overs > 0 ? (bat.score / bat.overs).toFixed(2) : '—';
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Score</p>
                <span className="flex items-center gap-1.5 text-[10px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />LIVE
                </span>
            </div>
            <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-900 text-sm">{bat.name}</p>
                    <p className="font-black text-2xl text-[#1E88E5]">{bat.score}/{bat.wickets}</p>
                </div>
                <p className="text-xs text-gray-400">{bat.overs} ov · CRR {crr}</p>
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
                {(state.currentStriker || state.currentNonStriker) && (
                    <div className="space-y-1 pt-2 border-t border-gray-50">
                        {[state.currentStriker, state.currentNonStriker].filter(Boolean).map((p, i) => {
                            const stats = bat.playingXI.find(ps => ps.playerId === p?.playerId);
                            return (
                                <div key={i} className="flex items-center justify-between text-xs">
                                    <span className="text-gray-700 font-semibold">{i === 0 ? '🏏 ' : ''}{p?.name}</span>
                                    {stats && <span className="text-gray-500 font-mono">{stats.runs}({stats.ballsFaced})</span>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// BANNER CARD — used by both admin and operator views
// ═══════════════════════════════════════════════════════════

function BannerCard({ icon, title, desc, active, canActivate, lockedReason, onToggle, previewBg, badge }: {
    icon: string; title: string; desc: string;
    active: boolean; canActivate: boolean; lockedReason?: string;
    onToggle: () => void; previewBg?: string; badge?: string;
}) {
    return (
        <div
            onClick={() => canActivate && onToggle()}
            className={`relative rounded-2xl border-2 overflow-hidden transition-all duration-300 select-none
        ${active ? 'border-[#34B8FF] shadow-xl shadow-blue-100 bg-blue-50 cursor-pointer' : ''}
        ${!active && canActivate ? 'border-gray-100 bg-white cursor-pointer hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5' : ''}
        ${!canActivate ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed' : ''}
      `}
        >
            {active && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#34B8FF] via-blue-300 to-[#34B8FF] animate-pulse" />}
            {previewBg && (
                <div className="h-10 w-full relative" style={{ background: previewBg }}>
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
                        <div className="flex items-center gap-2">
                            <p className={`font-bold text-sm ${active ? 'text-[#1E88E5]' : 'text-gray-900'}`}>{title}</p>
                            {badge && <span className="text-[9px] font-black bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">{badge}</span>}
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed mt-0.5">{desc}</p>
                    </div>
                </div>
                {!canActivate ? (
                    <div className="w-full py-2 rounded-xl bg-gray-100 text-gray-400 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                        <i className="ri-lock-line" />{lockedReason ?? 'Unavailable'}
                    </div>
                ) : active ? (
                    <div className="w-full py-2 rounded-xl bg-red-50 text-red-500 border border-red-200 text-xs font-bold text-center">
                        <i className="ri-stop-circle-line mr-1.5" />Hide Banner
                    </div>
                ) : (
                    <div className="w-full py-2 rounded-xl bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white text-xs font-bold text-center">
                        <i className="ri-play-circle-line mr-1.5" />Show Banner
                    </div>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// ADMIN: TEMPLATE ADD-ON CARD (shows buy or activate)
// ═══════════════════════════════════════════════════════════

function AdminTemplateCard({ tpl, owned, active, canActivate, onActivate, onBuy }: {
    tpl: AddOnTemplate; owned: boolean; active: boolean; canActivate: boolean;
    onActivate: () => void; onBuy: () => void;
}) {
    return (
        <div className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 ${active ? 'border-[#34B8FF] shadow-xl shadow-blue-100' : owned ? 'border-gray-200 hover:border-blue-200 hover:shadow-md' : 'border-gray-100 opacity-80'}`}>
            <div className="h-14 w-full relative" style={{ background: tpl.previewGradient }}>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-black/25 backdrop-blur-sm text-white text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full">OBS Overlay</span>
                </div>
                {active && (
                    <div className="absolute top-1.5 left-2 flex items-center gap-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                        <span className="w-1 h-1 rounded-full bg-white animate-pulse" />ON AIR
                    </div>
                )}
            </div>
            <div className="p-4 bg-white">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                        <p className="font-black text-gray-900 text-sm">{tpl.name}</p>
                        <span className={`text-[9px] font-black border px-2 py-0.5 rounded-full inline-block mt-0.5 ${tpl.tier === 'elite' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                            {tpl.tier.toUpperCase()}
                        </span>
                    </div>
                    {owned
                        ? <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex-shrink-0">✓ Owned</span>
                        : <span className="text-sm font-black text-gray-900 flex-shrink-0">₹{tpl.price}</span>
                    }
                </div>
                <ul className="space-y-0.5 mb-3">
                    {tpl.features.slice(0, 3).map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                            <i className="ri-check-line text-[#34B8FF] flex-shrink-0" />{f}
                        </li>
                    ))}
                </ul>
                {owned ? (
                    <button onClick={onActivate} disabled={!canActivate}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed
              ${active ? 'bg-red-50 text-red-500 border border-red-200' : 'bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white hover:shadow-md'}`}>
                        {active ? 'Hide Overlay' : !canActivate ? 'Start streaming first' : 'Activate Overlay'}
                    </button>
                ) : (
                    <button onClick={onBuy}
                        className="w-full py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-white hover:shadow-md transition-all flex items-center justify-center gap-1.5">
                        <i className="ri-vip-crown-line" />Buy for this match — ₹{tpl.price}
                    </button>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// OPERATOR: TEMPLATE CARD (activate only, no buy)
// ═══════════════════════════════════════════════════════════

function OperatorTemplateCard({ tpl, active, canActivate, onActivate }: {
    tpl: AddOnTemplate; active: boolean; canActivate: boolean; onActivate: () => void;
}) {
    return (
        <div className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 ${active ? 'border-[#34B8FF] shadow-xl shadow-blue-100' : 'border-gray-200 hover:border-blue-200 hover:shadow-md'}`}>
            <div className="h-14 w-full relative" style={{ background: tpl.previewGradient }}>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-black/25 text-white text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full backdrop-blur-sm">OBS Overlay</span>
                </div>
                {active && (
                    <div className="absolute top-1.5 left-2 flex items-center gap-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                        <span className="w-1 h-1 rounded-full bg-white animate-pulse" />ON AIR
                    </div>
                )}
            </div>
            <div className="p-4 bg-white">
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div>
                        <p className="font-black text-gray-900 text-sm">{tpl.name}</p>
                        <span className={`text-[9px] font-black border px-2 py-0.5 rounded-full inline-block mt-0.5 ${tpl.tier === 'elite' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                            {tpl.tier.toUpperCase()}
                        </span>
                    </div>
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">✓ Available</span>
                </div>
                <button onClick={onActivate} disabled={!canActivate}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-2
            ${active ? 'bg-red-50 text-red-500 border border-red-200' : 'bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white hover:shadow-md'}`}>
                    {active ? 'Hide Overlay' : !canActivate ? 'Start streaming first' : 'Activate Overlay'}
                </button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// STREAM CONTROL PANEL (shared)
// ═══════════════════════════════════════════════════════════

function StreamControlPanel({ session, streaming, claimBusy, canStream, lockedReason, onClaim, onRelease, obsUrl, copied, onCopy }: {
    session: StreamSession; streaming: boolean; claimBusy: boolean;
    canStream: boolean; lockedReason?: string;
    onClaim: () => void; onRelease: () => void;
    obsUrl: string; copied: boolean; onCopy: () => void;
}) {
    const lockedByOther = session.isLocked && !streaming;
    return (
        <div className="space-y-4">
            {/* Stream state */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Stream Control</p>

                {!canStream ? (
                    <div className="text-center py-3">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-3">
                            <i className="ri-vip-crown-line text-amber-500 text-2xl" />
                        </div>
                        <p className="font-bold text-gray-900 text-sm mb-1">Streaming dashboard locked</p>
                        <p className="text-xs text-gray-400 mb-4 leading-relaxed">{lockedReason}</p>
                        <Link href="/pricing" className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:shadow-md transition-all">
                            <i className="ri-vip-crown-line" />View Plans
                        </Link>
                    </div>
                ) : lockedByOther ? (
                    <div className="text-center py-2">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-3">
                            <i className="ri-lock-2-line text-amber-500 text-2xl" />
                        </div>
                        <p className="font-bold text-gray-900 text-sm mb-1">Stream is active</p>
                        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                            <strong>{session.lockedByName}</strong> is currently streaming. They must release the stream first.
                        </p>
                        <button className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5">
                            <i className="ri-refresh-line" />Refresh Status
                        </button>
                    </div>
                ) : !streaming ? (
                    <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 space-y-1">
                            <p className="font-bold">Before you start:</p>
                            <p>① Copy the OBS URL below & add as Browser Source</p>
                            <p>② Click "Start Streaming" to take control</p>
                        </div>
                        <button onClick={onClaim} disabled={claimBusy}
                            className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 text-white font-black rounded-xl hover:shadow-lg hover:shadow-red-200 disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                            {claimBusy ? <><i className="ri-loader-4-line animate-spin" />Claiming…</> : <><i className="ri-live-line" />Start Streaming</>}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping flex-shrink-0" />
                            <div>
                                <p className="text-red-700 text-sm font-bold">You are live</p>
                                <p className="text-red-500 text-xs">OBS is capturing your overlay</p>
                            </div>
                        </div>
                        <button onClick={onRelease}
                            className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-red-50 hover:text-red-600 transition-all border border-gray-200 flex items-center justify-center gap-1.5">
                            <i className="ri-stop-circle-line" />Release Stream
                        </button>
                    </div>
                )}
            </div>

            {/* OBS URL */}
            {canStream && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">OBS Browser Source URL</p>
                        <Link href={obsUrl} target="_blank" className="text-[10px] text-[#34B8FF] font-semibold hover:underline">
                            Preview <i className="ri-external-link-line" />
                        </Link>
                    </div>
                    <div className="flex gap-2 mb-2">
                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-500 font-mono truncate">{obsUrl}</div>
                        <button onClick={onCopy}
                            className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-[#34B8FF]/10 text-[#1E88E5] border border-[#34B8FF]/20 hover:bg-[#34B8FF]/20'}`}>
                            {copied ? <><i className="ri-check-line" /> Copied!</> : <><i className="ri-clipboard-line" /> Copy</>}
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                        OBS → Add Source → Browser → paste URL → 1920×1080 → ✅ Allow transparency
                    </p>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export default function StreamDashboard() {
    const params = useParams();
    const matchId = params?.matchId as string;

    const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
    const [matchState, setMatchState] = useState<MatchState | null>(null);
    const [session, setSession] = useState<StreamSession>({ isLocked: false, lockedByUserId: null, lockedByName: null });
    const [matchSub, setMatchSub] = useState<MatchSubscription | null>(null);
    const [activeBanner, setActiveBanner] = useState<BannerType>('none');
    const [streaming, setStreaming] = useState(false);
    const [loading, setLoading] = useState(true);
    const [claimBusy, setClaimBusy] = useState(false);
    const [bannerBusy, setBannerBusy] = useState(false);
    const [copied, setCopied] = useState(false);
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    // Auth — replace with real session
    const currentUser = {
        id: (typeof window !== 'undefined' ? localStorage.getItem('userUUID') : null) ?? 'mock-uuid',
        name: (typeof window !== 'undefined' ? localStorage.getItem('userName') : null) ?? 'Demo User',
    };
    const obsUrl = typeof window !== 'undefined' ? `${window.location.origin}/obs/${matchId}` : `/obs/${matchId}`;

    // Derive role once matchInfo loaded
    const matchRole: MatchRole | null = matchInfo
        ? (matchInfo.creatorId === currentUser.id ? 'admin' : 'operator')
        : null;

    const isAdmin = matchRole === 'admin';
    const isOperator = matchRole === 'operator';
    const iAmStreaming = streaming && session.lockedByUserId === currentUser.id;

    // Admin can stream if admin has subscription
    // Operator can stream regardless (they just use what's available)
    const canStream = isAdmin
        ? (matchSub?.adminHasSubscription ?? false)
        : (matchSub?.adminHasSubscription ?? false); // Operator also needs admin to have subscribed

    const streamLockReason = isAdmin
        ? 'Subscribe to unlock the streaming dashboard for your matches.'
        : 'The match admin needs an active subscription to enable streaming.';

    // Initial load
    useEffect(() => {
        if (!matchId) return;
        Promise.all([
            fetchMatchInfo(matchId),
            fetchMatchState(matchId),
            fetchStreamSession(matchId),
            fetchMatchSubscription(matchId),
        ]).then(([info, state, sess, sub]) => {
            setMatchInfo(info); setMatchState(state); setSession(sess); setMatchSub(sub);
            if (sess.isLocked && sess.lockedByUserId === currentUser.id) setStreaming(true);
            setLoading(false);
        });
    }, [matchId]);

    // Poll match state every 4s
    useEffect(() => {
        if (!matchId) return;
        pollRef.current = setInterval(async () => {
            // TODO: Replace with WebSocket /topic/match/{matchId}
            const s = await fetchMatchState(matchId);
            setMatchState(s);
        }, 4000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [matchId]);

    const handleClaim = async () => {
        setClaimBusy(true);
        const result = await claimStreamLock(matchId, currentUser.id);
        if (result.success) {
            setSession({ isLocked: true, lockedByUserId: currentUser.id, lockedByName: currentUser.name });
            setStreaming(true);
        } else {
            alert('Could not claim stream — another operator may have just taken it.');
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

    const handleBuyTemplate = (tpl: AddOnTemplate) => {
        // TODO: Add to cart and redirect to pricing/checkout
        // Or open an in-page purchase modal
        window.location.href = `/pricing?addon=${tpl.id}&matchId=${matchId}`;
    };

    const copyObs = () => { navigator.clipboard.writeText(obsUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };

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

    const purchasedTemplates = ADDON_TEMPLATES.filter(t => matchSub?.purchasedTemplateIds.includes(t.id));

    return (
        <div className="min-h-screen bg-[#F8F9FA]">

            {/* Navbar */}
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
                        {/* Role badge */}
                        {matchRole && (
                            matchRole === 'admin' ? (
                                <span className="flex items-center gap-1.5 bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold px-3 py-1.5 rounded-full">
                                    <i className="ri-shield-star-line" />Match Admin
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 bg-blue-50 text-[#1E88E5] border border-blue-200 text-xs font-bold px-3 py-1.5 rounded-full">
                                    <i className="ri-user-settings-line" />Operator
                                </span>
                            )
                        )}
                        {/* Stream status */}
                        {iAmStreaming ? (
                            <span className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping inline-block" />STREAMING
                            </span>
                        ) : session.isLocked && !iAmStreaming ? (
                            <span className="flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-200">
                                <i className="ri-lock-line" />Locked · {session.lockedByName}
                            </span>
                        ) : null}
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-6 py-8 max-w-7xl">
                <div className="grid lg:grid-cols-[320px_1fr] gap-6">

                    {/* ══ LEFT SIDEBAR ══ */}
                    <div className="space-y-5">

                        {/* Match info */}
                        {matchInfo && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] px-5 pt-5 pb-4">
                                    {matchInfo.tournamentName && <p className="text-white/70 text-xs font-semibold mb-1">{matchInfo.tournamentName}</p>}
                                    <h1 className="text-white font-black text-base leading-snug">
                                        {matchInfo.team1.name} <span className="text-white/50 font-normal text-sm">vs</span> {matchInfo.team2.name}
                                    </h1>
                                    {matchInfo.stage && <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 inline-block uppercase">{matchInfo.stage}</span>}
                                </div>
                                <div className="px-5 py-4 space-y-2 text-sm text-gray-600">
                                    {[
                                        { icon: 'ri-map-pin-line', text: matchInfo.venue },
                                        { icon: 'ri-calendar-line', text: fmtDate(matchInfo.matchDate) },
                                        { icon: 'ri-time-line', text: `${fmt12(matchInfo.matchTime)} · ${matchInfo.overs} overs` },
                                    ].map((r, i) => (
                                        <div key={i} className="flex items-center gap-2.5">
                                            <i className={`${r.icon} text-[#34B8FF] flex-shrink-0`} /><span className="truncate">{r.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stream control */}
                        <StreamControlPanel
                            session={session} streaming={iAmStreaming} claimBusy={claimBusy}
                            canStream={canStream} lockedReason={streamLockReason}
                            onClaim={handleClaim} onRelease={handleRelease}
                            obsUrl={obsUrl} copied={copied} onCopy={copyObs}
                        />

                        {/* Live score */}
                        {matchState && <ScoreLive state={matchState} />}
                    </div>

                    {/* ══ MAIN PANEL ══ */}
                    <div className="space-y-6">

                        {/* Active banner status */}
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
                                    <p className="text-xs text-gray-400">{activeBanner !== 'none' ? 'Displaying in your OBS browser source' : 'Select a banner below to show it'}</p>
                                </div>
                            </div>
                            {activeBanner !== 'none' && (
                                <button onClick={() => handleBanner('none')} disabled={!iAmStreaming || bannerBusy}
                                    className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold text-red-600 bg-white border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40">
                                    <i className="ri-close-line" />Clear
                                </button>
                            )}
                        </div>

                        {/* ═══════════════════════════════════════════════
                ADMIN VIEW
            ═══════════════════════════════════════════════ */}
                        {isAdmin && (
                            <div className="space-y-6">

                                {/* Admin: no subscription warning */}
                                {!matchSub?.adminHasSubscription && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
                                        <i className="ri-information-line text-amber-500 text-xl flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="font-bold text-amber-800 text-sm">Subscribe to unlock all streaming features</p>
                                            <p className="text-xs text-amber-700 mt-0.5 mb-3">As the match admin, you need an active subscription to use the streaming dashboard. Operators assigned to your match will also gain access.</p>
                                            <Link href="/pricing" className="inline-flex items-center gap-2 bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-amber-600 transition-colors">
                                                <i className="ri-vip-crown-line" />View Plans
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                {/* Included banners */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center"><i className="ri-gift-line text-[#34B8FF] text-sm" /></div>
                                        <p className="font-black text-gray-900">Included Banners</p>
                                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">With subscription</span>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <BannerCard icon="ri-layout-top-2-line" title="Main Match Banner"
                                            desc="Tournament, teams, venue, date and toss result." active={activeBanner === 'main'}
                                            canActivate={iAmStreaming && (matchSub?.adminHasSubscription ?? false)}
                                            lockedReason={!matchSub?.adminHasSubscription ? 'Subscription required' : 'Start streaming first'}
                                            onToggle={() => handleBanner('main')} previewBg="linear-gradient(135deg,#34B8FF,#1E88E5)" />
                                        <BannerCard icon="ri-group-line" title="Batting XI Banner"
                                            desc="Full batting lineup with live runs and dismissal info." active={activeBanner === 'playingXI_bat'}
                                            canActivate={iAmStreaming && (matchSub?.adminHasSubscription ?? false)}
                                            lockedReason={!matchSub?.adminHasSubscription ? 'Subscription required' : 'Start streaming first'}
                                            onToggle={() => handleBanner('playingXI_bat')} previewBg="linear-gradient(135deg,#00b4d8,#0077b6)" />
                                        <BannerCard icon="ri-group-2-line" title="Bowling XI Banner"
                                            desc="Bowling lineup with overs, wickets and economy." active={activeBanner === 'playingXI_bowl'}
                                            canActivate={iAmStreaming && (matchSub?.adminHasSubscription ?? false)}
                                            lockedReason={!matchSub?.adminHasSubscription ? 'Subscription required' : 'Start streaming first'}
                                            onToggle={() => handleBanner('playingXI_bowl')} previewBg="linear-gradient(135deg,#8E54E9,#4776E6)" />
                                        <BannerCard icon="ri-bar-chart-line" title="Live Score Overlay"
                                            desc="Persistent bottom score bar, updates ball by ball." active={activeBanner === 'score'}
                                            canActivate={iAmStreaming && (matchSub?.adminHasSubscription ?? false)}
                                            lockedReason={!matchSub?.adminHasSubscription ? 'Subscription required' : 'Start streaming first'}
                                            onToggle={() => handleBanner('score')} previewBg="linear-gradient(135deg,#0a1628,#1E88E5)" />
                                    </div>
                                </div>

                                {/* Admin: Premium add-on templates — buy + activate */}
                                <div>
                                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center"><i className="ri-vip-crown-line text-amber-600 text-sm" /></div>
                                            <p className="font-black text-gray-900">Premium Add-ons</p>
                                            <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-bold">Per match purchase</span>
                                        </div>
                                        <Link href="/pricing" className="text-xs text-[#34B8FF] font-bold hover:underline flex items-center gap-1">Browse all <i className="ri-arrow-right-line" /></Link>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {ADDON_TEMPLATES.map(tpl => (
                                            <AdminTemplateCard key={tpl.id} tpl={tpl}
                                                owned={matchSub?.purchasedTemplateIds.includes(tpl.id) ?? false}
                                                active={activeBanner === tpl.id as any}
                                                canActivate={iAmStreaming}
                                                onActivate={() => handleBanner(tpl.id as any)}
                                                onBuy={() => handleBuyTemplate(tpl)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ═══════════════════════════════════════════════
                OPERATOR VIEW — clean, no buying
            ═══════════════════════════════════════════════ */}
                        {isOperator && (
                            <div className="space-y-6">

                                {/* Operator context banner */}
                                <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 flex items-start gap-3">
                                    <i className="ri-user-settings-line text-[#1E88E5] text-xl flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-[#1565C0] text-sm">You are an operator on this match</p>
                                        <p className="text-xs text-blue-600 mt-0.5">You can stream and activate available banners. Premium overlays are managed by the match admin.</p>
                                    </div>
                                </div>

                                {/* No subscription from admin */}
                                {!matchSub?.adminHasSubscription && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
                                        <i className="ri-information-line text-amber-500 text-xl flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-amber-800 text-sm">Streaming not available for this match</p>
                                            <p className="text-xs text-amber-700 mt-0.5">The match admin hasn't subscribed yet. Ask them to upgrade to unlock the streaming dashboard.</p>
                                        </div>
                                    </div>
                                )}

                                {matchSub?.adminHasSubscription && (
                                    <>
                                        {/* Included banners — operator can activate */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center"><i className="ri-gift-line text-[#34B8FF] text-sm" /></div>
                                                <p className="font-black text-gray-900">Available Banners</p>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <BannerCard icon="ri-layout-top-2-line" title="Main Match Banner"
                                                    desc="Tournament, teams, venue, date and toss result." active={activeBanner === 'main'}
                                                    canActivate={iAmStreaming} lockedReason="Start streaming first"
                                                    onToggle={() => handleBanner('main')} previewBg="linear-gradient(135deg,#34B8FF,#1E88E5)" />
                                                <BannerCard icon="ri-group-line" title="Batting XI Banner"
                                                    desc="Full batting lineup with live runs and dismissal info." active={activeBanner === 'playingXI_bat'}
                                                    canActivate={iAmStreaming} lockedReason="Start streaming first"
                                                    onToggle={() => handleBanner('playingXI_bat')} previewBg="linear-gradient(135deg,#00b4d8,#0077b6)" />
                                                <BannerCard icon="ri-group-2-line" title="Bowling XI Banner"
                                                    desc="Bowling lineup with overs, wickets and economy." active={activeBanner === 'playingXI_bowl'}
                                                    canActivate={iAmStreaming} lockedReason="Start streaming first"
                                                    onToggle={() => handleBanner('playingXI_bowl')} previewBg="linear-gradient(135deg,#8E54E9,#4776E6)" />
                                                <BannerCard icon="ri-bar-chart-line" title="Live Score Overlay"
                                                    desc="Persistent bottom score bar, updates ball by ball." active={activeBanner === 'score'}
                                                    canActivate={iAmStreaming} lockedReason="Start streaming first"
                                                    onToggle={() => handleBanner('score')} previewBg="linear-gradient(135deg,#0a1628,#1E88E5)" />
                                            </div>
                                        </div>

                                        {/* Premium add-ons purchased by admin — operator can activate, cannot buy */}
                                        {purchasedTemplates.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center"><i className="ri-vip-crown-line text-amber-600 text-sm" /></div>
                                                    <p className="font-black text-gray-900">Premium Overlays</p>
                                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Purchased by match admin</span>
                                                </div>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    {purchasedTemplates.map(tpl => (
                                                        <OperatorTemplateCard key={tpl.id} tpl={tpl}
                                                            active={activeBanner === tpl.id as any}
                                                            canActivate={iAmStreaming}
                                                            onActivate={() => handleBanner(tpl.id as any)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* No premium overlays purchased by admin */}
                                        {purchasedTemplates.length === 0 && (
                                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-8 text-center">
                                                <i className="ri-layout-top-2-line text-gray-200 text-4xl block mb-3" />
                                                <p className="font-bold text-gray-400 text-sm">No premium overlays for this match</p>
                                                <p className="text-xs text-gray-300 mt-1">The match admin can purchase premium overlay templates from the pricing page.</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </div>

            <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet" />
        </div>
    );
}
