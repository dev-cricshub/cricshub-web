import { MatchState, TeamDetails, PlayerStats } from "../types";
import { getBowlTeam, fmtOv, fmtEcon } from "../helpers";
import { A } from "./theme";
import { AeroTeamBadge } from "./TeamBadge"; // Make sure you are importing the Aero specific badge

export function AeroBowlingCard({
  team,
  state,
}: {
  team: TeamDetails;
  state: MatchState;
}) {
  // --------------------------------------------------------------------------
  // DATA LOGIC (Remains exactly the same)
  // --------------------------------------------------------------------------
  const isPassedTeamBatFirst = team.name === state.battingFirst?.name;
  const bowlingOrderArr =
    (isPassedTeamBatFirst
      ? (state as any).team2BowlingOrder
      : (state as any).team1BowlingOrder) || [];

  const opponent = team.name === state.team1.name ? state.team2 : state.team1;
  const isActiveBowlTeam = team.name === getBowlTeam(state).name;
  const activeBowlerId = isActiveBowlTeam
    ? state.currentBowler?.playerId
    : null;

  const placedIds = new Set<string>();
  const orderedBowlers: PlayerStats[] = [];

  bowlingOrderArr.forEach((p: any) => {
    if ((p.ballsBowled ?? 0) > 0 || (p.wicketsTaken ?? 0) > 0) {
      orderedBowlers.push(p);
      placedIds.add(p.playerId);
    }
  });

  if (activeBowlerId && !placedIds.has(activeBowlerId)) {
    const baseProfile = team.playingXI.find(
      (p) => p.playerId === activeBowlerId,
    );
    if (baseProfile) {
      orderedBowlers.push({
        ...baseProfile,
        overs: 0,
        ballsBowled: 0,
        runsConceded: 0,
        wicketsTaken: 0,
        economyRate: 0,
      });
      placedIds.add(activeBowlerId);
    }
  }

  const bowlers = orderedBowlers.sort(
    (a, b) => (b.ballsBowled || 0) - (a.ballsBowled || 0),
  );
  const currentBowlerId = state.currentBowler?.playerId;
  const ROW_H = 56;

  // --------------------------------------------------------------------------
  // RENDER LOGIC (Aero Theme)
  // --------------------------------------------------------------------------
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 960,
        animation: "aeroScaleIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both", // Smooth springy animation
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          background: A.bg, // Clean white background
          border: `1px solid ${A.borderSub}`, // Extremely subtle outer ring
          borderRadius: 24, // Premium large rounding
          overflow: "hidden",
          boxShadow: A.panelShadow, // Soft Apple-style shadow
        }}
      >
        {/* Soft Team Accent Stripe */}
        <div style={{ height: 4, background: A.pink, opacity: 0.85 }} />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 36px",
            background: A.bg, // Keep header white
            borderBottom: `1px solid ${A.border}`, // Soft divider
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <AeroTeamBadge
              name={team.name}
              logoUrl={team.logoUrl}
              size={58}
              accent={A.pink}
            />
            <div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: A.t45, // Muted gray
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                BOWLING
              </div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: A.textMain, // Near black for team name
                  fontWeight: 800,
                  fontSize: 36,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  lineHeight: 1,
                }}
              >
                {team.name}
              </div>
            </div>
          </div>
          {(opponent.score > 0 || opponent.wickets > 0) && (
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  color: A.t45,
                  fontSize: 13,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 3,
                }}
              >
                {opponent.name}
              </div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: A.textMain,
                  fontWeight: 800,
                  fontSize: 34,
                  lineHeight: 1,
                }}
              >
                {opponent.score}/{opponent.wickets}{" "}
                <span style={{ color: A.t45, fontSize: 17, fontWeight: 600 }}>
                  ({opponent.overs})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Column headers */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: 40,
            padding: "0 36px",
            borderBottom: `1px solid ${A.borderSub}`,
            background: A.bgLight, // Very soft gray for headers
          }}
        >
          <div
            style={{
              flex: 1,
              fontFamily: "'Barlow Condensed', sans-serif",
              color: A.t45,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 2.5,
              textTransform: "uppercase",
            }}
          >
            BOWLER
          </div>
          {[
            { h: "O", w: 88 },
            { h: "R", w: 78 },
            { h: "W", w: 70 },
            { h: "ECON", w: 98 },
          ].map(({ h, w }) => (
            <div
              key={h}
              style={{
                width: w,
                textAlign: "right",
                fontFamily: "'Barlow Condensed', sans-serif",
                color: A.t45,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 2.5,
                textTransform: "uppercase",
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {bowlers.length === 0 ? (
          <div
            style={{
              padding: "36px",
              textAlign: "center",
              color: A.t45,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 16,
              letterSpacing: 1,
            }}
          >
            NO OVERS BOWLED YET
          </div>
        ) : (
          <div>
            {bowlers.map((p, i) => {
              const isCurrent = p.playerId === currentBowlerId;
              const isCap = p.playerId === team.captainId;

              // Clean alternating rows
              const rowBg = isCurrent
                ? A.pinkDim // Soft pink tint for active bowler
                : i % 2 === 0
                  ? A.bg
                  : A.bgLight;

              return (
                <div
                  key={p.playerId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: ROW_H,
                    padding: "0 36px",
                    background: rowBg,
                    borderBottom:
                      i < bowlers.length - 1
                        ? `1px solid ${A.borderSub}` // Almost invisible separator
                        : "none",
                    borderLeft: isCurrent
                      ? `4px solid ${A.pink}`
                      : "4px solid transparent",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      overflow: "hidden",
                    }}
                  >
                    {isCurrent && (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          flexShrink: 0,
                          background: A.pink,
                        }}
                      />
                    )}
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        color: isCurrent ? A.textMain : A.t70, // Darker text if active
                        fontWeight: isCurrent ? 800 : 700,
                        fontSize: 20,
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
                          fontSize: 11,
                          fontWeight: 800,
                          color: A.teal, // Aqua pill
                          background: A.tealDim,
                          borderRadius: 100, // Pill shaped badge
                          padding: "2px 8px",
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
                      width: 88,
                      textAlign: "right",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: 20,
                      color: A.t70,
                      flexShrink: 0,
                    }}
                  >
                    {fmtOv(p.overs ?? 0)}
                  </div>
                  <div
                    style={{
                      width: 78,
                      textAlign: "right",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: 20,
                      color: A.t70,
                      flexShrink: 0,
                    }}
                  >
                    {p.runsConceded ?? 0}
                  </div>
                  <div
                    style={{
                      width: 70,
                      textAlign: "right",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: (p.wicketsTaken ?? 0) > 0 ? 800 : 700,
                      fontSize: 22,
                      color: (p.wicketsTaken ?? 0) > 0 ? A.pink : A.t70,
                      flexShrink: 0,
                    }}
                  >
                    {p.wicketsTaken ?? 0}
                  </div>
                  <div
                    style={{
                      width: 98,
                      textAlign: "right",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: 18,
                      color: A.t45,
                      flexShrink: 0,
                    }}
                  >
                    {fmtEcon(p.economyRate ?? 0)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "14px 36px",
            borderTop: `1px solid ${A.border}`,
            background: A.bgDeep, // Soft gray footer
            gap: 0,
          }}
        >
          <div
            style={{ flex: 1, display: "flex", alignItems: "center", gap: 14 }}
          >
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: A.t45,
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Overs
            </span>
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: A.textMain, // Near black
                fontSize: 20,
                fontWeight: 800,
              }}
            >
              {opponent.overs} / {state.totalOvers}
            </span>
          </div>
          {(() => {
            const extras = opponent.extras;
            const total = extras
              ? extras.wide +
                extras.noBall +
                extras.bye +
                extras.legBye +
                extras.penalty
              : 0;
            return total > 0 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "0 28px",
                  borderLeft: `1px solid ${A.border}`,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: A.t45,
                    fontSize: 13,
                    fontWeight: 800,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                  }}
                >
                  Extras
                </span>
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: A.textMain,
                    fontSize: 20,
                    fontWeight: 800,
                  }}
                >
                  {total}
                </span>
              </div>
            ) : null;
          })()}
        </div>
      </div>
    </div>
  );
}
