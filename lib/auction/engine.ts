import type {
  Auction,
  AuctionEvent,
  AuctionPlayer,
  AuctionRules,
  AuctionTeam,
  Bid,
  EventType,
  PlayerRole,
  ServiceResult,
} from "./types";
import { ROLE_LABEL } from "./types";

export function uid(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${rand}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

const REVERSIBLE: EventType[] = ["presented", "bid", "sold", "unsold", "deferred", "reopened", "withdrawn"];

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
  // Server-computed: purse the team must keep to reach the minimum squad.
  if (team.maxBid != null && amount > team.maxBid) {
    return { ok: false, reason: `${team.shortName} must keep purse for its minimum squad (max bid ${amountLabel(team.maxBid)}).` };
  }
  const squad = squadOf(auction, teamId);
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

export interface ConfigIssue {
  step: "details" | "rules" | "teams" | "players";
  message: string;
}

export function validateConfig(auction: Auction): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  if (!auction.name.trim()) issues.push({ step: "details", message: "Auction name is required." });
  if (!auction.tournament.trim()) issues.push({ step: "details", message: "Tournament name is required." });
  if (!auction.startsAt || Number.isNaN(new Date(auction.startsAt).getTime())) {
    issues.push({ step: "details", message: "A valid auction date and time is required." });
  }
  if (auction.rules.pursePerTeam <= 0) issues.push({ step: "rules", message: "Team purse must be greater than zero." });
  if (auction.rules.minSquad < 1) issues.push({ step: "rules", message: "Minimum squad size must be at least 1." });
  if (auction.rules.maxSquad < auction.rules.minSquad) {
    issues.push({ step: "rules", message: "Maximum squad size cannot be below the minimum." });
  }
  if (!auction.rules.increments.length || auction.rules.increments.some((s) => s.step <= 0)) {
    issues.push({ step: "rules", message: "Add at least one bid increment greater than zero." });
  }
  if (auction.teams.length < 2) issues.push({ step: "teams", message: "Add at least two teams." });
  const shorts = new Set<string>();
  const names = new Set<string>();
  for (const team of auction.teams) {
    const name = team.name.trim().toLowerCase();
    const short = team.shortName.trim().toLowerCase();
    if (!name || !short) issues.push({ step: "teams", message: "Every team needs a name and a short name." });
    if (names.has(name)) issues.push({ step: "teams", message: `Duplicate team name “${team.name}”.` });
    if (shorts.has(short)) issues.push({ step: "teams", message: `Duplicate short name “${team.shortName}”.` });
    names.add(name);
    shorts.add(short);
    if (team.purseOverride != null && !auction.rules.allowPurseOverride) {
      issues.push({ step: "teams", message: `${team.shortName} has a purse override, but overrides are turned off.` });
    }
    if (team.purseOverride != null && team.purseOverride <= 0) {
      issues.push({ step: "teams", message: `${team.shortName} purse override must be greater than zero.` });
    }
  }
  if (!auction.players.some((p) => p.status !== "withdrawn")) {
    issues.push({ step: "players", message: "Add at least one player." });
  }
  const playerNames = new Set<string>();
  for (const player of auction.players) {
    if (player.status === "withdrawn") continue;
    const key = player.name.trim().toLowerCase();
    if (!key) issues.push({ step: "players", message: "Every player needs a name." });
    if (playerNames.has(key)) issues.push({ step: "players", message: `Duplicate player “${player.name}”.` });
    playerNames.add(key);
    if (player.basePrice <= 0) issues.push({ step: "players", message: `${player.name || "A player"} needs a base price above zero.` });
  }
  return issues;
}

export function editable(auction: Auction): boolean {
  return !auction.archived && (auction.status === "draft" || auction.status === "scheduled");
}

function touch(auction: Auction, event: Omit<AuctionEvent, "id" | "at" | "reverted"> & { at?: string }): Auction {
  const next: AuctionEvent = {
    id: uid("evt"),
    at: event.at ?? nowIso(),
    type: event.type,
    message: event.message,
    payload: event.payload,
    reverted: false,
  };
  return { ...auction, updatedAt: next.at, events: [...auction.events, next] };
}

function replacePlayer(auction: Auction, player: AuctionPlayer): Auction {
  return { ...auction, players: auction.players.map((p) => (p.id === player.id ? player : p)) };
}

