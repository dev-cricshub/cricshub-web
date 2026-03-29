import { MatchState, MatchInfo } from "../types";
import { fmt12, fmtDate } from "../helpers";
import { B } from "./theme";
import { BroadcastTeamBadge } from "./TeamBadge";

export function BroadcastMainMatchBanner({
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
        width: 1200,
        fontFamily: "'Barlow Condensed', 'DM Sans', sans-serif",
        animation: "bcScaleIn 0.45s cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      {(info.tournamentName || info.stage) && (
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 14,
              background: B.panelBgDeep,
              border: `2px solid ${B.lineHard}`,
              borderRadius: 100,
              padding: "8px 32px",
              fontSize: 15,
              fontWeight: 900,
              color: B.white,
              letterSpacing: 4,
              textTransform: "uppercase",
              boxShadow: `0 8px 24px rgba(0,0,0,0.5)`,
            }}
          >
            {info.tournamentName}
            {info.tournamentName && info.stage && (
              <span style={{ color: B.w30 }}>/</span>
            )}
            {info.stage && <span style={{ color: B.gold }}>{info.stage}</span>}
          </span>
        </div>
      )}

      <div
        style={{
          background: B.panelBg,
          borderRadius: 8,
          overflow: "hidden",
          boxShadow: `0 16px 40px rgba(0,0,0,0.6)`,
          border: `1px solid ${B.lineHard}`,
        }}
      >
        <div style={{ display: "flex", height: 8 }}>
          <div style={{ flex: 1, background: B.t1 }} />
          <div style={{ flex: 1, background: B.t2 }} />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            minHeight: 300,
            background: B.panelBgDeep,
          }}
        >
          {/* TEAM 1: Aggressive diagonal flood */}
          <div
            style={{
              flex: 1,
              padding: "40px 50px",
              background: `linear-gradient(135deg, ${B.t1Dim} 0%, ${B.t1Mid} 40%, transparent 80%)`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <BroadcastTeamBadge
              name={state.team1.name}
              logoUrl={state.team1.logoUrl}
              size={90}
              teamColor={B.t1}
            />
            <div
              style={{
                color: B.white,
                fontSize: 56,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: 2,
                lineHeight: 1,
                textShadow: `0 4px 12px rgba(0,0,0,0.5)`,
              }}
            >
              {state.team1.name}
            </div>
            {hasScores && (
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span
                  style={{
                    color: B.t1,
                    fontSize: 76,
                    fontWeight: 900,
                    lineHeight: 1,
                    textShadow: `0 0 30px ${B.t1}80, 0 4px 10px rgba(0,0,0,0.8)`,
                  }}
                >
                  {state.team1.score}/{state.team1.wickets}
                </span>
                <span
                  style={{
                    color: B.white,
                    opacity: 0.8,
                    fontSize: 24,
                    fontWeight: 800,
                  }}
                >
                  ({state.team1.overs} ov)
                </span>
              </div>
            )}
          </div>

          {/* VS CENTRE */}
          <div
            style={{
              width: 120,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              background: B.panelBg,
              borderLeft: `2px solid ${B.lineHard}`,
              borderRight: `2px solid ${B.lineHard}`,
              position: "relative",
              zIndex: 10,
              boxShadow: `0 0 30px rgba(0,0,0,0.5)`,
            }}
          >
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                background: B.panelBgDeep,
                border: `3px solid ${B.w30}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 900,
                color: B.white,
                letterSpacing: 4,
              }}
            >
              VS
            </div>
            {info.overs > 0 && (
              <div
                style={{
                  color: B.gold,
                  fontSize: 16,
                  fontWeight: 900,
                  letterSpacing: 3,
                }}
              >
                T{info.overs}
              </div>
            )}
          </div>

          {/* TEAM 2: Aggressive diagonal flood */}
          <div
            style={{
              flex: 1,
              padding: "40px 50px",
              background: `linear-gradient(225deg, ${B.t2Dim} 0%, ${B.t2Mid} 40%, transparent 80%)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <BroadcastTeamBadge
              name={state.team2.name}
              logoUrl={state.team2.logoUrl}
              size={90}
              teamColor={B.t2}
            />
            <div
              style={{
                color: B.white,
                fontSize: 56,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: 2,
                lineHeight: 1,
                textAlign: "right",
                textShadow: `0 4px 12px rgba(0,0,0,0.5)`,
              }}
            >
              {state.team2.name}
            </div>
            {hasScores && (
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span
                  style={{
                    color: B.white,
                    opacity: 0.8,
                    fontSize: 24,
                    fontWeight: 800,
                  }}
                >
                  ({state.team2.overs} ov)
                </span>
                <span
                  style={{
                    color: B.t2,
                    fontSize: 76,
                    fontWeight: 900,
                    lineHeight: 1,
                    textShadow: `0 0 30px ${B.t2}80, 0 4px 10px rgba(0,0,0,0.8)`,
                  }}
                >
                  {state.team2.score}/{state.team2.wickets}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Info Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            background: B.panelBg,
            borderTop: `2px solid ${B.lineHard}`,
          }}
        >
          {(
            [
              info.venue ? { label: "VENUE", value: info.venue } : null,
              info.matchDate
                ? {
                    label: "DATE & TIME",
                    value: `${fmtDate(info.matchDate)}${info.matchTime ? "  /  " + fmt12(info.matchTime) : ""}`,
                  }
                : null,
              state.tossWinner
                ? {
                    label: "TOSS",
                    value: `${state.tossWinner} WON — CHOSE TO ${state.choice}`,
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
                  padding: "18px 32px",
                  borderRight:
                    i < arr.length - 1 ? `1px solid ${B.lineHard}` : "none",
                  background: `linear-gradient(0deg, ${B.panelBgDeep} 0%, transparent 100%)`,
                }}
              >
                <div
                  style={{
                    color: B.w50,
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: 3,
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  {item.label}
                </div>
                <div style={{ color: B.white, fontSize: 17, fontWeight: 800 }}>
                  {item.value}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export { BroadcastMainMatchBanner as GlassMainMatchBanner };
