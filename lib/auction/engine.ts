import type { Auction, AuctionPlayer, AuctionRules, AuctionTeam, Bid, PlayerRole } from "./types";
import { ROLE_LABEL } from "./types";

export function teamById(auction: Auction, id: string | null | undefined): AuctionTeam | undefined {
  if (!id) return undefined;
  return auction.teams.find((t) => t.id === id);
}

export function playerById(auction: Auction, id: string | null | undefined): AuctionPlayer | undefined {
  if (!id) return undefined;
  return auction.players.find((p) => p.id === id);
}

export function teamBudget(auction: Auction, team: AuctionTeam): number {
  return team.purseOverride ?? auction.rules.pursePerTeam;
}

export function squadOf(auction: Auction, teamId: string): AuctionPlayer[] {
  return auction.players.filter((p) => p.status === "sold" && p.soldToTeamId === teamId);
}

export function teamSpent(auction: Auction, teamId: string): number {
  return squadOf(auction, teamId).reduce((sum, p) => sum + (p.soldPrice ?? 0), 0);
}

export function teamRemaining(auction: Auction, teamId: string): number {
  const team = teamById(auction, teamId);
  if (!team) return 0;
  return teamBudget(auction, team) - teamSpent(auction, teamId);
}

export function activeBids(auction: Auction, playerId: string): Bid[] {
  return auction.bids.filter((b) => b.playerId === playerId && !b.voided);
}

export function highestBid(auction: Auction, playerId: string): Bid | undefined {
  return activeBids(auction, playerId).at(-1);
}

export function incrementFor(rules: AuctionRules, amount: number): number {
  const slabs = [...rules.increments].sort((a, b) => (a.upTo ?? Infinity) - (b.upTo ?? Infinity));
  for (const slab of slabs) {
    if (slab.upTo == null || amount < slab.upTo) return slab.step;
  }
  return slabs.at(-1)?.step ?? 0;
}

/** The only amount a team may bid right now. Base price when nobody has bid. */
export function nextBidAmount(auction: Auction): number | null {
  const player = playerById(auction, auction.currentPlayerId);
  if (!player || player.status !== "in_auction") return null;
  const top = highestBid(auction, player.id);
  if (!top) return player.basePrice;
  return top.amount + incrementFor(auction.rules, top.amount);
}

export function queue(auction: Auction): AuctionPlayer[] {
  return auction.players
    .filter((p) => p.status === "available")
    .sort((a, b) => a.queueOrder - b.queueOrder || a.name.localeCompare(b.name));
}

export interface TeamConstraint {
  ok: boolean;
  reason: string | null;
}

export function teamCanBid(auction: Auction, teamId: string, amount: number, player: AuctionPlayer): TeamConstraint {
  const team = teamById(auction, teamId);
  if (!team) return { ok: false, reason: "That team is not in this auction." };
  if (teamRemaining(auction, teamId) < amount) {
    return { ok: false, reason: `${team.shortName} does not have enough purse for ${amountLabel(amount)}.` };
  }
  const squad = squadOf(auction, teamId);
  // Server-computed: purse the team must keep to reach the minimum squad (same wording as RESERVE_REQUIRED).
  if (team.maxBid != null && amount > team.maxBid) {
    const need = Math.max(auction.rules.minSquad - squad.length - 1, 0);
    const keep = teamRemaining(auction, teamId) - team.maxBid;
    return { ok: false, reason: `${team.shortName} must keep ${amountLabel(keep)} for ${need} more player${need === 1 ? "" : "s"}.` };
  }
  if (squad.length >= auction.rules.maxSquad) {
    return { ok: false, reason: `${team.shortName} already has ${auction.rules.maxSquad} players.` };
  }
  if (player.overseas && auction.rules.overseasLimit != null) {
    const overseas = squad.filter((p) => p.overseas).length;
    if (overseas >= auction.rules.overseasLimit) {
      return { ok: false, reason: `${team.shortName} has reached the overseas limit of ${auction.rules.overseasLimit}.` };
    }
  }
  const limit = auction.rules.roleLimits.find((r) => r.role === player.role);
  if (limit?.max != null) {
    const count = squad.filter((p) => p.role === player.role).length;
    if (count >= limit.max) {
      return { ok: false, reason: `${team.shortName} cannot take another ${ROLE_LABEL[player.role].toLowerCase()}.` };
    }
  }
  return { ok: true, reason: null };
}