export function publishAuction(auction: Auction): ServiceResult<Auction> {
  if (auction.status !== "draft") return { ok: false, error: "Only a draft can be published." };
  const issues = validateConfig(auction);
  if (issues.length) return { ok: false, error: issues[0].message };
  const at = nowIso();
  return {
    ok: true,
    value: touch(
      { ...auction, status: "scheduled", publishedAt: at },
      { type: "published", message: "Auction scheduled.", payload: {} },
    ),
  };
}

export function startAuction(auction: Auction): ServiceResult<Auction> {
  if (auction.status !== "scheduled") return { ok: false, error: "Publish the auction before starting it." };
  const issues = validateConfig(auction);
  if (issues.length) return { ok: false, error: issues[0].message };
  const started = touch(
    { ...auction, status: "live", startedAt: nowIso(), pausedAt: null },
    { type: "started", message: "Auction is live.", payload: {} },
  );
  return presentNext(started);
}

export function pauseAuction(auction: Auction): ServiceResult<Auction> {
  if (auction.status !== "live") return { ok: false, error: "Only a live auction can be paused." };
  return {
    ok: true,
    value: touch(
      { ...auction, status: "paused", pausedAt: nowIso() },
      { type: "paused", message: "Auction paused.", payload: {} },
    ),
  };
}

export function resumeAuction(auction: Auction): ServiceResult<Auction> {
  if (auction.status !== "paused" || !auction.pausedAt) return { ok: false, error: "The auction is not paused." };
  const extra = Date.now() - new Date(auction.pausedAt).getTime();
  return {
    ok: true,
    value: touch(
      { ...auction, status: "live", pausedAt: null, pausedMs: auction.pausedMs + Math.max(0, extra) },
      { type: "resumed", message: "Auction resumed.", payload: {} },
    ),
  };
}

function assertOperating(auction: Auction): string | null {
  if (auction.status === "paused") return "Resume the auction before changing the lot.";
  if (auction.status !== "live") return "This action is only available while the auction is live.";
  return null;
}

export function presentNext(auction: Auction): ServiceResult<Auction> {
  const blocked = assertOperating(auction);
  if (blocked) return { ok: false, error: blocked };
  const current = playerById(auction, auction.currentPlayerId);
  if (current?.status === "in_auction") {
    return { ok: false, error: "Sell, unsold, or defer the current player before calling the next one." };
  }
  const next = queue(auction)[0];
  if (!next) return { ok: false, error: "No available players left in the queue." };
  const player: AuctionPlayer = { ...next, status: "in_auction" };
  const withPlayer = replacePlayer({ ...auction, currentPlayerId: player.id }, player);
  return {
    ok: true,
    value: touch(withPlayer, {
      type: "presented",
      message: `${player.name} is up for auction.`,
      payload: {
        playerId: player.id,
        prevStatus: next.status,
        prevCurrentPlayerId: auction.currentPlayerId,
      },
    }),
  };
}

export function placeBid(auction: Auction, teamId: string): ServiceResult<Auction> {
  const blocked = assertOperating(auction);
  if (blocked) return { ok: false, error: blocked };
  const player = playerById(auction, auction.currentPlayerId);
  if (!player || player.status !== "in_auction") return { ok: false, error: "No player is currently in the auction." };
  const amount = nextBidAmount(auction);
  if (amount == null) return { ok: false, error: "There is no legal bid amount right now." };
  const check = teamCanBid(auction, teamId, amount, player);
  if (!check.ok) return { ok: false, error: check.reason ?? "That team cannot bid." };
  const last = auction.bids.at(-1);
  if (
    last &&
    !last.voided &&
    last.playerId === player.id &&
    last.teamId === teamId &&
    last.amount === amount &&
    Date.now() - new Date(last.at).getTime() < 600
  ) {
    return { ok: false, error: "That bid was just recorded." };
  }
  const team = teamById(auction, teamId)!;
  const bid: Bid = { id: uid("bid"), playerId: player.id, teamId, amount, at: nowIso(), voided: false };
  return {
    ok: true,
    value: touch(
      { ...auction, bids: [...auction.bids, bid] },
      {
        type: "bid",
        message: `${team.shortName} bid ${amountLabel(amount)} for ${player.name}.`,
        payload: { bidId: bid.id, playerId: player.id, teamId, amount },
      },
    ),
  };
}

