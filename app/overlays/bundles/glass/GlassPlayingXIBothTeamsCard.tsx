import { MatchState, TeamDetails } from "../types";
import { getBatTeam, getBowlTeam, ROLE_META } from "../helpers";
import { G } from "./theme";
import { GlassTeamBadge } from "./TeamBadge";

function GlassTeamColumn({ team, accent, glow }: { team: TeamDetails; accent: string; glow: string }) {
  const captainId = team.captainId?.toString();
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Team header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 22px",
          borderBottom: `1px solid ${G.borderSub}`,
          background: `linear-gradient(135deg, ${accent}10 0%, transparent 60%)`,
        }}
      >
        <GlassTeamBadge name={team.name} logoUrl={team.logoUrl} size={44} accent={accent} glow={glow} />
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.white, fontWeight: 800, fontSize: 22, textTransform: "uppercase", letterSpacing: 0.5, lineHeight: 1 }}>
          {team.name}
        </div>
      </div>

      {/* Player rows */}
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
                padding: "0 20px",
                height: 46,
                borderBottom: `1px solid ${G.borderSub}`,
                background: idx % 2 === 0 ? "transparent" : G.bgLight,
              }}
            >
              <div style={{ width: 24, flexShrink: 0, color: G.w25, fontSize: 12, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textAlign: "right", marginRight: 12 }}>
                {idx + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 7, overflow: "hidden" }}>
                <span style={{ color: G.w90, fontSize: 16, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.name}
                </span>
                {isCaptain && (
                  <div style={{ flexShrink: 0, background: "rgba(0,212,170,0.12)", border: "1px solid rgba(0,212,170,0.4)", borderRadius: 4, padding: "1px 6px", color: G.teal, fontSize: 10, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 }}>
                    C
                  </div>
                )}
              </div>
              {roleMeta && (
                <div style={{ marginLeft: 8, flexShrink: 0, background: roleMeta.bg, border: `1px solid ${roleMeta.color}22`, borderRadius: 6, padding: "2px 10px", color: roleMeta.color, fontSize: 11, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5 }}>
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

export function GlassPlayingXIBothTeamsCard({ state }: { state: MatchState }) {
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
        {/* Top gradient stripe */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${G.cyan}, ${G.teal} 50%, ${G.pink})`, boxShadow: `0 0 14px ${G.tealGlow}` }} />

        {/* Card header */}
        <div
          style={{
            padding: "10px 24px",
            borderBottom: `1px solid ${G.borderSub}`,
            background: `linear-gradient(135deg, rgba(34,211,238,0.06) 0%, transparent 50%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.teal, fontSize: 12, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase", textShadow: `0 0 10px ${G.tealGlow}` }}>
            Playing XI
          </div>
        </div>

        {/* Two columns */}
        <div style={{ display: "flex" }}>
          <GlassTeamColumn team={team1} accent={G.cyan} glow={G.cyanGlow} />
          <div style={{ width: 1, background: G.border, flexShrink: 0 }} />
          <GlassTeamColumn team={team2} accent={G.pink} glow={G.pinkGlow} />
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 24px",
            borderTop: `1px solid ${G.borderSub}`,
            background: G.bgDark,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <span style={{ color: G.w45, fontSize: "clamp(13px, 1.3vw, 17px)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, letterSpacing: 1 }}>
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
              <div style={{ display: "flex", alignItems: "center", gap: "clamp(10px, 1.2vw, 18px)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: G.coral, boxShadow: `0 0 8px ${G.coral}`, animation: "reelPing 1.4s ease-in-out infinite", flexShrink: 0 }} />
                <span style={{ color: G.cyan, fontSize: "clamp(15px, 1.6vw, 22px)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>
                  {bat.name}
                </span>
                <span style={{ color: G.white, fontSize: "clamp(20px, 2.2vw, 32px)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, letterSpacing: 1, lineHeight: 1 }}>
                  {bat.score}/{bat.wickets}
                </span>
                <span style={{ color: G.w45, fontSize: "clamp(12px, 1.2vw, 16px)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600 }}>
                  ({bat.overs} ov)
                </span>
                <span style={{ color: G.w25, fontSize: "clamp(13px, 1.3vw, 18px)", fontWeight: 700 }}>vs</span>
                <span style={{ color: G.pink, fontSize: "clamp(15px, 1.6vw, 22px)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>
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
