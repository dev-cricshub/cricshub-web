// Simulated match engine for the landing-page demos. Pure + deterministic:
// nothing here talks to a backend, and every UI using it is labelled DEMO.
// Shape mirrors what a real live-score API would provide so it can be swapped later.

export type BallKind = "dot" | "run" | "four" | "six" | "wicket" | "wide";

export interface BallEvent {
  kind: BallKind;
  runs: number;
  label: string;
}

export interface Batter {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  dismissal?: string;
}

export interface Bowler {
  name: string;
  balls: number;
  runs: number;
  wickets: number;
}

export interface CommentaryLine {
  id: number;
  over: string;
  kind: BallKind;
  runs: number;
  text: string;
}

export interface TeamInfo {
  name: string;
  short: string;
  color: string;
}

export interface MatchState {
  title: string;
  batting: TeamInfo;
  bowling: TeamInfo;
  firstInnings: { runs: number; wickets: number; overs: string };
  target: number;
  maxBalls: number;
  runs: number;
  wickets: number;
  balls: number; // legal deliveries
  extras: number;
  batters: Batter[];
  striker: number;
  nonStriker: number;
  lineup: string[]; // yet to bat
  bowlers: Bowler[];
  bowler: number;
  thisOver: BallEvent[];
  commentary: CommentaryLine[];
  seq: number;
  result: string | null;
}

export type DemoAction = "dot" | "1" | "2" | "4" | "6" | "wide" | "wicket";

const TEAMS = {
  // Team colours are match data (they'd come from the team profile), not UI tokens.
  home: { name: "Mumbai Strikers", short: "MUM", color: "#1E88E5" },
  away: { name: "Andheri Warriors", short: "AND", color: "#E2B94B" },
};

export function initialMatch(): MatchState {
  return {
    title: "City Premier League · Final",
    batting: TEAMS.home,
    bowling: TEAMS.away,
    firstInnings: { runs: 177, wickets: 6, overs: "20.0" },
    target: 178,
    maxBalls: 120,
    runs: 142,
    wickets: 3,
    balls: 98, // 16.2 overs
    extras: 9,
    batters: [
      { name: "A. Rao", runs: 31, balls: 24, fours: 4, sixes: 0, dismissal: "c Khan b Mehta" },
      { name: "V. Iyer", runs: 12, balls: 10, fours: 2, sixes: 0, dismissal: "b Desai" },
      { name: "R. Sharma", runs: 58, balls: 37, fours: 6, sixes: 3 },
      { name: "K. Patil", runs: 11, balls: 9, fours: 1, sixes: 0, dismissal: "lbw b Mehta" },
      { name: "S. Yadav", runs: 21, balls: 14, fours: 2, sixes: 1 },
    ],
    striker: 2,
    nonStriker: 4,
    lineup: ["H. Pandya", "T. Varma", "N. Wadhera", "P. Chawla", "J. Bumrah", "A. Madhwal"],
    bowlers: [
      { name: "Z. Khan", balls: 24, runs: 31, wickets: 0 },
      { name: "D. Mehta", balls: 24, runs: 29, wickets: 2 },
      { name: "R. Desai", balls: 22, runs: 33, wickets: 1 },
      { name: "S. Thakur", balls: 18, runs: 26, wickets: 0 },
      { name: "M. Ali", balls: 10, runs: 14, wickets: 0 },
    ],
    bowler: 2,
    thisOver: [
      { kind: "run", runs: 1, label: "1" },
      { kind: "four", runs: 4, label: "4" },
    ],
    commentary: [
      { id: 2, over: "16.2", kind: "four", runs: 4, text: "Desai to Sharma, FOUR — short and wide, slapped through cover point." },
      { id: 1, over: "16.1", kind: "run", runs: 1, text: "Desai to Yadav, 1 run — worked off the pads to deep square leg." },
      { id: 0, over: "15.6", kind: "dot", runs: 0, text: "Thakur to Sharma, no run — yorker on off stump, dug out." },
    ],
    seq: 3,
    result: null,
  };
}

export const oversText = (balls: number) => `${Math.floor(balls / 6)}.${balls % 6}`;
export const runRate = (runs: number, balls: number) => (balls ? ((runs * 6) / balls).toFixed(2) : "0.00");
export const strikeRate = (b: Batter) => (b.balls ? ((b.runs * 100) / b.balls).toFixed(1) : "0.0");
export const economy = (b: Bowler) => (b.balls ? ((b.runs * 6) / b.balls).toFixed(2) : "0.00");

export function requiredRate(s: MatchState) {
  const need = s.target - s.runs;
  const left = s.maxBalls - s.balls;
  if (need <= 0 || left <= 0) return "—";
  return ((need * 6) / left).toFixed(2);
}