export function sellCurrent(auction: Auction): ServiceResult<Auction> {
  const blocked = assertOperating(auction);
  if (blocked) return { ok: false, error: blocked };
  const player = playerById(auction, auction.currentPlayerId);
  if (!player || player.status !== "in_auction") return { ok: false, error: "No player is currently in the auction." };
  const top = highestBid(auction, player.id);
  if (!top) return { ok: false, error: "Accept at least one bid before marking the player sold." };
  const check = teamCanBid(auction, top.teamId, top.amount, player);
  if (!check.ok) return { ok: false, error: check.reason ?? "The leading team can no longer complete this purchase." };
  const team = teamById(auction, top.teamId)!;
  const sold: AuctionPlayer = { ...player, status: "sold", soldToTeamId: team.id, soldPrice: top.amount };
  return {
    ok: true,
    value: touch(replacePlayer(auction, sold), {
      type: "sold",
      message: `${player.name} sold to ${team.name} for ${amountLabel(top.amount)}.`,
      payload: { playerId: player.id, teamId: team.id, amount: top.amount },
    }),
  };
}

export function unsoldCurrent(auction: Auction): ServiceResult<Auction> {
  const blocked = assertOperating(auction);
  if (blocked) return { ok: false, error: blocked };
  const player = playerById(auction, auction.currentPlayerId);
  if (!player || player.status !== "in_auction") return { ok: false, error: "No player is currently in the auction." };
  if (highestBid(auction, player.id)) {
    return { ok: false, error: "Undo the bids, or sell the player. A player with a live bid cannot be marked unsold." };
  }
  const unsold: AuctionPlayer = { ...player, status: "unsold", soldToTeamId: null, soldPrice: null };
  return {
    ok: true,
    value: touch(replacePlayer(auction, unsold), {
      type: "unsold",
      message: `${player.name} went unsold.`,
      payload: { playerId: player.id },
    }),
  };
}

export function deferCurrent(auction: Auction): ServiceResult<Auction> {
  const blocked = assertOperating(auction);
  if (blocked) return { ok: false, error: blocked };
  const player = playerById(auction, auction.currentPlayerId);
  if (!player || player.status !== "in_auction") return { ok: false, error: "No player is currently in the auction." };
  if (highestBid(auction, player.id)) return { ok: false, error: "Undo the bids before deferring this player." };
  const maxOrder = auction.players.reduce((m, p) => Math.max(m, p.queueOrder), 0);
  const deferred: AuctionPlayer = { ...player, status: "deferred", queueOrder: maxOrder + 1 };
  return {
    ok: true,
    value: touch(replacePlayer({ ...auction, currentPlayerId: null }, deferred), {
      type: "deferred",
      message: `${player.name} was deferred.`,
      payload: { playerId: player.id, prevQueueOrder: player.queueOrder },
    }),
  };
}

export function reopenPlayer(auction: Auction, playerId: string): ServiceResult<Auction> {
  if (auction.status !== "live" && auction.status !== "paused") {
    return { ok: false, error: "Players can only be reopened during a live or paused auction." };
  }
  const player = playerById(auction, playerId);
  if (!player) return { ok: false, error: "Player not found." };
  if (player.status !== "unsold" && player.status !== "deferred") {
    return { ok: false, error: "Only an unsold or deferred player can be returned to the queue." };
  }
  const maxOrder = auction.players.reduce((m, p) => Math.max(m, p.queueOrder), 0);
  const next: AuctionPlayer = { ...player, status: "available", queueOrder: maxOrder + 1, soldPrice: null, soldToTeamId: null };
  return {
    ok: true,
    value: touch(replacePlayer(auction, next), {
      type: "reopened",
      message: `${player.name} returned to the queue.`,
      payload: { playerId: player.id, prevStatus: player.status },
    }),
  };
}

export function withdrawPlayer(auction: Auction, playerId: string): ServiceResult<Auction> {
  const player = playerById(auction, playerId);
  if (!player) return { ok: false, error: "Player not found." };
  if (player.status === "sold") return { ok: false, error: "A sold player cannot be withdrawn." };
  if (player.status === "in_auction") return { ok: false, error: "Finish the current lot before withdrawing this player." };
  if (player.status === "withdrawn") return { ok: false, error: "This player is already withdrawn." };
  if (!editable(auction) && auction.status !== "live" && auction.status !== "paused") {
    return { ok: false, error: "Players cannot be withdrawn after the auction has finished." };
  }
  const next: AuctionPlayer = { ...player, status: "withdrawn" };
  return {
    ok: true,
    value: touch(replacePlayer(auction, next), {
      type: "withdrawn",
      message: `${player.name} withdrawn.`,
      payload: { playerId: player.id, prevStatus: player.status },
    }),
  };
}

