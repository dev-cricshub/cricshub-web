import { MatchState } from "../types";
import { getBatTeam, getBowlTeam, fmtOv } from "../helpers";
import { A, aeroBallStyle } from "./theme";
import { AeroTeamBadge } from "./TeamBadge";

export function AeroScoreOverlay({ state }: { state: MatchState }) {
  // --------------------------------------------------------------------------
  // DATA LOGIC (Remains identical)
  // --------------------------------------------------------------------------
  const bat = getBatTeam(state);
  const bowl = getBowlTeam(state);
  const crr = bat.overs > 0 ? (bat.score / bat.overs).toFixed(2) : "0.00";
  const target = bowl.score + 1;
  const runsNeeded = Math.max(0, target - bat.score);
  const ballsLeft = Math.max(0, Math.round((state.totalOvers - bat.overs) * 6));
  const rrr = ballsLeft > 0 ? ((runsNeeded / ballsLeft) * 6).toFixed(2) : "—";
  const inning = state.firstInnings ? "1ST INN" : "2ND INN";

  const displayBalls =
    state.currentOverBalls?.length > 0
      ? state.currentOverBalls
      : ((state.firstInnings ? state.innings1Overs : state.innings2Overs)
          ?.slice(-1)?.[0]
          ?.map(
            (b: any) => b.shortBallOutcome ?? b.getShortBallOutcome?.() ?? "",
          ) ?? []);

  const isBatTeam1 = bat.name === state.team1.name;
  const batOrder = isBatTeam1
    ? state.innings1BattingOrder
    : state.innings2BattingOrder;
  const isBowlTeam1 = bowl.name === state.team1.name;
  const bowlOrder = isBowlTeam1
    ? state.team1BowlingOrder
    : state.team2BowlingOrder;

  const striker = state.currentStriker;
  const nonStriker = state.currentNonStriker;
  const bowler = state.currentBowler;

  const stS = striker
    ? batOrder?.find((p) => p.playerId === striker.playerId) ||
      bat.playingXI.find((p) => p.playerId === striker.playerId)
    : null;
  const nsS = nonStriker
    ? batOrder?.find((p) => p.playerId === nonStriker.playerId) ||
      bat.playingXI.find((p) => p.playerId === nonStriker.playerId)
    : null;
  const bowS = bowler
    ? bowlOrder?.find((p) => p.playerId === bowler.playerId) ||
      bowl.playingXI.find((p) => p.playerId === bowler.playerId)
    : null;

  // --------------------------------------------------------------------------
  // RENDER LOGIC (Aero Theme)
  // --------------------------------------------------------------------------
  const divider = { borderRight: `1px solid ${A.border}` }; // Very soft divider

  return (
    <div
      style={{
        position: "absolute",
        bottom: 24, // Lifted off the bottom edge for the floating pill look
        left: "50%", // Centered horizontally
        transform: "translateX(-50%)", // Centered horizontally
        width: "max-content", // Allow it to wrap content, but...
        maxWidth: "96%", // ...don't let it touch the edges
        animation: "aeroSlideUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both", // Smooth, springy float-up
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Floating Pill Container */}
      <div
        style={{
          height: 100, // Slightly slimmer than Material
          background: A.bg, // Pure white
          borderRadius: 100, // Full pill shape
          boxShadow: A.panelShadow, // Soft premium shadow
          display: "flex",
          alignItems: "stretch",
          padding: "0 32px 0 16px", // Asymmetric padding to account for the left badge
          border: `1px solid ${A.borderSub}`, // Incredibly subtle outer ring
          overflow: "hidden", // Keep contents inside the pill
        }}
      >
        {/* BATTING TEAM + SCORE */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            paddingRight: 28,
            ...divider,
            minWidth: 310,
          }}
        >
          <div style={{ padding: "10px 0" }}>
            {" "}
            {/* Keep badge circular inside the flat flex container */}
            <AeroTeamBadge
              name={bat.name}
              logoUrl={bat.logoUrl}
              size={68} // Slightly larger badge to dominate the left side of the pill
              accent={A.cyan}
            />
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: A.t45, // Soft gray
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 1,
              }}
            >
              {bat.name}&nbsp;·&nbsp;{inning}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: A.textMain, // Near black for absolute clarity
                  fontWeight: 900,
                  fontSize: 52,
                  lineHeight: 1,
                  letterSpacing: -1,
                }}
              >
                {bat.score}/{bat.wickets}
              </span>
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: A.t45,
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                ({bat.overs}/{state.totalOvers})
              </span>
            </div>
          </div>
        </div>

        {/* CRR / RRR */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 5,
            padding: "0 26px",
            ...divider,
            minWidth: 110,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span
              style={{
                color: A.t45,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              CRR
            </span>
            <span
              style={{
                color: A.teal, // Deep teal pops on white
                fontWeight: 800,
                fontSize: 26,
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              {crr}
            </span>
          </div>
          {!state.firstInnings && (
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span
                style={{
                  color: A.t45,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  fontFamily: "'Barlow Condensed', sans-serif",
                }}
              >
                RRR
              </span>
              <span
                style={{
                  color: A.coral, // Red pops on white
                  fontWeight: 800,
                  fontSize: 26,
                  fontFamily: "'Barlow Condensed', sans-serif",
                }}
              >
                {rrr}
              </span>
            </div>
          )}
        </div>

        {/* TARGET */}
        {!state.firstInnings && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 2,
              padding: "0 26px",
              ...divider,
              minWidth: 140,
            }}
          >
            <div
              style={{
                color: A.t45,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              Need
            </div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 800,
                fontSize: 32,
                color: A.textMain, // Near black
                lineHeight: 1,
              }}
            >
              {runsNeeded}{" "}
              <span style={{ color: A.t45, fontSize: 16, fontWeight: 600 }}>
                off {ballsLeft}b
              </span>
            </div>
          </div>
        )}

        {/* THIS OVER */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 8,
            padding: "0 26px",
            ...divider,
            minWidth: 260,
          }}
        >
          <div
            style={{
              color: A.t45,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
          >
            Over {Math.min(state.completedOvers + 1, state.totalOvers)}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {displayBalls.map((b: string, i: number) => {
              const s = aeroBallStyle(b); // Soft, clean balls
              return (
                <div
                  key={i}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: s.bg,
                    border: s.border,
                    boxShadow: s.shadow,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 800,
                    fontSize: 15,
                    color: s.fg,
                  }}
                >
                  {b}
                </div>
              );
            })}
            {Array.from({ length: Math.max(0, 6 - displayBalls.length) }).map(
              (_, i) => (
                <div
                  key={`ep${i}`}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: A.bgLight, // Very soft gray for empty balls
                    border: `1px solid ${A.t06}`,
                  }}
                />
              ),
            )}
          </div>
        </div>

        {/* BATTERS */}
        {(striker || nonStriker) && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 8,
              padding: "0 26px",
              ...divider,
              minWidth: 310,
              maxWidth: 350,
            }}
          >
            {[
              { p: striker, stats: stS, isOn: true },
              { p: nonStriker, stats: nsS, isOn: false },
            ]
              .filter((x) => x.p)
              .map(({ p, stats, isOn }) => (
                <div
                  key={p!.playerId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: isOn ? A.teal : A.t12, // Crisp indicator dot
                    }}
                  />
                  <span
                    style={{
                      color: isOn ? A.textMain : A.t45, // Near black for active, gray for inactive
                      fontWeight: isOn ? 700 : 500,
                      fontSize: isOn ? 16 : 14,
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p!.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      color: isOn ? A.teal : A.t45,
                      fontWeight: 800,
                      fontSize: isOn ? 20 : 16,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      minWidth: 60,
                      textAlign: "right",
                    }}
                  >
                    {stats ? (
                      <>
                        {stats.runs}
                        <span
                          style={{
                            color: A.t45,
                            fontWeight: 600,
                            fontSize: 12,
                            marginLeft: 4,
                          }}
                        >
                          ({stats.ballsFaced})
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* BOWLER */}
        {bowler && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 4,
              padding: "0 26px",
              ...divider,
              minWidth: 180,
            }}
          >
            <div
              style={{
                color: A.t45,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              Bowling
            </div>
            <div
              style={{
                color: A.textMain, // Near black
                fontWeight: 700,
                fontSize: 16,
                whiteSpace: "nowrap",
              }}
            >
              {bowler.name}
            </div>
            {bowS && (
              <div
                style={{
                  color: A.t70, // Medium gray
                  fontSize: 14,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 600,
                  letterSpacing: 0.5,
                }}
              >
                {fmtOv(bowS.overs)} ov · {bowS.wicketsTaken}w ·{" "}
                {bowS.runsConceded}r
              </div>
            )}
          </div>
        )}

        {/* FIELDING TEAM */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginLeft: "auto",
            paddingLeft: 26,
            // Removed border-left here since the bowler handles the right border,
            // keeping the pill end perfectly clean.
          }}
        >
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: A.t45,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              FIELDING
            </div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: A.textMain, // Near black
                fontWeight: 800,
                fontSize: 24,
                lineHeight: 1,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              {bowl.name}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
