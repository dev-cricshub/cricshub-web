import { MatchState, TeamDetails, PlayerStats } from "../types";
import { dismissalText, fmtSR } from "../helpers";
import { G } from "./theme";
import { GlassTeamBadge } from "./TeamBadge";

export function GlassBattingCard({
  team,
  state,
}: {
  team: TeamDetails;
  state: MatchState;
}) {
  const battingFirstName = state.battingFirst?.name;
  const isInnings1Team = team.name === battingFirstName;
  const rawOrder: PlayerStats[] =
    (isInnings1Team ? (state as any).team1BattingOrder : (state as any).team2BattingOrder) || [];

  const strikerId = state.currentStriker?.playerId;
  const nonStrikerId = state.currentNonStriker?.playerId;
  const actualWickets = team.wickets;

  const seenIds = new Set<string>();
  const dedupedOrder: PlayerStats[] = [];
  for (const p of rawOrder) {
    if (!seenIds.has(p.playerId)) { seenIds.add(p.playerId); dedupedOrder.push(p); }
  }

  let dismissedCount = 0;
  const battedPlayers = dedupedOrder.map((p) => {
    const isAtCrease = p.playerId === strikerId || p.playerId === nonStrikerId;
    if (isAtCrease) return { ...p, wicketDetails: null };
    if (p.wicketDetails) {
      if (dismissedCount < actualWickets) { dismissedCount++; return p; }
      else return { ...p, wicketDetails: null };
    }
    return p;
  });
  const battedIds = new Set(battedPlayers.map((p) => p.playerId));
  const yetToBat = team.playingXI.filter((p) => !battedIds.has(p.playerId));
  const players = [...battedPlayers, ...yetToBat].slice(0, 11);

  const totalExtras = team.extras
    ? team.extras.wide + team.extras.noBall + team.extras.bye + team.extras.legBye + team.extras.penalty
    : 0;

  const ROW_H = 52;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 1140,
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
        {/* Cyan top stripe */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${G.cyan}, ${G.teal} 50%, ${G.cyan})`, boxShadow: `0 0 14px ${G.cyanGlow}` }} />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 36px",
            background: `linear-gradient(135deg, rgba(34,211,238,0.08) 0%, transparent 55%)`,
            borderBottom: `1px solid ${G.borderSub}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <GlassTeamBadge name={team.name} logoUrl={team.logoUrl} size={58} accent={G.cyan} glow={G.cyanGlow} />
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.cyan, fontSize: 13, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>
                BATTING
              </div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.white, fontWeight: 900, fontSize: 36, textTransform: "uppercase", letterSpacing: 1, lineHeight: 1, textShadow: G.textGlow }}>
                {team.name}
              </div>
            </div>
          </div>
          {(team.score > 0 || team.wickets > 0) && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.cyan, fontWeight: 900, fontSize: 52, lineHeight: 1, textShadow: `0 2px 12px rgba(0,0,0,0.9), 0 0 20px ${G.cyanGlow}` }}>
                {team.score}/{team.wickets}
              </div>
              <div style={{ color: G.w45, fontSize: 16, fontWeight: 500, marginTop: 2 }}>{team.overs} overs</div>
            </div>
          )}
        </div>

        {/* Column headers */}
        <div style={{ display: "flex", alignItems: "center", height: 40, padding: "0 36px", borderBottom: `1px solid ${G.borderSub}`, background: G.bgDark }}>
          <div style={{ width: 30, flexShrink: 0 }} />
          <div style={{ flex: 1, fontFamily: "'Barlow Condensed', sans-serif", color: G.w45, fontSize: 12, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase" }}>BATTER</div>
          <div style={{ width: 280, fontFamily: "'Barlow Condensed', sans-serif", color: G.w45, fontSize: 12, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase" }} />
          {["R", "B", "4s", "6s", "SR"].map((h) => (
            <div key={h} style={{ width: h === "SR" ? 82 : 60, textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", color: G.w45, fontSize: 12, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase" }}>
              {h}
            </div>
          ))}
        </div>

        {/* Player rows */}
        <div>
          {players.map((p, i) => {
            const isStriker = strikerId === p.playerId;
            const isNonStriker = nonStrikerId === p.playerId;
            const isAtCrease = isStriker || isNonStriker;
            const isOut = !!p.wicketDetails && !isAtCrease;
            const hasBat = (p.ballsFaced ?? 0) > 0;
            const isNotOut = isAtCrease || (!isOut && hasBat);
            const isCap = p.playerId === team.captainId;

            const rowBg = isAtCrease
              ? "rgba(0,212,170,0.05)"
              : i % 2 === 0 ? G.bgLight : "transparent";

            return (
              <div
                key={`${p.playerId}-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  minHeight: ROW_H,
                  padding: "0 36px",
                  background: rowBg,
                  borderBottom: i < players.length - 1 ? `1px solid ${G.borderSub}` : "none",
                  borderLeft: isAtCrease ? `3px solid ${G.teal}` : "3px solid transparent",
                  opacity: isOut ? 0.55 : 1,
                }}
              >
                <div style={{ width: 30, flexShrink: 0, fontFamily: "'Barlow Condensed', sans-serif", color: G.w25, fontSize: 14, fontWeight: 800, textAlign: "right", paddingRight: 10 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                  {isAtCrease && (
                    <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: isStriker ? G.teal : G.w45, boxShadow: isStriker ? `0 0 6px ${G.teal}, 0 0 12px ${G.tealGlow}` : "none" }} />
                  )}
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: isNotOut ? G.white : G.w70, fontWeight: isNotOut ? 800 : 700, fontSize: 20, textTransform: "uppercase", letterSpacing: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </span>
                  {isCap && (
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 900, color: G.teal, border: `1px solid rgba(0,212,170,0.35)`, borderRadius: 2, padding: "1px 5px", letterSpacing: 1.5, flexShrink: 0 }}>
                      C
                    </span>
                  )}
                </div>
                <div style={{ width: 280, flexShrink: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: isNotOut ? G.teal : G.w45, letterSpacing: isNotOut ? 1 : 0, textTransform: isNotOut ? "uppercase" : "none" }}>
                  {isOut ? dismissalText(p) : isNotOut ? "NOT OUT" : ""}
                </div>
                {hasBat || isAtCrease ? (
                  <>
                    <div style={{ width: 60, textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 21, color: G.cyan, flexShrink: 0 }}>{p.runs ?? 0}</div>
                    <div style={{ width: 60, textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 19, color: G.w70, flexShrink: 0 }}>{p.ballsFaced ?? 0}</div>
                    <div style={{ width: 60, textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 19, color: G.w70, flexShrink: 0 }}>{p.fours ?? 0}</div>
                    <div style={{ width: 60, textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 19, color: G.w70, flexShrink: 0 }}>{p.sixes ?? 0}</div>
                    <div style={{ width: 82, textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 17, color: G.w45, flexShrink: 0 }}>{fmtSR(p.strikeRate ?? 0)}</div>
                  </>
                ) : (
                  [60, 60, 60, 60, 82].map((w, j) => (
                    <div key={j} style={{ width: w, textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 17, color: G.w12, flexShrink: 0 }}>—</div>
                  ))
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", padding: "14px 36px", borderTop: `1px solid ${G.borderSub}`, background: G.bgDark, gap: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.w45, fontSize: 13, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>Extras</span>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.w90, fontSize: 20, fontWeight: 900 }}>{totalExtras}</span>
            {team.extras && (
              <span style={{ color: G.w45, fontSize: 13, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600 }}>
                (w {team.extras.wide}, nb {team.extras.noBall}, b {team.extras.bye}, lb {team.extras.legBye})
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 28px", borderLeft: `1px solid ${G.borderSub}`, borderRight: `1px solid ${G.borderSub}` }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.w45, fontSize: 13, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>Overs</span>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.w90, fontSize: 20, fontWeight: 900 }}>{team.overs}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, paddingLeft: 28 }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.w45, fontSize: 13, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>Total</span>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.teal, fontSize: 26, fontWeight: 900, letterSpacing: -0.5, textShadow: `0 0 12px ${G.tealGlow}` }}>
              {team.score}/{team.wickets}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
