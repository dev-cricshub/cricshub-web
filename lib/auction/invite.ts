/*
 * An invite the player opened before signing in. Kept for 7 days so the dashboard can bring them back to
 * the form after sign-in (or after installing and coming back later).
 */

const KEY = "cricshub.pendingInvite";
const TTL_MS = 7 * 86_400_000;

export interface PendingInvite {
  code: string;
  auctionName?: string;
  savedAt: number;
}

export function savePendingInvite(code: string, auctionName?: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ code, auctionName, savedAt: Date.now() } satisfies PendingInvite));
  } catch {
    /* storage unavailable: the player can reopen the link */
  }
}

export function readPendingInvite(): PendingInvite | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const invite = JSON.parse(raw) as PendingInvite;
    if (!invite.code || Date.now() - invite.savedAt > TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return invite;
  } catch {
    return null;
  }
}

export function clearPendingInvite() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Invite codes are 8 characters from an alphabet without look-alikes; accept any case and stray spaces. */
export function normalizeInviteCode(raw: string): string {
  return decodeURIComponent(raw).trim().toUpperCase();
}
