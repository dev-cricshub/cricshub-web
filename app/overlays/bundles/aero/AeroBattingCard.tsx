import { MatchState, TeamDetails, PlayerStats } from "../types";
import { dismissalText, fmtSR } from "../helpers";
import { A } from "./theme";
import { AeroTeamBadge } from "./TeamBadge";

export function AeroBattingCard({
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
  // RENDER LOGIC (Aero Theme)
  // --------------------------------------------------------------------------
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 1140,
        animation: "aeroScaleIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          background: A.bg, // Pure white
          border: `1px solid ${A.borderSub}`,
          borderRadius: 24, // High-end rounding
          overflow: "hidden",
          boxShadow: A.panelShadow,
        }}
      >
        {/* Soft Team Accent Stripe */}
        <div style={{ height: 4, background: A.cyan, opacity: 0.85 }} />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 40px",
            background: A.bg,
            borderBottom: `1px solid ${A.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <AeroTeamBadge
              name={team.name}
              logoUrl={team.logoUrl}
              size={64}
              accent={A.cyan}
            />
            <div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: A.t45,
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
                  color: A.textMain,
                  fontWeight: 800,
                  fontSize: 40,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  lineHeight: 1,
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
                  color: A.cyan,
                  fontWeight: 900,
                  fontSize: 56,
                  lineHeight: 1,
                }}
              >
                {team.score}/{team.wickets}
              </div>
              <div
                style={{
                  color: A.t45,
                  fontSize: 16,
                  fontWeight: 700,
                  marginTop: 4,
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
            padding: "0 40px",
            borderBottom: `1px solid ${A.borderSub}`,
            background: A.bgLight,
          }}
        >
          <div style={{ width: 30, flexShrink: 0 }} />
          <div
            style={{
              flex: 1,
              fontFamily: "'Barlow Condensed', sans-serif",
              color: A.t45,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 2.5,
              textTransform: "uppercase",
            }}
          >
            BATTER
          </div>
          <div style={{ width: 280 }} />
          {["R", "B", "4s", "6s", "SR"].map((h) => (
            <div
              key={h}
              style={{
                width: h === "SR" ? 82 : 60,
                textAlign: "right",
                fontFamily: "'Barlow Condensed', sans-serif",
                color: A.t45,
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

            const rowBg = isAtCrease
              ? A.cyanDim // Soft tinted blue for active pair
              : i % 2 === 0
                ? A.bg
                : A.bgLight;

            return (
              <div
                key={`${p.playerId}-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  minHeight: ROW_H,
                  padding: "0 40px",
                  background: rowBg,
                  borderBottom:
                    i < players.length - 1
                      ? `1px solid ${A.borderSub}`
                      : "none",
                  opacity: isOut ? 0.65 : 1,
                }}
              >
                <div
                  style={{
                    width: 30,
                    flexShrink: 0,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: A.t25,
                    fontSize: 14,
                    fontWeight: 700,
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
                    gap: 10,
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
                        background: isStriker ? A.teal : A.t25,
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      color: isNotOut ? A.textMain : A.t70,
                      fontWeight: isNotOut ? 800 : 600,
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
                        fontWeight: 800,
                        color: A.teal,
                        background: A.tealDim,
                        borderRadius: 100, // Pill badge
                        padding: "2px 8px",
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
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {isNotOut && (
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: 11,
                        fontWeight: 800,
                        color: A.teal,
                        background: A.tealDim,
                        borderRadius: 100,
                        padding: "3px 10px",
                        letterSpacing: 1,
                        textTransform: "uppercase",
                      }}
                    >
                      NOT OUT
                    </span>
                  )}
                  {isOut && (
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: 13,
                        fontWeight: 600,
                        color: A.t45,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
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
                        fontSize: 22,
                        color: A.cyan,
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
                        fontSize: 18,
                        color: A.t70,
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
                        fontSize: 18,
                        color: A.t70,
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
                        fontSize: 18,
                        color: A.t70,
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
                        fontSize: 16,
                        color: A.t45,
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
                        color: A.t12,
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
            padding: "18px 40px",
            borderTop: `1px solid ${A.border}`,
            background: A.bgDeep,
          }}
        >
          <div
            style={{ flex: 1, display: "flex", alignItems: "center", gap: 14 }}
          >
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: A.t45,
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
                color: A.textMain,
                fontSize: 22,
                fontWeight: 800,
              }}
            >
              {totalExtras}
            </span>
            {team.extras && (
              <span
                style={{
                  color: A.t45,
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
              padding: "0 32px",
              borderLeft: `1px solid ${A.borderSub}`,
              borderRight: `1px solid ${A.borderSub}`,
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: A.t45,
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
                display: "block",
                fontFamily: "'Barlow Condensed', sans-serif",
                color: A.textMain,
                fontSize: 22,
                fontWeight: 800,
              }}
            >
              {team.overs}
            </span>
          </div>
          <div style={{ paddingLeft: 32, textAlign: "right" }}>
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: A.t45,
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
                display: "block",
                fontFamily: "'Barlow Condensed', sans-serif",
                color: A.cyan,
                fontSize: 32,
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
