'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

// ═══════════════════════════════════════════════════════════
// TYPES — exact mirror of MatchState.java
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
    matchId: string;
    team1: TeamDetails; team2: TeamDetails;
    tossWinner: string; choice: string;
    isFirstInnings: boolean; completedOvers: number; totalOvers: number;
    matchComplete: boolean; winner: string | null; winBy: string | null;
    battingFirst: TeamDetails | null; battingSecond: TeamDetails | null;
    currentStriker: PlayerDetails | null; currentNonStriker: PlayerDetails | null; currentBowler: PlayerDetails | null;
    currentOverBalls: string[];
    team1BattingOrder: PlayerStats[]; team2BattingOrder: PlayerStats[];
}
interface MatchInfo {
    id: string; venue: string; matchDate: string; matchTime: string;
    stage: string | null; overs: number; tournamentName: string | null;
    team1: { name: string; logoPath: string | null };
    team2: { name: string; logoPath: string | null };
}
type BannerType = 'none' | 'main' | 'playingXI_bat' | 'playingXI_bowl' | 'score';
interface StreamState { activeBanner: BannerType; templateId: string | null; }

// ═══════════════════════════════════════════════════════════
// PLACEHOLDER API CALLS
// ═══════════════════════════════════════════════════════════

async function fetchMatchInfoObs(matchId: string): Promise<MatchInfo> {
    // TODO: GET /api/v1/matches/{matchId}
    await new Promise(r => setTimeout(r, 200));
    return {
        id: matchId, venue: 'Jharkhand State Cricket Stadium',
        matchDate: '2026-02-26', matchTime: '14:30:00',
        stage: 'Final', overs: 20, tournamentName: 'Ranchi Premier League 2025',
        team1: { name: 'Mumbai XI', logoPath: null },
        team2: { name: 'Delhi Strikers', logoPath: null },
    };
}

