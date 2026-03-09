import { MatchState, TeamDetails, PlayerStats } from "../types";
import { getBowlTeam, fmtOv, fmtEcon } from "../helpers";
import { G } from "./theme";
import { GlassTeamBadge } from "./TeamBadge";

export function GlassBowlingCard({
  team,
  state,
}: {
  team: TeamDetails;
  state: MatchState;
}) {
  const isPassedTeamBatFirst = team.name === state.battingFirst?.name;
  const bowlingOrderArr = (isPassedTeamBatFirst
    ? (state as any).team2BowlingOrder
    : (state as any).team1BowlingOrder) || [];

  const opponent = team.name === state.team1.name ? state.team2 : state.team1;
  const isActiveBowlTeam = team.name === getBowlTeam(state).name;
  const activeBowlerId = isActiveBowlTeam ? state.currentBowler?.playerId : null;

  const placedIds = new Set<string>();
  const orderedBowlers: PlayerStats[] = [];

  bowlingOrderArr.forEach((p: any) => {
    if ((p.ballsBowled ?? 0) > 0 || (p.wicketsTaken ?? 0) > 0) {
      orderedBowlers.push(p);
      placedIds.add(p.playerId);
    }
  });

  if (activeBowlerId && !placedIds.has(activeBowlerId)) {
    const baseProfile = team.playingXI.find((p) => p.playerId === activeBowlerId);
    if (baseProfile) {
      orderedBowlers.push({ ...baseProfile, overs: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, economyRate: 0 });
      placedIds.add(activeBowlerId);
    }
  }

  const bowlers = orderedBowlers.sort((a, b) => (b.ballsBowled || 0) - (a.ballsBowled || 0));
  const currentBowlerId = state.currentBowler?.playerId;
  const ROW_H = 56;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 960,
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
        {/* Pink top stripe */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${G.pink}, ${G.teal} 50%, ${G.pink})`, boxShadow: `0 0 14px ${G.pinkGlow}` }} />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 36px",
            background: `linear-gradient(135deg, rgba(244,114,182,0.08) 0%, transparent 55%)`,
            borderBottom: `1px solid ${G.borderSub}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <GlassTeamBadge name={team.name} logoUrl={team.logoUrl} size={58} accent={G.pink} glow={G.pinkGlow} />
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.pink, fontSize: 13, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>BOWLING</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.white, fontWeight: 900, fontSize: 36, textTransform: "uppercase", letterSpacing: 1, lineHeight: 1, textShadow: G.textGlow }}>
                {team.name}
              </div>
            </div>
          </div>
          {(opponent.score > 0 || opponent.wickets > 0) && (
            <div style={{ textAlign: "right" }}>
              <div style={{ color: G.w45, fontSize: 13, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 3 }}>
                {opponent.name}
              </div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.w90, fontWeight: 900, fontSize: 34, lineHeight: 1 }}>
                {opponent.score}/{opponent.wickets}{" "}
                <span style={{ color: G.w45, fontSize: 17, fontWeight: 600 }}>({opponent.overs})</span>
              </div>
            </div>
          )}
        </div>

        {/* Column headers */}
        <div style={{ display: "flex", alignItems: "center", height: 40, padding: "0 36px", borderBottom: `1px solid ${G.borderSub}`, background: G.bgDark }}>
          <div style={{ flex: 1, fontFamily: "'Barlow Condensed', sans-serif", color: G.w45, fontSize: 12, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase" }}>BOWLER</div>
          {[{ h: "O", w: 88 }, { h: "R", w: 78 }, { h: "W", w: 70 }, { h: "ECON", w: 98 }].map(({ h, w }) => (
            <div key={h} style={{ width: w, textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", color: G.w45, fontSize: 12, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase" }}>
              {h}
            </div>
          ))}
        </div>

        {bowlers.length === 0 ? (
          <div style={{ padding: "36px", textAlign: "center", color: G.w45, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, letterSpacing: 1 }}>
            NO OVERS BOWLED YET
          </div>
        ) : (
          <div>
            {bowlers.map((p, i) => {
              const isCurrent = p.playerId === currentBowlerId;
              const isCap = p.playerId === team.captainId;
              return (
                <div
                  key={p.playerId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: ROW_H,
                    padding: "0 36px",
                    background: isCurrent ? "rgba(244,114,182,0.06)" : i % 2 === 0 ? G.bgLight : "transparent",
                    borderBottom: i < bowlers.length - 1 ? `1px solid ${G.borderSub}` : "none",
                    borderLeft: isCurrent ? `3px solid ${G.pink}` : "3px solid transparent",
                  }}
                >
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
                    {isCurrent && (
                      <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: G.pink, boxShadow: `0 0 6px ${G.pink}, 0 0 12px ${G.pinkGlow}` }} />
                    )}
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: isCurrent ? G.white : G.w70, fontWeight: isCurrent ? 800 : 700, fontSize: 20, textTransform: "uppercase", letterSpacing: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name}
                    </span>
                    {isCap && (
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 900, color: G.teal, border: `1px solid rgba(0,212,170,0.35)`, borderRadius: 2, padding: "1px 5px", letterSpacing: 1.5, flexShrink: 0 }}>
                        C
                      </span>
                    )}
                  </div>
                  <div style={{ width: 88, textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 20, color: G.w70, flexShrink: 0 }}>{fmtOv(p.overs ?? 0)}</div>
                  <div style={{ width: 78, textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 20, color: G.w70, flexShrink: 0 }}>{p.runsConceded ?? 0}</div>
                  <div style={{ width: 70, textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: (p.wicketsTaken ?? 0) > 0 ? 900 : 700, fontSize: 22, color: (p.wicketsTaken ?? 0) > 0 ? G.pink : G.w70, flexShrink: 0, textShadow: (p.wicketsTaken ?? 0) > 0 ? `0 0 10px ${G.pinkGlow}` : "none" }}>
                    {p.wicketsTaken ?? 0}
                  </div>
                  <div style={{ width: 98, textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 18, color: G.w45, flexShrink: 0 }}>{fmtEcon(p.economyRate ?? 0)}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", padding: "14px 36px", borderTop: `1px solid ${G.borderSub}`, background: G.bgDark, gap: 0 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.w45, fontSize: 13, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>Overs</span>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.w90, fontSize: 20, fontWeight: 900 }}>{opponent.overs} / {state.totalOvers}</span>
          </div>
          {(() => {
            const extras = opponent.extras;
            const total = extras ? extras.wide + extras.noBall + extras.bye + extras.legBye + extras.penalty : 0;
            return total > 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 28px", borderLeft: `1px solid ${G.borderSub}` }}>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.w45, fontSize: 13, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>Extras</span>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.w90, fontSize: 20, fontWeight: 900 }}>{total}</span>
              </div>
            ) : null;
          })()}
        </div>
      </div>
    </div>
  );
}
