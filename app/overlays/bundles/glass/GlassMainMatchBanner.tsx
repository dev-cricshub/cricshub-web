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
      {/* Holographic Projector Pill (Tournament Info) */}
      {(info.tournamentName || info.stage) && (
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              background: G.bgDeep, // Recessed core
              backdropFilter: G.backdropBlur,
              border: `1px solid ${G.borderSub}`,
              borderRadius: 100,
              padding: "8px 32px",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              fontSize: 14,
              color: G.teal,
              letterSpacing: 4,
              textTransform: "uppercase",
              boxShadow: `inset 0 2px 4px rgba(0,0,0,0.5), 0 0 24px ${G.tealGlow}`, // Inner depth + outer glow
              textShadow: `0 0 10px ${G.tealGlow}`,
            }}
          >
            {info.tournamentName}
            {info.tournamentName && info.stage && (
              <span style={{ color: G.w25, textShadow: "none" }}>◆</span>
            )}
            {info.stage && (
              <span style={{ color: G.white, textShadow: G.textGlow }}>
                {info.stage}
              </span>
            )}
          </span>
        </div>
      )}

      {/* Main Holographic Plate */}
      <div
        style={{
          background: G.bg,
          backdropFilter: G.backdropBlur,
          WebkitBackdropFilter: G.backdropBlur,
          // 3D Glass Bevel
          borderTop: `1px solid ${G.borderHighlight}`,
          borderLeft: `1px solid ${G.borderHighlight}`,
          borderBottom: `1px solid ${G.borderShadow}`,
          borderRight: `1px solid ${G.borderShadow}`,
          borderRadius: 24, // High-end curved glass
          overflow: "hidden",
          boxShadow: G.panelShadow,
          position: "relative",
        }}
      >
        {/* Intense Top Rim Glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "15%",
            right: "15%",
            height: 2,
            background: `linear-gradient(90deg, transparent 0%, ${G.cyan} 25%, ${G.teal} 50%, ${G.pink} 75%, transparent 100%)`,
            boxShadow: `0 0 24px ${G.teal}, 0 0 12px ${G.white}`,
            opacity: 0.9,
          }}
        />

        {/* Teams Area */}
        <div style={{ display: "flex", alignItems: "stretch", minHeight: 240 }}>
          {/* Team 1 */}
          <div
            style={{
              flex: 1,
              padding: "40px 48px",
              // Localized neon flare behind the team
              background: `radial-gradient(circle at 30% 50%, ${G.cyanDim} 0%, transparent 60%)`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <GlassTeamBadge
              name={state.team1.name}
              logoUrl={state.team1.logoUrl}
              size={72} // Slightly larger for impact
              accent={G.cyan}
              glow={G.cyanGlow}
            />
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: G.white,
                fontWeight: 900,
                fontSize: 44,
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
                    fontSize: 64,
                    lineHeight: 1,
                    textShadow: `0 0 20px ${G.cyanGlow}, ${G.textGlow}`, // Burns through the blur
                  }}
                >
                  {state.team1.score}/{state.team1.wickets}
                </span>
                <span
                  style={{
                    color: G.w70,
                    fontSize: 20,
                    fontWeight: 700,
                    textShadow: G.textGlow,
                  }}
                >
                  ({state.team1.overs} ov)
                </span>
              </div>
            )}
          </div>

          {/* VS Column (Etched Divider) */}
          <div
            style={{
              width: 120,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              borderLeft: `1px solid ${G.borderSub}`,
              borderRight: `1px solid ${G.borderSub}`,
              background: G.bgLight, // Frosted center strip
            }}
          >
            {/* Etched VS Badge */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                border: `1px solid ${G.borderSub}`,
                background: G.bgDeep, // Deep cutout
                boxShadow: "inset 0 4px 12px rgba(0,0,0,0.8)", // Indented shadow
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                fontSize: 20,
                color: G.w70,
                letterSpacing: 4,
                textShadow: G.textGlow,
              }}
            >
              VS
            </div>
            {info.overs > 0 && (
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: G.w45,
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: 2,
                }}
              >
                T{info.overs}
              </div>
            )}
          </div>

          {/* Team 2 */}
          <div
            style={{
              flex: 1,
              padding: "40px 48px",
              // Localized neon flare behind the team
              background: `radial-gradient(circle at 70% 50%, ${G.pinkDim} 0%, transparent 60%)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <GlassTeamBadge
              name={state.team2.name}
              logoUrl={state.team2.logoUrl}
              size={72}
              accent={G.pink}
              glow={G.pinkGlow}
            />
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: G.white,
                fontWeight: 900,
                fontSize: 44,
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
                <span
                  style={{
                    color: G.w70,
                    fontSize: 20,
                    fontWeight: 700,
                    textShadow: G.textGlow,
                  }}
                >
                  ({state.team2.overs} ov)
                </span>
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: G.pink,
                    fontWeight: 900,
                    fontSize: 64,
                    lineHeight: 1,
                    textShadow: `0 0 20px ${G.pinkGlow}, ${G.textGlow}`,
                  }}
                >
                  {state.team2.score}/{state.team2.wickets}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Floating Meta Strip */}
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            borderTop: `1px solid ${G.borderHighlight}`, // Inverse light catches the bottom lip
            background: G.bgDeep, // Deep recessed footer
            boxShadow: "inset 0 4px 12px rgba(0,0,0,0.5)", // Etched effect
          }}
        >
          {(
            [
              info.venue ? { label: "Venue", value: info.venue } : null,
              info.matchDate
                ? {
                    label: "Date",
                    value: `${fmtDate(info.matchDate)}${info.matchTime ? "  ·  " + fmt12(info.matchTime) : ""}`,
                  }
                : null,
              state.tossWinner
                ? {
                    label: "Toss",
                    value: `${state.tossWinner} won · chose to ${state.choice}`,
                  }
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
                  borderRight:
                    i < arr.length - 1 ? `1px solid ${G.borderSub}` : "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: G.w45,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 3,
                    textTransform: "uppercase",
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    color: G.w90,
                    fontSize: 15,
                    fontWeight: 700,
                    textShadow: G.textGlow,
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
