/** Domain models for the auction module. These are the frontend contract a future API should satisfy. */

export type AuctionStatus = "draft" | "scheduled" | "live" | "paused" | "completed" | "cancelled";

export type PlayerRole = "BAT" | "BOWL" | "AR" | "WK";

export type PlayerState = "available" | "in_auction" | "sold" | "unsold" | "withdrawn" | "deferred";

export type AuctionVisibility = "private" | "link";

export type EventType =
  | "created"
  | "updated"
  | "published"
  | "started"
  | "paused"
  | "resumed"
  | "presented"
  | "bid"
  | "sold"
  | "unsold"
  | "deferred"
  | "reopened"
  | "withdrawn"
  | "undo"
  | "completed"
  | "cancelled"
  | "archived";

export interface BidIncrement {
  /** Applies while the current bid is strictly below this amount. Null means no upper bound. */
  upTo: number | null;
  step: number;
}

export interface RoleLimit {
  role: PlayerRole;
  min: number;
  max: number | null;
}

export interface AuctionRules {
  /** Purse each team starts with, in rupees, unless a team overrides it. */
  pursePerTeam: number;
  increments: BidIncrement[];
  minSquad: number;
  maxSquad: number;
  /** Null means no overseas cap. */
  overseasLimit: number | null;
  roleLimits: RoleLimit[];
  /** When false, a team cannot be given a purse different from pursePerTeam. */
  allowPurseOverride: boolean;
}

export interface AuctionTeam {
  id: string;
  name: string;
  shortName: string;
  color: string;
  ownerName: string;
  /** Null uses the auction purse. */
  purseOverride: number | null;
  /** Existing CricsHub team this team maps to (auction + tournament mode). */
  appTeamId?: string | null;
  /** Owner's 10-digit phone; the owner manages the CricsHub team created on handover. */
  ownerPhone?: string | null;
  /** Server-computed: highest bid allowed while keeping enough purse to reach the minimum squad. */
  maxBid?: number;
}

export interface AuctionPlayer {
  id: string;
  name: string;
  role: PlayerRole;
  nationality: string;
  overseas: boolean;
  category: string;
  basePrice: number;
  matches: number;
  battingAvg: string;
  bowlingAvg: string;
  status: PlayerState;
  queueOrder: number;
  soldToTeamId: string | null;
  soldPrice: number | null;
  /** 10-digit phone identifying the CricsHub user; required when a tournament is linked. */
  phone?: string | null;
  /** CricsHub user resolved on handover. */
  userId?: string | null;
}

export interface Bid {
  id: string;
  playerId: string;
  teamId: string;
  amount: number;
  at: string;
  voided: boolean;
}

export interface AuctionEvent {
  id: string;
  type: EventType;
  at: string;
  message: string;
  reverted: boolean;
  /** Flat payload so the audit log and a future API share one shape. */
  payload: Record<string, string | number | boolean | null>;
}

export interface Auction {
  id: string;
  name: string;
  tournament: string;
  description: string;
  startsAt: string;
  timezone: string;
  format: "player";
  visibility: AuctionVisibility;
  status: AuctionStatus;
  archived: boolean;
  rules: AuctionRules;
  teams: AuctionTeam[];
  players: AuctionPlayer[];
  bids: Bid[];
  events: AuctionEvent[];
  currentPlayerId: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  startedAt: string | null;
  pausedAt: string | null;
  /** Milliseconds already spent paused, so the clock can resume cleanly. */
  pausedMs: number;
  endedAt: string | null;
  /** +1 per committed change on the server; newer socket updates replace older state. */
  revision?: number;
  /** Caller's role from the server. */
  role?: "auctioneer" | "viewer" | null;
  /** Linked CricsHub tournament (auction + tournament mode); null = auction only. */
  tournamentId?: string | null;
  /** Push of teams and squads into the linked tournament. */
  handoverStatus?: "none" | "done" | "failed";
  handedOverAt?: string | null;
  handoverError?: string | null;
}

/** Dashboard row (GET /auctions returns summaries, not full auctions). */
export interface AuctionListItem {
  id: string;
  name: string;
  tournament: string;
  status: AuctionStatus;
  archived: boolean;
  startsAt: string;
  timezone: string;
  teamCount: number;
  playerCount: number;
  updatedAt: string;
  tournamentId: string | null;
  handoverStatus: "none" | "done" | "failed";
}

/** A CricsHub tournament the user created and can link to an auction. */
export interface LinkableTournament {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
  teamCount: number;
  linkedAuctionId: string | null;
}

export interface AuctionDraftInput {
  name: string;
  tournament: string;
  description: string;
  startsAt: string;
  timezone: string;
  visibility: AuctionVisibility;
  /** "" unlinks; omitted leaves the link unchanged. */
  tournamentId?: string;
}

/** `code` is the server error code (e.g. SQUADS_INCOMPLETE) when the API rejected the action. */
export type ServiceError = { ok: false; error: string; code?: string };
export type ServiceOk<T> = { ok: true; value: T };
export type ServiceResult<T> = ServiceOk<T> | ServiceError;

export const ROLE_LABEL: Record<PlayerRole, string> = {
  BAT: "Batter",
  BOWL: "Bowler",
  AR: "All-rounder",
  WK: "Wicketkeeper",
};

export const PLAYER_ROLES: PlayerRole[] = ["BAT", "BOWL", "AR", "WK"];

export const STATUS_LABEL: Record<AuctionStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  live: "Live",
  paused: "Paused",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PLAYER_STATE_LABEL: Record<PlayerState, string> = {
  available: "Available",
  in_auction: "In auction",
  sold: "Sold",
  unsold: "Unsold",
  withdrawn: "Withdrawn",
  deferred: "Deferred",
};
