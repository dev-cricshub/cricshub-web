import { MatchState, TeamDetails, PlayerStats } from "../types";
import { dismissalText, fmtSR } from "../helpers";
import { G } from "./theme";
import { GlassTeamBadge } from "./TeamBadge";

export function GlassBattingCard({
  team,
  state,
}: {
  team: TeamDetails;
  state: MatchState;
}) {
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

  const ROW_H = 52;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 1140,
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
            background: `linear-gradient(90deg, transparent, ${G.cyan}, ${G.teal}, ${G.cyan}, transparent)`,
            boxShadow: `0 0 20px ${G.cyan}, 0 0 10px ${G.white}`,
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
              accent={G.cyan}
              glow={G.cyanGlow}
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
                <span style={{ color: G.cyan, textShadow: G.cyanGlow }}>
                  BATTING
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
          {(team.score > 0 || team.wickets > 0) && (
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: G.cyan,
                  fontWeight: 900,
                  fontSize: 56,
                  lineHeight: 1,
                  textShadow: `0 0 24px ${G.cyanGlow}, ${G.textGlow}`,
                }}
              >
                {team.score}/{team.wickets}
              </div>
              <div
                style={{
                  color: G.w70,
                  fontSize: 18,
                  fontWeight: 700,
                  marginTop: 4,
                  textShadow: G.textGlow,
                }}
              >
                {team.overs} overs
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
          <div style={{ width: 30, flexShrink: 0 }} />
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
            BATTER
          </div>
          <div
            style={{
              width: 280,
              fontFamily: "'Barlow Condensed', sans-serif",
              color: G.w45,
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 2.5,
              textTransform: "uppercase",
            }}
          />
          {["R", "B", "4s", "6s", "SR"].map((h) => (
            <div
              key={h}
              style={{
                width: h === "SR" ? 82 : 60,
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

        {/* Player rows */}
        <div>
          {players.map((p, i) => {
            const isStriker = strikerId === p.playerId;
            const isNonStriker = nonStrikerId === p.playerId;
            const isAtCrease = isStriker || isNonStriker;
            const isOut = !!p.wicketDetails && !isAtCrease;
            const hasBat = (p.ballsFaced ?? 0) > 0;
            const isNotOut = isAtCrease || (!isOut && hasBat);
            const isCap = p.playerId === team.captainId;

            const rowBg = isAtCrease
              ? `linear-gradient(90deg, ${G.cyanDim} 0%, transparent 80%)`
              : i % 2 === 0
                ? "transparent"
                : G.bgLight;

            return (
              <div
                key={`${p.playerId}-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  minHeight: ROW_H,
                  padding: "0 36px",
                  background: rowBg,
                  borderBottom:
                    i < players.length - 1
                      ? `1px solid ${G.borderShadow}`
                      : "none",
                  borderLeft: isAtCrease
                    ? `4px solid ${G.cyan}`
                    : "4px solid transparent",
                  opacity: isOut ? 0.65 : 1, // Increased from 0.55 so text shadow works better over blur
                }}
              >
                <div
                  style={{
                    width: 30,
                    flexShrink: 0,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: G.w25,
                    fontSize: 14,
                    fontWeight: 800,
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
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: isStriker ? G.cyan : G.w45,
                        boxShadow: isStriker
                          ? `0 0 8px ${G.cyan}, 0 0 16px ${G.cyanGlow}`
                          : "none",
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      color: isNotOut ? G.white : G.w70,
                      fontWeight: isNotOut ? 800 : 700,
                      fontSize: 22,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      textShadow: isNotOut ? G.textGlow : "none",
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
                    width: 280,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {isNotOut && (
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: 12,
                        fontWeight: 900,
                        color: G.cyan,
                        border: `1px solid ${G.cyan}`,
                        boxShadow: `inset 0 0 6px ${G.cyanGlow}, 0 0 6px ${G.cyanGlow}`,
                        borderRadius: 4,
                        padding: "2px 10px",
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        background: "rgba(0,0,0,0.4)",
                      }}
                    >
                      NOT OUT
                    </span>
                  )}
                  {isOut && (
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: 14,
                        fontWeight: 600,
                        color: G.w45,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
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
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 900,
                        fontSize: 24,
                        color: G.cyan,
                        flexShrink: 0,
                        textShadow: G.textGlow,
                      }}
                    >
                      {p.runs ?? 0}
                    </div>
                    <div
                      style={{
                        width: 60,
                        textAlign: "right",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700,
                        fontSize: 20,
                        color: G.white,
                        flexShrink: 0,
                        textShadow: G.textGlow,
                      }}
                    >
                      {p.ballsFaced ?? 0}
                    </div>
                    <div
                      style={{
                        width: 60,
                        textAlign: "right",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700,
                        fontSize: 20,
                        color: G.w70,
                        flexShrink: 0,
                      }}
                    >
                      {p.fours ?? 0}
                    </div>
                    <div
                      style={{
                        width: 60,
                        textAlign: "right",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700,
                        fontSize: 20,
                        color: G.w70,
                        flexShrink: 0,
                      }}
                    >
                      {p.sixes ?? 0}
                    </div>
                    <div
                      style={{
                        width: 82,
                        textAlign: "right",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700,
                        fontSize: 18,
                        color: G.w45,
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
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700,
                        fontSize: 18,
                        color: G.w12,
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
            style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}
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
              {totalExtras}
            </span>
            {team.extras && (
              <span
                style={{
                  color: G.w45,
                  fontSize: 14,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 600,
                }}
              >
                (w {team.extras.wide}, nb {team.extras.noBall}, b{" "}
                {team.extras.bye}, lb {team.extras.legBye})
              </span>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "0 32px",
              borderLeft: `1px solid ${G.borderSub}`,
              borderRight: `1px solid ${G.borderSub}`,
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
              Overs
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
                fontFamily: "'Barlow Condensed', sans-serif",
                color: G.w45,
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Total
            </span>
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: G.cyan,
                fontSize: 28,
                fontWeight: 900,
                letterSpacing: -0.5,
                textShadow: `0 0 16px ${G.cyanGlow}, ${G.textGlow}`,
              }}
            >
              {team.score}/{team.wickets}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
