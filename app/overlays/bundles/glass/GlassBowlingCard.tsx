import { MatchState, TeamDetails, PlayerStats } from "../types";
import { getBowlTeam, fmtOv, fmtEcon } from "../helpers";
import { B } from "./theme";
import { BroadcastTeamBadge } from "./TeamBadge";

// ═══════════════════════════════════════════════════════════
// BROADCAST BOWLING CARD
// TV-standard bowling figures panel.
// Bowling team color drives the header. Active bowler row
// highlighted with team color left-bar + dim tint.
// ═══════════════════════════════════════════════════════════

export function BroadcastBowlingCard({
  team,
  state,
}: {
  team: TeamDetails;
  state: MatchState;
}) {
  const isTeam1 = team.name === state.team1.name;
  const teamColor = isTeam1 ? B.t1 : B.t2;
  const teamColorDim = isTeam1 ? B.t1Dim : B.t2Dim;
  const teamColorMid = isTeam1 ? B.t1Mid : B.t2Mid;

  const isPassedTeamBatFirst = team.name === state.battingFirst?.name;
  const bowlingOrderArr =
    (isPassedTeamBatFirst
      ? (state as any).team2BowlingOrder
      : (state as any).team1BowlingOrder) || [];

  const opponent = team.name === state.team1.name ? state.team2 : state.team1;
  const isActiveBowlTeam = team.name === getBowlTeam(state).name;
  const activeBowlerId = isActiveBowlTeam
    ? state.currentBowler?.playerId
    : null;

  const placedIds = new Set<string>();
  const orderedBowlers: PlayerStats[] = [];

  bowlingOrderArr.forEach((p: any) => {
    if ((p.ballsBowled ?? 0) > 0 || (p.wicketsTaken ?? 0) > 0) {
      orderedBowlers.push(p);
      placedIds.add(p.playerId);
    }
  });

  if (activeBowlerId && !placedIds.has(activeBowlerId)) {
    const base = team.playingXI.find((p) => p.playerId === activeBowlerId);
    if (base) {
      orderedBowlers.push({
        ...base,
        overs: 0,
        ballsBowled: 0,
        runsConceded: 0,
        wicketsTaken: 0,
        economyRate: 0,
      });
      placedIds.add(activeBowlerId);
    }
  }

  const bowlers = orderedBowlers.sort(
    (a, b) => (b.ballsBowled || 0) - (a.ballsBowled || 0),
  );
  const currentBowlerId = state.currentBowler?.playerId;
  const ROW_H = 54;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 960,
        fontFamily: "'Barlow Condensed', 'DM Sans', sans-serif",
        animation: "bcScaleIn 0.45s cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      <div
        style={{
          background: B.panelBg,
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: B.shadow,
          border: `1px solid ${B.lineHard}`,
        }}
      >
        {/* Top color rail */}
        <div style={{ height: 5, background: teamColor }} />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 32px",
            background: `linear-gradient(90deg, ${teamColorMid} 0%, ${teamColorDim} 55%, transparent 100%)`,
            borderBottom: `1px solid ${B.lineHard}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <BroadcastTeamBadge
              name={team.name}
              logoUrl={team.logoUrl}
              size={62}
              teamColor={teamColor}
            />
            <div>
              <div
                style={{
                  color: teamColor,
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  marginBottom: 2,
                }}
              >
                BOWLING
              </div>
              <div
                style={{
                  color: B.white,
                  fontSize: 38,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  lineHeight: 1,
                }}
              >
                {team.name}
              </div>
            </div>
          </div>
          {(opponent.score > 0 || opponent.wickets > 0) && (
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  color: B.w50,
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 3,
                }}
              >
                {state.firstInnings ? "BATTING" : "TARGET"}
              </div>
              <div
                style={{
                  color: B.white,
                  fontSize: 38,
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                {opponent.score}/{opponent.wickets}
                <span
                  style={{
                    color: B.w70,
                    fontSize: 20,
                    fontWeight: 600,
                    marginLeft: 8,
                  }}
                >
                  ({opponent.overs})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Column headers */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: 40,
            padding: "0 32px",
            borderBottom: `1px solid ${B.lineHard}`,
            background: B.panelBgDeep,
          }}
        >
          <div
            style={{
              flex: 1,
              color: B.w50,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            BOWLER
          </div>
          {[
            { h: "O", w: 80 },
            { h: "R", w: 72 },
            { h: "W", w: 64 },
            { h: "ECON", w: 90 },
          ].map(({ h, w }) => (
            <div
              key={h}
              style={{
                width: w,
                textAlign: "right",
                color: B.w50,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {/* Bowler rows */}
        {bowlers.length === 0 ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: B.w50,
              fontSize: 18,
              letterSpacing: 1,
            }}
          >
            NO OVERS BOWLED YET
          </div>
        ) : (
          <div>
            {bowlers.map((p, i) => {
              const isCurrent = p.playerId === currentBowlerId;
              const isCap = p.playerId === team.captainId;
              const hasWickets = (p.wicketsTaken ?? 0) > 0;

              return (
                <div
                  key={p.playerId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: ROW_H,
                    padding: "0 32px",
                    background: isCurrent
                      ? teamColorDim
                      : i % 2 === 0
                        ? "transparent"
                        : B.panelBgMid,
                    borderBottom:
                      i < bowlers.length - 1
                        ? `1px solid ${B.lineDim}`
                        : "none",
                    borderLeft: isCurrent
                      ? `4px solid ${teamColor}`
                      : "4px solid transparent",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      overflow: "hidden",
                    }}
                  >
                    {isCurrent && (
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          flexShrink: 0,
                          background: teamColor,
                        }}
                      />
                    )}
                    <span
                      style={{
                        color: isCurrent ? B.white : B.w70,
                        fontWeight: isCurrent ? 800 : 700,
                        fontSize: 22,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.name}
                    </span>
                    {isCap && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: teamColor,
                          border: `1px solid ${teamColor}`,
                          borderRadius: 3,
                          padding: "1px 6px",
                          letterSpacing: 1,
                          flexShrink: 0,
                        }}
                      >
                        C
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      width: 80,
                      textAlign: "right",
                      color: isCurrent ? B.white : B.w70,
                      fontSize: 22,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {fmtOv(p.overs ?? 0)}
                  </div>
                  <div
                    style={{
                      width: 72,
                      textAlign: "right",
                      color: isCurrent ? B.white : B.w70,
                      fontSize: 22,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {p.runsConceded ?? 0}
                  </div>
                  <div
                    style={{
                      width: 64,
                      textAlign: "right",
                      color: hasWickets ? teamColor : B.w70,
                      fontSize: 24,
                      fontWeight: hasWickets ? 900 : 700,
                      flexShrink: 0,
                    }}
                  >
                    {p.wicketsTaken ?? 0}
                  </div>
                  <div
                    style={{
                      width: 90,
                      textAlign: "right",
                      color: B.w50,
                      fontSize: 17,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {fmtEcon(p.economyRate ?? 0)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "14px 32px",
            borderTop: `1px solid ${B.lineHard}`,
            background: B.panelBgDeep,
          }}
        >
          <div
            style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}
          >
            <span
              style={{
                color: B.w50,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Overs
            </span>
            <span style={{ color: B.white, fontSize: 22, fontWeight: 900 }}>
              {opponent.overs} / {state.totalOvers}
            </span>
          </div>
          {(() => {
            const ex = opponent.extras;
            const tot = ex
              ? ex.wide + ex.noBall + ex.bye + ex.legBye + ex.penalty
              : 0;
            return tot > 0 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "0 24px",
                  borderLeft: `1px solid ${B.lineHard}`,
                }}
              >
                <span
                  style={{
                    color: B.w50,
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                  }}
                >
                  Extras
                </span>
                <span style={{ color: B.white, fontSize: 22, fontWeight: 900 }}>
                  {tot}
                </span>
              </div>
            ) : null;
          })()}
        </div>
      </div>
    </div>
  );
}

// Re-export for backward compatibility with overlay page imports
export { BroadcastBowlingCard as GlassBowlingCard };
