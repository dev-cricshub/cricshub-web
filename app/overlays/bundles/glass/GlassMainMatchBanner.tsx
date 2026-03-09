import { MatchState, MatchInfo } from "../types";
import { fmt12, fmtDate } from "../helpers";
import { G } from "./theme";
import { GlassTeamBadge } from "./TeamBadge";

export function GlassMainMatchBanner({
  info,
  state,
}: {
  info: MatchInfo;
  state: MatchState;
}) {
  const hasScores =
    state.team1.score > 0 || state.team2.score > 0 || state.team1.wickets > 0;

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
      {/* Tournament pill */}
      {(info.tournamentName || info.stage) && (
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(8,12,28,0.92)",
              border: `1px solid rgba(0,212,170,0.50)`,
              borderRadius: 100,
              padding: "7px 28px",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 800,
              fontSize: 12,
              color: G.teal,
              letterSpacing: 3,
              textTransform: "uppercase",
              boxShadow: `0 4px 24px rgba(0,0,0,0.7), 0 0 16px rgba(0,212,170,0.18)`,
            }}
          >
            {info.tournamentName}
            {info.tournamentName && info.stage && <span style={{ color: "rgba(0,212,170,0.4)" }}>◆</span>}
            {info.stage && <span style={{ color: "rgba(0,212,170,0.65)" }}>{info.stage}</span>}
          </span>
        </div>
      )}

      {/* Main card */}
      <div
        style={{
          background: G.bg,
          border: `1px solid ${G.border}`,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: `0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.10)`,
        }}
      >
        {/* Top glow stripe */}
        <div
          style={{
            height: 3,
            background: `linear-gradient(90deg, ${G.cyan} 0%, ${G.teal} 40%, ${G.teal} 60%, ${G.pink} 100%)`,
            boxShadow: `0 0 16px ${G.tealGlow}`,
          }}
        />

        {/* Teams area */}
        <div style={{ display: "flex", alignItems: "stretch", minHeight: 240 }}>
          {/* Team 1 */}
          <div
            style={{
              flex: 1,
              padding: "36px 48px",
              background: `linear-gradient(135deg, rgba(34,211,238,0.08) 0%, transparent 65%)`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <GlassTeamBadge name={state.team1.name} logoUrl={state.team1.logoUrl} size={66} accent={G.cyan} glow={G.cyanGlow} />
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: G.white,
                fontWeight: 900,
                fontSize: 40,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                lineHeight: 1,
                textShadow: G.textGlow,
              }}
            >
              {state.team1.name}
            </div>
            {hasScores && (
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: G.cyan,
                    fontWeight: 900,
                    fontSize: 60,
                    lineHeight: 1,
                    textShadow: `0 2px 12px rgba(0,0,0,0.9), 0 0 30px ${G.cyanGlow}`,
                  }}
                >
                  {state.team1.score}/{state.team1.wickets}
                </span>
                <span style={{ color: G.w45, fontSize: 20, fontWeight: 500 }}>({state.team1.overs} ov)</span>
              </div>
            )}
          </div>

          {/* VS column */}
          <div
            style={{
              width: 120,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              borderLeft: `1px solid ${G.border}`,
              borderRight: `1px solid ${G.border}`,
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                border: `1.5px solid rgba(0,212,170,0.4)`,
                background: "rgba(0,212,170,0.07)",
                boxShadow: `0 0 20px rgba(0,212,170,0.2), inset 0 0 12px rgba(0,212,170,0.05)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                fontSize: 17,
                color: G.teal,
                letterSpacing: 3,
              }}
            >
              VS
            </div>
            {info.overs > 0 && (
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.w25, fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>
                T{info.overs}
              </div>
            )}
          </div>

          {/* Team 2 */}
          <div
            style={{
              flex: 1,
              padding: "36px 48px",
              background: `linear-gradient(225deg, rgba(244,114,182,0.08) 0%, transparent 65%)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <GlassTeamBadge name={state.team2.name} logoUrl={state.team2.logoUrl} size={66} accent={G.pink} glow={G.pinkGlow} />
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: G.white,
                fontWeight: 900,
                fontSize: 40,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                lineHeight: 1,
                textAlign: "right",
                textShadow: G.textGlow,
              }}
            >
              {state.team2.name}
            </div>
            {hasScores && (
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{ color: G.w45, fontSize: 20, fontWeight: 500 }}>({state.team2.overs} ov)</span>
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: G.pink,
                    fontWeight: 900,
                    fontSize: 60,
                    lineHeight: 1,
                    textShadow: `0 2px 12px rgba(0,0,0,0.9), 0 0 30px ${G.pinkGlow}`,
                  }}
                >
                  {state.team2.score}/{state.team2.wickets}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Meta strip */}
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            borderTop: `1px solid ${G.borderSub}`,
            background: G.bgDark,
          }}
        >
          {(
            [
              info.venue ? { label: "Venue", value: info.venue } : null,
              info.matchDate
                ? { label: "Date", value: `${fmtDate(info.matchDate)}${info.matchTime ? "  ·  " + fmt12(info.matchTime) : ""}` }
                : null,
              state.tossWinner
                ? { label: "Toss", value: `${state.tossWinner} won · chose to ${state.choice}` }
                : null,
            ] as const
          )
            .filter(Boolean)
            .map((item: any, i, arr) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  padding: "16px 32px",
                  borderRight: i < arr.length - 1 ? `1px solid ${G.borderSub}` : "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.w45, fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase" }}>
                  {item.label}
                </div>
                <div style={{ color: G.w90, fontSize: 15, fontWeight: 600 }}>{item.value}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
