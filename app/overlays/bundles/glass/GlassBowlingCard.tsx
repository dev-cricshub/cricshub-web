import { MatchState, TeamDetails, PlayerStats } from "../types";
import { getBowlTeam, fmtOv, fmtEcon } from "../helpers";
import { G } from "./theme";
import { GlassTeamBadge } from "./TeamBadge";

export function GlassBowlingCard({
  team,
  state,
}: {
  team: TeamDetails;
  state: MatchState;
}) {
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
    const baseProfile = team.playingXI.find(
      (p) => p.playerId === activeBowlerId,
    );
    if (baseProfile) {
      orderedBowlers.push({
        ...baseProfile,
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
  const ROW_H = 56;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 960,
        animation: "glassScaleIn 0.45s cubic-bezier(0.16,1,0.3,1) both",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          background: G.bg,
          backdropFilter: G.backdropBlur,
          WebkitBackdropFilter: G.backdropBlur,
          borderTop: `1px solid ${G.borderHighlight}`,
          borderLeft: `1px solid ${G.borderHighlight}`,
          borderBottom: `1px solid ${G.borderShadow}`,
          borderRight: `1px solid ${G.borderShadow}`,
          borderRadius: 24, // Holographic curved edges
          overflow: "hidden",
          boxShadow: G.panelShadow,
          position: "relative",
        }}
      >
        {/* Holographic Top Rim Glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "20%",
            right: "20%",
            height: 2,
            background: `linear-gradient(90deg, transparent, ${G.cyan}, ${G.pink}, transparent)`,
            boxShadow: `0 0 20px ${G.pink}, 0 0 10px ${G.white}`,
            opacity: 0.8,
          }}
        />

        {/* Header - Recessed Glass */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 36px",
            background: G.bgDeep, // Recessed etching
            borderBottom: `1px solid ${G.borderSub}`,
            boxShadow: "inset 0 4px 12px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <GlassTeamBadge
              name={team.name}
              logoUrl={team.logoUrl}
              size={64}
              accent={G.pink}
              glow={G.pinkGlow}
            />
            <div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: G.w45,
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                <span style={{ color: G.pink, textShadow: G.pinkGlow }}>
                  BOWLING
                </span>
              </div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: G.white,
                  fontWeight: 900,
                  fontSize: 40,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  lineHeight: 1,
                  textShadow: G.textGlow,
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
                  color: G.w45,
                  fontSize: 14,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 3,
                }}
              >
                Target
              </div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: G.white,
                  fontWeight: 900,
                  fontSize: 40,
                  lineHeight: 1,
                  textShadow: G.textGlow,
                }}
              >
                {opponent.score}/{opponent.wickets}{" "}
                <span style={{ color: G.w70, fontSize: 20, fontWeight: 600 }}>
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
            height: 44,
            padding: "0 36px",
            borderBottom: `1px solid ${G.borderSub}`,
            background: G.bgLight,
          }}
        >
          <div
            style={{
              flex: 1,
              fontFamily: "'Barlow Condensed', sans-serif",
              color: G.w45,
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 2.5,
              textTransform: "uppercase",
            }}
          >
            BOWLER
          </div>
          {[
            { h: "O", w: 88 },
            { h: "R", w: 78 },
            { h: "W", w: 70 },
            { h: "ECON", w: 98 },
          ].map(({ h, w }) => (
            <div
              key={h}
              style={{
                width: w,
                textAlign: "right",
                fontFamily: "'Barlow Condensed', sans-serif",
                color: G.w45,
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: 2.5,
                textTransform: "uppercase",
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {bowlers.length === 0 ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: G.w45,
              fontFamily: "'Barlow Condensed', sans-serif",
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
              return (
                <div
                  key={p.playerId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: ROW_H,
                    padding: "0 36px",
                    background: isCurrent
                      ? `linear-gradient(90deg, ${G.pinkDim} 0%, transparent 80%)`
                      : i % 2 === 0
                        ? "transparent"
                        : G.bgLight,
                    borderBottom:
                      i < bowlers.length - 1
                        ? `1px solid ${G.borderShadow}`
                        : "none",
                    borderLeft: isCurrent
                      ? `4px solid ${G.pink}`
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
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          flexShrink: 0,
                          background: G.pink,
                          boxShadow: `0 0 12px ${G.pinkGlow}`,
                        }}
                      />
                    )}
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        color: isCurrent ? G.white : G.w70,
                        fontWeight: isCurrent ? 800 : 700,
                        fontSize: 22,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        textShadow: isCurrent ? G.textGlow : "none",
                      }}
                    >
                      {p.name}
                    </span>
                    {isCap && (
                      <span
                        style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontSize: 11,
                          fontWeight: 900,
                          color: G.teal,
                          border: `1px solid ${G.teal}`,
                          boxShadow: `inset 0 0 6px ${G.tealGlow}, 0 0 6px ${G.tealGlow}`,
                          borderRadius: 4,
                          padding: "2px 8px",
                          letterSpacing: 1.5,
                          flexShrink: 0,
                          background: "rgba(0,0,0,0.5)",
                        }}
                      >
                        C
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      width: 88,
                      textAlign: "right",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: 22,
                      color: isCurrent ? G.white : G.w70,
                      flexShrink: 0,
                    }}
                  >
                    {fmtOv(p.overs ?? 0)}
                  </div>
                  <div
                    style={{
                      width: 78,
                      textAlign: "right",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: 22,
                      color: isCurrent ? G.white : G.w70,
                      flexShrink: 0,
                    }}
                  >
                    {p.runsConceded ?? 0}
                  </div>
                  <div
                    style={{
                      width: 70,
                      textAlign: "right",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: (p.wicketsTaken ?? 0) > 0 ? 900 : 700,
                      fontSize: 24,
                      color: (p.wicketsTaken ?? 0) > 0 ? G.pink : G.w70,
                      flexShrink: 0,
                      textShadow:
                        (p.wicketsTaken ?? 0) > 0
                          ? `0 0 12px ${G.pinkGlow}`
                          : "none",
                    }}
                  >
                    {p.wicketsTaken ?? 0}
                  </div>
                  <div
                    style={{
                      width: 98,
                      textAlign: "right",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: 18,
                      color: G.w45,
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
            padding: "16px 36px",
            borderTop: `1px solid ${G.borderHighlight}`,
            background: G.bgDeep,
            boxShadow: "inset 0 4px 12px rgba(0,0,0,0.5)",
            gap: 0,
          }}
        >
          <div
            style={{ flex: 1, display: "flex", alignItems: "center", gap: 14 }}
          >
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: G.w45,
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Overs
            </span>
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: G.w90,
                fontSize: 22,
                fontWeight: 900,
                textShadow: G.textGlow,
              }}
            >
              {opponent.overs} / {state.totalOvers}
            </span>
          </div>
          {(() => {
            const extras = opponent.extras;
            const total = extras
              ? extras.wide +
                extras.noBall +
                extras.bye +
                extras.legBye +
                extras.penalty
              : 0;
            return total > 0 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "0 28px",
                  borderLeft: `1px solid ${G.borderSub}`,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: G.w45,
                    fontSize: 13,
                    fontWeight: 800,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                  }}
                >
                  Extras
                </span>
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: G.white,
                    fontSize: 22,
                    fontWeight: 900,
                    textShadow: G.textGlow,
                  }}
                >
                  {total}
                </span>
              </div>
            ) : null;
          })()}
        </div>
      </div>
    </div>
  );
}
