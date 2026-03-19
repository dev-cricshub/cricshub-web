import { MatchState, TeamDetails, PlayerStats } from "../types";
import { getBatTeam, getBowlTeam, fmtSR, fmtOv, fmtEcon } from "../helpers";
import { C } from "./theme";
import { TeamBadge } from "./TeamBadge";

function InningsPanel({
  inningsNum,
  batTeam,
  bowlTeam,
  batters,
  bowlers,
  accent,
}: {
  inningsNum: number;
  batTeam: TeamDetails;
  bowlTeam: TeamDetails;
  batters: PlayerStats[];
  bowlers: PlayerStats[];
  accent: string;
}) {
  const ROW_H = 38;
  return (
    <div style={{ display: "flex", flexDirection: "column", borderBottom: `1px solid ${C.border}` }}>
      {/* Innings header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 28px",
          background: "rgba(0,0,0,0.3)",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.gold, fontSize: 10, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase", border: `1px solid ${C.goldDim}`, borderRadius: 3, padding: "2px 8px" }}>
            {inningsNum === 1 ? "1ST INNINGS" : "2ND INNINGS"}
          </span>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.white, fontSize: 18, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1 }}>
            {batTeam.name}
          </span>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: accent, fontSize: 22, fontWeight: 900 }}>
            {batTeam.score}/{batTeam.wickets}
          </span>
          <span style={{ color: C.w35, fontSize: 13, fontWeight: 500 }}>({batTeam.overs} ov)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: C.w35, fontSize: 12, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>vs</span>
          <TeamBadge name={bowlTeam.name} logoUrl={bowlTeam.logoUrl} size={28} accent={accent === C.blue ? C.purple : C.blue} accentBg={accent === C.blue ? C.purpleDim : C.blueDim} />
          <span style={{ color: C.w55, fontSize: 14, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: "uppercase" }}>
            {bowlTeam.name}
          </span>
        </div>
      </div>

      {/* Stats columns */}
      <div style={{ display: "flex" }}>
        {/* BATTERS */}
        <div style={{ flex: 1, borderRight: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 20px", borderBottom: `1px solid rgba(255,255,255,0.05)`, background: "rgba(0,0,0,0.25)" }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.w35, fontSize: 10, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase" }}>Batter</span>
            <div style={{ display: "flex", gap: 16 }}>
              {["R", "B", "SR"].map((h) => (
                <span key={h} style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.w35, fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", width: 36, textAlign: "right" }}>
                  {h}
                </span>
              ))}
            </div>
          </div>
          {batters.length === 0 ? (
            <div style={{ padding: "14px 20px", color: C.w20, fontSize: 12, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 }}>NO BATTING DATA</div>
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
                    background: i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
                    borderBottom: i < batters.length - 1 ? `1px solid rgba(255,255,255,0.04)` : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, overflow: "hidden" }}>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: isNotOut ? C.white : C.w80, fontWeight: 700, fontSize: 15, textTransform: "uppercase", letterSpacing: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name}
                    </span>
                    {isNotOut && (
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 9, color: "#34D399", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 2, padding: "1px 4px", letterSpacing: 1, flexShrink: 0 }}>
                        *
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: accent, fontWeight: 900, fontSize: 16, width: 36, textAlign: "right" }}>{p.runs}</span>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.w55, fontWeight: 700, fontSize: 15, width: 36, textAlign: "right" }}>{p.ballsFaced}</span>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.w35, fontWeight: 700, fontSize: 13, width: 36, textAlign: "right" }}>{fmtSR(p.strikeRate)}</span>
                  </div>
                </div>
              );
            })
          )}
          {batTeam.extras && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 20px", borderTop: `1px solid rgba(255,255,255,0.05)`, background: "rgba(0,0,0,0.2)" }}>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.w35, fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>Extras</span>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.w55, fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>
                <span style={{ color: C.w80, fontWeight: 900, marginRight: 8 }}>
                  {batTeam.extras.wide + batTeam.extras.noBall + batTeam.extras.bye + batTeam.extras.legBye + batTeam.extras.penalty}
                </span>
                (W:{batTeam.extras.wide} NB:{batTeam.extras.noBall} B:{batTeam.extras.bye} LB:{batTeam.extras.legBye})
              </span>
            </div>
          )}
        </div>

        {/* BOWLERS */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 20px", borderBottom: `1px solid rgba(255,255,255,0.05)`, background: "rgba(0,0,0,0.25)" }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.w35, fontSize: 10, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase" }}>Bowler</span>
            <div style={{ display: "flex", gap: 16 }}>
              {["W-R", "O", "ECO"].map((h) => (
                <span key={h} style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.w35, fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", width: 36, textAlign: "right" }}>
                  {h}
                </span>
              ))}
            </div>
          </div>
          {bowlers.length === 0 ? (
            <div style={{ padding: "14px 20px", color: C.w20, fontSize: 12, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 }}>NO BOWLING DATA</div>
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
                  background: i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
                  borderBottom: i < bowlers.length - 1 ? `1px solid rgba(255,255,255,0.04)` : "none",
                }}
              >
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.w80, fontWeight: 700, fontSize: 15, textTransform: "uppercase", letterSpacing: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, paddingRight: 12 }}>
                  {p.name}
                </span>
                <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: p.wicketsTaken > 0 ? accent : C.w55, fontWeight: p.wicketsTaken > 0 ? 900 : 700, fontSize: 16, width: 36, textAlign: "right" }}>
                    {p.wicketsTaken}-{p.runsConceded}
                  </span>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.w55, fontWeight: 700, fontSize: 15, width: 36, textAlign: "right" }}>{fmtOv(p.overs)}</span>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.w35, fontWeight: 700, fontSize: 13, width: 36, textAlign: "right" }}>{fmtEcon(p.economyRate)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function MatchSummaryCard({ state }: { state: MatchState }) {
  const inn1BatTeam = state.battingFirst?.name === state.team1.name ? state.team1 : state.team2;
  const inn1BowlTeam = inn1BatTeam.name === state.team1.name ? state.team2 : state.team1;
  const inn2BatTeam = inn1BowlTeam;
  const inn2BowlTeam = inn1BatTeam;
  const strikerId = state.currentStriker?.playerId;
  const nonStrikerId = state.currentNonStriker?.playerId;

  const inn1Batters: PlayerStats[] = ((state as any).team1BattingOrder ?? [])
    .filter((p: PlayerStats) => p.ballsFaced > 0)
    .map((p: PlayerStats) => {
      const live = inn1BatTeam.playingXI.find((x) => x.playerId === p.playerId);
      const enriched = live ?? p;
      const isAtCrease = enriched.playerId === strikerId || enriched.playerId === nonStrikerId;
      return isAtCrease ? { ...enriched, wicketDetails: null } : enriched;
    })
    .sort((a: PlayerStats, b: PlayerStats) => b.runs - a.runs)
    .slice(0, 4);

  const inn1Bowlers: PlayerStats[] = ((state as any).team1BowlingOrder ?? [])
    .sort((a: PlayerStats, b: PlayerStats) => b.wicketsTaken - a.wicketsTaken || a.economyRate - b.economyRate)
    .slice(0, 4);

  console.log(
    "NOT_OUT_DEBUG",
    JSON.stringify(
      {
        currentStriker: state.currentStriker,
        currentNonStriker: state.currentNonStriker,
        team2BattingOrder: (state as any).team2BattingOrder?.map((p: any) => ({
          name: p.name,
          runs: p.runs,
          balls: p.ballsFaced,
          out: !!p.wicketDetails,
          wicketType: p.wicketDetails?.dismissalType,
        })),
        inn2PlayingXI: inn2BatTeam.playingXI?.map((p) => ({
          name: p.name,
          runs: p.runs,
          balls: p.ballsFaced,
          out: !!p.wicketDetails,
        })),
        wickets: inn2BatTeam.wickets,
      },
      null,
      2,
    ),
  );

  const inn2Batters: PlayerStats[] = ((state as any).team2BattingOrder ?? [])
    .filter((p: PlayerStats) => p.ballsFaced > 0)
    .map((p: PlayerStats) => {
      const live = inn2BatTeam.playingXI.find((x) => x.playerId === p.playerId);
      const enriched = live ?? p;
      const isAtCrease = enriched.playerId === strikerId || enriched.playerId === nonStrikerId;
      return isAtCrease ? { ...enriched, wicketDetails: null } : enriched;
    })
    .sort((a: PlayerStats, b: PlayerStats) => b.runs - a.runs)
    .slice(0, 4);

  const inn2Bowlers: PlayerStats[] = ((state as any).team2BowlingOrder ?? [])
    .sort((a: PlayerStats, b: PlayerStats) => b.wicketsTaken - a.wicketsTaken || a.economyRate - b.economyRate)
    .slice(0, 4);

  const showInnings2 = !state.firstInnings || inn2Batters.length > 0 || inn2Bowlers.length > 0;

  function statusBar() {
    if (state.matchComplete && state.winner) {
      return { text: `${state.winner.toUpperCase()} WON`, sub: state.winBy ? state.winBy.toUpperCase() : "", isResult: true };
    }
    const bat = getBatTeam(state);
    const bowl = getBowlTeam(state);
    const crr = bat.overs > 0 ? (bat.score / bat.overs).toFixed(2) : "0.00";
    if (!state.firstInnings) {
      const target = bowl.score + 1;
      const runsNeeded = Math.max(0, target - bat.score);
      const ballsLeft = Math.max(0, Math.round((state.totalOvers - bat.overs) * 6));
      const rrr = ballsLeft > 0 ? ((runsNeeded / ballsLeft) * 6).toFixed(2) : "—";
      return { text: `${bat.name.toUpperCase()} NEED ${runsNeeded} OFF ${ballsLeft} BALLS`, sub: `RRR  ${rrr}`, isResult: false };
    }
    return { text: `${bat.name.toUpperCase()} — INNINGS IN PROGRESS`, sub: `CRR  ${crr}`, isResult: false };
  }
  const bar = statusBar();

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 1460,
        animation: "scaleIn 0.45s cubic-bezier(0.16,1,0.3,1) both",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          background: "rgba(6,8,16,0.98)",
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          overflow: "hidden",
          boxShadow: "0 40px 100px rgba(0,0,0,0.9)",
        }}
      >
        <div style={{ height: 4, background: `linear-gradient(90deg, ${C.blue}, ${C.gold} 50%, ${C.purple})` }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 36px", borderBottom: `1px solid ${C.border}`, background: "rgba(0,0,0,0.3)", gap: 16 }}>
          <div style={{ height: 1, flex: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12))" }} />
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.gold, fontWeight: 900, fontSize: 18, letterSpacing: 5, textTransform: "uppercase" }}>
            Match Summary
          </span>
          <div style={{ height: 1, flex: 1, background: "linear-gradient(90deg, rgba(255,255,255,0.12), transparent)" }} />
        </div>

        <InningsPanel inningsNum={1} batTeam={inn1BatTeam} bowlTeam={inn1BowlTeam} batters={inn1Batters} bowlers={inn1Bowlers} accent={C.blue} />
        {showInnings2 && (
          <InningsPanel inningsNum={2} batTeam={inn2BatTeam} bowlTeam={inn2BowlTeam} batters={inn2Batters} bowlers={inn2Bowlers} accent={C.purple} />
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 36px",
            background: state.matchComplete
              ? "linear-gradient(90deg, rgba(226,185,75,0.15), rgba(226,185,75,0.08), rgba(226,185,75,0.15))"
              : "rgba(0,0,0,0.4)",
          }}
        >
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: state.matchComplete ? C.gold : C.white, fontWeight: 900, fontSize: state.matchComplete ? 20 : 15, letterSpacing: 2, textTransform: "uppercase" }}>
            {bar.text}
          </span>
          {bar.sub && (
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.gold, fontWeight: 900, fontSize: 16, letterSpacing: 2, textTransform: "uppercase" }}>
              {bar.sub}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
