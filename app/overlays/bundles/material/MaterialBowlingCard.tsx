import { MatchState, TeamDetails, PlayerStats } from "../types";
import { getBowlTeam, fmtOv, fmtEcon } from "../helpers";
import { M } from "./theme";
import { MaterialTeamBadge } from "./TeamBadge";

export function MaterialBowlingCard({
  team,
  state,
}: {
  team: TeamDetails;
  state: MatchState;
}) {
  // --------------------------------------------------------------------------
  // DATA LOGIC (Remains exactly the same)
  // --------------------------------------------------------------------------
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

  // --------------------------------------------------------------------------
  // RENDER LOGIC (Material Theme)
  // --------------------------------------------------------------------------
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 960,
        animation: "fadeScaleIn 0.3s cubic-bezier(0.0, 0.0, 0.2, 1) both", // Snappier material animation
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          background: M.bg,
          border: `1px solid ${M.border}`,
          borderRadius: 8, // Tighter radius for standard broadcast style
          overflow: "hidden",
          boxShadow: M.panelShadow, // Standard broadcast drop shadow
        }}
      >
        {/* Solid Team Accent Stripe (Replaces gradient/glow) */}
        <div style={{ height: 4, background: M.pink }} />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 36px",
            background: M.bgDeep, // Solid deep background
            borderBottom: `1px solid ${M.borderSub}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <MaterialTeamBadge
              name={team.name}
              logoUrl={team.logoUrl}
              size={58}
              accent={M.pink}
            />
            <div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: M.pink,
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                BOWLING
              </div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: M.white,
                  fontWeight: 900,
                  fontSize: 36,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  lineHeight: 1,
                  textShadow: M.textGlow,
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
                  color: M.w45,
                  fontSize: 13,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 3,
                }}
              >
                {opponent.name}
              </div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: M.w90,
                  fontWeight: 900,
                  fontSize: 34,
                  lineHeight: 1,
                  textShadow: M.textGlow,
                }}
              >
                {opponent.score}/{opponent.wickets}{" "}
                <span style={{ color: M.w45, fontSize: 17, fontWeight: 600 }}>
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
            padding: "0 36px",
            borderBottom: `1px solid ${M.borderSub}`,
            background: M.bgDark,
          }}
        >
          <div
            style={{
              flex: 1,
              fontFamily: "'Barlow Condensed', sans-serif",
              color: M.w45,
              fontSize: 12,
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
                color: M.w45,
                fontSize: 12,
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
              padding: "36px",
              textAlign: "center",
              color: M.w45,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 16,
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

              // Solid alternating colors
              const rowBg = isCurrent
                ? M.bgDark
                : i % 2 === 0
                  ? M.bgLight
                  : "transparent";

              return (
                <div
                  key={p.playerId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: ROW_H,
                    padding: "0 36px",
                    background: rowBg,
                    borderBottom:
                      i < bowlers.length - 1
                        ? `1px solid ${M.borderSub}`
                        : "none",
                    borderLeft: isCurrent
                      ? `4px solid ${M.pink}`
                      : "4px solid transparent", // Thicker solid border
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
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
                          background: M.pink,
                        }}
                      /> // Removed glowing dot
                    )}
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        color: isCurrent ? M.white : M.w70,
                        fontWeight: isCurrent ? 800 : 700,
                        fontSize: 20,
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
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontSize: 11,
                          fontWeight: 900,
                          color: M.bg,
                          background: M.teal,
                          borderRadius: 2,
                          padding: "2px 6px",
                          letterSpacing: 1.5,
                          flexShrink: 0,
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
                      fontSize: 20,
                      color: M.w70,
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
                      fontSize: 20,
                      color: M.w70,
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
                      fontSize: 22,
                      color: (p.wicketsTaken ?? 0) > 0 ? M.pink : M.w70,
                      flexShrink: 0,
                    }}
                  >
                    {p.wicketsTaken ?? 0} {/* Removed text shadow glow */}
                  </div>
                  <div
                    style={{
                      width: 98,
                      textAlign: "right",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: 18,
                      color: M.w45,
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
            padding: "14px 36px",
            borderTop: `1px solid ${M.borderSub}`,
            background: M.bgDark,
            gap: 0,
          }}
        >
          <div
            style={{ flex: 1, display: "flex", alignItems: "center", gap: 14 }}
          >
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: M.w45,
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
                color: M.w90,
                fontSize: 20,
                fontWeight: 900,
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
                  borderLeft: `1px solid ${M.borderSub}`,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: M.w45,
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
                    color: M.w90,
                    fontSize: 20,
                    fontWeight: 900,
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
