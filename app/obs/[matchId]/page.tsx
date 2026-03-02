'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import { fetchMatchById, fetchMatchState, fetchStreamState } from '@/lib/api';

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
    firstInnings: boolean; completedOvers: number; totalOvers: number;
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
type BannerType = 'none' | 'main' | 'playingXI_bat' | 'playingXI_bowl' | 'score' | string;
interface StreamState { activeBanner: BannerType; templateId: string | null; }

// ═══════════════════════════════════════════════════════════
// STYLE HELPERS
// ═══════════════════════════════════════════════════════════

const initials = (n: string) => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

function fmt12(t: string | number[]) {
    if (!t) return '';
    let h: number, m: string | number;

    if (Array.isArray(t)) {
        h = t[0];
        m = t[1] !== undefined ? t[1].toString().padStart(2, '0') : '00';
    } else {
        const parts = String(t).split(':'); // Safely cast to string
        h = parseInt(parts[0]);
        m = parts[1] || '00';
    }
    return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
}

function fmtDate(d: string | number[]) {
    if (!d) return '';
    const dateObj = Array.isArray(d) ? new Date(d[0], d[1] - 1, d[2]) : new Date(d);
    return dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
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
    return s.firstInnings
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
                        {!state.firstInnings && (
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
                    {info.venue && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600 }}>
                            <span>📍</span><span>{info.venue}</span>
                        </div>
                    )}
                    {(info.matchDate || info.matchTime) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600 }}>
                            <span>📅</span><span>{fmtDate(info.matchDate)} {info.matchTime ? `· ${fmt12(info.matchTime)}` : ''}</span>
                        </div>
                    )}
                    {state.tossWinner && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600 }}>
                            <span>🪙</span><span>{state.tossWinner} won toss & chose to {state.choice}</span>
                        </div>
                    )}
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
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 800, animation: 'scaleIn 0.55s cubic-bezier(0.16,1,0.3,1)' }}>
            <div style={{ ...glass, borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ height: 5, background: `linear-gradient(90deg,${accent[0]},${accent[1]},${accent[0]})`, backgroundSize: '200%', animation: 'shimmer 4s linear infinite' }} />

                <div style={{ padding: '20px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div>
                        <div style={{ color: accent[0], fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>{isBatting ? 'Batting XI' : 'Bowling XI'}</div>
                        <div style={{ color: '#fff', fontWeight: 900, fontSize: 24, textTransform: 'uppercase', letterSpacing: 1 }}>{team.name}</div>
                    </div>
                </div>

                <div style={{ padding: '20px 30px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {players.map((p, i) => (
                        <div key={p.playerId} style={{
                            display: 'flex', alignItems: 'center', padding: '10px 16px', borderRadius: 8,
                            background: 'rgba(255,255,255,0.05)',
                            borderLeft: `4px solid ${accent[0]}`,
                        }}>
                            <div style={{ width: 30, color: 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: 14 }}>{i + 1}</div>
                            <div style={{ flex: 1, color: '#fff', fontWeight: 700, fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 }}>{p.name}</div>

                            {isBatting && p.runs > 0 && (
                                <div style={{ color: '#34B8FF', fontWeight: 900, fontSize: 16 }}>{p.runs} <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>({p.ballsFaced})</span></div>
                            )}
                            {!isBatting && p.wicketsTaken > 0 && (
                                <div style={{ color: '#8E54E9', fontWeight: 900, fontSize: 16 }}>{p.wicketsTaken} <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>wkts</span></div>
                            )}
                        </div>
                    ))}
                </div>
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

    useEffect(() => {
        if (!matchId) return;

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

        // 1. Fetch initial data
        Promise.all([
            fetchMatchById(matchId),
            fetchMatchState(matchId),
            fetchStreamState(matchId)
        ]).then(([rawMatch, state, stream]) => {
            const actualMatch = rawMatch?.data || rawMatch;
            const actualState = state?.data || state;
            const actualStream = stream;

            // Map backend MatchResponse2 to OBS MatchInfo
            setInfo({
                id: actualMatch?.matchId || actualMatch?.id,
                venue: actualMatch?.venue || 'Venue TBD',
                matchDate: actualMatch?.matchDate,
                matchTime: actualMatch?.matchTime,
                stage: actualMatch?.stage,
                overs: actualMatch?.overs || 0,
                tournamentName: actualMatch?.tournamentResponse?.name || actualMatch?.tournamentName || null, // 🔥 Now it grabs the name!
                team1: { name: actualState?.team1?.name || 'Team 1', logoPath: null },
                team2: { name: actualState?.team2?.name || 'Team 2', logoPath: null }
            });

            // Set the live cricket state
            setLiveState(actualState);

            // Set the active OBS banner based on dashboard controls
            setStreamState({
                activeBanner: actualStream?.activeBanner || 'none',
                templateId: actualStream?.activeTemplateId || null
            });
        }).catch(err => {
            console.error("OBS Fetch Error:", err);
        });

        const stompClient = new Client({
            webSocketFactory: () => new SockJS(`${API_URL}/ws`),
            reconnectDelay: 5000,
            onConnect: () => {

                // A. Subscribe to Banner Toggles
                stompClient.subscribe(`/topic/stream/${matchId}`, (msg) => {
                    try {
                        const data = JSON.parse(msg.body);
                        setStreamState({ activeBanner: data.activeBanner, templateId: data.activeTemplateId });
                    } catch (err) { console.error('Banner parsing error:', err); }
                });

                stompClient.subscribe(`/topic/match/${matchId}`, async (msg) => {
                    try {
                        const parsed = JSON.parse(msg.body);
                        const data = parsed.payload ? parsed.payload : parsed;

                        // Anti-Crash Check: Ensure we have the full MatchState
                        if (data && data.team1 && data.team2) {
                            setLiveState(data);
                        } else {
                            // Partial update received, fetch full state safely to prevent blank overlays
                            console.log("OBS received partial update, fetching full state...");
                            const fullState = await fetchMatchState(matchId);
                            setLiveState(fullState.data || fullState);
                        }
                    } catch (err) { console.error('Score parsing error:', err); }
                });
            },
        });

        stompClient.activate();

        return () => {
            stompClient.deactivate();
        };
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
                {streamState.activeBanner.startsWith('tpl-') && (
                    <ScoreOverlay state={liveState} /> // fallback to score overlay until premium templates are built
                )}
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