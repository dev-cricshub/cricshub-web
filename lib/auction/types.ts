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
  | "archived"
  | "registration_settings"
  | "registration_submitted"
  | "registration_updated"
  | "registration_approved"
  | "registration_rejected"
  | "registration_waitlisted"
  | "registration_withdrawn"
  | "registration_promoted"
  | "registrations_closed";

export interface BidIncrement {
  /** Applies while the current bid is strictly below this amount. Null means no upper bound. */
  upTo: number | null;
  step: number;
}

/** Optional per-role squad limits. Null min / max means no limit on that side. */
export interface RoleLimit {
  role: PlayerRole;
  min: number | null;
  max: number | null;
}

export interface AuctionRules {
  /** Purse each team starts with, in rupees, unless a team overrides it. */
  pursePerTeam: number;
  increments: BidIncrement[];
  minSquad: number;
  maxSquad: number;
  /** Optional. Empty means no role limits. */
  roleLimits: RoleLimit[];
  /** When false, a team cannot be given a purse different from pursePerTeam. */
  allowPurseOverride: boolean;
  /** Keep purse for the minimum squad: a team's max bid leaves room for the players it still needs. */
  reserveForMinSquad?: boolean;
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
  category: string;
  basePrice: number;
  matches: number;
  battingAvg: string;
  bowlingAvg: string;
  status: PlayerState;
  queueOrder: number;
  soldToTeamId: string | null;
  soldPrice: number | null;
  /** 10-digit phone identifying the CricsHub user (auctioneer only); required when a tournament is linked. */
  phone?: string | null;
  /** How the player entered the pool. */
  source?: "manual" | "csv" | "registration";
  /** From the player's registration. */
  photoUrl?: string | null;
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
  /** Caller's role from the server. A player is anyone registered in the auction. */
  role?: "auctioneer" | "viewer" | "player" | null;
  /** Linked CricsHub tournament (auction + tournament mode); null = auction only. */
  tournamentId?: string | null;
  /** Push of teams and squads into the linked tournament. */
  handoverStatus?: "none" | "done" | "failed";
  handedOverAt?: string | null;
  handoverError?: string | null;
  /** Default nationality for self-registered players. */
  homeCountry?: string;
  /** Auctioneer only: registration settings and how many registrations wait for a decision. */
  registration?: RegistrationConfig | null;
  pendingRegistrations?: number;
  /** Player only: their own pool player (for "You're up") and registration status. */
  myPlayerId?: string | null;
  myRegistrationStatus?: RegistrationStatus | null;
}

// ─── Self-registration ───────────────────────────────────────────────────────

export type RegistrationStatus = "pending" | "approved" | "rejected" | "waitlisted" | "withdrawn" | "expired";

export interface RegistrationQuestion {
  id?: string;
  label: string;
  required: boolean;
}

export interface RegistrationConfig {
  enabled: boolean;
  opensAt: string | null;
  closesAt: string | null;
  cap: number | null;
  waitlist: boolean;
  approvalMode: "manual" | "auto";
  defaultCategory: string;
  basePrices: Record<string, number>;
  allowSuggestedPrice: boolean;
  form: { photo: boolean; dateOfBirth: boolean; city: boolean; playingHistory: boolean; idProof: boolean };
  customQuestions: RegistrationQuestion[];
  eligibility: { minAge: number | null; cities: string[] };
}

export interface InviteLink {
  id: string;
  code: string;
  url: string;
  label: string | null;
  defaultLink: boolean;
  expiresAt: string | null;
  maxUses: number | null;
  revoked: boolean;
  opens: number;
  signIns: number;
  submitted: number;
  approved: number;
}

/** Auctioneer's review row (personal data is only ever returned here). */
export interface RegistrationRow {
  id: string;
  status: RegistrationStatus;
  name: string;
  phone?: string;
  photoUrl?: string;
  dateOfBirth?: string;
  age?: number;
  city?: string;
  role: PlayerRole;
  battingHand?: string;
  bowlingStyle?: string;
  nationality?: string;
  matches?: number;
  battingAvg?: string;
  bowlingAvg?: string;
  suggestedBasePrice?: number;
  playingHistory?: string;
  idProofUrl?: string;
  answers: Record<string, string>;
  reason?: string;
  link?: string;
  submittedAt: string;
  auctionPlayerId?: string;
  sameNameAs?: string[];
}

export interface RegistrationsOverview {
  funnel: { opens: number; signIns: number; submitted: number; approved: number };
  links: InviteLink[];
  items: RegistrationRow[];
}

export type InviteState =
  | "OPEN"
  | "CAN_REGISTER"
  | "ALREADY_REGISTERED"
  | "NOT_OPEN"
  | "CLOSED"
  | "FULL"
  | "WAITLIST_AVAILABLE"
  | "LINK_INVALID"
  | "NOT_ELIGIBLE"
  | "AUCTION_CANCELLED";

export interface InviteCard {
  code: string;
  auctionId?: string;
  auctionName?: string;
  tournament?: string;
  startsAt?: string;
  timezone?: string;
  organiser?: string;
  state: InviteState;
  opensAt?: string;
  closesAt?: string;
}

export interface MyRegistration {
  id: string;
  auctionId: string;
  auctionName: string;
  tournament?: string;
  startsAt?: string;
  timezone: string;
  auctionStatus: AuctionStatus;
  status: RegistrationStatus;
  reason?: string;
  canWithdraw: boolean;
  soldToTeam?: string;
  soldPrice?: number;
}

export interface InviteResolution {
  state: InviteState;
  message?: string;
  invite?: InviteCard;
  form?: {
    fields: RegistrationConfig["form"];
    customQuestions: RegistrationQuestion[];
    allowSuggestedPrice: boolean;
    minAge: number | null;
    cities: string[];
  };
  prefill?: { name?: string; photoUrl?: string; dateOfBirth?: string; city?: string; battingHand?: string; bowlingStyle?: string };
  registration?: MyRegistration;
}

export interface RegistrationSubmit {
  name?: string;
  photoUrl?: string;
  dateOfBirth?: string;
  city?: string;
  role: PlayerRole;
  battingHand?: string;
  bowlingStyle?: string;
  nationality?: string;
  matches?: number;
  battingAvg?: string;
  bowlingAvg?: string;
  suggestedBasePrice?: number;
  playingHistory?: string;
  idProofUrl?: string;
  answers: Record<string, string>;
  acceptTerms: boolean;
}

export const REGISTRATION_STATUS_LABEL: Record<RegistrationStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Not selected",
  waitlisted: "Waitlisted",
  withdrawn: "Withdrawn",
  expired: "Left out",
};

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
  homeCountry?: string;
}

/** `code` is the server error code (e.g. SQUADS_INCOMPLETE) when the API rejected the action. */
/** fields: per-field problems from a VALIDATION error (path like "dateOfBirth" or "answers.q1"). */
export type ServiceError = { ok: false; error: string; code?: string; fields?: { path: string; message: string }[] };
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
