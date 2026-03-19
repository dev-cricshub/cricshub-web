import { MatchState } from "../types";
import { getBatTeam, getBowlTeam, fmtOv } from "../helpers";
import { M, materialBallStyle } from "./theme";
import { MaterialTeamBadge } from "./TeamBadge"; // Use the flat badge

export function MaterialScoreOverlay({ state }: { state: MatchState }) {
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
  // RENDER LOGIC (Material Theme)
  // --------------------------------------------------------------------------
  const divider = { borderRight: `1px solid ${M.borderSub}` }; // Solid, flat divider

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        animation: "fadeSlideUp 0.3s cubic-bezier(0.0, 0.0, 0.2, 1) both", // Snappy material slide up
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Solid top accent border (Replaces glowing gradient) */}
      <div
        style={{
          height: 4,
          background: M.teal,
        }}
      />

      {/* Solid bar */}
      <div
        style={{
          height: 106,
          background: M.bgDeep, // Deepest background for high contrast on the bottom bar
          borderTop: `1px solid ${M.border}`,
          boxShadow: "0 -4px 12px rgba(0,0,0,0.5)", // Standard broadcast drop shadow
          display: "flex",
          alignItems: "stretch",
          padding: "0 40px",
        }}
      >
        {/* BATTING TEAM + SCORE */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            paddingRight: 28,
            ...divider,
            minWidth: 340,
          }}
        >
          <MaterialTeamBadge
            name={bat.name}
            logoUrl={bat.logoUrl}
            size={56}
            accent={M.cyan}
          />
          <div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: M.w45,
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: 2.5,
                textTransform: "uppercase",
                marginBottom: 1,
              }}
            >
              {bat.name}&nbsp;·&nbsp;{inning}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: M.white,
                  fontWeight: 900,
                  fontSize: 56,
                  lineHeight: 1,
                  letterSpacing: -1,
                  textShadow: M.textGlow, // Subtle depth, no neon glow
                }}
              >
                {bat.score}/{bat.wickets}
              </span>
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: M.w45,
                  fontSize: 18,
                  fontWeight: 700,
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
            minWidth: 120,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span
              style={{
                color: M.w45,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: "uppercase",
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              CRR
            </span>
            <span
              style={{
                color: M.teal,
                fontWeight: 900,
                fontSize: 28,
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
                  color: M.w45,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  fontFamily: "'Barlow Condensed', sans-serif",
                }}
              >
                RRR
              </span>
              <span
                style={{
                  color: M.coral,
                  fontWeight: 900,
                  fontSize: 28,
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
              minWidth: 155,
            }}
          >
            <div
              style={{
                color: M.w45,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: "uppercase",
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              Need
            </div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                fontSize: 34,
                color: M.white,
                lineHeight: 1,
              }}
            >
              {runsNeeded}{" "}
              <span style={{ color: M.w45, fontSize: 17, fontWeight: 700 }}>
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
            minWidth: 280,
          }}
        >
          <div
            style={{
              color: M.w45,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 2,
              textTransform: "uppercase",
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
          >
            Over {Math.min(state.completedOvers + 1, state.totalOvers)}
          </div>
          <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
            {displayBalls.map((b: string, i: number) => {
              const s = materialBallStyle(b); // Use flat material ball styles
              return (
                <div
                  key={i}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: s.bg,
                    border: s.border,
                    boxShadow: s.shadow,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 900,
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
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: M.bgLight, // Solid empty ball indicator
                    border: `1px solid ${M.borderSub}`,
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
              gap: 10,
              padding: "0 26px",
              ...divider,
              minWidth: 340,
              maxWidth: 380,
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
                      background: isOn ? M.teal : M.w25, // Solid dot indicator, no glow
                    }}
                  />
                  <span
                    style={{
                      color: isOn ? M.white : M.w70,
                      fontWeight: isOn ? 800 : 600,
                      fontSize: isOn ? 17 : 15,
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
                      color: isOn ? M.teal : M.w70,
                      fontWeight: 900,
                      fontSize: isOn ? 22 : 18,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      minWidth: 65,
                      textAlign: "right",
                    }}
                  >
                    {stats ? (
                      <>
                        {stats.runs}
                        <span
                          style={{
                            color: M.w45,
                            fontWeight: 700,
                            fontSize: 13,
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
              minWidth: 200,
            }}
          >
            <div
              style={{
                color: M.w45,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: "uppercase",
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              Bowling
            </div>
            <div
              style={{
                color: M.white,
                fontWeight: 800,
                fontSize: 17,
                whiteSpace: "nowrap",
              }}
            >
              {bowler.name}
            </div>
            {bowS && (
              <div
                style={{
                  color: M.w70,
                  fontSize: 15,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
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
            paddingLeft: 28,
            borderLeft: `1px solid ${M.borderSub}`, // Replaces the main border with sub-border for consistency
          }}
        >
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: M.w45,
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: 2.5,
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              FIELDING
            </div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: M.white,
                fontWeight: 900,
                fontSize: 26,
                lineHeight: 1,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                textShadow: M.textGlow,
              }}
            >
              {bowl.name}
            </div>
          </div>
          <MaterialTeamBadge
            name={bowl.name}
            logoUrl={bowl.logoUrl}
            size={56}
            accent={M.pink}
          />
        </div>
      </div>
    </div>
  );
}
