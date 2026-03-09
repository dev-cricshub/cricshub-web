import { MatchState, TeamDetails, PlayerStats } from "../types";
import { getBatTeam, getBowlTeam, fmtSR, fmtOv, fmtEcon } from "../helpers";
import { G } from "./theme";
import { GlassTeamBadge } from "./TeamBadge";

function GlassInningsPanel({
  inningsNum,
  batTeam,
  bowlTeam,
  batters,
  bowlers,
  accent,
  accentGlow,
  opponentAccent,
  opponentGlow,
}: {
  inningsNum: number;
  batTeam: TeamDetails;
  bowlTeam: TeamDetails;
  batters: PlayerStats[];
  bowlers: PlayerStats[];
  accent: string;
  accentGlow: string;
  opponentAccent: string;
  opponentGlow: string;
}) {
  const ROW_H = 38;
  return (
    <div style={{ display: "flex", flexDirection: "column", borderBottom: `1px solid ${G.borderSub}` }}>
      {/* Innings header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 28px",
          background: G.bgDark,
          borderBottom: `1px solid ${G.borderSub}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.teal, fontSize: 9, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase", border: `1px solid rgba(0,212,170,0.3)`, borderRadius: 100, padding: "2px 10px", background: "rgba(0,212,170,0.08)" }}>
            {inningsNum === 1 ? "1ST INN" : "2ND INN"}
          </span>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.white, fontSize: 18, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1 }}>
            {batTeam.name}
          </span>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: accent, fontSize: 22, fontWeight: 900, textShadow: `0 0 10px ${accentGlow}` }}>
            {batTeam.score}/{batTeam.wickets}
          </span>
          <span style={{ color: G.w45, fontSize: 13, fontWeight: 500 }}>({batTeam.overs} ov)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: G.w45, fontSize: 11, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>vs</span>
          <GlassTeamBadge name={bowlTeam.name} logoUrl={bowlTeam.logoUrl} size={28} accent={opponentAccent} glow={opponentGlow} />
          <span style={{ color: G.w70, fontSize: 13, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: "uppercase" }}>
            {bowlTeam.name}
          </span>
        </div>
      </div>

      {/* Stats columns */}
      <div style={{ display: "flex" }}>
        {/* BATTERS */}
        <div style={{ flex: 1, borderRight: `1px solid ${G.borderSub}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 20px", borderBottom: `1px solid ${G.borderSub}`, background: G.bgDark }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.w45, fontSize: 9, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase" }}>Batter</span>
            <div style={{ display: "flex", gap: 16 }}>
              {["R", "B", "SR"].map((h) => (
                <span key={h} style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.w45, fontSize: 9, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", width: 36, textAlign: "right" }}>
                  {h}
                </span>
              ))}
            </div>
          </div>
          {batters.length === 0 ? (
            <div style={{ padding: "14px 20px", color: G.w25, fontSize: 12, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 }}>NO BATTING DATA</div>
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
                    background: i % 2 === 0 ? G.bgLight : "transparent",
                    borderBottom: i < batters.length - 1 ? `1px solid ${G.borderSub}` : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, overflow: "hidden" }}>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: isNotOut ? G.white : G.w70, fontWeight: 700, fontSize: 14, textTransform: "uppercase", letterSpacing: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name}
                    </span>
                    {isNotOut && (
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 9, color: G.teal, border: `1px solid rgba(0,212,170,0.3)`, borderRadius: 2, padding: "1px 4px", letterSpacing: 1, flexShrink: 0 }}>*</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: accent, fontWeight: 900, fontSize: 15, width: 36, textAlign: "right" }}>{p.runs}</span>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.w45, fontWeight: 700, fontSize: 14, width: 36, textAlign: "right" }}>{p.ballsFaced}</span>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.w25, fontWeight: 700, fontSize: 12, width: 36, textAlign: "right" }}>{fmtSR(p.strikeRate)}</span>
                  </div>
                </div>
              );
            })
          )}
          {batTeam.extras && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 20px", borderTop: `1px solid ${G.borderSub}`, background: G.bgDark }}>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.w45, fontSize: 9, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>Extras</span>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.w45, fontSize: 11, fontWeight: 700 }}>
                <span style={{ color: G.w90, fontWeight: 900, marginRight: 8 }}>
                  {batTeam.extras.wide + batTeam.extras.noBall + batTeam.extras.bye + batTeam.extras.legBye + batTeam.extras.penalty}
                </span>
                (W:{batTeam.extras.wide} NB:{batTeam.extras.noBall} B:{batTeam.extras.bye} LB:{batTeam.extras.legBye})
              </span>
            </div>
          )}
        </div>

        {/* BOWLERS */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 20px", borderBottom: `1px solid ${G.borderSub}`, background: G.bgDark }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.w45, fontSize: 9, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase" }}>Bowler</span>
            <div style={{ display: "flex", gap: 16 }}>
              {["W-R", "O", "ECO"].map((h) => (
                <span key={h} style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.w45, fontSize: 9, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", width: 36, textAlign: "right" }}>
                  {h}
                </span>
              ))}
            </div>
          </div>
          {bowlers.length === 0 ? (
            <div style={{ padding: "14px 20px", color: G.w25, fontSize: 12, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 }}>NO BOWLING DATA</div>
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
                  background: i % 2 === 0 ? G.bgLight : "transparent",
                  borderBottom: i < bowlers.length - 1 ? `1px solid ${G.borderSub}` : "none",
                }}
              >
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.w70, fontWeight: 700, fontSize: 14, textTransform: "uppercase", letterSpacing: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, paddingRight: 12 }}>
                  {p.name}
                </span>
                <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: p.wicketsTaken > 0 ? accent : G.w45, fontWeight: p.wicketsTaken > 0 ? 900 : 700, fontSize: 15, width: 36, textAlign: "right" }}>
                    {p.wicketsTaken}-{p.runsConceded}
                  </span>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.w45, fontWeight: 700, fontSize: 14, width: 36, textAlign: "right" }}>{fmtOv(p.overs)}</span>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.w25, fontWeight: 700, fontSize: 12, width: 36, textAlign: "right" }}>{fmtEcon(p.economyRate)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function GlassMatchSummaryCard({ state }: { state: MatchState }) {
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
        animation: "glassScaleIn 0.45s cubic-bezier(0.16,1,0.3,1) both",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          background: G.bg,
          border: `1px solid ${G.border}`,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: `0 40px 100px rgba(0,0,0,0.88), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.10)`,
        }}
      >
        {/* Top stripe */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${G.cyan}, ${G.teal} 50%, ${G.pink})`, boxShadow: `0 0 14px ${G.tealGlow}` }} />

        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 36px", borderBottom: `1px solid ${G.borderSub}`, background: G.bgDark, gap: 16 }}>
          <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, transparent, ${G.tealGlow})` }} />
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.teal, fontWeight: 900, fontSize: 17, letterSpacing: 5, textTransform: "uppercase", textShadow: `0 0 12px ${G.tealGlow}` }}>
            Match Summary
          </span>
          <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, ${G.tealGlow}, transparent)` }} />
        </div>

        <GlassInningsPanel inningsNum={1} batTeam={inn1BatTeam} bowlTeam={inn1BowlTeam} batters={inn1Batters} bowlers={inn1Bowlers} accent={G.cyan} accentGlow={G.cyanGlow} opponentAccent={G.pink} opponentGlow={G.pinkGlow} />
        {showInnings2 && (
          <GlassInningsPanel inningsNum={2} batTeam={inn2BatTeam} bowlTeam={inn2BowlTeam} batters={inn2Batters} bowlers={inn2Bowlers} accent={G.pink} accentGlow={G.pinkGlow} opponentAccent={G.cyan} opponentGlow={G.cyanGlow} />
        )}

        {/* Status bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 36px",
            background: state.matchComplete
              ? "linear-gradient(90deg, rgba(0,212,170,0.12), rgba(0,212,170,0.06), rgba(0,212,170,0.12))"
              : G.bgDark,
          }}
        >
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: state.matchComplete ? G.teal : G.white, fontWeight: 900, fontSize: state.matchComplete ? 20 : 14, letterSpacing: 2, textTransform: "uppercase", textShadow: state.matchComplete ? `0 0 14px ${G.tealGlow}` : "none" }}>
            {bar.text}
          </span>
          {bar.sub && (
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.teal, fontWeight: 900, fontSize: 16, letterSpacing: 2, textTransform: "uppercase" }}>
              {bar.sub}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
