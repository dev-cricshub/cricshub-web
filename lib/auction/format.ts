import type { Auction, AuctionStatus, PlayerState } from "./types";

export function inr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatWhen(iso: string, timeZone = "Asia/Kolkata"): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(date);
}

export function elapsedLabel(auction: Auction, now = Date.now()): string {
  if (!auction.startedAt) return "—";
  const start = new Date(auction.startedAt).getTime();
  const end = auction.endedAt
    ? new Date(auction.endedAt).getTime()
    : auction.pausedAt
      ? new Date(auction.pausedAt).getTime()
      : now;
  const ms = Math.max(0, end - start - auction.pausedMs);
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function statusTone(status: AuctionStatus): "neutral" | "primary" | "live" | "warning" | "success" | "danger" {
  if (status === "live") return "live";
  if (status === "paused") return "warning";
  if (status === "scheduled") return "primary";
  if (status === "completed") return "success";
  if (status === "cancelled") return "danger";
  return "neutral";
}

export function playerTone(status: PlayerState): "neutral" | "primary" | "success" | "warning" | "danger" | "outline" {
  if (status === "in_auction") return "primary";
  if (status === "sold") return "success";
  if (status === "unsold" || status === "deferred") return "warning";
  if (status === "withdrawn") return "danger";
  return "neutral";
}

/** Value for `<input type="datetime-local">` in the auction's timezone, as a wall-clock string. */
export function toDateTimeLocal(iso: string, timeZone: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** Interpret a datetime-local value as wall time in `timeZone` and return an ISO string. */
export function fromDateTimeLocal(value: string, timeZone: string): string {
  if (!value) return "";
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  // Guess UTC, then correct by the zone offset at that instant.
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute);
  const offset = zoneOffsetMs(new Date(utcGuess), timeZone);
  return new Date(utcGuess - offset).toISOString();
}

function zoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - date.getTime();
}
