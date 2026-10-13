"use client";

import { useEffect, useState } from "react";
import { parsePlayerCsv } from "./csv";
import {
  cancelAuction,
  completeAuction,
  defaultRules,
  deferCurrent,
  editable,
  nowIso,
  placeBid,
  presentNext,
  publishAuction,
  reopenPlayer,
  resumeAuction,
  sellCurrent,
  startAuction,
  uid,
  undoLast,
  unsoldCurrent,
  validateConfig,
  withdrawPlayer,
  pauseAuction,
} from "./engine";
import { buildSeedAuctions } from "./seed";
import type { Auction, AuctionDraftInput, AuctionPlayer, AuctionRules, AuctionTeam, ServiceResult } from "./types";

const KEY = "cricshub.auctions.v1";

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((fn) => fn());
}

function read(): Auction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const seed = buildSeedAuctions();
      localStorage.setItem(KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as Auction[];
    if (!Array.isArray(parsed)) throw new Error("bad");
    return parsed;
  } catch {
    const seed = buildSeedAuctions();
    localStorage.setItem(KEY, JSON.stringify(seed));
    return seed;
  }
}

function write(list: Auction[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  emit();
}

function update(id: string, mutate: (auction: Auction) => ServiceResult<Auction>): ServiceResult<Auction> {
  const list = read();
  const current = list.find((a) => a.id === id);
  if (!current) return { ok: false, error: "Auction not found." };
  const result = mutate(current);
  if (!result.ok) return result;
  write(list.map((a) => (a.id === id ? result.value : a)));
  return result;
}

export const auctionService = {
  list(): Auction[] {
    return read().slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  get(id: string): Auction | null {
    return read().find((a) => a.id === id) ?? null;
  },

  createDraft(input?: Partial<AuctionDraftInput>): Auction {
    const at = nowIso();
    const auction: Auction = {
      id: uid("auc"),
      name: input?.name?.trim() || "Untitled auction",
      tournament: input?.tournament?.trim() || "",
      description: input?.description?.trim() || "",
      startsAt: input?.startsAt || new Date(Date.now() + 7 * 86400000).toISOString(),
      timezone: input?.timezone || "Asia/Kolkata",
      visibility: input?.visibility || "private",
      format: "player",
      status: "draft",
      archived: false,
      rules: defaultRules(),
      teams: [],
      players: [],
      bids: [],
      events: [{ id: uid("evt"), type: "created", at, message: "Draft created.", reverted: false, payload: {} }],
      currentPlayerId: null,
      createdAt: at,
      updatedAt: at,
      publishedAt: null,
      startedAt: null,
      pausedAt: null,
      pausedMs: 0,
      endedAt: null,
    };
    write([auction, ...read()]);
    return auction;
  },

  saveDetails(id: string, input: AuctionDraftInput): ServiceResult<Auction> {
    return update(id, (auction) => {
      if (!editable(auction)) return { ok: false, error: "Details can only be edited before the auction starts." };
      if (!input.name.trim()) return { ok: false, error: "Auction name is required." };
      return {
        ok: true,
        value: {
          ...auction,
          name: input.name.trim(),
          tournament: input.tournament.trim(),
          description: input.description.trim(),
          startsAt: input.startsAt,
          timezone: input.timezone,
          visibility: input.visibility,
          updatedAt: nowIso(),
        },
      };
    });
  },

  saveRules(id: string, rules: AuctionRules): ServiceResult<Auction> {
    return update(id, (auction) => {
      if (!editable(auction)) return { ok: false, error: "Rules are locked once the auction has started." };
      if (rules.pursePerTeam <= 0) return { ok: false, error: "Purse must be greater than zero." };
      if (rules.maxSquad < rules.minSquad) return { ok: false, error: "Maximum squad cannot be below the minimum." };
      if (!rules.increments.length || rules.increments.some((s) => s.step <= 0)) {
        return { ok: false, error: "Every bid increment must be greater than zero." };
      }
      return { ok: true, value: { ...auction, rules, updatedAt: nowIso() } };
    });
  },

  addTeam(id: string, team: Omit<AuctionTeam, "id">): ServiceResult<Auction> {
    return update(id, (auction) => {
      if (!editable(auction)) return { ok: false, error: "Teams can only be added before the auction starts." };
      const name = team.name.trim();
      const shortName = team.shortName.trim().toUpperCase();
      if (!name || !shortName) return { ok: false, error: "Team name and short name are required." };
      if (auction.teams.some((t) => t.name.trim().toLowerCase() === name.toLowerCase())) {
        return { ok: false, error: "A team with that name is already in the auction." };
      }
      if (auction.teams.some((t) => t.shortName.toLowerCase() === shortName.toLowerCase())) {
        return { ok: false, error: "That short name is already used." };
      }
      if (team.purseOverride != null && !auction.rules.allowPurseOverride) {
        return { ok: false, error: "Purse overrides are turned off in the rules." };
      }
      const next: AuctionTeam = { ...team, id: uid("team"), name, shortName, ownerName: team.ownerName.trim() };
      return { ok: true, value: { ...auction, teams: [...auction.teams, next], updatedAt: nowIso() } };
    });
  },

  updateTeam(id: string, teamId: string, patch: Omit<AuctionTeam, "id">): ServiceResult<Auction> {
    return update(id, (auction) => {
      if (!editable(auction)) return { ok: false, error: "Teams can only be edited before the auction starts." };
      if (!auction.teams.some((t) => t.id === teamId)) return { ok: false, error: "Team not found." };
      const name = patch.name.trim();
      const shortName = patch.shortName.trim().toUpperCase();
      if (auction.teams.some((t) => t.id !== teamId && t.name.trim().toLowerCase() === name.toLowerCase())) {
        return { ok: false, error: "A team with that name is already in the auction." };
      }
      if (auction.teams.some((t) => t.id !== teamId && t.shortName.toLowerCase() === shortName.toLowerCase())) {
        return { ok: false, error: "That short name is already used." };
      }
      return {
        ok: true,
        value: {
          ...auction,
          updatedAt: nowIso(),
          teams: auction.teams.map((t) => (t.id === teamId ? { ...patch, id: teamId, name, shortName } : t)),
        },
      };
    });
  },

  removeTeam(id: string, teamId: string): ServiceResult<Auction> {
    return update(id, (auction) => {
      if (!editable(auction)) return { ok: false, error: "Teams cannot be removed after the auction starts." };
      return { ok: true, value: { ...auction, teams: auction.teams.filter((t) => t.id !== teamId), updatedAt: nowIso() } };
    });
  },

  addPlayer(id: string, input: Omit<AuctionPlayer, "id" | "status" | "soldToTeamId" | "soldPrice" | "queueOrder">): ServiceResult<Auction> {
    return update(id, (auction) => {
      if (!editable(auction)) return { ok: false, error: "Players can only be added before the auction starts." };
      const name = input.name.trim();
      if (!name) return { ok: false, error: "Player name is required." };
      if (auction.players.some((p) => p.status !== "withdrawn" && p.name.trim().toLowerCase() === name.toLowerCase())) {
        return { ok: false, error: "A player with that name is already registered." };
      }
      if (input.basePrice <= 0) return { ok: false, error: "Base price must be greater than zero." };
      const order = auction.players.reduce((m, p) => Math.max(m, p.queueOrder), 0) + 1;
      const player: AuctionPlayer = {
        ...input,
        id: uid("plyr"),
        name,
        status: "available",
        queueOrder: order,
        soldToTeamId: null,
        soldPrice: null,
        nationality: input.nationality.trim() || "India",
        category: input.category.trim().toUpperCase() || "B",
        battingAvg: input.battingAvg.trim() || "—",
        bowlingAvg: input.bowlingAvg.trim() || "—",
      };
      return { ok: true, value: { ...auction, players: [...auction.players, player], updatedAt: nowIso() } };
    });
  },

  updatePlayer(id: string, playerId: string, input: Omit<AuctionPlayer, "id" | "status" | "soldToTeamId" | "soldPrice" | "queueOrder">): ServiceResult<Auction> {
    return update(id, (auction) => {
      if (!editable(auction)) return { ok: false, error: "Players can only be edited before the auction starts." };
      const existing = auction.players.find((p) => p.id === playerId);
      if (!existing) return { ok: false, error: "Player not found." };
      if (existing.status === "sold") return { ok: false, error: "A sold player cannot be edited." };
      const name = input.name.trim();
      if (auction.players.some((p) => p.id !== playerId && p.status !== "withdrawn" && p.name.trim().toLowerCase() === name.toLowerCase())) {
        return { ok: false, error: "A player with that name is already registered." };
      }
      return {
        ok: true,
        value: {
          ...auction,
          updatedAt: nowIso(),
          players: auction.players.map((p) =>
            p.id === playerId
              ? {
                  ...p,
                  ...input,
                  name,
                  nationality: input.nationality.trim() || "India",
                  category: input.category.trim().toUpperCase() || "B",
                }
              : p,
          ),
        },
      };
    });
  },

  removePlayer(id: string, playerId: string): ServiceResult<Auction> {
    return update(id, (auction) => {
      if (!editable(auction)) return { ok: false, error: "Players cannot be removed after the auction starts. Withdraw them instead." };
      const player = auction.players.find((p) => p.id === playerId);
      if (!player) return { ok: false, error: "Player not found." };
      if (player.status === "sold") return { ok: false, error: "A sold player cannot be removed." };
      return { ok: true, value: { ...auction, players: auction.players.filter((p) => p.id !== playerId), updatedAt: nowIso() } };
    });
  },

  importPlayers(id: string, csv: string): ServiceResult<{ auction: Auction; imported: number; errors: { row: number; message: string }[] }> {
    const list = read();
    const auction = list.find((a) => a.id === id);
    if (!auction) return { ok: false, error: "Auction not found." };
    if (!editable(auction)) return { ok: false, error: "Players can only be imported before the auction starts." };
    const start = auction.players.reduce((m, p) => Math.max(m, p.queueOrder), 0);
    const preview = parsePlayerCsv(csv, start);
    const existing = new Set(auction.players.filter((p) => p.status !== "withdrawn").map((p) => p.name.trim().toLowerCase()));
    const accepted = preview.players.filter((p) => {
      if (existing.has(p.name.trim().toLowerCase())) {
        preview.errors.push({ row: 0, message: `${p.name} is already in this auction and was skipped.` });
        return false;
      }
      existing.add(p.name.trim().toLowerCase());
      return true;
    });
    if (!accepted.length && preview.errors.length) {
      return { ok: false, error: preview.errors[0].message };
    }
    const players: AuctionPlayer[] = accepted.map((p) => ({
      ...p,
      id: uid("plyr"),
      status: "available",
      soldToTeamId: null,
      soldPrice: null,
    }));
    const next = { ...auction, players: [...auction.players, ...players], updatedAt: nowIso() };
    write(list.map((a) => (a.id === id ? next : a)));
    return { ok: true, value: { auction: next, imported: players.length, errors: preview.errors } };
  },

  previewCsv(csv: string) {
    return parsePlayerCsv(csv, 0);
  },

  validate(id: string) {
    const auction = this.get(id);
    if (!auction) return [];
    return validateConfig(auction);
  },

  publish: (id: string) => update(id, publishAuction),
  start: (id: string) => update(id, startAuction),
  pause: (id: string) => update(id, pauseAuction),
  resume: (id: string) => update(id, resumeAuction),
  presentNext: (id: string) => update(id, presentNext),
  placeBid: (id: string, teamId: string) => update(id, (a) => placeBid(a, teamId)),
  sell: (id: string) => update(id, sellCurrent),
  unsold: (id: string) => update(id, unsoldCurrent),
  defer: (id: string) => update(id, deferCurrent),
  reopen: (id: string, playerId: string) => update(id, (a) => reopenPlayer(a, playerId)),
  withdraw: (id: string, playerId: string) => update(id, (a) => withdrawPlayer(a, playerId)),
  undo: (id: string) => update(id, undoLast),
  complete: (id: string) => update(id, completeAuction),
  cancel: (id: string) => update(id, cancelAuction),

  archive(id: string): ServiceResult<Auction> {
    return update(id, (auction) => {
      if (auction.status === "live" || auction.status === "paused") {
        return { ok: false, error: "Pause is not the same as archive. End or cancel the auction first." };
      }
      return {
        ok: true,
        value: {
          ...auction,
          archived: true,
          updatedAt: nowIso(),
          events: [
            ...auction.events,
            { id: uid("evt"), type: "archived", at: nowIso(), message: "Auction archived.", reverted: false, payload: {} },
          ],
        },
      };
    });
  },

  resetDemo(): Auction[] {
    const seed = buildSeedAuctions();
    write(seed);
    return seed;
  },
};

export function useAuctionList(): Auction[] | null {
  const [list, setList] = useState<Auction[] | null>(null);
  useEffect(() => {
    const pull = () => setList(auctionService.list());
    pull();
    listeners.add(pull);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) pull();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(pull);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return list;
}

export function useAuction(id: string): Auction | null | undefined {
  const list = useAuctionList();
  if (list == null) return undefined;
  return list.find((a) => a.id === id) ?? null;
}