export function undoLast(auction: Auction): ServiceResult<Auction> {
  if (auction.status !== "live" && auction.status !== "paused") {
    return { ok: false, error: "Corrections are only available during the auction." };
  }
  const target = [...auction.events].reverse().find((e) => !e.reverted && REVERSIBLE.includes(e.type));
  if (!target) return { ok: false, error: "Nothing to undo." };
  const later = auction.events.some((e) => !e.reverted && REVERSIBLE.includes(e.type) && e.at > target.at && e.id !== target.id);
  if (later) return { ok: false, error: "Only the most recent auction action can be undone." };

  let next = auction;
  if (target.type === "bid") {
    const bidId = String(target.payload.bidId ?? "");
    next = { ...next, bids: next.bids.map((b) => (b.id === bidId ? { ...b, voided: true } : b)) };
  } else if (target.type === "sold" || target.type === "unsold") {
    const player = playerById(next, String(target.payload.playerId ?? ""));
    if (!player) return { ok: false, error: "The player for that action is missing." };
    next = replacePlayer(next, { ...player, status: "in_auction", soldToTeamId: null, soldPrice: null });
    next = { ...next, currentPlayerId: player.id };
  } else if (target.type === "presented") {
    const player = playerById(next, String(target.payload.playerId ?? ""));
    if (!player) return { ok: false, error: "The player for that action is missing." };
    if (activeBids(next, player.id).length) return { ok: false, error: "Undo the bids before taking this player off the block." };
    const prev = String(target.payload.prevStatus ?? "available") as AuctionPlayer["status"];
    next = replacePlayer(next, { ...player, status: prev });
    next = { ...next, currentPlayerId: (target.payload.prevCurrentPlayerId as string | null) ?? null };
  } else if (target.type === "deferred" || target.type === "reopened" || target.type === "withdrawn") {
    const player = playerById(next, String(target.payload.playerId ?? ""));
    if (!player) return { ok: false, error: "The player for that action is missing." };
    const prev = String(target.payload.prevStatus ?? "available") as AuctionPlayer["status"];
    const queueOrder = target.type === "deferred" ? Number(target.payload.prevQueueOrder ?? player.queueOrder) : player.queueOrder;
    next = replacePlayer(next, { ...player, status: prev, queueOrder });
    if (target.type === "deferred") next = { ...next, currentPlayerId: player.id };
  }

  next = {
    ...next,
    events: next.events.map((e) => (e.id === target.id ? { ...e, reverted: true } : e)),
  };
  return {
    ok: true,
    value: touch(next, {
      type: "undo",
      message: `Undid: ${target.message}`,
      payload: { targetEventId: target.id, targetType: target.type },
    }),
  };
}

export function completeAuction(auction: Auction): ServiceResult<Auction> {
  if (auction.status !== "live" && auction.status !== "paused") {
    return { ok: false, error: "Only a live or paused auction can be completed." };
  }
  const current = playerById(auction, auction.currentPlayerId);
  if (current?.status === "in_auction") {
    return { ok: false, error: "Finish the current player before ending the auction." };
  }
  const open = auction.players.filter((p) => p.status === "available" || p.status === "deferred");
  if (open.length) {
    return { ok: false, error: `${open.length} player${open.length === 1 ? " is" : "s are"} still waiting. Sell, unsold, or withdraw them first.` };
  }
  let pausedMs = auction.pausedMs;
  if (auction.pausedAt) pausedMs += Math.max(0, Date.now() - new Date(auction.pausedAt).getTime());
  return {
    ok: true,
    value: touch(
      { ...auction, status: "completed", endedAt: nowIso(), pausedAt: null, pausedMs, currentPlayerId: null },
      { type: "completed", message: "Auction completed.", payload: {} },
    ),
  };
}

export function cancelAuction(auction: Auction): ServiceResult<Auction> {
  if (auction.status === "completed" || auction.status === "cancelled") {
    return { ok: false, error: "This auction is already finished." };
  }
  if (auction.status === "live" || auction.status === "paused") {
    const sold = auction.players.some((p) => p.status === "sold");
    if (sold) return { ok: false, error: "A live auction with sales cannot be cancelled. Complete it, or undo the sales first." };
  }
  return {
    ok: true,
    value: touch(
      { ...auction, status: "cancelled", endedAt: nowIso(), currentPlayerId: null },
      { type: "cancelled", message: "Auction cancelled.", payload: {} },
    ),
  };
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
  };
}
