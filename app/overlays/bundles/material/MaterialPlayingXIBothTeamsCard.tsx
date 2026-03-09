import { MatchState, TeamDetails } from "../types";
import { getBatTeam, getBowlTeam, ROLE_META } from "../helpers";
import { M } from "./theme";
import { MaterialTeamBadge } from "./TeamBadge"; // Make sure to use the flat badge

function MaterialTeamColumn({
  team,
  accent,
}: {
  team: TeamDetails;
  accent: string;
}) {
  const captainId = team.captainId?.toString();
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Team header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 22px",
          borderBottom: `1px solid ${M.borderSub}`,
          background: M.bgDeep, // Solid flat background
        }}
      >
        <MaterialTeamBadge
          name={team.name}
          logoUrl={team.logoUrl}
          size={44}
          accent={accent}
        />
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            color: M.white,
            fontWeight: 900,
            fontSize: 22,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            lineHeight: 1,
          }}
        >
          {team.name}
        </div>
      </div>

      {/* Player rows */}
      <div>
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
                padding: "0 20px",
                height: 46,
                borderBottom: `1px solid ${M.borderSub}`,
                background: idx % 2 === 0 ? "transparent" : M.bgLight, // Alternating solid row colors
              }}
            >
              <div
                style={{
                  width: 24,
                  flexShrink: 0,
                  color: M.w45,
                  fontSize: 13,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 800,
                  textAlign: "right",
                  marginRight: 12,
                }}
              >
                {idx + 1}
              </div>
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    color: M.w90,
                    fontSize: 16,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {p.name}
                </span>
                {isCaptain && (
                  <div
                    style={{
                      flexShrink: 0,
                      background: M.teal,
                      borderRadius: 2,
                      padding: "2px 6px",
                      color: M.bg,
                      fontSize: 10,
                      fontWeight: 900,
                      fontFamily: "'Barlow Condensed', sans-serif",
                      letterSpacing: 1,
                    }}
                  >
                    C
                  </div>
                )}
              </div>
              {roleMeta && (
                <div
                  style={{
                    marginLeft: 8,
                    flexShrink: 0,
                    background: M.bgDark,
                    border: `1px solid ${M.border}`,
                    borderRadius: 4,
                    padding: "2px 10px",
                    color: M.w70,
                    fontSize: 11,
                    fontWeight: 800,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    letterSpacing: 0.5,
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

export function MaterialPlayingXIBothTeamsCard({
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
        width: 1200,
        animation: "fadeScaleIn 0.3s cubic-bezier(0.0, 0.0, 0.2, 1) both", // Snappy material animation
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          background: M.bg,
          border: `1px solid ${M.border}`,
          borderRadius: 8, // Tighter broadcast radius
          overflow: "hidden",
          boxShadow: M.panelShadow, // Flat broadcast drop shadow
        }}
      >
        {/* Top solid accent split stripe */}
        <div
          style={{
            height: 4,
            background: `linear-gradient(90deg, ${M.cyan} 0%, ${M.cyan} 50%, ${M.pink} 50%, ${M.pink} 100%)`,
          }}
        />

        {/* Card header */}
        <div
          style={{
            padding: "10px 24px",
            borderBottom: `1px solid ${M.borderSub}`,
            background: M.bgDark, // Solid background
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              color: M.w45,
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            Playing XI
          </div>
        </div>

        {/* Two columns */}
        <div style={{ display: "flex" }}>
          <MaterialTeamColumn team={team1} accent={M.cyan} />
          <div style={{ width: 1, background: M.borderSub, flexShrink: 0 }} />
          <MaterialTeamColumn team={team2} accent={M.pink} />
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 24px",
            borderTop: `1px solid ${M.borderSub}`,
            background: M.bgDark,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <span
            style={{
              color: M.w45,
              fontSize: "clamp(13px, 1.3vw, 17px)",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {state.matchComplete && state.winner
              ? `${state.winner} won${state.winBy ? ` — ${state.winBy}` : ""}`
              : tossSet
                ? `Toss: ${state.tossWinner} won — elected to ${state.choice}`
                : "Toss Pending"}
          </span>

          {inProgress &&
            !state.matchComplete &&
            (() => {
              const bat = getBatTeam(state);
              const bowl = getBowlTeam(state);
              return (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "clamp(10px, 1.2vw, 18px)",
                  }}
                >
                  {/* Solid red dot for live indicator, no glowing shadow */}
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: M.coral,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      color: M.cyan,
                      fontSize: "clamp(15px, 1.6vw, 22px)",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 900,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                    }}
                  >
                    {bat.name}
                  </span>
                  <span
                    style={{
                      color: M.white,
                      fontSize: "clamp(20px, 2.2vw, 32px)",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 900,
                      letterSpacing: 1,
                      lineHeight: 1,
                    }}
                  >
                    {bat.score}/{bat.wickets}
                  </span>
                  <span
                    style={{
                      color: M.w45,
                      fontSize: "clamp(12px, 1.2vw, 16px)",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                    }}
                  >
                    ({bat.overs} ov)
                  </span>
                  <span
                    style={{
                      color: M.w25,
                      fontSize: "clamp(13px, 1.3vw, 18px)",
                      fontWeight: 800,
                      textTransform: "uppercase",
                    }}
                  >
                    vs
                  </span>
                  <span
                    style={{
                      color: M.pink,
                      fontSize: "clamp(15px, 1.6vw, 22px)",
                      fontFamily: "'Barlow Condensed', sans-serif",
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
    </div>
  );
}
