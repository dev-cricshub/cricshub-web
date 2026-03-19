"use client";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface PlayerDetails { playerId: string; name: string; }
interface PlayerStats {
  playerId: string; name: string;
  runs: number; ballsFaced: number; strikeRate: number;
  overs: number; runsConceded: number; wicketsTaken: number; economyRate: number;
  wicketDetails: { dismissalType: string } | null;
  fours: number; sixes: number; ballsBowled: number;
}
interface TeamDetails {
  name: string; logoUrl: string | null;
  playingXI: PlayerStats[];
  score: number; wickets: number; overs: number;
  extras: unknown | null;
}
interface MatchState {
  matchId: string;
  team1: TeamDetails; team2: TeamDetails;
  firstInnings: boolean; totalOvers: number; completedOvers: number;
  matchComplete: boolean; winner: string | null; winBy: string | null;
  battingFirst: TeamDetails | null; battingSecond: TeamDetails | null;
  currentStriker: PlayerDetails | null; currentNonStriker: PlayerDetails | null;
  currentBowler: PlayerDetails | null; currentOverBalls: string[];
  innings1BattingOrder?: PlayerStats[]; innings2BattingOrder?: PlayerStats[];
  team1BowlingOrder?: PlayerStats[]; team2BowlingOrder?: PlayerStats[];
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function getBatTeam(s: MatchState): TeamDetails {
  if (!s.battingFirst) return s.team1;
  return s.firstInnings
    ? s.battingFirst.name === s.team1.name ? s.team1 : s.team2
    : s.battingFirst.name === s.team1.name ? s.team2 : s.team1;
}
function getBowlTeam(s: MatchState): TeamDetails {
  const bat = getBatTeam(s);
  return bat.name === s.team1.name ? s.team2 : s.team1;
}
function getStats(team: TeamDetails, name?: string): PlayerStats | null {
  if (!name) return null;
  return team.playingXI.find((p) => p.name === name) ?? null;
}
const fmtOv = (v: number) => (v > 0 ? v.toFixed(1) : "0.0");

// ═══════════════════════════════════════════════════════════
// DESIGN TOKENS — high contrast, readable on any screen
// ═══════════════════════════════════════════════════════════

const FONT   = "'Inter','Segoe UI',system-ui,sans-serif";
const BG     = "#050a14";                  // near-black
const SHADOW = "0 1px 6px rgba(0,0,0,1)"; // text shadow for any bg bleed
const WHITE  = "#ffffff";
const CYAN   = "#38bdf8";   // batter highlight
const AMBER  = "#fbbf24";   // target + bowler
const RULE   = "rgba(255,255,255,0.18)";

// ═══════════════════════════════════════════════════════════
// BALL DOT
// ═══════════════════════════════════════════════════════════

function BallDot({ value }: { value: string }) {
  const isW   = value === "W";
  const is4   = value === "4";
  const is6   = value === "6";
  const isDot = value === "0" || value === "";

  const bg    = isW ? "#ef4444" : is6 ? "#a855f7" : is4 ? "#3b82f6" : "#1e293b";
  const color = isDot ? "#94a3b8" : WHITE;
  const label = isDot ? "•" : value;

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 36, height: 36, borderRadius: "50%",
      background: bg,
      border: isDot ? "2px solid #334155" : "2px solid rgba(255,255,255,0.25)",
      color, fontSize: isDot ? 16 : 15, fontWeight: 800,
      fontFamily: FONT, flexShrink: 0,
      textShadow: SHADOW,
    }}>
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
// DIVIDER
// ═══════════════════════════════════════════════════════════

