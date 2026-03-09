import { MatchState, TeamDetails, PlayerStats } from "../types";
import { dismissalText, fmtSR } from "../helpers";
import { M } from "./theme";
import { MaterialTeamBadge } from "./TeamBadge"; // Make sure to create a flat version of your badge

export function MaterialBattingCard({
  team,
  state,
}: {
  team: TeamDetails;
  state: MatchState;
}) {
  // --------------------------------------------------------------------------
  // DATA LOGIC (Remains exactly the same)
  // --------------------------------------------------------------------------
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
        width: 1140,
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
          boxShadow: M.panelShadow, // Standard drop shadow, no glass inset
        }}
      >
        {/* Solid Team Accent Stripe (Replaces gradient/glow) */}
        <div style={{ height: 4, background: M.cyan }} />

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
              accent={M.cyan}
            />
            <div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: M.cyan,
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                BATTING
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
          {(team.score > 0 || team.wickets > 0) && (
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: M.cyan,
                  fontWeight: 900,
                  fontSize: 52,
                  lineHeight: 1,
                  textShadow: M.textGlow,
                }}
              >
                {team.score}/{team.wickets}
              </div>
              <div
                style={{
                  color: M.w45,
                  fontSize: 16,
                  fontWeight: 600,
                  marginTop: 2,
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
            height: 40,
            padding: "0 36px",
            borderBottom: `1px solid ${M.borderSub}`,
            background: M.bgDark,
          }}
        >
          <div style={{ width: 30, flexShrink: 0 }} />
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
            BATTER
          </div>
          <div
            style={{
              width: 280,
              fontFamily: "'Barlow Condensed', sans-serif",
              color: M.w45,
              fontSize: 12,
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

            // Solid alternating colors
            const rowBg = isAtCrease
              ? M.bgDark
              : i % 2 === 0
                ? M.bgLight
                : "transparent";

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
                      ? `1px solid ${M.borderSub}`
                      : "none",
                  borderLeft: isAtCrease
                    ? `4px solid ${M.teal}`
                    : "4px solid transparent", // Thicker solid border for active player
                  opacity: isOut ? 0.6 : 1, // Slightly more opaque than glass bundle for readability
                }}
              >
                <div
                  style={{
                    width: 30,
                    flexShrink: 0,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: M.w45,
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
                    gap: 8,
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
                        background: isStriker ? M.teal : M.w45,
                      }}
                    /> // Removed glowing dot
                  )}
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      color: isNotOut ? M.white : M.w70,
                      fontWeight: isNotOut ? 800 : 700,
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
                    width: 280,
                    flexShrink: 0,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: isNotOut ? M.teal : M.w45,
                    letterSpacing: isNotOut ? 1 : 0,
                    textTransform: isNotOut ? "uppercase" : "none",
                  }}
                >
                  {isOut ? dismissalText(p) : isNotOut ? "NOT OUT" : ""}
                </div>
                {hasBat || isAtCrease ? (
                  <>
                    <div
                      style={{
                        width: 60,
                        textAlign: "right",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 900,
                        fontSize: 21,
                        color: M.cyan,
                        flexShrink: 0,
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
                        fontSize: 19,
                        color: M.w70,
                        flexShrink: 0,
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
                        fontSize: 19,
                        color: M.w70,
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
                        fontSize: 19,
                        color: M.w70,
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
                        fontSize: 17,
                        color: M.w45,
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
                        fontSize: 17,
                        color: M.w25,
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
            padding: "14px 36px",
            borderTop: `1px solid ${M.borderSub}`,
            background: M.bgDark,
            gap: 0,
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}
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
              {totalExtras}
            </span>
            {team.extras && (
              <span
                style={{
                  color: M.w45,
                  fontSize: 13,
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
              padding: "0 28px",
              borderLeft: `1px solid ${M.borderSub}`,
              borderRight: `1px solid ${M.borderSub}`,
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
              {team.overs}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              paddingLeft: 28,
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
              Total
            </span>
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: M.teal,
                fontSize: 26,
                fontWeight: 900,
                letterSpacing: -0.5,
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