function amountLabel(n: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

/** Errors block publish and start; warnings are shown but never block (same as POST /validate). */
export interface ConfigIssue {
  step: "details" | "rules" | "teams" | "registration" | "players";
  message: string;
  severity: "error" | "warning";
}

export function validateConfig(auction: Auction): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  const error = (step: ConfigIssue["step"], message: string) => issues.push({ step, message, severity: "error" });
  const warning = (step: ConfigIssue["step"], message: string) => issues.push({ step, message, severity: "warning" });
  const { rules } = auction;
  if (!auction.name.trim()) error("details", "Auction name is required.");
  if (!auction.tournament.trim()) error("details", "Tournament name is required.");
  if (!auction.startsAt || Number.isNaN(new Date(auction.startsAt).getTime())) {
    error("details", "A valid auction date and time is required.");
  }
  if (rules.pursePerTeam <= 0) error("rules", "Team purse must be greater than zero.");
  if (rules.minSquad < 1) error("rules", "Minimum squad size must be at least 1.");
  if (rules.maxSquad < rules.minSquad) error("rules", "Maximum squad size cannot be below the minimum.");
  if (!rules.increments.length || rules.increments.some((s) => s.step <= 0)) {
    error("rules", "Add at least one bid increment greater than zero.");
  }
  if (auction.teams.length < 2) error("teams", "Add at least two teams.");
  const shorts = new Set<string>();
  const names = new Set<string>();
  for (const team of auction.teams) {
    const name = team.name.trim().toLowerCase();
    const short = team.shortName.trim().toLowerCase();
    if (!name || !short) error("teams", "Every team needs a name and a short name.");
    if (names.has(name)) error("teams", `Duplicate team name “${team.name}”.`);
    if (shorts.has(short)) error("teams", `Duplicate short name “${team.shortName}”.`);
    names.add(name);
    shorts.add(short);
    if (team.purseOverride != null && !rules.allowPurseOverride) {
      error("teams", `${team.shortName} has a purse override, but overrides are turned off.`);
    }
    if (team.purseOverride != null && team.purseOverride <= 0) {
      error("teams", `${team.shortName} purse override must be greater than zero.`);
    }
  }
  const pool = auction.players.filter((p) => p.status !== "withdrawn");
  const registering = auction.registration?.enabled === true;
  if (!pool.length) {
    // With self-registration on, the pool fills after publishing.
    if (registering) warning("players", "No players yet. Approved registrations will join the pool.");
    else error("players", "Add at least one player.");
  } else if (auction.teams.length >= 2 && pool.length < auction.teams.length * rules.minSquad) {
    warning("players", `Pool has ${pool.length} players but squads need ${auction.teams.length * rules.minSquad} minimum.`);
  }
  const seen = new Map<string, number>();
  for (const player of pool) {
    const key = player.name.trim().toLowerCase();
    if (!key) error("players", "Every player needs a name.");
    else seen.set(key, (seen.get(key) ?? 0) + 1);
    if (player.basePrice <= 0) error("players", `${player.name || "A player"} needs a base price above zero.`);
  }
  for (const [key, count] of seen) {
    if (count > 1) {
      const name = pool.find((p) => p.name.trim().toLowerCase() === key)?.name ?? key;
      warning("players", `${count} players are named “${name}”. Check they are different people.`);
    }
  }
  if ((auction.pendingRegistrations ?? 0) > 0) {
    warning("registration", `${auction.pendingRegistrations} registration(s) still need a decision.`);
  }
  return issues;
}

/** "LIO has 1 of 4" for each team below the minimum squad (ending is still allowed; results flag them). */
export function shortSquads(auction: Auction): string[] {
  return auction.teams
    .map((team) => ({ team, size: squadOf(auction, team.id).length }))
    .filter(({ size }) => size < auction.rules.minSquad)
    .map(({ team, size }) => `${team.shortName} has ${size} of ${auction.rules.minSquad}`);
}

export function editable(auction: Auction): boolean {
  return !auction.archived && (auction.status === "draft" || auction.status === "scheduled");
}

export function roleCounts(players: AuctionPlayer[]): Record<PlayerRole, number> {
  const counts: Record<PlayerRole, number> = { BAT: 0, BOWL: 0, AR: 0, WK: 0 };
  for (const player of players) {
    if (player.status === "withdrawn") continue;
    counts[player.role] += 1;
  }
  return counts;
}

export function defaultRules(): AuctionRules {
  return {
    pursePerTeam: 2_000_000,
    increments: [
      { upTo: 100_000, step: 10_000 },
      { upTo: 500_000, step: 25_000 },
      { upTo: null, step: 50_000 },
    ],
    minSquad: 11,
    maxSquad: 15,
    overseasLimit: 2,
    roleLimits: [
      { role: "WK", min: 1, max: 3 },
      { role: "BAT", min: 3, max: null },
      { role: "BOWL", min: 3, max: null },
      { role: "AR", min: 1, max: null },
    ],
    allowPurseOverride: true,
    reserveForMinSquad: true,
  };
}
