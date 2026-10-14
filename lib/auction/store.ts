"use client";

import { useEffect, useState } from "react";
import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { API_BASE } from "@/lib/site";
import { requestLogin } from "@/lib/session";
import { parsePlayerCsv } from "./csv";
import { validateConfig, type ConfigIssue } from "./engine";
import type {
  Auction,
  AuctionDraftInput,
  AuctionListItem,
  AuctionPlayer,
  AuctionRules,
  AuctionTeam,
  LinkableTournament,
  ServiceResult,
} from "./types";

/*
 * Auction data lives on the CricsHub API (/api/v1/auctions). This module keeps an in-memory cache so the
 * screens can read auctions synchronously through hooks, and every mutation returns the server's
 * { ok, value | error } result. Auction screens subscribe to /topic/auction.{id} so all tabs and devices
 * see bids and sales live.
 */

const BASE = `${API_BASE}/api/v1/auctions`;

type Listener = () => void;
const listeners = new Set<Listener>();
const docs = new Map<string, Auction>();
const missing = new Set<string>();
let listCache: AuctionListItem[] | null = null;

function emit() {
  listeners.forEach((fn) => fn());
}

// ─── HTTP ──────────────────────────────────────────────────────────────────

type RequestOptions = { body?: unknown; csv?: string; idempotent?: boolean; query?: Record<string, string> };

