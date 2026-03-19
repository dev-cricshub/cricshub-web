import { MatchState, TeamDetails, PlayerStats } from "../types";
import { getBatTeam, getBowlTeam, fmtSR, fmtOv, fmtEcon } from "../helpers";
import { A } from "./theme";
import { AeroTeamBadge } from "./TeamBadge"; // Use the floating white badge

function AeroInningsPanel({
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
  const ROW_H = 42; // Slightly taller rows for the Aero aesthetic
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderBottom: `1px solid ${A.borderSub}`,
      }}
    >
      {/* Innings header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 32px", // Increased padding
          background: A.bgDeep, // Soft gray header
          borderBottom: `1px solid ${A.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              color: A.teal, // Dark text on light pill
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 2,
              textTransform: "uppercase",
              borderRadius: 100, // Perfect pill shape
              padding: "4px 10px",
              background: A.tealDim, // Soft tinted background
            }}
          >
            {inningsNum === 1 ? "1ST INN" : "2ND INN"}
          </span>
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              color: A.textMain, // Near black
              fontSize: 20,
              fontWeight: 800,
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
              fontSize: 24,
              fontWeight: 900,
            }}
          >
            {batTeam.score}/{batTeam.wickets}
          </span>
          <span style={{ color: A.t45, fontSize: 14, fontWeight: 600 }}>
            ({batTeam.overs} ov)
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              color: A.t25, // Very soft 'vs'
              fontSize: 12,
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: 1,
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            vs
          </span>
          <AeroTeamBadge
            name={bowlTeam.name}
            logoUrl={bowlTeam.logoUrl}
            size={32}
            accent={opponentAccent}
          />
          <span
            style={{
              color: A.t70, // Medium gray
              fontSize: 14,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
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
        <div style={{ flex: 1, borderRight: `1px solid ${A.border}` }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 24px",
              borderBottom: `1px solid ${A.border}`,
              background: A.bgLight, // Very soft column header
            }}
          >
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: A.t45,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2,
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
                    color: A.t45,
                    fontSize: 11,
                    fontWeight: 700,
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
                padding: "16px 24px",
                color: A.t45,
                fontSize: 13,
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: 1,
                fontWeight: 600,
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
                    padding: "0 24px",
                    background: A.bg, // Clean white rows
                    borderBottom:
                      i < batters.length - 1
                        ? `1px solid ${A.borderSub}` // Ultra soft divider
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
                        color: isNotOut ? A.textMain : A.t45, // Near black for not out, soft gray for out
                        fontWeight: isNotOut ? 700 : 500,
                        fontSize: 15,
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
                          fontSize: 11,
                          color: A.teal, // Accent colored text
                          background: A.tealDim, // Soft pill background
                          borderRadius: 100, // Perfect pill
                          padding: "2px 8px",
                          letterSpacing: 1,
                          flexShrink: 0,
                          fontWeight: 800,
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
                        fontWeight: 800,
                        fontSize: 16,
                        width: 36,
                        textAlign: "right",
                      }}
                    >
                      {p.runs}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        color: A.t70, // Medium gray
                        fontWeight: 600,
                        fontSize: 15,
                        width: 36,
                        textAlign: "right",
                      }}
                    >
                      {p.ballsFaced}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        color: A.t45, // Soft gray
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
                padding: "8px 24px",
                borderTop: `1px solid ${A.border}`,
                background: A.bgLight,
              }}
            >
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: A.t45,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                Extras
              </span>
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: A.t45,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <span
                  style={{ color: A.textMain, fontWeight: 800, marginRight: 8 }}
                >
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
              padding: "8px 24px",
              borderBottom: `1px solid ${A.border}`,
              background: A.bgLight,
            }}
          >
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: A.t45,
                fontSize: 11,
                fontWeight: 700,
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
                    color: A.t45,
                    fontSize: 11,
                    fontWeight: 700,
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
                padding: "16px 24px",
                color: A.t45,
                fontSize: 13,
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: 1,
                fontWeight: 600,
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
                  padding: "0 24px",
                  background: A.bg, // Clean white rows
                  borderBottom:
                    i < bowlers.length - 1
                      ? `1px solid ${A.borderSub}`
                      : "none",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: A.textMain, // Near black
                    fontWeight: 600,
                    fontSize: 15,
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
                      color: p.wicketsTaken > 0 ? accent : A.t70,
                      fontWeight: p.wicketsTaken > 0 ? 800 : 600,
                      fontSize: 16,
                      width: 36,
                      textAlign: "right",
                    }}
                  >
                    {p.wicketsTaken}-{p.runsConceded}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      color: A.t70,
                      fontWeight: 600,
                      fontSize: 15,
                      width: 36,
                      textAlign: "right",
                    }}
                  >
                    {fmtOv(p.overs)}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      color: A.t45,
                      fontWeight: 600,
                      fontSize: 14,
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

export function AeroMatchSummaryCard({ state }: { state: MatchState }) {
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
  // RENDER LOGIC (Aero Theme)
  // --------------------------------------------------------------------------
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 1460,
        animation: "aeroScaleIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both", // Springy aero animation
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          background: A.bg, // Clean white
          border: `1px solid ${A.borderSub}`, // Extremely subtle outer ring
          borderRadius: 24, // Premium large rounded corners
          overflow: "hidden",
          boxShadow: A.panelShadow, // Soft Apple-style shadow
        }}
      >
        {/* Soft top accent line */}
        <div style={{ height: 4, background: A.teal, opacity: 0.8 }} />

        {/* Title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "14px 36px",
            borderBottom: `1px solid ${A.border}`,
            background: A.bg, // Clean white title area
            gap: 16,
          }}
        >
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              color: A.t45,
              fontWeight: 800,
              fontSize: 16,
              letterSpacing: 6,
              textTransform: "uppercase",
            }}
          >
            Match Summary
          </span>
        </div>

        <AeroInningsPanel
          inningsNum={1}
          batTeam={inn1BatTeam}
          bowlTeam={inn1BowlTeam}
          batters={inn1Batters}
          bowlers={inn1Bowlers}
          accent={A.cyan}
          opponentAccent={A.pink}
        />
        {showInnings2 && (
          <AeroInningsPanel
            inningsNum={2}
            batTeam={inn2BatTeam}
            bowlTeam={inn2BowlTeam}
            batters={inn2Batters}
            bowlers={inn2Bowlers}
            accent={A.pink}
            opponentAccent={A.cyan}
          />
        )}

        {/* Status bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 36px",
            // If the match is complete, use a soft tinted background, otherwise soft gray
            background: state.matchComplete ? A.tealDim : A.bgDeep,
            borderTop: `1px solid ${A.border}`,
          }}
        >
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              color: state.matchComplete ? A.teal : A.textMain, // Highlight result, near black for ongoing
              fontWeight: 800,
              fontSize: state.matchComplete ? 20 : 18,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            {bar.text}
          </span>
          {bar.sub && (
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: state.matchComplete ? A.teal : A.t45, // Soft gray for sub text
                fontWeight: 800,
                fontSize: 18,
                letterSpacing: 1.5,
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
