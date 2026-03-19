import { MatchState, TeamDetails, PlayerStats } from "../types";
import { dismissalText, fmtSR } from "../helpers";
import { C } from "./theme";
import { TeamBadge } from "./TeamBadge";

export function BattingCard({
  team,
  state,
}: {
  team: TeamDetails;
  state: MatchState;
}) {
  const battingFirstName = state.battingFirst?.name;
  const isInnings1Team = team.name === battingFirstName;
  const rawOrder: PlayerStats[] =
    (isInnings1Team
      ? (state as any).team1BattingOrder
      : (state as any).team2BattingOrder) || [];

  const strikerId = state.currentStriker?.playerId;
  const nonStrikerId = state.currentNonStriker?.playerId;
  const actualWickets = team.wickets;

  const seenIds = new Set<string>();
  const dedupedOrder: PlayerStats[] = [];
  for (const p of rawOrder) {
    if (!seenIds.has(p.playerId)) {
      seenIds.add(p.playerId);
      dedupedOrder.push(p);
    }
  }

  let dismissedCount = 0;
  const battedPlayers = dedupedOrder.map((p) => {
    const isAtCrease = p.playerId === strikerId || p.playerId === nonStrikerId;
    if (isAtCrease) return { ...p, wicketDetails: null };
    if (p.wicketDetails) {
      if (dismissedCount < actualWickets) {
        dismissedCount++;
        return p;
      } else {
        return { ...p, wicketDetails: null };
      }
    }
    return p;
  });
  const battedIds = new Set(battedPlayers.map((p) => p.playerId));
  const yetToBat = team.playingXI.filter((p) => !battedIds.has(p.playerId));
  const players = [...battedPlayers, ...yetToBat].slice(0, 11);

  const totalExtras = team.extras
    ? team.extras.wide +
      team.extras.noBall +
      team.extras.bye +
      team.extras.legBye +
      team.extras.penalty
    : 0;

  const ROW_H = 46;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 1100,
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
        <div
          style={{
            height: 4,
            background: `linear-gradient(90deg, ${C.blue}, ${C.gold} 50%, ${C.blue})`,
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 32px",
            background: "linear-gradient(135deg, rgba(74,158,245,0.13) 0%, transparent 60%)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <TeamBadge name={team.name} logoUrl={team.logoUrl} size={52} accent={C.blue} accentBg={C.blueDim} />
            <div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: C.blue,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  marginBottom: 3,
                }}
              >
                BATTING
              </div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: C.white,
                  fontWeight: 900,
                  fontSize: 30,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  lineHeight: 1,
                }}
              >
                {team.name}
              </div>
            </div>
          </div>
          {(team.score > 0 || team.wickets > 0) && (
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: C.blue,
                  fontWeight: 900,
                  fontSize: 44,
                  lineHeight: 1,
                }}
              >
                {team.score}/{team.wickets}
              </div>
              <div style={{ color: C.w35, fontSize: 14, fontWeight: 500, marginTop: 2 }}>
                {team.overs} overs
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
          <div style={{ width: 28, flexShrink: 0 }} />
          <div
            style={{
              flex: 1,
              fontFamily: "'Barlow Condensed', sans-serif",
              color: C.w35,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 2.5,
              textTransform: "uppercase",
            }}
          >
            BATTER
          </div>
          <div
            style={{
              width: 260,
              fontFamily: "'Barlow Condensed', sans-serif",
              color: C.w35,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 2.5,
              textTransform: "uppercase",
            }}
          />
          {["R", "B", "4s", "6s", "SR"].map((h) => (
            <div
              key={h}
              style={{
                width: h === "SR" ? 76 : 56,
                textAlign: "right",
                fontFamily: "'Barlow Condensed', sans-serif",
                color: C.w35,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 2.5,
                textTransform: "uppercase",
              }}
            >
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
              ? "rgba(52,211,153,0.05)"
              : i % 2 === 0
                ? C.w04
                : "transparent";

            return (
              <div
                key={`${p.playerId}-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  minHeight: ROW_H,
                  padding: "0 32px",
                  background: rowBg,
                  borderBottom: i < players.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  opacity: isOut ? 0.52 : 1,
                }}
              >
                <div
                  style={{
                    width: 28,
                    flexShrink: 0,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: C.w20,
                    fontSize: 12,
                    fontWeight: 800,
                    textAlign: "right",
                    paddingRight: 10,
                  }}
                >
                  {i + 1}
                </div>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    overflow: "hidden",
                  }}
                >
                  {isAtCrease && (
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: isStriker ? C.gold : C.w35,
                        boxShadow: isStriker ? `0 0 5px ${C.gold}` : "none",
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      color: isNotOut ? C.white : C.w80,
                      fontWeight: isNotOut ? 800 : 700,
                      fontSize: 17,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.name}
                  </span>
                  {isCap && (
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: 9,
                        fontWeight: 900,
                        color: C.gold,
                        border: `1px solid ${C.goldDim}`,
                        borderRadius: 2,
                        padding: "1px 5px",
                        letterSpacing: 1.5,
                        flexShrink: 0,
                      }}
                    >
                      C
                    </span>
                  )}
                </div>
                <div
                  style={{
                    width: 260,
                    flexShrink: 0,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: isNotOut ? "#34D399" : C.w35,
                    letterSpacing: isNotOut ? 1 : 0,
                    textTransform: isNotOut ? "uppercase" : "none",
                  }}
                >
                  {isOut ? dismissalText(p) : isNotOut ? "NOT OUT" : ""}
                </div>
                {hasBat || isAtCrease ? (
                  <>
                    <div style={{ width: 56, textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 18, color: C.blue, flexShrink: 0 }}>
                      {p.runs ?? 0}
                    </div>
                    <div style={{ width: 56, textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 17, color: C.w80, flexShrink: 0 }}>
                      {p.ballsFaced ?? 0}
                    </div>
                    <div style={{ width: 56, textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 17, color: C.w80, flexShrink: 0 }}>
                      {p.fours ?? 0}
                    </div>
                    <div style={{ width: 56, textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 17, color: C.w80, flexShrink: 0 }}>
                      {p.sixes ?? 0}
                    </div>
                    <div style={{ width: 76, textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15, color: C.w55, flexShrink: 0 }}>
                      {fmtSR(p.strikeRate ?? 0)}
                    </div>
                  </>
                ) : (
                  [56, 56, 56, 56, 76].map((w, j) => (
                    <div
                      key={j}
                      style={{ width: w, textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 17, color: "rgba(255,255,255,0.15)", flexShrink: 0 }}
                    >
                      —
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 32px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(0,0,0,0.45)",
            gap: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.w35, fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>
              Extras
            </span>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.w80, fontSize: 17, fontWeight: 900 }}>
              {totalExtras}
            </span>
            {team.extras && (
              <span style={{ color: C.w35, fontSize: 12, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600 }}>
                (w {team.extras.wide}, nb {team.extras.noBall}, b {team.extras.bye}, lb {team.extras.legBye})
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 32px", borderLeft: "1px solid rgba(255,255,255,0.07)", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.w35, fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>Overs</span>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.w80, fontSize: 17, fontWeight: 900 }}>{team.overs}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingLeft: 32 }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.w35, fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>Total</span>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.gold, fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>
              {team.score}/{team.wickets}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