const COMMENTARY: Record<BallKind, string[]> = {
  dot: [
    "no run — beaten outside off, good carry to the keeper.",
    "no run — full and straight, blocked back to the bowler.",
    "no run — slower ball, mistimed to mid-off.",
  ],
  run: [
    "{r} — nudged into the gap at midwicket.",
    "{r} — dropped at their feet, quick running.",
    "{r} — driven down to long-on.",
  ],
  four: [
    "FOUR — glorious cover drive, didn't need to run.",
    "FOUR — short, pulled hard and it races to the fence.",
    "FOUR — edged, but fine leg had no chance.",
  ],
  six: [
    "SIX — launched over long-on, into the second tier!",
    "SIX — down the track and lofted straight back over the bowler.",
    "SIX — picked up off the pads, all the way over square leg.",
  ],
  wicket: [
    "OUT — bowled him! Through the gate and the off stump is cartwheeling.",
    "OUT — top-edged and taken at short fine leg.",
    "OUT — plumb in front, given out lbw.",
  ],
  wide: ["wide — drifting down leg, an extra to the total.", "wide — too far outside off, signalled wide."],
};

const DISMISSALS = ["b {bowler}", "c Khan b {bowler}", "lbw b {bowler}"];

export function applyBall(prev: MatchState, action: DemoAction): MatchState {
  if (prev.result) return prev;
  const s: MatchState = {
    ...prev,
    batters: prev.batters.map((b) => ({ ...b })),
    bowlers: prev.bowlers.map((b) => ({ ...b })),
    lineup: [...prev.lineup],
    thisOver: prev.thisOver.length >= 6 ? [] : [...prev.thisOver],
  };
  const striker = s.batters[s.striker];
  const bowler = s.bowlers[s.bowler];
  const pick = (arr: string[]) => arr[s.seq % arr.length];

  let ball: BallEvent;
  let legal = true;

  switch (action) {
    case "wide":
      legal = false;
      s.runs += 1;
      s.extras += 1;
      bowler.runs += 1;
      ball = { kind: "wide", runs: 1, label: "Wd" };
      break;
    case "wicket":
      ball = { kind: "wicket", runs: 0, label: "W" };
      break;
    case "dot":
      ball = { kind: "dot", runs: 0, label: "•" };
      break;
    default: {
      const r = Number(action);
      ball = { kind: r === 4 ? "four" : r === 6 ? "six" : "run", runs: r, label: String(r) };
    }
  }

  const displayOver = legal
    ? `${Math.floor(s.balls / 6)}.${(s.balls % 6) + 1}`
    : `${Math.floor(s.balls / 6)}.${s.balls % 6}`;

  const bowlerSurname = bowler.name.split(" ").pop()!;
  const strikerSurname = striker.name.split(" ").pop()!;
  const text = pick(COMMENTARY[ball.kind]).replace("{r}", `${ball.runs} run${ball.runs === 1 ? "" : "s"}`);

  if (legal) {
    s.balls += 1;
    bowler.balls += 1;
    striker.balls += 1;
    if (ball.kind === "wicket") {
      s.wickets += 1;
      bowler.wickets += 1;
      striker.dismissal = pick(DISMISSALS).replace("{bowler}", bowlerSurname);
    } else {
      s.runs += ball.runs;
      bowler.runs += ball.runs;
      striker.runs += ball.runs;
      if (ball.kind === "four") striker.fours += 1;
      if (ball.kind === "six") striker.sixes += 1;
    }
  }

  s.thisOver.push(ball);
  s.commentary = [
    { id: s.seq, over: displayOver, kind: ball.kind, runs: ball.runs, text: `${bowlerSurname} to ${strikerSurname}, ${text}` },
    ...prev.commentary,
  ].slice(0, 30);
  s.seq += 1;

  // New batter
  if (ball.kind === "wicket" && s.wickets < 10) {
    const next = s.lineup.shift();
    if (next) {
      s.batters.push({ name: next, runs: 0, balls: 0, fours: 0, sixes: 0 });
      s.striker = s.batters.length - 1;
    }
  }

  // Strike rotation on odd runs
  if (legal && ball.kind !== "wicket" && ball.runs % 2 === 1) {
    [s.striker, s.nonStriker] = [s.nonStriker, s.striker];
  }

  // End of over: swap ends, next bowler (no bowler twice in a row)
  if (legal && s.balls % 6 === 0) {
    [s.striker, s.nonStriker] = [s.nonStriker, s.striker];
    s.bowler = (s.bowler + 1) % s.bowlers.length;
  }

  // Result
  if (s.runs >= s.target) {
    s.result = `${s.batting.name} won by ${10 - s.wickets} wicket${10 - s.wickets === 1 ? "" : "s"}`;
  } else if (s.wickets >= 10 || s.balls >= s.maxBalls) {
    const by = s.target - 1 - s.runs;
    s.result = by === 0 ? "Match tied" : `${s.bowling.name} won by ${by} run${by === 1 ? "" : "s"}`;
  }

  return s;
}

export const ballTone: Record<BallKind, string> = {
  dot: "bg-surface-3 text-fg-muted",
  run: "bg-surface-3 text-fg",
  four: "bg-brand text-white",
  six: "bg-accent text-fg-inverse",
  wicket: "bg-live text-white",
  wide: "bg-gold text-canvas",
};
