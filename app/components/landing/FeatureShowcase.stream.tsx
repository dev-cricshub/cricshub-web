"use client";

import { useEffect, useRef, useState } from "react";
import { GlassScoreOverlay } from "@/app/overlays/bundles/glass/GlassScoreOverlay";
import type { MatchState, PlayerStats } from "@/app/overlays/bundles/types";

/** Sample state shaped like a live match, so the real Glass overlay can render. */
function player(
  id: string,
  name: string,
  role: string,
  runs: number,
  balls: number,
  fours: number,
  sixes: number,
  bowling?: { overs: number; runs: number; wickets: number },
): PlayerStats {
  const overs = bowling?.overs ?? 0;
  const conceded = bowling?.runs ?? 0;
  return {
    playerId: id,
    name,
    role,
    runs,
    ballsFaced: balls,
    fours,
    sixes,
    strikeRate: balls > 0 ? Math.round((runs / balls) * 1000) / 10 : 0,
    wicketDetails: null,
    overs,
    ballsBowled: Math.round(overs * 6),
    runsConceded: conceded,
    wicketsTaken: bowling?.wickets ?? 0,
    economyRate: overs > 0 ? Math.round((conceded / overs) * 100) / 100 : 0,
  };
}

const BATTERS: PlayerStats[] = [
  player("s1", "S. Iyer", "BAT", 47, 29, 4, 2),
  player("s2", "K. Rao", "WK", 12, 9, 1, 0),
  player("s3", "R. Mehta", "BAT", 58, 34, 6, 2),
];

const BOWLERS: PlayerStats[] = [
  player("b1", "V. Khan", "BWL", 4, 3, 0, 0, { overs: 3.2, runs: 28, wickets: 2 }),
];

const STRIKERS = {
  name: "Mumbai Strikers",
  logoUrl: null,
  playingXI: BATTERS,
  captainId: "s3",
  score: 142,
  wickets: 4,
  overs: 16.2,
  ballsPlayed: 98,
  extras: { wide: 3, noBall: 1, bye: 0, legBye: 0, penalty: 0 },
};

const WARRIORS = {
  name: "Andheri Warriors",
  logoUrl: null,
  playingXI: BOWLERS,
  captainId: "b1",
  score: 177,
  wickets: 6,
  overs: 20,
  ballsPlayed: 120,
  extras: null,
};

const STREAM_MATCH: MatchState = {
  matchId: "landing-stream",
  team1: WARRIORS,
  team2: STRIKERS,
  tossWinner: "Andheri Warriors",
  choice: "bat",
  firstInnings: false,
  completedOvers: 16,
  totalOvers: 20,
  matchComplete: false,
  winner: null,
  winBy: null,
  battingFirst: WARRIORS,
  battingSecond: STRIKERS,
  currentStriker: { playerId: "s1", name: "S. Iyer" },
  currentNonStriker: { playerId: "s2", name: "K. Rao" },
  currentBowler: { playerId: "b1", name: "V. Khan" },
  currentOverBalls: ["1", "4", "0", "W", "6"],
  innings2BattingOrder: BATTERS,
  team1BowlingOrder: BOWLERS,
};

/** The Glass score bar, at broadcast size, scaled into the frame. */
export default function StreamPreview() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const apply = () => setScale(el.clientWidth / 1920);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={frameRef} className="relative aspect-video w-full overflow-hidden bg-black">
      <div
        className="pointer-events-none absolute left-0 top-0 h-[1080px] w-[1920px] origin-top-left"
        style={{ transform: `scale(${scale})` }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/matchStalkImage.jpg)" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.35),transparent_28%,transparent_62%,rgba(0,0,0,0.25))]" aria-hidden />
        <div className="absolute left-10 top-9 flex items-center gap-3">
          <span className="flex items-center gap-2 rounded-sm bg-[#FF4757] px-3 py-1.5 font-display text-[22px] font-bold uppercase tracking-wider text-white">
            <span className="h-2.5 w-2.5 rounded-full bg-white" />
            Live
          </span>
          <span className="font-display text-[22px] font-semibold uppercase tracking-[0.14em] text-white/90">
            City Premier League · Final
          </span>
        </div>
        <GlassScoreOverlay state={STREAM_MATCH} />
      </div>
    </div>
  );
}
