import { MatchState, TeamDetails, PlayerStats } from "../types";
import { getBatTeam, getBowlTeam, fmtSR, fmtOv, fmtEcon } from "../helpers";
import { M } from "./theme";
import { MaterialTeamBadge } from "./TeamBadge"; // Use the flat badge

function MaterialInningsPanel({
  inningsNum,
  batTeam,
  bowlTeam,
  batters,
  bowlers,
  accent,
  opponentAccent,
}: {
  inningsNum: number;
  batTeam: TeamDetails;
  bowlTeam: TeamDetails;
  batters: PlayerStats[];
  bowlers: PlayerStats[];
  accent: string;
  opponentAccent: string;
}) {
  const ROW_H = 38;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderBottom: `1px solid ${M.borderSub}`,
      }}
    >
      {/* Innings header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 28px",
          background: M.bgDark, // Solid background
          borderBottom: `1px solid ${M.borderSub}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              color: M.bg,
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: 2,
              textTransform: "uppercase",
              borderRadius: 4,
              padding: "2px 8px",
              background: M.teal,
            }}
          >
            {inningsNum === 1 ? "1ST INN" : "2ND INN"}
          </span>
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              color: M.white,
              fontSize: 18,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {batTeam.name}
          </span>
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              color: accent,
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            {batTeam.score}/{batTeam.wickets}
          </span>
          <span style={{ color: M.w45, fontSize: 13, fontWeight: 600 }}>
            ({batTeam.overs} ov)
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              color: M.w45,
              fontSize: 11,
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: 1,
              textTransform: "uppercase",
              fontWeight: 800,
            }}
          >
            vs
          </span>
          <MaterialTeamBadge
            name={bowlTeam.name}
            logoUrl={bowlTeam.logoUrl}
            size={28}
            accent={opponentAccent}
          />
          <span
            style={{
              color: M.w70,
              fontSize: 13,
              fontFamily: "'Barlow Condensed', sans-serif",
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
        {/* BATTERS */}
        <div style={{ flex: 1, borderRight: `1px solid ${M.borderSub}` }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 20px",
              borderBottom: `1px solid ${M.borderSub}`,
              background: M.bgDeep,
            }}
          >
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: M.w45,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 2.5,
                textTransform: "uppercase",
              }}
            >
              Batter
            </span>
            <div style={{ display: "flex", gap: 16 }}>
              {["R", "B", "SR"].map((h) => (
                <span
                  key={h}
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: M.w45,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 2,
                    textTransform: "uppercase",
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
            <div
              style={{
                padding: "14px 20px",
                color: M.w45,
                fontSize: 12,
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: 1,
                fontWeight: 700,
              }}
            >
              NO BATTING DATA
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
                    background: i % 2 === 0 ? M.bgLight : "transparent", // Flat alternating rows
                    borderBottom:
                      i < batters.length - 1
                        ? `1px solid ${M.borderSub}`
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
                        fontFamily: "'Barlow Condensed', sans-serif",
                        color: isNotOut ? M.white : M.w70,
                        fontWeight: 700,
                        fontSize: 14,
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
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontSize: 10,
                          color: M.bg,
                          background: M.teal,
                          borderRadius: 2,
                          padding: "1px 5px",
                          letterSpacing: 1,
                          flexShrink: 0,
                          fontWeight: 900,
                        }}
                      >
                        *
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        color: accent,
                        fontWeight: 900,
                        fontSize: 15,
                        width: 36,
                        textAlign: "right",
                      }}
                    >
                      {p.runs}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        color: M.w70,
                        fontWeight: 700,
                        fontSize: 14,
                        width: 36,
                        textAlign: "right",
                      }}
                    >
                      {p.ballsFaced}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        color: M.w45,
                        fontWeight: 700,
                        fontSize: 13,
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
                padding: "6px 20px",
                borderTop: `1px solid ${M.borderSub}`,
                background: M.bgDeep,
              }}
            >
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: M.w45,
                  fontSize: 10,
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
                  color: M.w45,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <span style={{ color: M.w90, fontWeight: 900, marginRight: 8 }}>
                  {batTeam.extras.wide +
                    batTeam.extras.noBall +
                    batTeam.extras.bye +
                    batTeam.extras.legBye +
                    batTeam.extras.penalty}
                </span>
                (W:{batTeam.extras.wide} NB:{batTeam.extras.noBall} B:
                {batTeam.extras.bye} LB:{batTeam.extras.legBye})
              </span>
            </div>
          )}
        </div>

        {/* BOWLERS */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 20px",
              borderBottom: `1px solid ${M.borderSub}`,
              background: M.bgDeep,
            }}
          >
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: M.w45,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 2.5,
                textTransform: "uppercase",
              }}
            >
              Bowler
            </span>
            <div style={{ display: "flex", gap: 16 }}>
              {["W-R", "O", "ECO"].map((h) => (
                <span
                  key={h}
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: M.w45,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    width: 36,
                    textAlign: "right",
                  }}
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
          {bowlers.length === 0 ? (
            <div
              style={{
                padding: "14px 20px",
                color: M.w45,
                fontSize: 12,
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: 1,
                fontWeight: 700,
              }}
            >
              NO BOWLING DATA
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
                  background: i % 2 === 0 ? M.bgLight : "transparent",
                  borderBottom:
                    i < bowlers.length - 1
                      ? `1px solid ${M.borderSub}`
                      : "none",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: M.w70,
                    fontWeight: 700,
                    fontSize: 14,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                    paddingRight: 12,
                  }}
                >
                  {p.name}
                </span>
                <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      color: p.wicketsTaken > 0 ? accent : M.w70,
                      fontWeight: p.wicketsTaken > 0 ? 900 : 700,
                      fontSize: 15,
                      width: 36,
                      textAlign: "right",
                    }}
                  >
                    {p.wicketsTaken}-{p.runsConceded}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      color: M.w70,
                      fontWeight: 700,
                      fontSize: 14,
                      width: 36,
                      textAlign: "right",
                    }}
                  >
                    {fmtOv(p.overs)}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      color: M.w45,
                      fontWeight: 700,
                      fontSize: 13,
                      width: 36,
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

