import { MatchState, MatchInfo } from "../types";
import { fmt12, fmtDate } from "../helpers";
import { A } from "./theme";
import { AeroTeamBadge } from "./TeamBadge"; // Use the floating white badge

export function AeroMainMatchBanner({
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
        animation: "aeroScaleIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both", // Springy aero animation
        fontFamily: "'DM Sans', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16, // Space between the distinct floating blocks
      }}
    >
      {/* Floating Tournament Badge */}
      {(info.tournamentName || info.stage) && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: A.bgDeep, // Soft gray
            border: `1px solid ${A.border}`,
            borderRadius: 100, // Perfect pill shape
            padding: "8px 28px",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800,
            fontSize: 13,
            color: A.textMain, // Near black
            letterSpacing: 2,
            textTransform: "uppercase",
            boxShadow: A.panelShadow, // Soft premium shadow
          }}
        >
          <span style={{ color: A.teal }}>{info.tournamentName}</span>
          {info.tournamentName && info.stage && (
            <span style={{ color: A.t25 }}>◆</span>
          )}
          {info.stage && <span style={{ color: A.t70 }}>{info.stage}</span>}
        </div>
      )}

      {/* Main Teams Pill */}
      <div
        style={{
          background: A.bg, // Clean white
          border: `1px solid ${A.borderSub}`, // Ultra subtle edge
          borderRadius: 100, // Giant pill shape
          overflow: "hidden",
          boxShadow: A.panelShadow,
          display: "flex",
          alignItems: "stretch",
          width: "100%",
          position: "relative",
        }}
      >
        {/* Soft top accent line - constrained to the top edge of the pill */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${A.cyan} 0%, ${A.cyan} 50%, ${A.pink} 50%, ${A.pink} 100%)`,
            opacity: 0.85,
          }}
        />

        {/* Team 1 Section */}
        <div
          style={{
            flex: 1,
            padding: "32px 56px",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end", // Align towards the center
            gap: 24,
          }}
        >
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: A.textMain,
                fontWeight: 800,
                fontSize: 38,
                textTransform: "uppercase",
                letterSpacing: 1,
                lineHeight: 1,
              }}
            >
              {state.team1.name}
            </div>
            {hasScores && (
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  justifyContent: "flex-end",
                  marginTop: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: A.cyan, // Team color pops on white
                    fontWeight: 900,
                    fontSize: 48,
                    lineHeight: 1,
                  }}
                >
                  {state.team1.score}/{state.team1.wickets}
                </span>
                <span style={{ color: A.t45, fontSize: 18, fontWeight: 600 }}>
                  ({state.team1.overs} ov)
                </span>
              </div>
            )}
          </div>
          <AeroTeamBadge
            name={state.team1.name}
            logoUrl={state.team1.logoUrl}
            size={76}
            accent={A.cyan}
          />
        </div>

        {/* VS Divider (Center of the Pill) */}
        <div
          style={{
            width: 80,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            borderLeft: `1px solid ${A.borderSub}`,
            borderRight: `1px solid ${A.borderSub}`,
            background: A.bgLight, // Very soft gray center strip
          }}
        >
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 800,
              fontSize: 16,
              color: A.t25, // Extremely soft 'VS'
              letterSpacing: 2,
            }}
          >
            VS
          </div>
          {info.overs > 0 && (
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: A.t45,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              T{info.overs}
            </div>
          )}
        </div>

        {/* Team 2 Section */}
        <div
          style={{
            flex: 1,
            padding: "32px 56px",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start", // Align towards the center
            gap: 24,
          }}
        >
          <AeroTeamBadge
            name={state.team2.name}
            logoUrl={state.team2.logoUrl}
            size={76}
            accent={A.pink}
          />
          <div style={{ textAlign: "left" }}>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: A.textMain,
                fontWeight: 800,
                fontSize: 38,
                textTransform: "uppercase",
                letterSpacing: 1,
                lineHeight: 1,
              }}
            >
              {state.team2.name}
            </div>
            {hasScores && (
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  justifyContent: "flex-start",
                  marginTop: 4,
                }}
              >
                <span style={{ color: A.t45, fontSize: 18, fontWeight: 600 }}>
                  ({state.team2.overs} ov)
                </span>
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: A.pink, // Team color pops on white
                    fontWeight: 900,
                    fontSize: 48,
                    lineHeight: 1,
                  }}
                >
                  {state.team2.score}/{state.team2.wickets}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Meta Strip (Below the main card) */}
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          background: A.bgDeep, // Soft gray container
          borderRadius: 100, // Perfect pill shape
          padding: "4px 16px",
          border: `1px solid ${A.border}`,
          boxShadow: A.panelShadow,
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
                padding: "8px 24px",
                borderRight:
                  i < arr.length - 1 ? `1px solid ${A.borderSub}` : "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: A.t45,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                {item.label}
              </div>
              <div style={{ color: A.textMain, fontSize: 14, fontWeight: 700 }}>
                {item.value}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
