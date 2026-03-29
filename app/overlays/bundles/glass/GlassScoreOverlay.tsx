import { MatchState } from "../types";
import { getBatTeam, getBowlTeam, fmtOv } from "../helpers";
import { B, broadcastBallStyle } from "./theme";
import { BroadcastTeamBadge } from "./TeamBadge";

export function BroadcastScoreOverlay({ state }: { state: MatchState }) {
  const bat = getBatTeam(state);
  const bowl = getBowlTeam(state);
  if (!bat || !bowl) return null;

  const isBatTeam1 = bat.name === state.team1.name;

  // Active team colors
  const batColor = isBatTeam1 ? B.t1 : B.t2;
  const batDim = isBatTeam1 ? B.t1Dim : B.t2Dim;
  const bowlColor = isBatTeam1 ? B.t2 : B.t1;
  const bowlDim = isBatTeam1 ? B.t2Dim : B.t1Dim;

  const crr =
    (bat?.overs ?? 0) > 0 ? (bat!.score / bat!.overs).toFixed(2) : "0.00";
  const target = (bowl?.score ?? 0) + 1;
  const runsNeeded = Math.max(0, target - (bat?.score ?? 0));
  const ballsLeft = Math.max(
    0,
    Math.round((state.totalOvers - (bat?.overs ?? 0)) * 6),
  );
  const rrr = ballsLeft > 0 ? ((runsNeeded / ballsLeft) * 6).toFixed(2) : "—";
  const inning = state.firstInnings ? "1st Inn" : "2nd Inn";

  const displayBalls: string[] =
    state.currentOverBalls?.length > 0
      ? state.currentOverBalls
      : ((state.firstInnings ? state.innings1Overs : state.innings2Overs)
          ?.slice(-1)?.[0]
          ?.map(
            (b: any) => b.shortBallOutcome ?? b.getShortBallOutcome?.() ?? "",
          ) ?? []);

  const striker = state.currentStriker;
  const nonStriker = state.currentNonStriker;
  const bowler = state.currentBowler;

  const batOrder = isBatTeam1
    ? state.innings1BattingOrder
    : state.innings2BattingOrder;
  const isBowlT1 = bowl.name === state.team1.name;
  const bowlOrder = isBowlT1
    ? state.team1BowlingOrder
    : state.team2BowlingOrder;

  const stS = striker
    ? batOrder?.find((p) => p.playerId === striker.playerId) ||
      bat?.playingXI.find((p) => p.playerId === striker.playerId)
    : null;
  const nsS = nonStriker
    ? batOrder?.find((p) => p.playerId === nonStriker.playerId) ||
      bat?.playingXI.find((p) => p.playerId === nonStriker.playerId)
    : null;
  const bowS = bowler
    ? bowlOrder?.find((p) => p.playerId === bowler.playerId) ||
      bowl?.playingXI.find((p) => p.playerId === bowler.playerId)
    : null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        fontFamily: "'Barlow Condensed', 'DM Sans', sans-serif",
        animation: "bcSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      {/* Heavy TV-style accent rail */}
      <div style={{ display: "flex", height: 6 }}>
        <div
          style={{
            flex: 1,
            background: batColor,
            boxShadow: `0 -2px 10px ${batColor}66`,
          }}
        />
        <div
          style={{
            flex: 1,
            background: bowlColor,
            boxShadow: `0 -2px 10px ${bowlColor}66`,
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          height: 80,
          background: B.panelBg,
          boxShadow: B.shadow,
        }}
      >
        {/* LEFT: Solid Batting Team Block */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "0 28px 0 20px",
            background: `linear-gradient(135deg, ${batColor} 0%, ${batDim} 100%)`,
            borderRight: `4px solid ${B.panelBgDeep}`,
            flexShrink: 0,
            boxShadow: `inset -10px 0 20px rgba(0,0,0,0.3)`,
          }}
        >
          <BroadcastTeamBadge
            name={bat.name}
            logoUrl={bat.logoUrl}
            size={54}
            teamColor={B.panelBgDeep}
            textColor={batColor}
          />
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: -2,
              }}
            >
              <span
                style={{
                  color: B.white,
                  fontSize: 15,
                  fontWeight: 900,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                {bat.name}
              </span>
              <span
                style={{
                  background: B.white,
                  color: batColor,
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: 1,
                  padding: "2px 6px",
                  borderRadius: 3,
                  textTransform: "uppercase",
                }}
              >
                {inning}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span
                style={{
                  color: B.white,
                  fontSize: 48,
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: -1,
                  textShadow: `0 4px 10px rgba(0,0,0,0.5)`,
                }}
              >
                {bat.score}/{bat.wickets}
              </span>
              <span
                style={{
                  color: B.white,
                  opacity: 0.8,
                  fontSize: 22,
                  fontWeight: 800,
                }}
              >
                ({bat.overs})
              </span>
            </div>
          </div>
        </div>

        {/* CENTRE: Match Stats */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            gap: 0,
            overflow: "hidden",
          }}
        >
          {/* Rate block */}
          <div
            style={{
              padding: "0 20px",
              borderRight: `1px solid ${B.lineHard}`,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                marginBottom: 3,
              }}
            >
              <span
                style={{
                  color: B.w50,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 1.5,
                }}
              >
                CRR
              </span>
              <span style={{ color: B.white, fontSize: 26, fontWeight: 900 }}>
                {crr}
              </span>
            </div>
            {!state.firstInnings && (
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span
                  style={{
                    color: B.w50,
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: 1.5,
                  }}
                >
                  RRR
                </span>
                <span style={{ color: B.live, fontSize: 24, fontWeight: 900 }}>
                  {rrr}
                </span>
              </div>
            )}
          </div>

          {/* Over dots */}
          <div
            style={{
              padding: "0 20px",
              borderRight: `1px solid ${B.lineHard}`,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                color: B.w50,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 1.5,
                marginBottom: 5,
              }}
            >
              OVR {Math.min(state.completedOvers + 1, state.totalOvers)}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {displayBalls.map((b: string, i: number) => {
                const s = broadcastBallStyle(b);
                return (
                  <div
                    key={i}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: s.bg,
                      border: s.border,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: 14,
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
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${B.lineSoft}`,
                    }}
                  />
                ),
              )}
            </div>
          </div>

          {/* Batters Highlighted */}
          {(striker || nonStriker) && (
            <div
              style={{
                padding: "0 20px",
                borderRight: `1px solid ${B.lineHard}`,
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              {[
                { p: striker, stats: stS, on: true },
                { p: nonStriker, stats: nsS, on: false },
              ]
                .filter((x) => x.p)
                .map(({ p, stats, on }) => (
                  <div
                    key={p!.playerId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: on ? 4 : 0,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: on ? batColor : B.w30,
                        flexShrink: 0,
                        boxShadow: on ? `0 0 8px ${batColor}` : "none",
                      }}
                    />
                    <span
                      style={{
                        color: on ? B.white : B.w70,
                        fontSize: on ? 18 : 15,
                        fontWeight: on ? 900 : 600,
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
                        color: on ? batColor : B.w50,
                        fontSize: on ? 22 : 18,
                        fontWeight: 900,
                        flexShrink: 0,
                      }}
                    >
                      {stats ? `${stats.runs}` : "—"}
                      {stats && (
                        <span
                          style={{
                            color: B.w50,
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          {" "}
                          ({stats.ballsFaced})
                        </span>
                      )}
                    </span>
                  </div>
                ))}
            </div>
          )}

          {/* Bowler */}
          {bowler && (
            <div style={{ padding: "0 20px", flexShrink: 0 }}>
              <div
                style={{
                  color: B.w50,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 1.5,
                  marginBottom: 3,
                }}
              >
                BOWLING
              </div>
              <div
                style={{
                  color: bowlColor,
                  fontSize: 18,
                  fontWeight: 900,
                  whiteSpace: "nowrap",
                  textTransform: "uppercase",
                }}
              >
                {bowler.name}
              </div>
              {bowS && (
                <div style={{ color: B.w70, fontSize: 15, fontWeight: 800 }}>
                  {fmtOv(bowS.overs)}ov · {bowS.wicketsTaken}w ·{" "}
                  {bowS.runsConceded}r
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Solid Fielding Team Block */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "0 20px 0 28px",
            background: `linear-gradient(225deg, ${bowlColor} 0%, ${bowlDim} 100%)`,
            borderLeft: `4px solid ${B.panelBgDeep}`,
            flexShrink: 0,
            boxShadow: `inset 10px 0 20px rgba(0,0,0,0.3)`,
          }}
        >
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                color: B.white,
                opacity: 0.8,
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: 1.5,
                marginBottom: 2,
              }}
            >
              FIELDING
            </div>
            <div
              style={{
                color: B.white,
                fontSize: 26,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                textShadow: `0 2px 8px rgba(0,0,0,0.4)`,
              }}
            >
              {bowl.name}
            </div>
          </div>
          <BroadcastTeamBadge
            name={bowl.name}
            logoUrl={bowl.logoUrl}
            size={54}
            teamColor={B.panelBgDeep}
            textColor={bowlColor}
          />
        </div>
      </div>
    </div>
  );
}

export { BroadcastScoreOverlay as GlassScoreOverlay };
