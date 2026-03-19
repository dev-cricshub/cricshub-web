import { MatchState, TeamDetails, PlayerStats } from "../types";
import { getBatTeam, getBowlTeam, ROLE_META } from "../helpers";
import { C } from "./theme";
import { TeamBadge } from "./TeamBadge";

function TeamColumn({ team, accent }: { team: TeamDetails; accent: string }) {
  const captainId = team.captainId?.toString();
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: `linear-gradient(135deg, ${accent}18 0%, transparent 60%)`,
        }}
      >
        <TeamBadge name={team.name} logoUrl={team.logoUrl} size={42} accent={accent} accentBg={`${accent}22`} />
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.white, fontWeight: 800, fontSize: 22, textTransform: "uppercase", letterSpacing: 0.5, lineHeight: 1 }}>
          {team.name}
        </div>
      </div>
      <div>
        {team.playingXI.slice(0, 11).map((p, idx) => {
          const isCaptain = captainId && p.playerId?.toString() === captainId;
          const roleMeta = p.role ? (ROLE_META[p.role.toUpperCase()] ?? null) : null;
          return (
            <div
              key={p.playerId}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0 18px",
                height: 46,
                borderBottom: "1px solid rgba(255,255,255,0.045)",
                background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.025)",
              }}
            >
              <div style={{ width: 24, flexShrink: 0, color: C.w35, fontSize: 13, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textAlign: "right", marginRight: 12 }}>
                {idx + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 7, overflow: "hidden" }}>
                <span style={{ color: C.w80, fontSize: 16, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.name}
                </span>
                {isCaptain && (
                  <div style={{ flexShrink: 0, background: "rgba(217,119,6,0.15)", border: "1px solid rgba(217,119,6,0.5)", borderRadius: 4, padding: "1px 6px", color: C.gold, fontSize: 11, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 }}>
                    C
                  </div>
                )}
              </div>
              {roleMeta && (
                <div style={{ marginLeft: 8, flexShrink: 0, background: roleMeta.bg, borderRadius: 4, padding: "2px 9px", color: roleMeta.color, fontSize: 12, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5 }}>
                  {roleMeta.label}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PlayingXIBothTeamsCard({ state }: { state: MatchState }) {
  const { team1, team2 } = state;
  const tossSet = !!state.battingFirst;
  const inProgress =
    tossSet &&
    (team1.score > 0 || team2.score > 0 || !!state.currentStriker || !!state.currentBowler);

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 1200,
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
        <div style={{ height: 4, background: `linear-gradient(90deg, ${C.blue}, ${C.gold} 50%, ${C.purple})` }} />

        <div
          style={{
            padding: "10px 22px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            background: "linear-gradient(135deg, rgba(74,158,245,0.08) 0%, transparent 50%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.blue, fontSize: 12, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase" }}>
            Playing XI
          </div>
        </div>

        <div style={{ display: "flex" }}>
          <TeamColumn team={team1} accent={C.blue} />
          <div style={{ width: 1, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />
          <TeamColumn team={team2} accent={C.purple} />
        </div>

        <div
          style={{
            padding: "10px 22px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <span style={{ color: C.w55, fontSize: "clamp(13px, 1.3vw, 18px)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, letterSpacing: 1 }}>
            {state.matchComplete && state.winner
              ? `${state.winner} won${state.winBy ? ` — ${state.winBy}` : ""}`
              : tossSet
                ? `Toss: ${state.tossWinner} won — elected to ${state.choice}`
                : "Toss Pending"}
          </span>

          {inProgress && !state.matchComplete && (() => {
            const bat = getBatTeam(state);
            const bowl = getBowlTeam(state);
            return (
              <div style={{ display: "flex", alignItems: "center", gap: "clamp(10px, 1.2vw, 20px)" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#EF4444", animation: "reelPing 1.4s ease-in-out infinite", flexShrink: 0 }} />
                <span style={{ color: C.blue, fontSize: "clamp(16px, 1.7vw, 24px)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>
                  {bat.name}
                </span>
                <span style={{ color: "#FFFFFF", fontSize: "clamp(22px, 2.4vw, 34px)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, letterSpacing: 1, lineHeight: 1 }}>
                  {bat.score}/{bat.wickets}
                </span>
                <span style={{ color: C.w55, fontSize: "clamp(13px, 1.3vw, 18px)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, letterSpacing: 0.5 }}>
                  ({bat.overs} ov)
                </span>
                <span style={{ color: C.w35, fontSize: "clamp(14px, 1.4vw, 20px)", fontWeight: 700 }}>vs</span>
                <span style={{ color: C.purple, fontSize: "clamp(16px, 1.7vw, 24px)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>
                  {bowl.name}
                </span>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