async function fetchMatchStateObs(matchId: string): Promise<MatchState> {
    // TODO: GET /api/v1/matches/matchstate/{matchId}
    // IMPORTANT: Replace this polling with WebSocket for zero-latency updates:
    //   const stompClient = new Client({ brokerURL: 'ws://your-api/ws' });
    //   stompClient.activate();
    //   stompClient.subscribe(`/topic/match/${matchId}`, msg => setLiveState(JSON.parse(msg.body)));
    //   stompClient.subscribe(`/topic/stream/${matchId}`, msg => setStreamState(JSON.parse(msg.body)));
    await new Promise(r => setTimeout(r, 150));
    const xi = (pfx: string): PlayerStats[] => Array.from({ length: 11 }, (_, i) => ({
        playerId: `${pfx}${i}`, name: `Player ${i + 1}`,
        runs: 20 + i * 9, ballsFaced: 18 + i * 6,
        fours: i % 4, sixes: i % 2, strikeRate: 110 + i * 5,
        wicketDetails: i < 4 ? { dismissalType: ['Bowled', 'Caught', 'LBW', 'Run Out'][i], bowlerId: null, catcherId: null, runOutMakerId: null, overNumber: i + 1, ballNumber: i + 3 } : null,
        overs: i < 5 ? i + 1 : 0, ballsBowled: i < 5 ? (i + 1) * 6 : 0,
        runsConceded: i < 5 ? (i + 1) * 9 : 0, wicketsTaken: i < 5 ? i % 3 : 0, economyRate: i < 5 ? 7.5 + i * 0.4 : 0,
    }));
    const t1: TeamDetails = { name: 'Mumbai XI', logoUrl: null, playingXI: xi('mum'), captainId: null, score: 148, wickets: 5, overs: 20, ballsPlayed: 120, extras: { wide: 4, noBall: 1, bye: 2, legBye: 1, penalty: 0 } };
    const t2: TeamDetails = { name: 'Delhi Strikers', logoUrl: null, playingXI: xi('del'), captainId: null, score: 132, wickets: 7, overs: 18.2, ballsPlayed: 110, extras: { wide: 3, noBall: 0, bye: 1, legBye: 2, penalty: 0 } };
    return {
        matchId, team1: t1, team2: t2,
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

async function fetchStreamStateObs(matchId: string): Promise<StreamState> {
    // TODO: GET /api/v1/stream/{matchId}/state
    // Returns whichever banner the operator activated on the dashboard
    // Replace with WebSocket: stompClient.subscribe(`/topic/stream/${matchId}`, ...)
    await new Promise(r => setTimeout(r, 100));
    // DEMO: cycle through banners so you can preview all of them
    const banners: BannerType[] = ['main', 'playingXI_bat', 'playingXI_bowl', 'score'];
    const idx = Math.floor(Date.now() / 8000) % banners.length;
    return { activeBanner: banners[idx], templateId: null };
}

// ═══════════════════════════════════════════════════════════
// STYLE HELPERS
// ═══════════════════════════════════════════════════════════

const initials = (n: string) => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

function fmt12(t: string) {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}
function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function ballClr(b: string): string {
    if (b === 'W') return '#ef4444';
    if (b === '4') return '#3b82f6';
    if (b === '6') return '#8b5cf6';
    if (b === 'Wd' || b === 'Nb') return '#f59e0b';
    if (b === '0') return 'rgba(255,255,255,0.18)';
    return '#22c55e';
}
function getBatTeam(s: MatchState): TeamDetails {
    if (!s.battingFirst) return s.team1;
    return s.isFirstInnings
        ? (s.battingFirst.name === s.team1.name ? s.team1 : s.team2)
        : (s.battingFirst.name === s.team1.name ? s.team2 : s.team1);
}
function getBowlTeam(s: MatchState): TeamDetails {
    const bat = getBatTeam(s); return bat.name === s.team1.name ? s.team2 : s.team1;
}
function dismissalLabel(p: PlayerStats): string {
    const d = p.wicketDetails;
    if (!d) return '';
    if (d.dismissalType === 'Bowled') return `b ${d.bowlerId?.name ?? ''}`;
    if (d.dismissalType === 'Caught') return `c ${d.catcherId?.name ?? ''} b ${d.bowlerId?.name ?? ''}`;
    if (d.dismissalType === 'LBW') return `lbw b ${d.bowlerId?.name ?? ''}`;
    if (d.dismissalType === 'Run Out') return `run out (${d.runOutMakerId?.name ?? ''})`;
    return d.dismissalType;
}

// ═══════════════════════════════════════════════════════════
// SHARED GLASS CARD
// ═══════════════════════════════════════════════════════════

const glass = {
    background: 'linear-gradient(135deg, rgba(10,18,36,0.93), rgba(22,38,72,0.93))',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(52,184,255,0.25)',
    boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
};

// ═══════════════════════════════════════════════════════════
// BANNER: SCORE OVERLAY (bottom bar)
// ═══════════════════════════════════════════════════════════

function ScoreOverlay({ state }: { state: MatchState }) {
    const bat = getBatTeam(state);
    const bowl = getBowlTeam(state);
    const crr = bat.overs > 0 ? (bat.score / bat.overs).toFixed(2) : '0.00';
    const runsNeeded = bat.score - bowl.score + 1;
    const ballsLeft = Math.round((state.totalOvers - bowl.overs) * 6);

    return (
        <div style={{ position: 'absolute', bottom: 44, left: 0, right: 0, display: 'flex', justifyContent: 'center', animation: 'slideUp 0.5s cubic-bezier(0.16,1,0.3,1)' }}>
            <div style={{ ...glass, borderRadius: 16, overflow: 'hidden', minWidth: 720 }}>
                {/* accent bar */}
                <div style={{ height: 3, background: 'linear-gradient(90deg,#34B8FF,#1E88E5,#34B8FF,#1E88E5)', backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite' }} />

                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    {/* Batting score */}
                    <div style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 14, flex: '0 0 auto' }}>
                        <div style={{ width: 38, height: 38, borderRadius: 9, background: 'linear-gradient(135deg,#34B8FF,#1E88E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: 13, flexShrink: 0 }}>
                            {initials(bat.name)}
                        </div>
                        <div>
                            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 1 }}>{bat.name}</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                <span style={{ color: '#fff', fontWeight: 900, fontSize: 30, lineHeight: 1 }}>{bat.score}/{bat.wickets}</span>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600 }}>({bat.overs})</span>
                            </div>
                        </div>
                    </div>

                    {/* CRR / Target */}
                    <div style={{ padding: '10px 18px', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>CRR</div>
                        <div style={{ color: '#34B8FF', fontWeight: 900, fontSize: 20 }}>{crr}</div>
                        {!state.isFirstInnings && (
                            <>
                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>Need</div>
                                <div style={{ color: '#FF9F43', fontWeight: 900, fontSize: 14 }}>{runsNeeded} off {ballsLeft}</div>
                            </>
                        )}
                    </div>

                    {/* Current over */}
                    <div style={{ padding: '10px 18px', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5 }}>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>This over</div>
                        <div style={{ display: 'flex', gap: 5 }}>
                            {(state.currentOverBalls ?? []).map((b, i) => (
                                <div key={i} style={{ width: 27, height: 27, borderRadius: '50%', background: ballClr(b), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, color: '#fff' }}>{b}</div>
                            ))}
                        </div>
                    </div>

                    {/* Batters */}
                    {(state.currentStriker || state.currentNonStriker) && (
                        <div style={{ padding: '10px 20px', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5 }}>
                            {[state.currentStriker, state.currentNonStriker].filter(Boolean).map((p, i) => {
                                const stats = bat.playingXI.find(ps => ps.playerId === p?.playerId);
                                return (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ color: i === 0 ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: i === 0 ? 800 : 600, fontSize: 13, whiteSpace: 'nowrap' }}>
                                            {i === 0 ? '🏏 ' : ''}{p?.name}
                                        </span>
                                        {stats && <span style={{ color: '#34B8FF', fontWeight: 900, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{stats.runs}({stats.ballsFaced})</span>}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Bowler */}
                    {state.currentBowler && (
                        <div style={{ padding: '10px 20px', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Bowling</div>
                            {(() => {
                                const bs = getBowlTeam(state).playingXI.find(p => p.playerId === state.currentBowler?.playerId);
                                return (
                                    <>
                                        <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{state.currentBowler.name}</div>
                                        {bs && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{bs.overs}ov · {bs.wicketsTaken}w · {bs.runsConceded}r</div>}
                                    </>
                                );
                            })()}
                        </div>
                    )}

                    {/* Extras */}
                    {bat.extras && (
                        <div style={{ padding: '10px 18px', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Extras</div>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600 }}>
                                W{bat.extras.wide} N{bat.extras.noBall} B{bat.extras.bye} LB{bat.extras.legBye}
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
                                Total {bat.extras.wide + bat.extras.noBall + bat.extras.bye + bat.extras.legBye + bat.extras.penalty}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// BANNER: MAIN MATCH
// ═══════════════════════════════════════════════════════════

function MainMatchBanner({ info, state }: { info: MatchInfo; state: MatchState }) {
    return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 940, animation: 'scaleIn 0.55s cubic-bezier(0.16,1,0.3,1)' }}>
            <div style={{ ...glass, borderRadius: 26, overflow: 'hidden' }}>
                <div style={{ height: 4, background: 'linear-gradient(90deg,#34B8FF,#1E88E5,#8E54E9,#34B8FF)', backgroundSize: '200%', animation: 'shimmer 4s linear infinite' }} />

                {/* Tournament + stage */}
                <div style={{ padding: '22px 36px 0', textAlign: 'center' }}>
                    {info.tournamentName && (
                        <div style={{ display: 'inline-block', background: 'rgba(52,184,255,0.12)', border: '1px solid rgba(52,184,255,0.25)', borderRadius: 50, padding: '5px 18px', color: '#34B8FF', fontWeight: 800, fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                            {info.tournamentName}
                        </div>
                    )}
                    {info.stage && (
                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' }}>{info.stage}</div>
                    )}
                </div>

                {/* Teams */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '28px 56px 20px' }}>
                    {/* Team 1 */}
                    <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg,#34B8FF,#1E88E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontWeight: 900, color: '#fff', fontSize: 24, boxShadow: '0 10px 30px rgba(52,184,255,0.4)' }}>{initials(state.team1.name)}</div>
                        <div style={{ color: '#fff', fontWeight: 900, fontSize: 22 }}>{state.team1.name}</div>
                        <div style={{ color: '#34B8FF', fontWeight: 900, fontSize: 36, marginTop: 4, lineHeight: 1 }}>{state.team1.score}/{state.team1.wickets}</div>
                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 3 }}>({state.team1.overs} ov)</div>
                    </div>

                    {/* VS */}
                    <div style={{ padding: '0 28px', textAlign: 'center' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontWeight: 900, fontSize: 15, letterSpacing: 2 }}>VS</div>
                    </div>

                    {/* Team 2 */}
                    <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg,#8E54E9,#4776E6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontWeight: 900, color: '#fff', fontSize: 24, boxShadow: '0 10px 30px rgba(142,84,233,0.4)' }}>{initials(state.team2.name)}</div>
                        <div style={{ color: '#fff', fontWeight: 900, fontSize: 22 }}>{state.team2.name}</div>
                        <div style={{ color: '#8E54E9', fontWeight: 900, fontSize: 36, marginTop: 4, lineHeight: 1 }}>{state.team2.score}/{state.team2.wickets}</div>
                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 3 }}>({state.team2.overs} ov)</div>
                    </div>
                </div>

                {/* Meta row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28, padding: '14px 36px 22px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {[
                        { e: '📍', t: info.venue },
                        { e: '📅', t: fmtDate(info.matchDate) },
                        { e: '🕐', t: fmt12(info.matchTime) },
                        { e: '🪙', t: `${state.tossWinner} won toss · chose to ${state.choice}` },
                    ].map((row, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600 }}>
                            <span>{row.e}</span><span>{row.t}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// BANNER: PLAYING XI
// ═══════════════════════════════════════════════════════════

function PlayingXIBanner({ team, isBatting }: { team: TeamDetails; isBatting: boolean }) {
    const accent = isBatting ? ['#34B8FF', '#1E88E5'] : ['#8E54E9', '#4776E6'];
    const players = team.playingXI.slice(0, 11);

    return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 900, animation: 'scaleIn 0.55s cubic-bezier(0.16,1,0.3,1)' }}>
            <div style={{ ...glass, borderRadius: 26, overflow: 'hidden' }}>
                <div style={{ height: 4, background: `linear-gradient(90deg,${accent[0]},${accent[1]},${accent[0]})`, backgroundSize: '200%', animation: 'shimmer 4s linear infinite' }} />

                {/* Header */}
                <div style={{ padding: '18px 28px 14px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ width: 46, height: 46, borderRadius: 12, background: `linear-gradient(135deg,${accent[0]},${accent[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: 15 }}>{initials(team.name)}</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>{isBatting ? '🏏 Batting Team' : '🎳 Bowling Team'}</div>
                        <div style={{ color: '#fff', fontWeight: 900, fontSize: 20 }}>{team.name} — Playing XI</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ color: accent[0], fontWeight: 900, fontSize: 28 }}>{team.score}/{team.wickets}</div>
                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>({team.overs} ov)</div>
                    </div>
                </div>

                {/* Players grid */}
                <div style={{ padding: '14px 28px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px' }}>
                    {players.map((p, i) => {
                        const isOut = !!p.wicketDetails;
                        const hasBowled = p.ballsBowled > 0 || p.wicketsTaken > 0;
                        return (
                            <div key={p.playerId} style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10,
                                background: isOut ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${isOut ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)'}`,
                                transition: 'all 0.3s',
                            }}>
                                {/* Number */}
                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: isOut ? 'rgba(239,68,68,0.18)' : `rgba(${accent[0] === '#34B8FF' ? '52,184,255' : '142,84,233'},0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: isOut ? '#ef4444' : accent[0], fontSize: 11, flexShrink: 0 }}>
                                    {i + 1}
                                </div>
                                {/* Name + stats */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ color: isOut ? 'rgba(255,255,255,0.35)' : '#fff', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {p.name}
                                    </div>
                                    {isBatting && (
                                        <div style={{ color: isOut ? '#f87171' : 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600, marginTop: 1 }}>
                                            {isOut ? dismissalLabel(p) : `${p.runs}(${p.ballsFaced}) · SR ${p.strikeRate.toFixed(0)}`}
                                        </div>
                                    )}
                                    {!isBatting && hasBowled && (
                                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600, marginTop: 1 }}>
                                            {p.overs}ov · {p.wicketsTaken}w · {p.runsConceded}r · ER {p.economyRate.toFixed(1)}
                                        </div>
                                    )}
                                </div>
                                {/* Right stat */}
                                {isBatting && !isOut && p.runs > 0 && (
                                    <div style={{ color: accent[0], fontWeight: 900, fontSize: 16, flexShrink: 0 }}>{p.runs}</div>
                                )}
                                {!isBatting && p.wicketsTaken > 0 && (
                                    <div style={{ color: '#ef4444', fontWeight: 900, fontSize: 15, flexShrink: 0 }}>{p.wicketsTaken}w</div>
                                )}
                                {isOut && isBatting && (
                                    <div style={{ color: '#ef4444', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>OUT</div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Extras footer */}
                {isBatting && team.extras && (
                    <div style={{ padding: '10px 28px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 16 }}>
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600 }}>Extras:</span>
                        {[
                            { l: 'W', v: team.extras.wide },
                            { l: 'Nb', v: team.extras.noBall },
                            { l: 'B', v: team.extras.bye },
                            { l: 'LB', v: team.extras.legBye },
                        ].map(e => (
                            <span key={e.l} style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 600 }}>{e.l}: {e.v}</span>
                        ))}
                        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 600, marginLeft: 'auto' }}>
                            Total Extras: {Object.values(team.extras).reduce((a, b) => a + b, 0)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// OBS PAGE — transparent canvas OBS captures
// ═══════════════════════════════════════════════════════════

export default function ObsOverlayPage() {
    const params = useParams();
    const matchId = params?.matchId as string;

    const [info, setInfo] = useState<MatchInfo | null>(null);
    const [liveState, setLiveState] = useState<MatchState | null>(null);
    const [streamState, setStreamState] = useState<StreamState>({ activeBanner: 'none', templateId: null });
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!matchId) return;
        // Initial load
        Promise.all([fetchMatchInfoObs(matchId), fetchMatchStateObs(matchId), fetchStreamStateObs(matchId)])
            .then(([i, s, ss]) => { setInfo(i); setLiveState(s); setStreamState(ss); });

        // Poll every 2s — replace both with WebSocket for production
        pollRef.current = setInterval(async () => {
            const [s, ss] = await Promise.all([fetchMatchStateObs(matchId), fetchStreamStateObs(matchId)]);
            setLiveState(s); setStreamState(ss);
        }, 2000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [matchId]);

    if (!info || !liveState) return null;

    const batTeam = getBatTeam(liveState);
    const bowlTeam = getBowlTeam(liveState);

    return (
        <>
            {/* 1920×1080 transparent canvas — exactly what OBS captures */}
            <div style={{
                position: 'fixed', inset: 0,
                width: 1920, height: 1080,
                background: 'transparent',
                overflow: 'hidden',
                fontFamily: "'Segoe UI', 'SF Pro Display', system-ui, sans-serif",
                WebkitFontSmoothing: 'antialiased',
            }}>
                {streamState.activeBanner === 'score' && <ScoreOverlay state={liveState} />}
                {streamState.activeBanner === 'main' && <MainMatchBanner info={info} state={liveState} />}
                {streamState.activeBanner === 'playingXI_bat' && <PlayingXIBanner team={batTeam} isBatting={true} />}
                {streamState.activeBanner === 'playingXI_bowl' && <PlayingXIBanner team={bowlTeam} isBatting={false} />}
                {/* 'none' → fully transparent, nothing rendered */}
            </div>

            <style>{`
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { background: transparent !important; overflow: hidden; width: 1920px; height: 1080px; }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 24px)) scale(0.94); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes shimmer {
          from { background-position: 200% center; }
          to   { background-position: -200% center; }
        }
      `}</style>
        </>
    );
}