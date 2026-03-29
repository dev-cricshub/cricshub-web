import { MatchState, TeamDetails } from "../types";
import { getBatTeam, getBowlTeam, ROLE_META } from "../helpers";
import { B } from "./theme";
import { BroadcastTeamBadge } from "./TeamBadge";

function TeamColumn({
  team,
  teamColor,
  teamColorDim,
  teamColorMid,
  side,
}: {
  team: TeamDetails;
  teamColor: string;
  teamColorDim: string;
  teamColorMid: string;
  side: "left" | "right";
}) {
  const captainId = team.captainId?.toString();
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        background: `linear-gradient(180deg, ${teamColor}0A 0%, transparent 100%)`,
      }}
    >
      {/* Heavy TV Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "20px 28px",
          background: `linear-gradient(${side === "left" ? "90deg" : "270deg"}, ${teamColorMid} 0%, ${teamColorDim} 70%, transparent 100%)`,
          borderBottom: `2px solid ${teamColor}`,
          borderLeft: side === "right" ? `6px solid ${teamColor}` : undefined,
          borderRight: side === "left" ? `6px solid ${teamColor}` : undefined,
        }}
      >
        <BroadcastTeamBadge
          name={team.name}
          logoUrl={team.logoUrl}
          size={60}
          teamColor={B.panelBgDeep}
          textColor={teamColor}
        />
        <div
          style={{
            color: B.white,
            fontSize: 30,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: 1,
            lineHeight: 1,
            textShadow: `0 2px 10px rgba(0,0,0,0.5)`,
          }}
        >
          {team.name}
        </div>
      </div>

      <div style={{ padding: "8px 0" }}>
        {team.playingXI.slice(0, 11).map((p, idx) => {
          const isCaptain = captainId && p.playerId?.toString() === captainId;
          const roleMeta = p.role
            ? (ROLE_META[p.role.toUpperCase()] ?? null)
            : null;
          return (
            <div
              key={p.playerId}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0 28px",
                height: 50,
                background: idx % 2 === 0 ? "transparent" : `${B.white}03`,
                borderBottom: `1px solid ${B.lineDim}`,
              }}
            >
              <div
                style={{
                  width: 28,
                  flexShrink: 0,
                  color: teamColor,
                  fontSize: 14,
                  fontWeight: 900,
                  textAlign: "right",
                  marginRight: 16,
                  opacity: 0.8,
                }}
              >
                {idx + 1}
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    color: B.white,
                    fontSize: 20,
                    fontWeight: 700,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.name}
                </span>
                {isCaptain && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 900,
                      color: B.panelBg,
                      background: teamColor,
                      borderRadius: 3,
                      padding: "2px 6px",
                      letterSpacing: 1,
                      flexShrink: 0,
                    }}
                  >
                    C
                  </span>
                )}
              </div>
              {roleMeta && (
                <div
                  style={{
                    flexShrink: 0,
                    marginLeft: 10,
                    background: `${teamColor}1A`,
                    border: `1px solid ${teamColor}80`,
                    borderRadius: 4,
                    padding: "3px 12px",
                    color: teamColor,
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  {roleMeta.label}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BroadcastPlayingXIBothTeamsCard({
  state,
}: {
  state: MatchState;
}) {
  const { team1, team2 } = state;
  const tossSet = !!state.battingFirst;
  const inProgress =
    tossSet &&
    (team1.score > 0 ||
      team2.score > 0 ||
      !!state.currentStriker ||
      !!state.currentBowler);

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 1360,
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
        <div style={{ display: "flex", height: 6 }}>
          <div style={{ flex: 1, background: B.t1 }} />
          <div style={{ flex: 1, background: B.t2 }} />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 36px",
            borderBottom: `2px solid ${B.lineHard}`,
            background: B.panelBgDeep,
          }}
        >
          <span
            style={{
              color: B.white,
              fontSize: 16,
              fontWeight: 900,
              letterSpacing: 5,
              textTransform: "uppercase",
            }}
          >
            PLAYING XI
          </span>
          <span
            style={{
              color: B.white,
              opacity: 0.8,
              fontSize: 14,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 1.5,
            }}
          >
            {state.matchComplete && state.winner ? (
              <span
                style={{ color: B.gold, textShadow: `0 0 10px ${B.gold}80` }}
              >
                {state.winner} WON{state.winBy ? ` — ${state.winBy}` : ""}
              </span>
            ) : tossSet ? (
              `TOSS: ${state.tossWinner} WON — CHOSE TO ${state.choice}`
            ) : (
              "TOSS PENDING"
            )}
          </span>
        </div>

        <div style={{ display: "flex" }}>
          <TeamColumn
            team={team1}
            teamColor={B.t1}
            teamColorDim={B.t1Dim}
            teamColorMid={B.t1Mid}
            side="left"
          />
          <div
            style={{
              width: 2,
              background: B.lineHard,
              flexShrink: 0,
              boxShadow: `0 0 10px rgba(0,0,0,0.5)`,
            }}
          />
          <TeamColumn
            team={team2}
            teamColor={B.t2}
            teamColorDim={B.t2Dim}
            teamColorMid={B.t2Mid}
            side="right"
          />
        </div>

        {inProgress &&
          !state.matchComplete &&
          (() => {
            const bat = getBatTeam(state);
            const bowl = getBowlTeam(state);
            const isBatT1 = bat.name === team1.name;
            return (
              <div
                style={{
                  padding: "18px 36px",
                  borderTop: `2px solid ${B.lineHard}`,
                  background: B.panelBgDeep,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 24,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: B.live,
                    animation: "reelPing 1.4s ease-in-out infinite",
                    flexShrink: 0,
                    boxShadow: `0 0 15px ${B.live}`,
                  }}
                />
                <span
                  style={{
                    color: isBatT1 ? B.t1 : B.t2,
                    fontSize: 24,
                    fontWeight: 900,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  {bat.name}
                </span>
                <span
                  style={{
                    color: B.white,
                    fontSize: 40,
                    fontWeight: 900,
                    letterSpacing: 1,
                    lineHeight: 1,
                  }}
                >
                  {bat.score}/{bat.wickets}
                </span>
                <span
                  style={{
                    color: B.white,
                    opacity: 0.8,
                    fontSize: 18,
                    fontWeight: 800,
                  }}
                >
                  ({bat.overs} ov)
                </span>
                <span
                  style={{
                    color: B.w50,
                    fontSize: 18,
                    fontWeight: 900,
                    margin: "0 12px",
                  }}
                >
                  VS
                </span>
                <span
                  style={{
                    color: isBatT1 ? B.t2 : B.t1,
                    fontSize: 24,
                    fontWeight: 900,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  {bowl.name}
                </span>
              </div>
            );
          })()}
      </div>
    </div>
  );
}

export { BroadcastPlayingXIBothTeamsCard as GlassPlayingXIBothTeamsCard };
