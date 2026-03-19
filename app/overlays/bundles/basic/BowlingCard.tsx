import { MatchState, TeamDetails, PlayerStats } from "../types";
import { getBatTeam, getBowlTeam, fmtOv, fmtEcon } from "../helpers";
import { C } from "./theme";
import { TeamBadge } from "./TeamBadge";

export function BowlingCard({
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
      orderedBowlers.push({
        ...baseProfile,
        overs: 0,
        ballsBowled: 0,
        runsConceded: 0,
        wicketsTaken: 0,
        economyRate: 0,
      });
      placedIds.add(activeBowlerId);
    }
  }

  const bowlers = orderedBowlers.sort(
    (a, b) => (b.ballsBowled || 0) - (a.ballsBowled || 0),
  );

  const currentBowlerId = state.currentBowler?.playerId;
  const ROW_H = 50;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 900,
        animation: "scaleIn 0.45s cubic-bezier(0.16,1,0.3,1) both",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          background: "rgba(6,8,16,0.98)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 10,
          overflow: "hidden",
          boxShadow: "0 40px 100px rgba(0,0,0,0.9)",
        }}
      >
        <div style={{ height: 4, background: `linear-gradient(90deg, ${C.purple}, ${C.gold} 50%, ${C.purple})` }} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 32px",
            background: "linear-gradient(135deg, rgba(168,85,247,0.12) 0%, transparent 60%)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <TeamBadge name={team.name} logoUrl={team.logoUrl} size={52} accent={C.purple} accentBg={C.purpleDim} />
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.purple, fontSize: 11, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", marginBottom: 3 }}>
                BOWLING
              </div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.white, fontWeight: 900, fontSize: 30, textTransform: "uppercase", letterSpacing: 1, lineHeight: 1 }}>
                {team.name}
              </div>
            </div>
          </div>
          {(opponent.score > 0 || opponent.wickets > 0) && (
            <div style={{ textAlign: "right" }}>
              <div style={{ color: C.w35, fontSize: 11, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 2 }}>
                {opponent.name}
              </div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.w80, fontWeight: 900, fontSize: 28, lineHeight: 1 }}>
                {opponent.score}/{opponent.wickets}{" "}
                <span style={{ color: C.w35, fontSize: 15, fontWeight: 600 }}>({opponent.overs})</span>
              </div>
            </div>
          )}
        </div>

        {/* Column headers */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: 36,
            padding: "0 32px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(0,0,0,0.4)",
          }}
        >
          <div style={{ flex: 1, fontFamily: "'Barlow Condensed', sans-serif", color: C.w35, fontSize: 11, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase" }}>
            BOWLER
          </div>
          {[{ h: "O", w: 80 }, { h: "R", w: 72 }, { h: "W", w: 64 }, { h: "ECON", w: 90 }].map(({ h, w }) => (
            <div key={h} style={{ width: w, textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", color: C.w35, fontSize: 11, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase" }}>
              {h}
            </div>
          ))}
        </div>

        {bowlers.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: C.w35, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, letterSpacing: 1 }}>
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
                    padding: "0 32px",
                    background: isCurrent ? "rgba(168,85,247,0.08)" : i % 2 === 0 ? C.w04 : "transparent",
                    borderBottom: i < bowlers.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    borderLeft: isCurrent ? `3px solid ${C.purple}` : "3px solid transparent",
                  }}
                >
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
                    {isCurrent && (
                      <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: C.purple, boxShadow: `0 0 6px ${C.purple}` }} />
                    )}
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: isCurrent ? C.white : C.w80, fontWeight: isCurrent ? 800 : 700, fontSize: 17, textTransform: "uppercase", letterSpacing: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name}
                    </span>
                    {isCap && (
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 9, fontWeight: 900, color: C.gold, border: `1px solid ${C.goldDim}`, borderRadius: 2, padding: "1px 5px", letterSpacing: 1.5, flexShrink: 0 }}>
                        C
                      </span>
                    )}
                  </div>
                  <div style={{ width: 80, textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 17, color: C.w80, flexShrink: 0 }}>
                    {fmtOv(p.overs ?? 0)}
                  </div>
                  <div style={{ width: 72, textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 17, color: C.w80, flexShrink: 0 }}>
                    {p.runsConceded ?? 0}
                  </div>
                  <div style={{ width: 64, textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: (p.wicketsTaken ?? 0) > 0 ? 900 : 700, fontSize: 18, color: (p.wicketsTaken ?? 0) > 0 ? C.purple : C.w80, flexShrink: 0 }}>
                    {p.wicketsTaken ?? 0}
                  </div>
                  <div style={{ width: 90, textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16, color: C.w55, flexShrink: 0 }}>
                    {fmtEcon(p.economyRate ?? 0)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", padding: "12px 32px", borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.45)", gap: 0 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.w35, fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>Overs</span>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.w80, fontSize: 17, fontWeight: 900 }}>{opponent.overs} / {state.totalOvers}</span>
          </div>
          {(() => {
            const extras = opponent.extras;
            const total = extras ? extras.wide + extras.noBall + extras.bye + extras.legBye + extras.penalty : 0;
            return total > 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 32px", borderLeft: "1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.w35, fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>Extras</span>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.w80, fontSize: 17, fontWeight: 900 }}>{total}</span>
              </div>
            ) : null;
          })()}
        </div>
      </div>
    </div>
  );
}
