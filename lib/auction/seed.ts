import { defaultRules, placeBid, presentNext, publishAuction, sellCurrent, startAuction, uid, unsoldCurrent, completeAuction, nowIso } from "./engine";
import type { Auction, AuctionPlayer, AuctionTeam, PlayerRole } from "./types";

const COLORS = ["#1E88E5", "#E2B94B", "#C46B4E", "#8A9BA8", "#207BBE", "#273687", "#3D8F6E", "#A15C8A"];

function team(name: string, shortName: string, ownerName: string, color: string, purseOverride: number | null = null): AuctionTeam {
  return { id: uid("team"), name, shortName, ownerName, color, purseOverride };
}

function player(
  name: string,
  role: PlayerRole,
  nationality: string,
  overseas: boolean,
  category: string,
  basePrice: number,
  matches: number,
  battingAvg: string,
  bowlingAvg: string,
  order: number,
): AuctionPlayer {
  return {
    id: uid("plyr"),
    name,
    role,
    nationality,
    overseas,
    category,
    basePrice,
    matches,
    battingAvg,
    bowlingAvg,
    status: "available",
    queueOrder: order,
    soldToTeamId: null,
    soldPrice: null,
  };
}

function must<T>(label: string, result: { ok: true; value: T } | { ok: false; error: string }): T {
  if (!result.ok) throw new Error(`${label}: ${result.error}`);
  return result.value;
}

function blank(partial: Pick<Auction, "name" | "tournament" | "description" | "startsAt" | "status"> & Partial<Auction>): Auction {
  const at = "2026-03-01T10:00:00.000Z";
  return {
    id: uid("auc"),
    visibility: "private",
    format: "player",
    timezone: "Asia/Kolkata",
    archived: false,
    rules: defaultRules(),
    teams: [],
    players: [],
    bids: [],
    events: [
      {
        id: uid("evt"),
        type: "created",
        at,
        message: "Auction created.",
        reverted: false,
        payload: {},
      },
    ],
    currentPlayerId: null,
    createdAt: at,
    updatedAt: at,
    publishedAt: null,
    startedAt: null,
    pausedAt: null,
    pausedMs: 0,
    endedAt: null,
    ...partial,
  };
}

function cplTeams(): AuctionTeam[] {
  return [
    team("Mumbai Strikers", "MUM", "Rohan Mehta", COLORS[0]),
    team("Andheri Warriors", "AND", "Neel Kadam", COLORS[1]),
    team("Thane Titans", "THA", "Ishaan Nair", COLORS[3]),
    team("Borivali Blasters", "BOR", "Yash Shinde", COLORS[2]),
    team("Dadar Daredevils", "DAD", "Kabir Rao", COLORS[4]),
    team("Powai Panthers", "POW", "Dev Kulkarni", COLORS[5]),
    team("Worli Waves", "WOR", "Asha Patil", COLORS[6]),
    team("Bandra Knights", "BAN", "Om Gaikwad", COLORS[7]),
  ];
}

function cplPlayers(): AuctionPlayer[] {
  const rows: [string, PlayerRole, string, boolean, string, number, number, string, string][] = [
    ["Arjun Mehta", "BAT", "India", false, "A", 100000, 42, "41.2", "—"],
    ["Kabir Rao", "BAT", "India", false, "A", 80000, 38, "36.4", "—"],
    ["Neel Kadam", "WK", "India", false, "A", 70000, 40, "28.1", "—"],
    ["Sahil Bhat", "WK", "India", false, "B", 40000, 22, "22.0", "—"],
    ["Dev Kulkarni", "AR", "India", false, "A", 90000, 36, "29.5", "24.8"],
    ["Ishaan Nair", "AR", "India", false, "B", 50000, 30, "18.2", "27.1"],
    ["Rohan Pawar", "BOWL", "India", false, "A", 80000, 44, "8.4", "21.6"],
    ["Yash Shinde", "BOWL", "India", false, "B", 40000, 28, "6.1", "26.4"],
    ["Varun Joshi", "BOWL", "India", false, "B", 30000, 19, "4.0", "28.9"],
    ["Owen Clarke", "BAT", "Australia", true, "A", 120000, 55, "44.8", "—"],
    ["Liam Hart", "BOWL", "England", true, "A", 100000, 48, "9.2", "22.4"],
    ["Farhan Qureshi", "AR", "India", false, "C", 20000, 16, "21.0", "31.5"],
    ["Ayaan Sheikh", "BAT", "India", false, "B", 50000, 25, "33.6", "—"],
    ["Rehan Desai", "BOWL", "India", false, "C", 20000, 14, "3.2", "32.0"],
    ["Nikhil More", "WK", "India", false, "C", 20000, 12, "19.4", "—"],
    ["Samar Jain", "AR", "India", false, "B", 40000, 21, "24.7", "29.0"],
  ];
  return rows.map((row, i) => player(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], i + 1));
}