const VRule = ({ tall = false }) => (
  <div style={{
    width: 1, alignSelf: "stretch",
    background: RULE, flexShrink: 0,
    margin: tall ? "0" : "10px 0",
  }} />
);

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function SkeletalScoreOverlay({ state }: { state: MatchState }) {
  const batTeam  = getBatTeam(state);
  const bowlTeam = getBowlTeam(state);

  const strikerStats    = getStats(batTeam,  state.currentStriker?.name);
  const nonStrikerStats = getStats(batTeam,  state.currentNonStriker?.name);
  const bowlerStats     = getStats(bowlTeam, state.currentBowler?.name);

  const target = !state.firstInnings && state.battingFirst
    ? (state.battingFirst.score ?? 0) + 1
    : null;

  // ── RESULT ──────────────────────────────────────────────
  if (state.matchComplete && state.winner) {
    return (
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: BG, borderTop: "5px solid #f59e0b",
        display: "flex", alignItems: "stretch",
        fontFamily: FONT, minHeight: 68,
      }}>
        <div style={{
          background: "#f59e0b", display: "flex", alignItems: "center",
          padding: "0 20px", flexShrink: 0,
        }}>
          <span style={{
            color: "#000", fontSize: 13, fontWeight: 900, letterSpacing: "0.12em",
          }}>
            RESULT
          </span>
        </div>

        <div style={{
          flex: 1, display: "flex", alignItems: "center",
          padding: "0 22px", gap: 10,
        }}>
          <span style={{ color: WHITE, fontSize: 20, fontWeight: 800, textShadow: SHADOW }}>
            {state.winner}
          </span>
          <span style={{ color: "#cbd5e1", fontSize: 17, textShadow: SHADOW }}>
            won{state.winBy ? ` by ${state.winBy}` : ""}
          </span>
        </div>

        <VRule tall />
        <div style={{
          display: "flex", flexDirection: "column", justifyContent: "center",
          alignItems: "flex-end", padding: "0 22px", flexShrink: 0, gap: 3,
        }}>
          <span style={{
            color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
          }}>
            {batTeam.name.toUpperCase()}
          </span>
          <span style={{
            color: WHITE, fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em",
            textShadow: SHADOW,
          }}>
            {batTeam.score}/{batTeam.wickets}
            <span style={{ color: "#94a3b8", fontSize: 14, fontWeight: 500, marginLeft: 8 }}>
              ({fmtOv(batTeam.overs)})
            </span>
          </span>
        </div>
      </div>
    );
  }

  // ── LIVE BAR ─────────────────────────────────────────────
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      background: BG, borderTop: "5px solid #38bdf8",
      fontFamily: FONT,
    }}>

      {/* ══ ROW 1 — Score ═══════════════════════════════ */}
      <div style={{
        display: "flex", alignItems: "stretch",
        borderBottom: `1px solid ${RULE}`,
        minHeight: 58,
      }}>

        {/* Team name chip */}
        <div style={{
          display: "flex", alignItems: "center",
          padding: "0 18px",
          background: "rgba(56,189,248,0.1)",
          borderRight: `1px solid ${RULE}`,
          flexShrink: 0,
        }}>
          <span style={{
            color: "#7dd3fc",
            fontSize: 12, fontWeight: 800,
            letterSpacing: "0.09em",
            whiteSpace: "nowrap",
            textShadow: SHADOW,
          }}>
            {batTeam.name.toUpperCase()}
          </span>
        </div>

        {/* Score */}
        <div style={{
          display: "flex", alignItems: "center",
          gap: 12, padding: "0 22px", flexShrink: 0,
        }}>
          <span style={{
            color: WHITE, fontSize: 36, fontWeight: 900,
            letterSpacing: "-0.04em", lineHeight: 1,
            textShadow: SHADOW,
          }}>
            {batTeam.score}/{batTeam.wickets}
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{
              color: WHITE, fontSize: 14, fontWeight: 700,
              whiteSpace: "nowrap", textShadow: SHADOW,
            }}>
              {fmtOv(batTeam.overs)} ov
            </span>
            {state.totalOvers > 0 && (
              <span style={{ color: "#64748b", fontSize: 11 }}>of {state.totalOvers}</span>
            )}
          </div>

          {target && (
            <>
              <div style={{ width: 1, height: 32, background: RULE }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{
                  color: "#94a3b8", fontSize: 10, fontWeight: 800,
                  letterSpacing: "0.1em",
                }}>
                  TARGET
                </span>
                <span style={{
                  color: AMBER, fontSize: 22, fontWeight: 900,
                  lineHeight: 1, textShadow: SHADOW,
                }}>
                  {target}
                </span>
              </div>
            </>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* This Over */}
        {state.currentOverBalls.length > 0 && (
          <>
            <VRule tall />
            <div style={{
              display: "flex", alignItems: "center",
              gap: 8, padding: "0 18px",
            }}>
              <span style={{
                color: "#64748b", fontSize: 10, fontWeight: 800,
                letterSpacing: "0.1em", marginRight: 2,
                whiteSpace: "nowrap",
              }}>
                THIS OVER
              </span>
              {state.currentOverBalls.map((ball, i) => (
                <BallDot key={i} value={ball} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ══ ROW 2 — Players ══════════════════════════════ */}
      <div style={{
        display: "flex", alignItems: "stretch",
        minHeight: 46,
      }}>

        {/* Striker */}
        {state.currentStriker && (
          <div style={{
            display: "flex", alignItems: "center",
            gap: 10, padding: "0 18px",
            borderRight: `1px solid ${RULE}`,
            flexShrink: 0,
          }}>
            {/* On-strike bar */}
            <div style={{
              width: 3, height: 24, borderRadius: 2,
              background: CYAN, flexShrink: 0,
            }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{
                color: WHITE, fontSize: 16, fontWeight: 700,
                whiteSpace: "nowrap", textShadow: SHADOW,
              }}>
                {state.currentStriker.name}
              </span>
              {strikerStats && (
                <span style={{ whiteSpace: "nowrap" }}>
                  <span style={{
                    color: CYAN, fontSize: 14, fontWeight: 800, textShadow: SHADOW,
                  }}>
                    {strikerStats.runs}
                  </span>
                  <span style={{ color: "#94a3b8", fontSize: 13 }}>
                    {" "}({strikerStats.ballsFaced})
                  </span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Non-striker */}
        {state.currentNonStriker && (
          <div style={{
            display: "flex", alignItems: "center",
            gap: 10, padding: "0 18px",
            flexShrink: 0,
          }}>
            <div style={{
              width: 3, height: 24, borderRadius: 2,
              background: "#334155", flexShrink: 0,
            }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{
                color: "#e2e8f0", fontSize: 16, fontWeight: 500,
                whiteSpace: "nowrap", textShadow: SHADOW,
              }}>
                {state.currentNonStriker.name}
              </span>
              {nonStrikerStats && (
                <span style={{ whiteSpace: "nowrap" }}>
                  <span style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 600 }}>
                    {nonStrikerStats.runs}
                  </span>
                  <span style={{ color: "#64748b", fontSize: 13 }}>
                    {" "}({nonStrikerStats.ballsFaced})
                  </span>
                </span>
              )}
            </div>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Bowler */}
        {state.currentBowler && (
          <>
            <VRule tall />
            <div style={{
              display: "flex", alignItems: "center",
              gap: 10, padding: "0 18px",
              flexShrink: 0,
            }}>
              <div style={{
                width: 3, height: 24, borderRadius: 2,
                background: "#f97316", flexShrink: 0,
              }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{
                  color: WHITE, fontSize: 16, fontWeight: 500,
                  whiteSpace: "nowrap", textShadow: SHADOW,
                }}>
                  {state.currentBowler.name}
                </span>
                {bowlerStats && (
                  <span style={{
                    color: AMBER, fontSize: 13, fontWeight: 700,
                    fontFamily: "'Courier New', monospace",
                    whiteSpace: "nowrap", textShadow: SHADOW,
                  }}>
                    {fmtOv(bowlerStats.overs)}-{bowlerStats.wicketsTaken}-{bowlerStats.runsConceded}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
