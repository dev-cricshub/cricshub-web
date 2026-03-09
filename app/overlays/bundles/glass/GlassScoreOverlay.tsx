import { MatchState } from "../types";
import { getBatTeam, getBowlTeam, fmtOv } from "../helpers";
import { G, glassBallStyle } from "./theme";
import { GlassTeamBadge } from "./TeamBadge";

export function GlassScoreOverlay({ state }: { state: MatchState }) {
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
          ?.map((b: any) => b.shortBallOutcome ?? b.getShortBallOutcome?.() ?? "") ?? []);

  const isBatTeam1 = bat.name === state.team1.name;
  const batOrder = isBatTeam1 ? state.innings1BattingOrder : state.innings2BattingOrder;
  const isBowlTeam1 = bowl.name === state.team1.name;
  const bowlOrder = isBowlTeam1 ? state.team1BowlingOrder : state.team2BowlingOrder;

  const striker = state.currentStriker;
  const nonStriker = state.currentNonStriker;
  const bowler = state.currentBowler;

  const stS = striker
    ? batOrder?.find((p) => p.playerId === striker.playerId) || bat.playingXI.find((p) => p.playerId === striker.playerId)
    : null;
  const nsS = nonStriker
    ? batOrder?.find((p) => p.playerId === nonStriker.playerId) || bat.playingXI.find((p) => p.playerId === nonStriker.playerId)
    : null;
  const bowS = bowler
    ? bowlOrder?.find((p) => p.playerId === bowler.playerId) || bowl.playingXI.find((p) => p.playerId === bowler.playerId)
    : null;

  const divider = { borderRight: `1px solid ${G.border}` };

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        animation: "glassSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Teal glow top border */}
      <div
        style={{
          height: 2,
          background: `linear-gradient(90deg, transparent 0%, ${G.cyan} 25%, ${G.teal} 50%, ${G.pink} 75%, transparent 100%)`,
          boxShadow: `0 0 12px ${G.tealGlow}, 0 0 24px rgba(0,212,170,0.15)`,
        }}
      />

      {/* Glass bar */}
      <div
        style={{
          height: 106,
          background: G.bg,
          borderTop: `1px solid ${G.border}`,
          boxShadow: "0 -20px 80px rgba(0,0,0,0.80), 0 -4px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.10)",
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
          <GlassTeamBadge name={bat.name} logoUrl={bat.logoUrl} size={56} accent={G.cyan} glow={G.cyanGlow} />
          <div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: G.w45,
                fontSize: 13,
                fontWeight: 700,
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
                  color: G.white,
                  fontWeight: 900,
                  fontSize: 56,
                  lineHeight: 1,
                  letterSpacing: -1,
                  textShadow: `0 2px 12px rgba(0,0,0,0.9), 0 0 30px rgba(34,211,238,0.3)`,
                }}
              >
                {bat.score}/{bat.wickets}
              </span>
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: G.w45,
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
            minWidth: 120,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ color: G.w45, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif" }}>CRR</span>
            <span style={{ color: G.teal, fontWeight: 900, fontSize: 28, fontFamily: "'Barlow Condensed', sans-serif", textShadow: `0 0 12px ${G.tealGlow}` }}>
              {crr}
            </span>
          </div>
          {!state.firstInnings && (
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ color: G.w45, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif" }}>RRR</span>
              <span style={{ color: G.coral, fontWeight: 900, fontSize: 28, fontFamily: "'Barlow Condensed', sans-serif", textShadow: "0 0 12px rgba(251,113,133,0.3)" }}>
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
            <div style={{ color: G.w45, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif" }}>Need</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 34, color: G.white, lineHeight: 1 }}>
              {runsNeeded}{" "}
              <span style={{ color: G.w45, fontSize: 17, fontWeight: 600 }}>off {ballsLeft}b</span>
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
          <div style={{ color: G.w45, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif" }}>
            Over {Math.min(state.completedOvers + 1, state.totalOvers)}
          </div>
          <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
            {displayBalls.map((b: string, i: number) => {
              const s = glassBallStyle(b);
              return (
                <div
                  key={i}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: s.bg,
                    border: `1.5px solid ${s.border}`,
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
            {Array.from({ length: Math.max(0, 6 - displayBalls.length) }).map((_, i) => (
              <div
                key={`ep${i}`}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: G.w06,
                  border: `1px solid ${G.w12}`,
                }}
              />
            ))}
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
                <div key={p!.playerId} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: isOn ? G.teal : G.w25,
                      boxShadow: isOn ? `0 0 8px ${G.teal}, 0 0 16px ${G.tealGlow}` : "none",
                    }}
                  />
                  <span
                    style={{
                      color: isOn ? G.white : G.w70,
                      fontWeight: isOn ? 700 : 500,
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
                      color: isOn ? G.teal : G.w70,
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
                        <span style={{ color: G.w45, fontWeight: 600, fontSize: 13 }}>({stats.ballsFaced})</span>
                      </>
                    ) : "—"}
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
            <div style={{ color: G.w45, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif" }}>Bowling</div>
            <div style={{ color: G.white, fontWeight: 700, fontSize: 17, whiteSpace: "nowrap" }}>{bowler.name}</div>
            {bowS && (
              <div style={{ color: G.w70, fontSize: 15, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: 0.5 }}>
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
            gap: 16,
            marginLeft: "auto",
            paddingLeft: 28,
            borderLeft: `1px solid ${G.border}`,
          }}
        >
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.w45, fontSize: 13, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 2 }}>
              FIELDING
            </div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: G.white,
                fontWeight: 800,
                fontSize: 26,
                lineHeight: 1,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                textShadow: G.textGlow,
              }}
            >
              {bowl.name}
            </div>
          </div>
          <GlassTeamBadge name={bowl.name} logoUrl={bowl.logoUrl} size={56} accent={G.pink} glow={G.pinkGlow} />
        </div>
      </div>
    </div>
  );
}
