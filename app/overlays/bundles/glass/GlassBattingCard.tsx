import { MatchState, TeamDetails, PlayerStats } from "../types";
import { dismissalText, fmtSR } from "../helpers";
import { B } from "./theme";
import { BroadcastTeamBadge } from "./TeamBadge";

export function BroadcastBattingCard({
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

  const battingFirstName = state.battingFirst?.name;
  const isInnings1Team = team.name === battingFirstName;
  const rawOrder: PlayerStats[] =
    (isInnings1Team
      ? (state as any).team1BattingOrder
      : (state as any).team2BattingOrder) || [];

  const strikerId = state.currentStriker?.playerId;
  const nonStrikerId = state.currentNonStriker?.playerId;
  const actualWickets = team.wickets;

  const seenIds = new Set<string>();
  const dedupedOrder: PlayerStats[] = [];
  for (const p of rawOrder) {
    if (!seenIds.has(p.playerId)) {
      seenIds.add(p.playerId);
      dedupedOrder.push(p);
    }
  }

  let dismissedCount = 0;
  const battedPlayers = dedupedOrder.map((p) => {
    const isAtCrease = p.playerId === strikerId || p.playerId === nonStrikerId;
    if (isAtCrease) return { ...p, wicketDetails: null };
    if (p.wicketDetails) {
      if (dismissedCount < actualWickets) {
        dismissedCount++;
        return p;
      } else return { ...p, wicketDetails: null };
    }
    return p;
  });
  const battedIds = new Set(battedPlayers.map((p) => p.playerId));
  const yetToBat = team.playingXI.filter((p) => !battedIds.has(p.playerId));
  const players = [...battedPlayers, ...yetToBat].slice(0, 11);

  const totalExtras = team.extras
    ? team.extras.wide +
      team.extras.noBall +
      team.extras.bye +
      team.extras.legBye +
      team.extras.penalty
    : 0;
  const ROW_H = 54;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 1180,
        fontFamily: "'Barlow Condensed', 'DM Sans', sans-serif",
        animation: "bcScaleIn 0.45s cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      <div
        style={{
          background: B.panelBg,
          borderRadius: 6,
          overflow: "hidden",
          boxShadow: `0 20px 50px rgba(0,0,0,0.7)`,
          border: `1px solid ${B.lineHard}`,
        }}
      >
        {/* Full Team Color Flood Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 36px",
            background: `linear-gradient(135deg, ${teamColorMid} 0%, ${teamColorDim} 100%)`,
            borderBottom: `4px solid ${teamColor}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <BroadcastTeamBadge
              name={team.name}
              logoUrl={team.logoUrl}
              size={70}
              teamColor={B.panelBgDeep}
              textColor={teamColor}
            />
            <div>
              <div
                style={{
                  color: B.white,
                  opacity: 0.9,
                  fontSize: 14,
                  fontWeight: 900,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  marginBottom: 2,
                }}
              >
                BATTING
              </div>
              <div
                style={{
                  color: B.white,
                  fontSize: 44,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  lineHeight: 1,
                  textShadow: `0 2px 10px rgba(0,0,0,0.4)`,
                }}
              >
                {team.name}
              </div>
            </div>
          </div>
          {(team.score > 0 || team.wickets > 0) && (
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  color: B.white,
                  fontSize: 60,
                  fontWeight: 900,
                  lineHeight: 1,
                  textShadow: `0 4px 16px rgba(0,0,0,0.6)`,
                }}
              >
                {team.score}/{team.wickets}
              </div>
              <div
                style={{
                  color: B.white,
                  opacity: 0.8,
                  fontSize: 20,
                  fontWeight: 800,
                  marginTop: 4,
                }}
              >
                {team.overs} OVERS
              </div>
            </div>
          )}
        </div>

        {/* Global Sub-background tint to tie the team color */}
        <div
          style={{
            background: `linear-gradient(to bottom, ${teamColor}0A, transparent)`,
          }}
        >
          {/* Column Headers */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: 44,
              padding: "0 36px",
              borderBottom: `2px solid ${B.lineHard}`,
              background: B.panelBgDeep,
            }}
          >
            <div style={{ width: 32, flexShrink: 0 }} />
            <div
              style={{
                flex: 1,
                color: B.w50,
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              BATTER
            </div>
            <div style={{ width: 260, flexShrink: 0 }} />
            {["R", "B", "4s", "6s", "SR"].map((h) => (
              <div
                key={h}
                style={{
                  width: h === "SR" ? 82 : 60,
                  textAlign: "right",
                  color: teamColor,
                  fontSize: 13,
                  fontWeight: 900,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div>
            {players.map((p, i) => {
              const isStriker = strikerId === p.playerId;
              const isNonStriker = nonStrikerId === p.playerId;
              const isAtCrease = isStriker || isNonStriker;
              const isOut = !!p.wicketDetails && !isAtCrease;
              const hasBat = (p.ballsFaced ?? 0) > 0;
              const isNotOut = isAtCrease || (!isOut && hasBat);
              const isCap = p.playerId === team.captainId;

              return (
                <div
                  key={`${p.playerId}-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    minHeight: ROW_H,
                    padding: "0 36px",
                    background: isAtCrease
                      ? `${teamColor}22`
                      : i % 2 === 0
                        ? "transparent"
                        : `${B.white}03`,
                    borderBottom:
                      i < players.length - 1
                        ? `1px solid ${B.lineDim}`
                        : "none",
                    borderLeft: isAtCrease
                      ? `6px solid ${teamColor}`
                      : "6px solid transparent",
                    opacity: isOut ? 0.6 : 1,
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      flexShrink: 0,
                      color: B.w30,
                      fontSize: 14,
                      fontWeight: 900,
                      textAlign: "right",
                      paddingRight: 10,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      overflow: "hidden",
                    }}
                  >
                    {isAtCrease && (
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          flexShrink: 0,
                          background: isStriker ? teamColor : B.w50,
                          boxShadow: isStriker
                            ? `0 0 10px ${teamColor}`
                            : "none",
                        }}
                      />
                    )}
                    <span
                      style={{
                        color: isNotOut ? B.white : B.w70,
                        fontWeight: isNotOut ? 900 : 700,
                        fontSize: 22,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {p.name}
                    </span>
                    {isCap && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 900,
                          color: B.panelBg,
                          background: teamColor,
                          borderRadius: 3,
                          padding: "2px 6px",
                          flexShrink: 0,
                          letterSpacing: 1,
                        }}
                      >
                        C
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      width: 260,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {isNotOut && !isOut && hasBat && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 900,
                          color: teamColor,
                          border: `1px solid ${teamColor}`,
                          borderRadius: 4,
                          padding: "3px 10px",
                          letterSpacing: 1.5,
                          textTransform: "uppercase",
                        }}
                      >
                        NOT OUT
                      </span>
                    )}
                    {isOut && (
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: B.w50,
                          textTransform: "uppercase",
                        }}
                      >
                        {dismissalText(p)}
                      </span>
                    )}
                  </div>
                  {hasBat || isAtCrease ? (
                    <>
                      <div
                        style={{
                          width: 60,
                          textAlign: "right",
                          color: teamColor,
                          fontSize: 26,
                          fontWeight: 900,
                          flexShrink: 0,
                          textShadow: isAtCrease
                            ? `0 0 15px ${teamColor}80`
                            : "none",
                        }}
                      >
                        {p.runs ?? 0}
                      </div>
                      <div
                        style={{
                          width: 60,
                          textAlign: "right",
                          color: B.white,
                          fontSize: 22,
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {p.ballsFaced ?? 0}
                      </div>
                      <div
                        style={{
                          width: 60,
                          textAlign: "right",
                          color: B.w70,
                          fontSize: 22,
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {p.fours ?? 0}
                      </div>
                      <div
                        style={{
                          width: 60,
                          textAlign: "right",
                          color: B.w70,
                          fontSize: 22,
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {p.sixes ?? 0}
                      </div>
                      <div
                        style={{
                          width: 82,
                          textAlign: "right",
                          color: B.w50,
                          fontSize: 18,
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {fmtSR(p.strikeRate ?? 0)}
                      </div>
                    </>
                  ) : (
                    [60, 60, 60, 60, 82].map((w, j) => (
                      <div
                        key={j}
                        style={{
                          width: w,
                          textAlign: "right",
                          color: B.w12,
                          fontSize: 18,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        —
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "16px 36px",
              borderTop: `2px solid ${B.lineHard}`,
              background: B.panelBgDeep,
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <span
                style={{
                  color: B.w50,
                  fontSize: 13,
                  fontWeight: 900,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                EXTRAS
              </span>
              <span style={{ color: B.white, fontSize: 24, fontWeight: 900 }}>
                {totalExtras}
              </span>
              {team.extras && (
                <span style={{ color: B.w50, fontSize: 14, fontWeight: 700 }}>
                  (W {team.extras.wide}, NB {team.extras.noBall}, B{" "}
                  {team.extras.bye}, LB {team.extras.legBye})
                </span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "0 32px",
                borderLeft: `1px solid ${B.lineHard}`,
                borderRight: `1px solid ${B.lineHard}`,
              }}
            >
              <span
                style={{
                  color: B.w50,
                  fontSize: 13,
                  fontWeight: 900,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                OVERS
              </span>
              <span style={{ color: B.white, fontSize: 24, fontWeight: 900 }}>
                {team.overs}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                paddingLeft: 32,
              }}
            >
              <span
                style={{
                  color: B.w50,
                  fontSize: 13,
                  fontWeight: 900,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                TOTAL
              </span>
              <span
                style={{
                  color: teamColor,
                  fontSize: 32,
                  fontWeight: 900,
                  textShadow: `0 0 20px ${teamColor}80`,
                }}
              >
                {team.score}/{team.wickets}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { BroadcastBattingCard as GlassBattingCard };
