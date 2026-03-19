import { MatchState } from "../types";
import { getBatTeam, getBowlTeam, fmtOv } from "../helpers";
import { C, ballStyle } from "./theme";
import { TeamBadge } from "./TeamBadge";

export function ScoreOverlay({ state }: { state: MatchState }) {
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
  const batOrder = isBatTeam1 ? state.innings1BattingOrder : state.innings2BattingOrder;
  const isBowlTeam1 = bowl.name === state.team1.name;
  const bowlOrder = isBowlTeam1 ? state.team1BowlingOrder : state.team2BowlingOrder;

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

  const divider = { borderRight: `1px solid ${C.border}` };

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        animation: "slideUp 0.4s cubic-bezier(0.16,1,0.3,1) both",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Accent line */}
      <div
        style={{
          height: 3,
          background: `linear-gradient(90deg, ${C.blue} 0%, ${C.gold} 40%, ${C.gold} 60%, ${C.purple} 100%)`,
        }}
      />

      {/* Bar */}
      <div
        style={{
          height: 88,
          background: C.bg,
          borderTop: `1px solid ${C.border}`,
          boxShadow: "0 -8px 48px rgba(0,0,0,0.7)",
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
            gap: 20,
            paddingRight: 32,
            ...divider,
            minWidth: 340,
          }}
        >
          <TeamBadge name={bat.name} logoUrl={bat.logoUrl} size={48} accent={C.blue} accentBg={C.blueDim} />
          <div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: C.w35,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2.5,
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              {bat.name}&nbsp;·&nbsp;{inning}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: C.white,
                  fontWeight: 900,
                  fontSize: 48,
                  lineHeight: 1,
                  letterSpacing: -1,
                }}
              >
                {bat.score}/{bat.wickets}
              </span>
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: C.w35,
                  fontSize: 17,
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
            gap: 6,
            padding: "0 28px",
            ...divider,
            minWidth: 120,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
            <span
              style={{
                color: C.w35,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              CRR
            </span>
            <span
              style={{
                color: C.gold,
                fontWeight: 900,
                fontSize: 24,
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              {crr}
            </span>
          </div>
          {!state.firstInnings && (
            <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
              <span
                style={{
                  color: C.w35,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  fontFamily: "'Barlow Condensed', sans-serif",
                }}
              >
                RRR
              </span>
              <span
                style={{
                  color: C.red,
                  fontWeight: 900,
                  fontSize: 24,
                  fontFamily: "'Barlow Condensed', sans-serif",
                }}
              >
                {rrr}
              </span>
            </div>
          )}
        </div>

        {/* TARGET — 2nd innings only */}
        {!state.firstInnings && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 3,
              padding: "0 28px",
              ...divider,
              minWidth: 150,
            }}
          >
            <div
              style={{
                color: C.w35,
                fontSize: 10,
                fontWeight: 700,
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
                fontSize: 30,
                color: C.white,
                lineHeight: 1,
              }}
            >
              {runsNeeded}{" "}
              <span style={{ color: C.w35, fontSize: 16, fontWeight: 600 }}>
                {" "}
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
            padding: "0 28px",
            ...divider,
            minWidth: 240,
          }}
        >
          <div
            style={{
              color: C.w35,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
          >
            Over {Math.min(state.completedOvers + 1, state.totalOvers)}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {displayBalls.map((b: string, i: number) => {
              const s = ballStyle(b);
              return (
                <div
                  key={i}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: s.bg,
                    border: `1.5px solid ${s.ring}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 900,
                    fontSize: 13,
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
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: C.w04,
                    border: `1px solid ${C.w10}`,
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
              padding: "0 28px",
              ...divider,
              minWidth: 320,
              maxWidth: 360,
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
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: isOn ? C.gold : C.w20,
                      boxShadow: isOn ? `0 0 8px ${C.gold}` : "none",
                    }}
                  />
                  <span
                    style={{
                      color: isOn ? C.white : C.w55,
                      fontWeight: isOn ? 700 : 500,
                      fontSize: isOn ? 15 : 13,
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
                      color: isOn ? C.gold : C.w55,
                      fontWeight: 900,
                      fontSize: isOn ? 19 : 15,
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
                            color: C.w35,
                            fontWeight: 600,
                            fontSize: 12,
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
              padding: "0 32px",
              minWidth: 190,
            }}
          >
            <div
              style={{
                color: C.w35,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              Bowling
            </div>
            <div style={{ color: C.white, fontWeight: 700, fontSize: 16, whiteSpace: "nowrap" }}>
              {bowler.name}
            </div>
            {bowS && (
              <div
                style={{
                  color: C.w55,
                  fontSize: 14,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  letterSpacing: 0.5,
                }}
              >
                {fmtOv(bowS.overs)} ov · {bowS.wicketsTaken}w · {bowS.runsConceded}r
              </div>
            )}
          </div>
        )}

        {/* FIELDING TEAM */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginLeft: "auto",
            paddingLeft: 32,
            borderLeft: `1px solid ${C.border}`,
          }}
        >
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: C.w35,
                fontSize: 11,
                fontWeight: 700,
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
                color: C.white,
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
          <TeamBadge name={bowl.name} logoUrl={bowl.logoUrl} size={48} accent={C.purple} accentBg={C.purpleDim} />
        </div>
      </div>
    </div>
  );
}
