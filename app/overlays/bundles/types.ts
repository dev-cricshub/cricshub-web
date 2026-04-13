// ═══════════════════════════════════════════════════════════
// SHARED TYPES — mirroring MatchState.java exactly
// Used by all overlay bundles (basic, glass, future bundles)
// ═══════════════════════════════════════════════════════════

export interface PlayerDetails {
  playerId: string;
  name: string;
}

export interface WicketDetails {
  dismissalType: string;
  bowlerId: PlayerDetails | null;
  catcherId: PlayerDetails | null;
  runOutMakerId: PlayerDetails | null;
  overNumber: number;
  ballNumber: number;
}

export interface Extras {
  wide: number;
  noBall: number;
  bye: number;
  legBye: number;
  penalty: number;
}

export interface PlayerStats {
  playerId: string;
  name: string;
  role?: string; // "BAT" | "BWL" | "AR" | "WK"
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  wicketDetails: WicketDetails | null;
  retiredHurt?: boolean;
  overs: number;
  ballsBowled: number;
  runsConceded: number;
  wicketsTaken: number;
  economyRate: number;
}

export interface TeamDetails {
  name: string;
  logoUrl: string | null;
  playingXI: PlayerStats[];
  captainId: string | null;
  score: number;
  wickets: number;
  overs: number;
  ballsPlayed: number;
  extras: Extras | null;
}

export interface MatchState {
  matchId: string;
  team1: TeamDetails;
  team2: TeamDetails;
  tossWinner: string;
  choice: string;
  firstInnings: boolean;
  completedOvers: number;
  totalOvers: number;
  matchComplete: boolean;
  winner: string | null;
  winBy: string | null;
  battingFirst: TeamDetails | null;
  battingSecond: TeamDetails | null;
  currentStriker: PlayerDetails | null;
  currentNonStriker: PlayerDetails | null;
  currentBowler: PlayerDetails | null;
  currentOverBalls: string[];
  innings1BattingOrder?: PlayerStats[];
  innings2BattingOrder?: PlayerStats[];
  team1BowlingOrder?: PlayerStats[];
  team2BowlingOrder?: PlayerStats[];
  innings1Overs?: { shortBallOutcome: string }[][];
  innings2Overs?: { shortBallOutcome: string }[][];
}

export interface MatchInfo {
  id: string;
  venue: string;
  matchDate: string;
  matchTime: string;
  stage: string | null;
  overs: number;
  tournamentName: string | null;
  team1: { name: string; logoPath: string | null };
  team2: { name: string; logoPath: string | null };
}

export type BannerType =
  | "none"
  | "main"
  | "playingXI_bat_team1"
  | "playingXI_bat_team2"
  | "playingXI_bowl_team1"
  | "playingXI_bowl_team2"
  | "playingXI_combined"
  | "score"
  | "summary"
  | string;