export function MaterialMatchSummaryCard({ state }: { state: MatchState }) {
  // --------------------------------------------------------------------------
  // DATA LOGIC (Remains identical)
  // --------------------------------------------------------------------------
  const inn1BatTeam =
    state.battingFirst?.name === state.team1.name ? state.team1 : state.team2;
  const inn1BowlTeam =
    inn1BatTeam.name === state.team1.name ? state.team2 : state.team1;
  const inn2BatTeam = inn1BowlTeam;
  const inn2BowlTeam = inn1BatTeam;
  const strikerId = state.currentStriker?.playerId;
  const nonStrikerId = state.currentNonStriker?.playerId;

  const inn1Batters: PlayerStats[] = ((state as any).team1BattingOrder ?? [])
    .filter((p: PlayerStats) => p.ballsFaced > 0)
    .map((p: PlayerStats) => {
      const live = inn1BatTeam.playingXI.find((x) => x.playerId === p.playerId);
      const enriched = live ?? p;
      const isAtCrease =
        enriched.playerId === strikerId || enriched.playerId === nonStrikerId;
      return isAtCrease ? { ...enriched, wicketDetails: null } : enriched;
    })
    .sort((a: PlayerStats, b: PlayerStats) => b.runs - a.runs)
    .slice(0, 4);

  const inn1Bowlers: PlayerStats[] = ((state as any).team1BowlingOrder ?? [])
    .sort(
      (a: PlayerStats, b: PlayerStats) =>
        b.wicketsTaken - a.wicketsTaken || a.economyRate - b.economyRate,
    )
    .slice(0, 4);

  const inn2Batters: PlayerStats[] = ((state as any).team2BattingOrder ?? [])
    .filter((p: PlayerStats) => p.ballsFaced > 0)
    .map((p: PlayerStats) => {
      const live = inn2BatTeam.playingXI.find((x) => x.playerId === p.playerId);
      const enriched = live ?? p;
      const isAtCrease =
        enriched.playerId === strikerId || enriched.playerId === nonStrikerId;
      return isAtCrease ? { ...enriched, wicketDetails: null } : enriched;
    })
    .sort((a: PlayerStats, b: PlayerStats) => b.runs - a.runs)
    .slice(0, 4);

  const inn2Bowlers: PlayerStats[] = ((state as any).team2BowlingOrder ?? [])
    .sort(
      (a: PlayerStats, b: PlayerStats) =>
        b.wicketsTaken - a.wicketsTaken || a.economyRate - b.economyRate,
    )
    .slice(0, 4);

  const showInnings2 =
    !state.firstInnings || inn2Batters.length > 0 || inn2Bowlers.length > 0;

  function statusBar() {
    if (state.matchComplete && state.winner) {
      return {
        text: `${state.winner.toUpperCase()} WON`,
        sub: state.winBy ? state.winBy.toUpperCase() : "",
        isResult: true,
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
        text: `${bat.name.toUpperCase()} NEED ${runsNeeded} OFF ${ballsLeft} BALLS`,
        sub: `RRR  ${rrr}`,
        isResult: false,
      };
    }
    return {
      text: `${bat.name.toUpperCase()} — INNINGS IN PROGRESS`,
      sub: `CRR  ${crr}`,
      isResult: false,
    };
  }
  const bar = statusBar();

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
        width: 1460,
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
        {/* Solid top accent stripe (Replaces gradient glow) */}
        <div style={{ height: 4, background: M.teal }} />

        {/* Title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px 36px",
            borderBottom: `1px solid ${M.borderSub}`,
            background: M.bgDeep,
            gap: 16,
          }}
        >
          {/* Removed fading gradient lines for a cleaner header */}
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              color: M.w45,
              fontWeight: 900,
              fontSize: 17,
              letterSpacing: 5,
              textTransform: "uppercase",
            }}
          >
            Match Summary
          </span>
        </div>

        <MaterialInningsPanel
          inningsNum={1}
          batTeam={inn1BatTeam}
          bowlTeam={inn1BowlTeam}
          batters={inn1Batters}
          bowlers={inn1Bowlers}
          accent={M.cyan}
          opponentAccent={M.pink}
        />
        {showInnings2 && (
          <MaterialInningsPanel
            inningsNum={2}
            batTeam={inn2BatTeam}
            bowlTeam={inn2BowlTeam}
            batters={inn2Batters}
            bowlers={inn2Bowlers}
            accent={M.pink}
            opponentAccent={M.cyan}
          />
        )}

        {/* Status bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 36px",
            // Use a solid highlight color if the match is complete, otherwise a standard dark footer
            background: state.matchComplete ? M.tealDim : M.bgDark,
          }}
        >
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              color: state.matchComplete ? M.white : M.w90,
              fontWeight: 900,
              fontSize: state.matchComplete ? 20 : 16,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {bar.text}
          </span>
          {bar.sub && (
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: state.matchComplete ? M.cyan : M.teal,
                fontWeight: 900,
                fontSize: 16,
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