function liveAuction(): Auction {
  let auction = blank({
    name: "Harbour T20 player auction",
    tournament: "Harbour T20",
    description: "Club auction for the Harbour T20 season. Eight franchises, a ₹20 lakh purse, and a 15-player squad cap.",
    startsAt: "2026-10-18T08:30:00.000Z",
    status: "draft",
    teams: cplTeams(),
    players: cplPlayers(),
  });
  auction = must("publish", publishAuction(auction));
  auction = must("start", startAuction(auction));
  const order = ["MUM", "AND", "THA", "BOR", "DAD", "POW"];
  const teamId = (short: string) => auction.teams.find((t) => t.shortName === short)!.id;
  // Sell the first four players, leave the fifth on the block with two bids.
  for (let i = 0; i < 4; i += 1) {
    auction = must("bid", placeBid(auction, teamId(order[i % order.length])));
    if (i % 2 === 0) auction = must("raise", placeBid(auction, teamId(order[(i + 1) % order.length])));
    auction = must("sell", sellCurrent(auction));
    auction = must("next", presentNext(auction));
  }
  auction = must("open bid", placeBid(auction, teamId("WOR")));
  auction = must("counter", placeBid(auction, teamId("BAN")));
  return auction;
}

function scheduledAuction(): Auction {
  const auction = blank({
    name: "City Premier League auction",
    tournament: "City Premier League",
    description: "Scheduled player auction. Rules, teams and the pool are set. Not started.",
    startsAt: "2026-11-02T09:00:00.000Z",
    status: "draft",
    teams: cplTeams().slice(0, 6),
    players: cplPlayers().slice(0, 12),
  });
  return must("publish cpl", publishAuction(auction));
}

function completedAuction(): Auction {
  let auction = blank({
    name: "Winter Cup retention auction",
    tournament: "Winter Cup",
    description: "A finished four-team auction used to show results and squad reports.",
    startsAt: "2026-01-12T09:00:00.000Z",
    status: "draft",
    rules: { ...defaultRules(), pursePerTeam: 1_000_000, maxSquad: 8, minSquad: 6, overseasLimit: 1 },
    teams: cplTeams().slice(0, 4),
    players: cplPlayers().slice(0, 8),
  });
  auction = must("publish winter", publishAuction(auction));
  auction = must("start winter", startAuction(auction));
  const ids = auction.teams.map((t) => t.id);
  for (let i = 0; i < 8; i += 1) {
    if (i === 7) {
      auction = must("unsold", unsoldCurrent(auction));
    } else {
      auction = must("bid", placeBid(auction, ids[i % ids.length]));
      auction = must("sell", sellCurrent(auction));
    }
    if (i < 7) auction = must("next", presentNext(auction));
  }
  return must("complete", completeAuction(auction));
}

function draftAuction(): Auction {
  return blank({
    name: "Sunday Smash draft",
    tournament: "Sunday Smash",
    description: "",
    startsAt: "2026-12-06T08:00:00.000Z",
    status: "draft",
    teams: cplTeams().slice(0, 2),
    players: [],
  });
}

export function buildSeedAuctions(): Auction[] {
  return [liveAuction(), scheduledAuction(), draftAuction(), completedAuction()];
}

export function seedStamp(): string {
  return nowIso();
}
