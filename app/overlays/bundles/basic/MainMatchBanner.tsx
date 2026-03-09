import { MatchState, MatchInfo } from "../types";
import { fmt12, fmtDate } from "../helpers";
import { C } from "./theme";
import { TeamBadge } from "./TeamBadge";

export function MainMatchBanner({
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
        width: 1120,
        animation: "scaleIn 0.45s cubic-bezier(0.16,1,0.3,1) both",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Tournament pill */}
      {(info.tournamentName || info.stage) && (
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: C.bg,
              border: `1px solid ${C.goldDim}`,
              borderRadius: 4,
              padding: "8px 28px",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 800,
              fontSize: 13,
              color: C.gold,
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            {info.tournamentName}
            {info.tournamentName && info.stage && (
              <span style={{ color: C.goldDim }}>◆</span>
            )}
            {info.stage && (
              <span style={{ color: "rgba(226,185,75,0.65)" }}>{info.stage}</span>
            )}
          </span>
        </div>
      )}

      {/* Card */}
      <div
        style={{
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          overflow: "hidden",
          boxShadow: "0 40px 100px rgba(0,0,0,0.85)",
        }}
      >
        <div
          style={{
            height: 4,
            background: `linear-gradient(90deg, ${C.blue}, ${C.gold} 50%, ${C.purple})`,
          }}
        />

        {/* Teams */}
        <div style={{ display: "flex", alignItems: "stretch", minHeight: 230 }}>
          {/* Team 1 */}
          <div
            style={{
              flex: 1,
              padding: "36px 48px",
              background: `linear-gradient(120deg, rgba(74,158,245,0.12) 0%, transparent 70%)`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <TeamBadge name={state.team1.name} logoUrl={state.team1.logoUrl} size={64} accent={C.blue} accentBg={C.blueDim} />
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: C.white,
                fontWeight: 900,
                fontSize: 40,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                lineHeight: 1,
              }}
            >
              {state.team1.name}
            </div>
            {hasScores && (
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: C.blue,
                    fontWeight: 900,
                    fontSize: 60,
                    lineHeight: 1,
                  }}
                >
                  {state.team1.score}/{state.team1.wickets}
                </span>
                <span style={{ color: C.w35, fontSize: 20, fontWeight: 500 }}>
                  ({state.team1.overs} ov)
                </span>
              </div>
            )}
          </div>

          {/* VS */}
          <div
            style={{
              width: 116,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              borderLeft: `1px solid ${C.border}`,
              borderRight: `1px solid ${C.border}`,
            }}
          >
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: "50%",
                border: `1.5px solid ${C.goldDim}`,
                background: "rgba(226,185,75,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                fontSize: 17,
                color: C.gold,
                letterSpacing: 3,
              }}
            >
              VS
            </div>
            {info.overs > 0 && (
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: C.w20,
                  fontSize: 13,
                  fontWeight: 700,
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
              background: `linear-gradient(240deg, rgba(168,85,247,0.12) 0%, transparent 70%)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <TeamBadge name={state.team2.name} logoUrl={state.team2.logoUrl} size={64} accent={C.purple} accentBg={C.purpleDim} />
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: C.white,
                fontWeight: 900,
                fontSize: 40,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                lineHeight: 1,
                textAlign: "right",
              }}
            >
              {state.team2.name}
            </div>
            {hasScores && (
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{ color: C.w35, fontSize: 20, fontWeight: 500 }}>
                  ({state.team2.overs} ov)
                </span>
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: C.purple,
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
            borderTop: `1px solid ${C.border}`,
            background: "rgba(0,0,0,0.25)",
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
                  borderRight: i < arr.length - 1 ? `1px solid ${C.border}` : "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: C.w35,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 2.5,
                    textTransform: "uppercase",
                  }}
                >
                  {item.label}
                </div>
                <div style={{ color: C.w80, fontSize: 15, fontWeight: 600 }}>
                  {item.value}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
