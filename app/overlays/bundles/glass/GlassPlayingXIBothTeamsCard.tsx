import { MatchState, TeamDetails } from "../types";
import { getBatTeam, getBowlTeam, ROLE_META } from "../helpers";
import { G } from "./theme";
import { GlassTeamBadge } from "./TeamBadge";

function GlassTeamColumn({
  team,
  accent,
  glow,
}: {
  team: TeamDetails;
  accent: string;
  glow: string;
}) {
  const captainId = team.captainId?.toString();
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Floating Team Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "20px 24px",
          background: `linear-gradient(180deg, ${accent}20 0%, transparent 100%)`, // Soft vertical glow
          borderBottom: `1px solid ${G.borderHighlight}`, // Edge light
        }}
      >
        <GlassTeamBadge
          name={team.name}
          logoUrl={team.logoUrl}
          size={54}
          accent={accent}
          glow={glow}
        />
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            color: G.white,
            fontWeight: 900,
            fontSize: 26,
            textTransform: "uppercase",
            letterSpacing: 1.5,
            lineHeight: 1,
            textShadow: G.textGlow,
          }}
        >
          {team.name}
        </div>
      </div>

      {/* Holographic Player Rows */}
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
                padding: "0 24px",
                height: 48,
                // Soft gradient rows instead of solid alternates
                background:
                  idx % 2 === 0
                    ? "transparent"
                    : `linear-gradient(90deg, transparent 0%, ${G.bgLight} 50%, transparent 100%)`,
              }}
            >
              <div
                style={{
                  width: 28,
                  flexShrink: 0,
                  color: G.w45, // Brighter index numbers
                  fontSize: 14,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 800,
                  textAlign: "right",
                  marginRight: 16,
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
                  gap: 10,
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    color: G.w90,
                    fontSize: 18,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    textShadow: "0 1px 4px rgba(0,0,0,0.8)", // Localized shadow for legibility over gradients
                  }}
                >
                  {p.name}
                </span>
                {isCaptain && (
                  <div
                    style={{
                      flexShrink: 0,
                      background: "rgba(0, 0, 0, 0.4)", // Dark glass pill
                      border: `1px solid ${G.teal}`, // Neon outline
                      boxShadow: `inset 0 0 8px ${G.tealDim}, 0 0 8px ${G.tealGlow}`, // Glowing edge
                      borderRadius: 4,
                      padding: "2px 8px",
                      color: G.teal,
                      fontSize: 11,
                      fontWeight: 900,
                      fontFamily: "'Barlow Condensed', sans-serif",
                      letterSpacing: 1.5,
                    }}
                  >
                    C
                  </div>
                )}
              </div>
              {roleMeta && (
                <div
                  style={{
                    marginLeft: 12,
                    flexShrink: 0,
                    background: "rgba(0, 0, 0, 0.4)", // Dark glass pill
                    border: `1px solid ${roleMeta.color}`, // Neon outline matching role
                    boxShadow: `inset 0 0 6px ${roleMeta.color}30, 0 0 6px ${roleMeta.color}30`,
                    borderRadius: 4,
                    padding: "3px 12px",
                    color: roleMeta.color,
                    fontSize: 11,
                    fontWeight: 800,
                    fontFamily: "'Barlow Condensed', sans-serif",
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

export function GlassPlayingXIBothTeamsCard({ state }: { state: MatchState }) {
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
        width: 1280, // Slightly wider to accommodate the internal floating panels
        animation: "glassScaleIn 0.45s cubic-bezier(0.16,1,0.3,1) both",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Outer Holographic Container */}
      <div
        style={{
          background: G.bg,
          backdropFilter: G.backdropBlur,
          WebkitBackdropFilter: G.backdropBlur,
          border: `1px solid ${G.borderShadow}`,
          borderTop: `1px solid ${G.borderHighlight}`, // Edge light
          borderLeft: `1px solid ${G.borderHighlight}`, // Edge light
          borderRadius: 24, // High tech curved edges
          overflow: "hidden",
          boxShadow: G.panelShadow,
          padding: "16px", // Internal padding to float the columns
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Top Header / Title Panel */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 24px",
            background: G.bgDeep, // Etched dark glass
            borderRadius: 16,
            border: `1px solid ${G.borderSub}`,
            boxShadow: "inset 0 4px 12px rgba(0,0,0,0.5)", // Indented look
          }}
        >
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              color: G.w70,
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: 6,
              textTransform: "uppercase",
            }}
          >
            Playing XI
          </div>

          <span
            style={{
              color: G.w45,
              fontSize: 14,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {state.matchComplete && state.winner ? (
              <span style={{ color: G.teal }}>
                {state.winner} won{state.winBy ? ` — ${state.winBy}` : ""}
              </span>
            ) : tossSet ? (
              `Toss: ${state.tossWinner} won — elected to ${state.choice}`
            ) : (
              "Toss Pending"
            )}
          </span>
        </div>

        {/* Inner Floating Columns Area */}
        <div
          style={{
            display: "flex",
            gap: 16, // Creates space between the two team panels
          }}
        >
          {/* Team 1 Floating Panel */}
          <div
            style={{
              flex: 1,
              background: G.bgDeep, // Frosted dark pane
              borderRadius: 16,
              border: `1px solid ${G.borderSub}`,
              overflow: "hidden",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            <GlassTeamColumn team={team1} accent={G.cyan} glow={G.cyanGlow} />
          </div>

          {/* Team 2 Floating Panel */}
          <div
            style={{
              flex: 1,
              background: G.bgDeep, // Frosted dark pane
              borderRadius: 16,
              border: `1px solid ${G.borderSub}`,
              overflow: "hidden",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            <GlassTeamColumn team={team2} accent={G.pink} glow={G.pinkGlow} />
          </div>
        </div>

        {/* Live Footer Panel */}
        {inProgress &&
          !state.matchComplete &&
          (() => {
            const bat = getBatTeam(state);
            const bowl = getBowlTeam(state);
            return (
              <div
                style={{
                  padding: "16px 32px",
                  background: G.bgDeep,
                  borderRadius: 16,
                  border: `1px solid ${G.borderSub}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center", // Centered for impact
                  gap: "clamp(12px, 1.5vw, 24px)",
                  boxShadow: "inset 0 4px 12px rgba(0,0,0,0.5)",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: G.coral,
                    boxShadow: `0 0 12px ${G.coral}, 0 0 24px ${G.coral}`, // High bloom neon
                    animation: "reelPing 1.4s ease-in-out infinite",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: G.cyan,
                    fontSize: 20,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 900,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    textShadow: G.cyanGlow,
                  }}
                >
                  {bat.name}
                </span>
                <span
                  style={{
                    color: G.white,
                    fontSize: 36,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 900,
                    letterSpacing: 1,
                    lineHeight: 1,
                    textShadow: G.textGlow,
                  }}
                >
                  {bat.score}/{bat.wickets}
                </span>
                <span
                  style={{
                    color: G.w70,
                    fontSize: 16,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                  }}
                >
                  ({bat.overs} ov)
                </span>
                <span
                  style={{
                    color: G.w25,
                    fontSize: 16,
                    fontWeight: 800,
                    margin: "0 12px",
                  }}
                >
                  VS
                </span>
                <span
                  style={{
                    color: G.pink,
                    fontSize: 20,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 900,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    textShadow: G.pinkGlow,
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
