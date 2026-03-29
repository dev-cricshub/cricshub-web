import { MatchState, TeamDetails, PlayerStats } from "../types";
import { getBatTeam, getBowlTeam, fmtSR, fmtOv, fmtEcon } from "../helpers";
import { B } from "./theme";
import { BroadcastTeamBadge } from "./TeamBadge";

// ═══════════════════════════════════════════════════════════
// BROADCAST MATCH SUMMARY CARD
// TV scorecard summary after match / at drinks break.
// Two innings side-by-side with batters + bowlers.
// Result bar at bottom in team color of winner.
// ═══════════════════════════════════════════════════════════

function InningsPanel({
  inningsNum,
  batTeam,
  bowlTeam,
  batters,
  bowlers,
  teamColor,
  teamColorDim,
  teamColorMid, // Added here
}: {
  inningsNum: number;
  batTeam: TeamDetails;
  bowlTeam: TeamDetails;
  batters: PlayerStats[];
  bowlers: PlayerStats[];
  teamColor: string;
  teamColorDim: string;
  teamColorMid: string; // Added here
}) {
  const ROW_H = 40;
  return (
    <div style={{ borderBottom: `1px solid ${B.lineHard}` }}>
      {/* Innings header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 32px",
          background: `linear-gradient(90deg, ${teamColorMid} 0%, ${teamColorDim} 60%, transparent 100%)`,
          borderLeft: `8px solid ${teamColor}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 900,
              color: B.panelBg,
              background: teamColor,
              borderRadius: 3,
              padding: "3px 8px",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {inningsNum === 1 ? "1ST INN" : "2ND INN"}
          </span>
          <span
            style={{
              color: B.white,
              fontSize: 26,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {batTeam.name}
          </span>
          <span
            style={{
              color: B.white,
              fontSize: 34,
              fontWeight: 900,
              textShadow: `0 2px 10px rgba(0,0,0,0.5)`,
            }}
          >
            {batTeam.score}/{batTeam.wickets}
          </span>
          <span
            style={{
              color: B.white,
              opacity: 0.8,
              fontSize: 16,
              fontWeight: 800,
            }}
          >
            ({batTeam.overs} ov)
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              color: B.w50,
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: 2,
            }}
          >
            VS
          </span>
          <span
            style={{
              color: B.white,
              opacity: 0.9,
              fontSize: 18,
              fontWeight: 800,
              textTransform: "uppercase",
            }}
          >
            {bowlTeam.name}
          </span>
        </div>
      </div>

      {/* Stats columns */}
      <div style={{ display: "flex" }}>
        {/* Batters */}
        <div style={{ flex: 1, borderRight: `1px solid ${B.lineHard}` }}>
          {/* Sub-header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "7px 20px",
              borderBottom: `1px solid ${B.lineHard}`,
              background: B.panelBgDeep,
            }}
          >
            <span
              style={{
                color: B.w50,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Batter
            </span>
            <div style={{ display: "flex", gap: 12 }}>
              {["R", "B", "SR"].map((h) => (
                <span
                  key={h}
                  style={{
                    color: B.w50,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 2,
                    width: 36,
                    textAlign: "right",
                  }}
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
          {batters.length === 0 ? (
            <div style={{ padding: "14px 20px", color: B.w30, fontSize: 13 }}>
              No batting data
            </div>
          ) : (
            batters.map((p, i) => {
              const isNotOut = !p.wicketDetails;
              return (
                <div
                  key={p.playerId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: ROW_H,
                    padding: "0 20px",
                    background: i % 2 === 0 ? "transparent" : B.panelBgMid,
                    borderBottom:
                      i < batters.length - 1
                        ? `1px solid ${B.lineDim}`
                        : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flex: 1,
                      overflow: "hidden",
                    }}
                  >
                    <span
                      style={{
                        color: isNotOut ? B.white : B.w70,
                        fontWeight: isNotOut ? 700 : 500,
                        fontSize: 16,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.name}
                    </span>
                    {isNotOut && (
                      <span
                        style={{
                          fontSize: 10,
                          color: teamColor,
                          border: `1px solid ${teamColor}`,
                          borderRadius: 3,
                          padding: "0 5px",
                          flexShrink: 0,
                        }}
                      >
                        *
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
                    <span
                      style={{
                        color: teamColor,
                        fontWeight: 900,
                        fontSize: 18,
                        width: 36,
                        textAlign: "right",
                      }}
                    >
                      {p.runs}
                    </span>
                    <span
                      style={{
                        color: B.w70,
                        fontWeight: 700,
                        fontSize: 16,
                        width: 36,
                        textAlign: "right",
                      }}
                    >
                      {p.ballsFaced}
                    </span>
                    <span
                      style={{
                        color: B.w50,
                        fontWeight: 600,
                        fontSize: 14,
                        width: 36,
                        textAlign: "right",
                      }}
                    >
                      {fmtSR(p.strikeRate)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          {batTeam.extras && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "7px 20px",
                borderTop: `1px solid ${B.lineHard}`,
                background: B.panelBgDeep,
              }}
            >
              <span
                style={{
                  color: B.w50,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                Extras
              </span>
              <span style={{ color: B.w90, fontSize: 13, fontWeight: 900 }}>
                {batTeam.extras.wide +
                  batTeam.extras.noBall +
                  batTeam.extras.bye +
                  batTeam.extras.legBye +
                  batTeam.extras.penalty}
                <span
                  style={{
                    color: B.w50,
                    fontSize: 11,
                    fontWeight: 600,
                    marginLeft: 6,
                  }}
                >
                  (W:{batTeam.extras.wide} NB:{batTeam.extras.noBall} B:
                  {batTeam.extras.bye} LB:{batTeam.extras.legBye})
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Bowlers */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "7px 20px",
              borderBottom: `1px solid ${B.lineHard}`,
              background: B.panelBgDeep,
            }}
          >
            <span
              style={{
                color: B.w50,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Bowler
            </span>
            <div style={{ display: "flex", gap: 12 }}>
              {["W-R", "O", "ECO"].map((h) => (
                <span
                  key={h}
                  style={{
                    color: B.w50,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 2,
                    width: 40,
                    textAlign: "right",
                  }}
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
          {bowlers.length === 0 ? (
            <div style={{ padding: "14px 20px", color: B.w30, fontSize: 13 }}>
              No bowling data
            </div>
          ) : (
            bowlers.map((p, i) => (
              <div
                key={p.playerId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  height: ROW_H,
                  padding: "0 20px",
                  background: i % 2 === 0 ? "transparent" : B.panelBgMid,
                  borderBottom:
                    i < bowlers.length - 1 ? `1px solid ${B.lineDim}` : "none",
                }}
              >
                <span
                  style={{
                    color: B.w70,
                    fontWeight: 600,
                    fontSize: 16,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    paddingRight: 10,
                  }}
                >
                  {p.name}
                </span>
                <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
                  <span
                    style={{
                      color: p.wicketsTaken > 0 ? teamColor : B.w70,
                      fontWeight: p.wicketsTaken > 0 ? 900 : 700,
                      fontSize: 18,
                      width: 40,
                      textAlign: "right",
                    }}
                  >
                    {p.wicketsTaken}-{p.runsConceded}
                  </span>
                  <span
                    style={{
                      color: B.w70,
                      fontWeight: 700,
                      fontSize: 16,
                      width: 40,
                      textAlign: "right",
                    }}
                  >
                    {fmtOv(p.overs)}
                  </span>
                  <span
                    style={{
                      color: B.w50,
                      fontWeight: 600,
                      fontSize: 14,
                      width: 40,
                      textAlign: "right",
                    }}
                  >
                    {fmtEcon(p.economyRate)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function BroadcastMatchSummaryCard({ state }: { state: MatchState }) {
  const inn1BatTeam =
    state.battingFirst?.name === state.team1.name ? state.team1 : state.team2;
  const inn1BowlTeam =
    inn1BatTeam.name === state.team1.name ? state.team2 : state.team1;
  const inn2BatTeam = inn1BowlTeam;
  const inn2BowlTeam = inn1BatTeam;

  const isInn1T1 = inn1BatTeam.name === state.team1.name;

  const strikerId = state.currentStriker?.playerId;
  const nonStrikerId = state.currentNonStriker?.playerId;

  function enrich(order: PlayerStats[], team: TeamDetails): PlayerStats[] {
    return order.map((p) => {
      const live = team.playingXI.find((x) => x.playerId === p.playerId);
      const enriched = live ?? p;
      const atCrease =
        enriched.playerId === strikerId || enriched.playerId === nonStrikerId;
      return atCrease ? { ...enriched, wicketDetails: null } : enriched;
    });
  }

  const inn1Batters = enrich(
    (state as any).team1BattingOrder ?? [],
    inn1BatTeam,
  )
    .filter((p) => p.ballsFaced > 0)
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 5);

  const inn1Bowlers = ((state as any).team1BowlingOrder ?? [])
    .sort(
      (a: PlayerStats, b: PlayerStats) =>
        b.wicketsTaken - a.wicketsTaken || a.economyRate - b.economyRate,
    )
    .slice(0, 5);

  const inn2Batters = enrich(
    (state as any).team2BattingOrder ?? [],
    inn2BatTeam,
  )
    .filter((p) => p.ballsFaced > 0)
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 5);

  const inn2Bowlers = ((state as any).team2BowlingOrder ?? [])
    .sort(
      (a: PlayerStats, b: PlayerStats) =>
        b.wicketsTaken - a.wicketsTaken || a.economyRate - b.economyRate,
    )
    .slice(0, 5);

  const showInn2 =
    !state.firstInnings || inn2Batters.length > 0 || inn2Bowlers.length > 0;

  // Status bar
  function statusBar() {
    if (state.matchComplete && state.winner) {
      return {
        text: `${state.winner.toUpperCase()} WON`,
        sub: state.winBy?.toUpperCase() ?? "",
        win: true,
        winnerIsT1: state.winner === state.team1.name,
      };
    }
    const bat = getBatTeam(state);
    const bowl = getBowlTeam(state);
    const crr = bat.overs > 0 ? (bat.score / bat.overs).toFixed(2) : "0.00";
    if (!state.firstInnings) {
      const target = bowl.score + 1;
      const runsNeeded = Math.max(0, target - bat.score);
      const ballsLeft = Math.max(
        0,
        Math.round((state.totalOvers - bat.overs) * 6),
      );
      const rrr =
        ballsLeft > 0 ? ((runsNeeded / ballsLeft) * 6).toFixed(2) : "—";
      return {
        text: `${bat.name.toUpperCase()} NEED ${runsNeeded} FROM ${ballsLeft} BALLS`,
        sub: `RRR  ${rrr}`,
        win: false,
        winnerIsT1: false,
      };
    }
    return {
      text: `${bat.name.toUpperCase()} — INNINGS IN PROGRESS`,
      sub: `CRR  ${crr}`,
      win: false,
      winnerIsT1: false,
    };
  }
  const bar = statusBar();
  const barColor = bar.win ? (bar.winnerIsT1 ? B.t1 : B.t2) : B.gold;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 1460,
        fontFamily: "'Barlow Condensed', 'DM Sans', sans-serif",
        animation: "bcScaleIn 0.45s cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      <div
        style={{
          background: B.panelBg,
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: B.shadow,
          border: `1px solid ${B.lineHard}`,
        }}
      >
        {/* Top split rail */}
        <div style={{ display: "flex", height: 5 }}>
          <div style={{ flex: 1, background: B.t1 }} />
          <div style={{ flex: 1, background: B.t2 }} />
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "13px 32px",
            borderBottom: `1px solid ${B.lineHard}`,
            background: B.panelBgDeep,
            gap: 18,
          }}
        >
          <div
            style={{
              height: 1,
              flex: 1,
              background: `linear-gradient(90deg, transparent, ${B.lineHard})`,
            }}
          />
          <span
            style={{
              color: B.w90,
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: 5,
              textTransform: "uppercase",
            }}
          >
            Match Summary
          </span>
          <div
            style={{
              height: 1,
              flex: 1,
              background: `linear-gradient(90deg, ${B.lineHard}, transparent)`,
            }}
          />
        </div>

        <InningsPanel
          inningsNum={1}
          batTeam={inn1BatTeam}
          bowlTeam={inn1BowlTeam}
          batters={inn1Batters}
          bowlers={inn1Bowlers}
          teamColor={isInn1T1 ? B.t1 : B.t2}
          teamColorDim={isInn1T1 ? B.t1Dim : B.t2Dim}
          teamColorMid={isInn1T1 ? B.t1Mid : B.t2Mid} // Added here
        />
        {showInn2 && (
          <InningsPanel
            inningsNum={2}
            batTeam={inn2BatTeam}
            bowlTeam={inn2BowlTeam}
            batters={inn2Batters}
            bowlers={inn2Bowlers}
            teamColor={isInn1T1 ? B.t2 : B.t1}
            teamColorDim={isInn1T1 ? B.t2Dim : B.t1Dim}
            teamColorMid={isInn1T1 ? B.t2Mid : B.t1Mid} // Added here
          />
        )}

        {/* Result / status bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 32px",
            background: bar.win ? `${barColor}22` : B.panelBgDeep,
            borderTop: `3px solid ${barColor}`,
          }}
        >
          <span
            style={{
              color: bar.win ? barColor : B.white,
              fontSize: bar.win ? 26 : 18,
              fontWeight: 900,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {bar.text}
          </span>
          {bar.sub && (
            <span
              style={{
                color: bar.win ? barColor : B.w70,
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              {bar.sub}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Re-export for backward compatibility with overlay page imports
export { BroadcastMatchSummaryCard as GlassMatchSummaryCard };
