import type { AuctionPlayer, PlayerRole } from "./types";
import { PLAYER_ROLES } from "./types";

export interface CsvRowError {
  row: number;
  message: string;
}

export interface CsvPreview {
  players: Omit<AuctionPlayer, "id" | "status" | "soldToTeamId" | "soldPrice">[];
  errors: CsvRowError[];
}

const HEADER = ["name", "role", "nationality", "overseas", "category", "basePrice", "matches", "battingAvg", "bowlingAvg", "phone"];

export function csvTemplate(): string {
  return [
    HEADER.join(","),
    "Arjun Mehta,BAT,India,no,A,100000,42,41.2,,9876543210",
    "Liam Hart,BOWL,England,yes,A,100000,48,9.2,22.4,",
  ].join("\n");
}

/**
 * Same rule as the server: a 10-digit mobile number, allowing spaces, dashes and a +91 / 91 prefix.
 * Returns "" for blank input and null when the value is not a valid number.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw || !raw.trim()) return "";
  let digits = raw.replace(/[\s\-()]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  return /^\d{10}$/.test(digits) ? digits : null;
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function roleOf(value: string): PlayerRole | null {
  const key = value.trim().toUpperCase();
  if (PLAYER_ROLES.includes(key as PlayerRole)) return key as PlayerRole;
  const aliases: Record<string, PlayerRole> = {
    BATTER: "BAT",
    BATSMAN: "BAT",
    BOWLER: "BOWL",
    "ALL-ROUNDER": "AR",
    ALLROUNDER: "AR",
    "WICKETKEEPER": "WK",
    "WICKET-KEEPER": "WK",
    KEEPER: "WK",
  };
  return aliases[key] ?? null;
}

export function parsePlayerCsv(text: string, startOrder: number): CsvPreview {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const errors: CsvRowError[] = [];
  const players: CsvPreview["players"] = [];
  if (!lines.length) return { players, errors: [{ row: 1, message: "The file is empty." }] };

  let start = 0;
  const head = splitCsvLine(lines[0]).map((c) => c.toLowerCase());
  if (head[0] === "name") start = 1;

  const seen = new Set<string>();
  for (let i = start; i < lines.length; i += 1) {
    const row = i + 1;
    const cells = splitCsvLine(lines[i]);
    const [name = "", roleRaw = "", nationality = "India", overseasRaw = "no", category = "B", baseRaw = "", matchesRaw = "0", battingAvg = "", bowlingAvg = "", phoneRaw = ""] = cells;
    if (!name) {
      errors.push({ row, message: "Name is required." });
      continue;
    }
    const role = roleOf(roleRaw);
    if (!role) {
      errors.push({ row, message: `${name}: role must be BAT, BOWL, AR, or WK.` });
      continue;
    }
    const basePrice = Number(baseRaw.replace(/[,₹\s]/g, ""));
    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      errors.push({ row, message: `${name}: base price must be a number above zero.` });
      continue;
    }
    const key = name.toLowerCase();
    if (seen.has(key)) {
      errors.push({ row, message: `${name} is duplicated in this file.` });
      continue;
    }
    const phone = normalizePhone(phoneRaw);
    if (phone === null) {
      errors.push({ row, message: `${name}: phone must be a 10-digit mobile number.` });
      continue;
    }
    seen.add(key);
    const overseas = /^(y|yes|true|1|overseas)$/i.test(overseasRaw);
    const matches = Number(matchesRaw);
    players.push({
      name,
      role,
      nationality: nationality || "India",
      overseas,
      category: (category || "B").toUpperCase(),
      basePrice,
      matches: Number.isFinite(matches) ? matches : 0,
      battingAvg: battingAvg || "—",
      bowlingAvg: bowlingAvg || "—",
      phone: phone || null,
      queueOrder: startOrder + players.length + 1,
    });
  }
  return { players, errors };
}

export function squadsToCsv(rows: { team: string; player: string; role: string; price: number; base: number }[]): string {
  const lines = ["team,player,role,soldPrice,basePrice"];
  for (const row of rows) {
    lines.push([row.team, row.player, row.role, row.price, row.base].join(","));
  }
  return lines.join("\n");
}
