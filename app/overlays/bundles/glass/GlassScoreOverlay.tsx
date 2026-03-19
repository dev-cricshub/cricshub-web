import { MatchState } from "../types";
import { getBatTeam, getBowlTeam, fmtOv } from "../helpers";
import { G, glassBallStyle } from "./theme";
import { GlassTeamBadge } from "./TeamBadge";

export function GlassScoreOverlay({ state }: { state: MatchState }) {
  // --------------------------------------------------------------------------
  // DATA LOGIC (Remains identical)
  // --------------------------------------------------------------------------
  const bat = getBatTeam(state);
  const bowl = getBowlTeam(state);
  const crr =
    (bat?.overs ?? 0 > 0) ? (bat!.score / bat!.overs).toFixed(2) : "0.00";
  const target = (bowl?.score ?? 0) + 1;
  const runsNeeded = Math.max(0, target - (bat?.score ?? 0));
  const ballsLeft = Math.max(
    0,
    Math.round((state.totalOvers - (bat?.overs ?? 0)) * 6),
  );
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

  const isBatTeam1 = bat?.name === state.team1.name;
  const batOrder = isBatTeam1
    ? state.innings1BattingOrder
    : state.innings2BattingOrder;
  const isBowlTeam1 = bowl?.name === state.team1.name;
  const bowlOrder = isBowlTeam1
    ? state.team1BowlingOrder
    : state.team2BowlingOrder;

  const striker = state.currentStriker;
  const nonStriker = state.currentNonStriker;
  const bowler = state.currentBowler;

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

  if (!bat || !bowl) return null;

  // --------------------------------------------------------------------------
  // RENDER LOGIC (Holographic Glass Theme)
  // --------------------------------------------------------------------------
  const divider = { borderRight: `1px solid ${G.borderSub}` };

  return (
    <div
      style={{
        position: "absolute",
        bottom: 24, // Floats like a HUD visor
        left: "50%",
        transform: "translateX(-50%)",
        width: "max-content",
        maxWidth: "96%",
        animation: "glassSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) both",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Main Glass Panel */}
      <div
        style={{
          height: 104,
          background: G.bg,
          backdropFilter: G.backdropBlur,
          WebkitBackdropFilter: G.backdropBlur,
          borderRadius: 24, // Sleek curved visor edges
          // 3D Edge Lighting Bevel
          borderTop: `1px solid ${G.borderHighlight}`,
          borderLeft: `1px solid ${G.borderHighlight}`,
          borderBottom: `1px solid ${G.borderShadow}`,
          borderRight: `1px solid ${G.borderShadow}`,
          boxShadow: G.panelShadow,
          display: "flex",
          alignItems: "stretch",
          padding: "0 32px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Holographic Top Rim Glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "15%",
            right: "15%",
            height: 2,
            background: `linear-gradient(90deg, transparent 0%, ${G.cyan} 30%, ${G.teal} 50%, ${G.pink} 70%, transparent 100%)`,
            boxShadow: `0 0 20px ${G.cyan}, 0 0 10px ${G.white}`,
            opacity: 0.8,
          }}
        />

        {/* BATTING TEAM + SCORE */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            paddingRight: 28,
            minWidth: 320,
          }}
        >
          <GlassTeamBadge
            name={bat.name}
            logoUrl={bat.logoUrl}
            size={64}
            accent={G.cyan}
            glow={G.cyanGlow}
          />
          <div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: G.w70,
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: 2.5,
                textTransform: "uppercase",
                marginBottom: 1,
                textShadow: G.textGlow,
              }}
            >
              {bat.name}&nbsp;·&nbsp;
              <span style={{ color: G.teal }}>{inning}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: G.white,
                  fontWeight: 900,
                  fontSize: 56,
                  lineHeight: 1,
                  letterSpacing: -1,
                  textShadow: G.textGlow,
                }}
              >
                {bat.score}/{bat.wickets}
              </span>
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: G.cyan,
                  fontSize: 20,
                  fontWeight: 800,
                  textShadow: G.textGlow,
                }}
              >
                ({bat.overs})
              </span>
            </div>
          </div>
        </div>

        {/* ETCHED INNER GLASS PANEL (Middle Data) */}
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            background: G.bgDeep, // Darker glass layer to create depth
            margin: "12px 0",
            borderRadius: 16,
            border: `1px solid ${G.borderShadow}`,
            borderTop: `1px solid ${G.borderSub}`, // Inverse lighting for indentation
            boxShadow: "inset 0 4px 12px rgba(0,0,0,0.5)", // Creates the 'etched' cutout look
            padding: "0 12px",
          }}
        >
          {/* CRR / RRR */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 4,
              padding: "0 20px",
              ...divider,
              minWidth: 110,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span
                style={{
                  color: G.w45,
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
                  color: G.teal,
                  fontWeight: 900,
                  fontSize: 26,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  textShadow: G.tealGlow,
                }}
              >
                {crr}
              </span>
            </div>
            {!state.firstInnings && (
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span
                  style={{
                    color: G.w45,
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
                    color: G.coral,
                    fontWeight: 900,
                    fontSize: 26,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    textShadow: `0 0 12px ${G.coral}`,
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
                padding: "0 20px",
                ...divider,
                minWidth: 140,
              }}
            >
              <div
                style={{
                  color: G.w45,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  fontFamily: "'Barlow Condensed', sans-serif",
                }}
              >
                Target
              </div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 900,
                  fontSize: 32,
                  color: G.white,
                  lineHeight: 1,
                  textShadow: G.textGlow,
                }}
              >
                {target}{" "}
                <span style={{ color: G.w70, fontSize: 16, fontWeight: 700 }}>
                  ({ballsLeft}b)
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
              padding: "0 20px",
              minWidth: 260,
            }}
          >
            <div
              style={{
                color: G.w45,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: "uppercase",
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              Over {Math.min(state.completedOvers + 1, state.totalOvers)}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {displayBalls.map((b: string, i: number) => {
                const s = glassBallStyle(b);
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
                      fontWeight: 900,
                      fontSize: 15,
                      color: s.fg,
                      textShadow: "0 1px 4px rgba(0,0,0,0.8)",
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
                      background: G.bgLight,
                      border: `1px solid ${G.borderSub}`,
                      boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
                    }}
                  />
                ),
              )}
            </div>
          </div>
        </div>

        {/* BATTERS */}
        {(striker || nonStriker) && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 12,
              padding: "0 26px 0 20px",
              borderRight: `1px solid ${G.borderSub}`,
              minWidth: 300,
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
                    gap: 10,
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: isOn ? G.teal : G.w25,
                      boxShadow: isOn ? G.tealGlow : "none",
                    }}
                  />
                  <span
                    style={{
                      color: isOn ? G.white : G.w70,
                      fontWeight: isOn ? 800 : 600,
                      fontSize: isOn ? 18 : 16,
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      textShadow: G.textGlow,
                    }}
                  >
                    {p!.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      color: isOn ? G.teal : G.w70,
                      fontWeight: 900,
                      fontSize: isOn ? 24 : 20,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      minWidth: 65,
                      textAlign: "right",
                      textShadow: G.textGlow,
                    }}
                  >
                    {stats ? (
                      <>
                        {stats.runs}
                        <span
                          style={{
                            color: G.w45,
                            fontWeight: 700,
                            fontSize: 14,
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
              gap: 6,
              padding: "0 26px",
              minWidth: 180,
            }}
          >
            <div
              style={{
                color: G.w45,
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
                color: G.white,
                fontWeight: 800,
                fontSize: 18,
                whiteSpace: "nowrap",
                textShadow: G.textGlow,
              }}
            >
              {bowler.name}
            </div>
            {bowS && (
              <div
                style={{
                  color: G.w70,
                  fontSize: 16,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  textShadow: G.textGlow,
                }}
              >
                {fmtOv(bowS.overs)} ov ·{" "}
                <span style={{ color: G.pink }}>{bowS.wicketsTaken}w</span> ·{" "}
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
            borderLeft: `1px solid ${G.borderSub}`,
          }}
        >
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: G.w45,
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
                color: G.white,
                fontWeight: 900,
                fontSize: 28,
                lineHeight: 1,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                textShadow: G.textGlow,
              }}
            >
              {bowl.name}
            </div>
          </div>
          <GlassTeamBadge
            name={bowl.name}
            logoUrl={bowl.logoUrl}
            size={64}
            accent={G.pink}
            glow={G.pinkGlow}
          />
        </div>
      </div>
    </div>
  );
}
