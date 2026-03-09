import { MatchState, TeamDetails } from "../types";
import { getBatTeam, getBowlTeam, ROLE_META } from "../helpers";
import { A } from "./theme";
import { AeroTeamBadge } from "./TeamBadge"; // Use the floating white badge

function AeroTeamColumn({
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
          gap: 14,
          padding: "16px 24px",
          borderBottom: `1px solid ${A.borderSub}`,
          background: A.bgLight, // Very soft gray for the column header
        }}
      >
        <AeroTeamBadge
          name={team.name}
          logoUrl={team.logoUrl}
          size={48}
          accent={accent}
        />
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            color: A.textMain, // Near-black for high contrast
            fontWeight: 800,
            fontSize: 24,
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
                padding: "0 24px",
                height: 50, // Slightly taller for breathing room
                borderBottom: `1px solid ${A.borderSub}`,
                background: idx % 2 === 0 ? "transparent" : A.bgLight, // Clean alternating rows
              }}
            >
              <div
                style={{
                  width: 24,
                  flexShrink: 0,
                  color: A.t25, // Soft muted gray for the index numbers
                  fontSize: 13,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  textAlign: "right",
                  marginRight: 14,
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
                  gap: 8,
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    color: A.t90, // Standard dark text
                    fontSize: 16,
                    fontWeight: 600,
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
                      background: A.tealDim, // Soft tinted pill
                      borderRadius: 100, // Perfect pill shape
                      padding: "2px 8px",
                      color: A.teal, // Accent colored text
                      fontSize: 10,
                      fontWeight: 800,
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
                    background: A.bgDeep, // Soft gray pill
                    border: `1px solid ${A.border}`, // Subtle edge
                    borderRadius: 100, // Perfect pill shape
                    padding: "3px 10px",
                    color: A.t70, // Medium gray text
                    fontSize: 10,
                    fontWeight: 700,
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

export function AeroPlayingXIBothTeamsCard({ state }: { state: MatchState }) {
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
        animation: "aeroScaleIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both", // Smooth springy entry
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          background: A.bg, // Pure white
          border: `1px solid ${A.borderSub}`, // Extremely subtle outer line
          borderRadius: 24, // Premium large rounding
          overflow: "hidden",
          boxShadow: A.panelShadow, // Soft, diffused Apple-style shadow
        }}
      >
        {/* Soft top accent line */}
        <div
          style={{
            height: 4,
            background: `linear-gradient(90deg, ${A.cyan} 0%, ${A.cyan} 50%, ${A.pink} 50%, ${A.pink} 100%)`,
            opacity: 0.85, // Slightly muted so it doesn't overpower the light theme
          }}
        />

        {/* Card header */}
        <div
          style={{
            padding: "14px 24px",
            borderBottom: `1px solid ${A.border}`,
            background: A.bg, // Clean white header
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              color: A.t45, // Muted gray
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            Playing XI
          </div>
        </div>

        {/* Two columns */}
        <div style={{ display: "flex" }}>
          <AeroTeamColumn team={team1} accent={A.cyan} />
          <div style={{ width: 1, background: A.borderSub, flexShrink: 0 }} />
          <AeroTeamColumn team={team2} accent={A.pink} />
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 28px", // Slightly more padding for breathing room
            borderTop: `1px solid ${A.border}`,
            background: A.bgDeep, // Soft gray footer base
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <span
            style={{
              color: A.t45, // Muted gray for secondary info
              fontSize: "clamp(13px, 1.3vw, 17px)",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 600,
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
                  {/* Clean flat red dot */}
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: A.coral,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      color: A.cyan,
                      fontSize: "clamp(15px, 1.6vw, 22px)",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 800,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                    }}
                  >
                    {bat.name}
                  </span>
                  <span
                    style={{
                      color: A.textMain, // Heavy dark text for the score
                      fontSize: "clamp(20px, 2.2vw, 32px)",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 800,
                      letterSpacing: 0,
                      lineHeight: 1,
                    }}
                  >
                    {bat.score}/{bat.wickets}
                  </span>
                  <span
                    style={{
                      color: A.t45,
                      fontSize: "clamp(12px, 1.2vw, 16px)",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    ({bat.overs} ov)
                  </span>
                  <span
                    style={{
                      color: A.t25, // Very soft 'vs'
                      fontSize: "clamp(13px, 1.3vw, 18px)",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    vs
                  </span>
                  <span
                    style={{
                      color: A.pink,
                      fontSize: "clamp(15px, 1.6vw, 22px)",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 800,
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