async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<ServiceResult<T>> {
  const headers = new Headers();
  const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let body: BodyInit | undefined;
  if (opts.csv != null) {
    headers.set("Content-Type", "text/csv");
    body = opts.csv;
  } else if (opts.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(opts.body);
  } else if (method !== "GET") {
    body = ""; // Google's load balancer rejects body-less POSTs without Content-Length.
  }
  // One key per user action; the server replays the original result if the request is retried.
  if (opts.idempotent) headers.set("Idempotency-Key", crypto.randomUUID());
  const qs = opts.query ? `?${new URLSearchParams(opts.query)}` : "";

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}${qs}`, { method, headers, body, credentials: "include" });
  } catch {
    return { ok: false, error: "Could not reach CricsHub. Check your connection and try again." };
  }
  if (res.status === 401) {
    requestLogin(typeof window !== "undefined" ? window.location.pathname : undefined);
    return { ok: false, error: "Sign in to use auctions.", code: "UNAUTHENTICATED" };
  }
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  if (!res.ok) {
    const err = (json as { error?: { code?: string; message?: string } } | null)?.error;
    return { ok: false, error: err?.message ?? `Request failed (${res.status}).`, code: err?.code };
  }
  return { ok: true, value: json as T };
}

// ─── Server → UI shape ─────────────────────────────────────────────────────

type ServerAuction = Omit<Auction, "events"> & { events: Auction["events"] };

/** Normalises nulls the UI renders as text, and puts events oldest-first (the server sends newest-first). */
function fromServer(raw: ServerAuction): Auction {
  return {
    ...raw,
    tournament: raw.tournament ?? "",
    description: raw.description ?? "",
    startsAt: raw.startsAt ?? "",
    teams: raw.teams.map((t) => ({ ...t, ownerName: t.ownerName ?? "", color: t.color ?? "#8A9BA8" })),
    players: raw.players.map((p) => ({
      ...p,
      nationality: p.nationality ?? "",
      category: p.category ?? "",
      matches: p.matches ?? 0,
      battingAvg: p.battingAvg ?? "—",
      bowlingAvg: p.bowlingAvg ?? "—",
    })),
    events: [...raw.events].reverse(),
  };
}

/** Caches a server document if it is not older than what we have, and notifies the screens. */
function store(raw: ServerAuction): Auction {
  const next = fromServer(raw);
  const prev = docs.get(next.id);
  if (prev && (prev.revision ?? 0) > (next.revision ?? 0)) return prev;
  // Socket broadcasts carry role null; keep the role we learned from GET.
  if (next.role == null && prev?.role) next.role = prev.role;
  docs.set(next.id, next);
  missing.delete(next.id);
  if (listCache) {
    listCache = listCache.map((row) =>
      row.id === next.id
        ? {
            ...row,
            name: next.name,
            tournament: next.tournament,
            status: next.status,
            archived: next.archived,
            startsAt: next.startsAt,
            updatedAt: next.updatedAt,
            teamCount: next.teams.length,
            playerCount: next.players.length,
            tournamentId: next.tournamentId ?? null,
            handoverStatus: next.handoverStatus ?? "none",
          }
        : row,
    );
  }
  emit();
  return next;
}

async function mutate(
  id: string,
  method: string,
  path: string,
  opts?: RequestOptions,
): Promise<ServiceResult<Auction>> {
  const result = await request<ServerAuction>(method, `/${id}${path}`, opts);
  if (!result.ok) {
    // Another device may have moved the auction on; resync so the screen shows the real state.
    if (result.code === "STALE_STATE" || result.code === "LOT_OPEN" || result.code === "NO_LOT") void refresh(id);
    return result;
  }
  return { ok: true, value: store(result.value) };
}

async function refresh(id: string): Promise<void> {
  const result = await request<ServerAuction>("GET", `/${id}`);
  if (result.ok) {
    store(result.value);
  } else if (!docs.has(id)) {
    // Not found, private, signed out or unreachable: stop the loading state.
    missing.add(id);
    emit();
  }
}

async function refreshList(): Promise<void> {
  const [active, archived] = await Promise.all([
    request<{ items: AuctionListItem[] }>("GET", "", { query: { pageSize: "100" } }),
    request<{ items: AuctionListItem[] }>("GET", "", { query: { pageSize: "100", status: "archived" } }),
  ]);
  if (!active.ok) return;
  listCache = [...active.value.items, ...(archived.ok ? archived.value.items : [])].map((row) => ({
    ...row,
    tournament: row.tournament ?? "",
    startsAt: row.startsAt ?? "",
  }));
  emit();
}

/** Same fields the app uses: format = league structure, type = overs per innings, ballType upper-case. */
export interface NewTournamentInput {
  name: string;
  format: "SINGLE_ROUND_ROBIN" | "DOUBLE_ROUND_ROBIN" | "CUSTOM";
  ballType: "TENNIS" | "LEATHER";
  type: string;
  startDate: string;
  endDate: string;
  matchesPerDay: number;
  venues: string[];
}

type TeamInput = Omit<AuctionTeam, "id">;
type PlayerInput = Omit<AuctionPlayer, "id" | "status" | "soldToTeamId" | "soldPrice" | "queueOrder">;

function teamBody(team: TeamInput) {
  return {
    name: team.name,
    shortName: team.shortName,
    ownerName: team.ownerName,
    color: team.color,
    purseOverride: team.purseOverride,
    appTeamId: team.appTeamId ?? "",
    ownerPhone: team.ownerPhone ?? "",
  };
}

function playerBody(p: PlayerInput) {
  return {
    name: p.name,
    role: p.role,
    nationality: p.nationality,
    overseas: p.overseas,
    category: p.category,
    basePrice: p.basePrice,
    matches: p.matches,
    battingAvg: p.battingAvg === "—" ? "" : p.battingAvg,
    bowlingAvg: p.bowlingAvg === "—" ? "" : p.bowlingAvg,
    phone: p.phone ?? "",
  };
}

// ─── Service ───────────────────────────────────────────────────────────────

export const auctionService = {
  /** Cached copy of an auction already loaded by a screen. */
  get(id: string): Auction | null {
    return docs.get(id) ?? null;
  },

  async createDraft(input?: Partial<AuctionDraftInput>): Promise<ServiceResult<Auction>> {
    const result = await request<ServerAuction>("POST", "", {
      body: {
        name: input?.name?.trim() || "Untitled auction",
        tournament: input?.tournament?.trim() || "",
        description: input?.description?.trim() || "",
        startsAt: input?.startsAt || new Date(Date.now() + 7 * 86400000).toISOString(),
        timezone: input?.timezone || "Asia/Kolkata",
        visibility: input?.visibility || "private",
        format: "player",
        ...(input?.tournamentId ? { tournamentId: input.tournamentId } : {}),
      },
    });
    if (!result.ok) return result;
    const doc = store(result.value);
    void refreshList();
    return { ok: true, value: doc };
  },

  saveDetails: (id: string, input: AuctionDraftInput) => mutate(id, "PATCH", "", { body: input }),
  /** Link ("" to unlink) a CricsHub tournament; also allowed after the auction ends. */
  linkTournament: (id: string, tournamentId: string) => mutate(id, "PATCH", "", { body: { tournamentId } }),
  saveRules: (id: string, rules: AuctionRules) => mutate(id, "PUT", "/rules", { body: rules }),

  addTeam: (id: string, team: TeamInput) => mutate(id, "POST", "/teams", { body: teamBody(team) }),
  updateTeam: (id: string, teamId: string, team: TeamInput) => mutate(id, "PATCH", `/teams/${teamId}`, { body: teamBody(team) }),
  removeTeam: (id: string, teamId: string) => mutate(id, "DELETE", `/teams/${teamId}`),

  addPlayer: (id: string, p: PlayerInput) => mutate(id, "POST", "/players", { body: playerBody(p) }),
  updatePlayer: (id: string, playerId: string, p: PlayerInput) => mutate(id, "PATCH", `/players/${playerId}`, { body: playerBody(p) }),
  removePlayer: (id: string, playerId: string) => mutate(id, "DELETE", `/players/${playerId}`),

  async importPlayers(
    id: string,
    csv: string,
  ): Promise<ServiceResult<{ auction: Auction | null; imported: number; errors: { row: number; message: string }[] }>> {
    const result = await request<{ imported: number; errors: { row: number; message: string }[] }>("POST", `/${id}/players/import`, { csv });
    if (!result.ok) return result;
    await refresh(id);
    return { ok: true, value: { auction: docs.get(id) ?? null, ...result.value } };
  },

  /** Client-side preview while typing; the server re-validates on import. */
  previewCsv(csv: string) {
    return parsePlayerCsv(csv, 0);
  },

  /** Server checks for the Review step (adds tournament checks the browser cannot know). */
  async validate(id: string): Promise<ServiceResult<ConfigIssue[]>> {
    const result = await request<{ issues: ConfigIssue[] }>("POST", `/${id}/validate`);
    return result.ok ? { ok: true, value: result.value.issues } : result;
  },

  /** Instant local checks for the cached auction (used before the server answers). */
  localIssues(id: string): ConfigIssue[] {
    const a = docs.get(id);
    return a ? validateConfig(a) : [];
  },

  publish: (id: string) => mutate(id, "POST", "/publish"),
  start: (id: string) => mutate(id, "POST", "/start", { idempotent: true }),
  pause: (id: string) => mutate(id, "POST", "/pause"),
  resume: (id: string) => mutate(id, "POST", "/resume"),
  presentNext: (id: string) => mutate(id, "POST", "/lots/next"),

  async placeBid(id: string, teamId: string): Promise<ServiceResult<Auction>> {
    const result = await request<{ auction: ServerAuction }>("POST", `/${id}/bids`, { body: { teamId }, idempotent: true });
    if (!result.ok) {
      if (result.code === "STALE_STATE") void refresh(id);
      return result;
    }
    return { ok: true, value: store(result.value.auction) };
  },

  sell: (id: string) => mutate(id, "POST", "/lots/sell", { idempotent: true }),
  unsold: (id: string) => mutate(id, "POST", "/lots/unsold", { idempotent: true }),
  defer: (id: string) => mutate(id, "POST", "/lots/defer", { idempotent: true }),
  reopen: (id: string, playerId: string) => mutate(id, "POST", `/players/${playerId}/reopen`),
  withdraw: (id: string, playerId: string) => mutate(id, "POST", `/players/${playerId}/withdraw`),
  undo: (id: string) => mutate(id, "POST", "/undo", { idempotent: true }),
  /** force=true ends even when some teams are below the minimum squad (server answers SQUADS_INCOMPLETE otherwise). */
  complete: (id: string, force = false) =>
    mutate(id, "POST", "/complete", { idempotent: true, query: force ? { force: "true" } : undefined }),
  cancel: (id: string) => mutate(id, "POST", "/cancel"),
  archive: (id: string) => mutate(id, "POST", "/archive"),
  /** Push teams and squads into the linked tournament (runs automatically on complete; this retries). */
  handover: (id: string) => mutate(id, "POST", "/handover"),
  /** Create a CricsHub tournament from this auction and link it; if the auction has ended, squads go in right away. */
  createTournament: (id: string, input: NewTournamentInput) => mutate(id, "POST", "/create-tournament", { body: input }),

  async linkableTournaments(): Promise<ServiceResult<LinkableTournament[]>> {
    return request<LinkableTournament[]>("GET", "/linkable-tournaments");
  },

  /** Results CSV straight from the server. */
  async resultsCsv(id: string): Promise<ServiceResult<string>> {
    const headers = new Headers();
    const token = localStorage.getItem("jwtToken");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    try {
      const res = await fetch(`${BASE}/${id}/results.csv`, { headers, credentials: "include" });
      if (!res.ok) return { ok: false, error: `Export failed (${res.status}).` };
      return { ok: true, value: await res.text() };
    } catch {
      return { ok: false, error: "Could not reach CricsHub." };
    }
  },

  refresh,
};

/** CricsHub teams the signed-in user created, for "Link existing team". */
export async function fetchMyCricshubTeams(): Promise<{ id: string; name: string }[]> {
  const headers = new Headers();
  const token = localStorage.getItem("jwtToken");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  try {
    const res = await fetch(`${API_BASE}/api/v1/teams/my-teams`, { headers, credentials: "include" });
    if (!res.ok) return [];
    const json = await res.json();
    const me = localStorage.getItem("userUUID");
    const teams = (json.data ?? []) as { id: string; name: string; creator?: { id?: string } }[];
    return teams.filter((t) => !me || t.creator?.id === me).map((t) => ({ id: t.id, name: t.name }));
  } catch {
    return [];
  }
}

// ─── Real-time ─────────────────────────────────────────────────────────────

const sockets = new Map<string, { client: Client; users: number }>();

/** One STOMP connection per open auction, shared by every component showing it. */
function subscribe(id: string): () => void {
  const existing = sockets.get(id);
  if (existing) {
    existing.users += 1;
    return () => release(id);
  }
  const token = localStorage.getItem("jwtToken");
  const client = new Client({
    webSocketFactory: () => new SockJS(`${API_BASE}/ws`),
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      client.subscribe(`/topic/auction.${id}`, (msg: IMessage) => {
        try {
          const data = JSON.parse(msg.body) as { auction?: ServerAuction };
          if (data.auction) store(data.auction);
        } catch {
          /* ignore malformed frames */
        }
      });
      // Catch up on anything missed while disconnected.
      void refresh(id);
    },
  });
  client.activate();
  sockets.set(id, { client, users: 1 });
  return () => release(id);
}

function release(id: string) {
  const entry = sockets.get(id);
  if (!entry) return;
  entry.users -= 1;
  if (entry.users <= 0) {
    void entry.client.deactivate();
    sockets.delete(id);
  }
}

// ─── Hooks ─────────────────────────────────────────────────────────────────

function useStoreVersion() {
  const [, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    listeners.add(bump);
    return () => {
      listeners.delete(bump);
    };
  }, []);
}

/** Dashboard rows. null while loading. Refreshes on mount and when the tab regains focus. */
export function useAuctionList(): AuctionListItem[] | null {
  useStoreVersion();
  useEffect(() => {
    void refreshList();
    const onFocus = () => void refreshList();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);
  return listCache;
}

/** Full auction with live updates. undefined while loading, null if missing or not visible to you. */
export function useAuction(id: string): Auction | null | undefined {
  useStoreVersion();
  useEffect(() => {
    void refresh(id);
    return subscribe(id);
  }, [id]);
  if (missing.has(id)) return null;
  return docs.get(id);
}
