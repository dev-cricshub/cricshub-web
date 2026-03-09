import { MatchState, MatchInfo } from "../types";
import { fmt12, fmtDate } from "../helpers";
import { M } from "./theme";
import { MaterialTeamBadge } from "./TeamBadge"; // Use the flat badge

export function MaterialMainMatchBanner({
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
        animation: "fadeScaleIn 0.3s cubic-bezier(0.0, 0.0, 0.2, 1) both", // Snappy material animation
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Tournament badge (Flat instead of pill) */}
      {(info.tournamentName || info.stage) && (
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: M.bgDeep, // Solid dark background
              border: `1px solid ${M.border}`,
              borderRadius: 4, // Sharp broadcast corners
              padding: "6px 24px",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 800,
              fontSize: 12,
              color: M.teal,
              letterSpacing: 3,
              textTransform: "uppercase",
              boxShadow: M.panelShadow, // Standard broadcast drop shadow
            }}
          >
            {info.tournamentName}
            {info.tournamentName && info.stage && (
              <span style={{ color: M.w45 }}>◆</span>
            )}
            {info.stage && <span style={{ color: M.w90 }}>{info.stage}</span>}
          </span>
        </div>
      )}

      {/* Main card */}
      <div
        style={{
          background: M.bg,
          border: `1px solid ${M.border}`,
          borderRadius: 8, // Tighter material radius
          overflow: "hidden",
          boxShadow: M.panelShadow,
        }}
      >
        {/* Top solid accent stripe (Replaces gradient/glow) */}
        <div
          style={{
            height: 4,
            background: `linear-gradient(90deg, ${M.cyan} 0%, ${M.cyan} 50%, ${M.pink} 50%, ${M.pink} 100%)`, // Sharp split instead of smooth blend
          }}
        />

        {/* Teams area */}
        <div style={{ display: "flex", alignItems: "stretch", minHeight: 240 }}>
          {/* Team 1 */}
          <div
            style={{
              flex: 1,
              padding: "36px 48px",
              background: M.bg, // Flat background, no gradients
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <MaterialTeamBadge
              name={state.team1.name}
              logoUrl={state.team1.logoUrl}
              size={66}
              accent={M.cyan}
            />
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: M.white,
                fontWeight: 900,
                fontSize: 40,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                lineHeight: 1,
                textShadow: M.textGlow,
              }}
            >
              {state.team1.name}
            </div>
            {hasScores && (
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: M.cyan,
                    fontWeight: 900,
                    fontSize: 60,
                    lineHeight: 1,
                  }}
                >
                  {state.team1.score}/{state.team1.wickets}
                </span>
                <span style={{ color: M.w45, fontSize: 20, fontWeight: 600 }}>
                  ({state.team1.overs} ov)
                </span>
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
              borderLeft: `1px solid ${M.borderSub}`,
              borderRight: `1px solid ${M.borderSub}`,
              background: M.bgLight, // Slight offset color to separate the teams
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                border: `2px solid ${M.border}`,
                background: M.bgDeep, // Solid VS circle
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                fontSize: 17,
                color: M.w70,
                letterSpacing: 3,
              }}
            >
              VS
            </div>
            {info.overs > 0 && (
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: M.w45,
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: 1,
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
              padding: "36px 48px",
              background: M.bg, // Flat background
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <MaterialTeamBadge
              name={state.team2.name}
              logoUrl={state.team2.logoUrl}
              size={66}
              accent={M.pink}
            />
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: M.white,
                fontWeight: 900,
                fontSize: 40,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                lineHeight: 1,
                textAlign: "right",
                textShadow: M.textGlow,
              }}
            >
              {state.team2.name}
            </div>
            {hasScores && (
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{ color: M.w45, fontSize: 20, fontWeight: 600 }}>
                  ({state.team2.overs} ov)
                </span>
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: M.pink, // Solid pink, no text shadow glow
                    fontWeight: 900,
                    fontSize: 60,
                    lineHeight: 1,
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
            borderTop: `1px solid ${M.borderSub}`,
            background: M.bgDark, // Deep solid footer
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
                    i < arr.length - 1 ? `1px solid ${M.borderSub}` : "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: M.w45,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 2.5,
                    textTransform: "uppercase",
                  }}
                >
                  {item.label}
                </div>
                <div style={{ color: M.w90, fontSize: 15, fontWeight: 600 }}>
                  {item.value}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
