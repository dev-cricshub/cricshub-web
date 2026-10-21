// Client-side session helpers shared by headers, dashboard, profile and pricing.
// The real JWT lives in an httpOnly cookie on the API domain; these keys only
// drive UI state and the `sessionActive` cookie that middleware.ts checks.

import { API_BASE } from "@/lib/site";

const SESSION_KEYS = ["userUUID", "userName", "hasSubscription", "jwtToken"] as const;

export interface StoredUser {
  id: string;
  name: string;
  hasSubscription: boolean;
}

export function hasSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim().startsWith("sessionActive="));
}

/** Returns the logged-in user, clearing stale localStorage if the session cookie is gone. */
export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const id = localStorage.getItem("userUUID");
  const name = localStorage.getItem("userName");
  if (!id || !name) return null;
  if (!hasSessionCookie()) {
    clearSession();
    return null;
  }
  return {
    id,
    name,
    hasSubscription: localStorage.getItem("hasSubscription") === "true",
  };
}

export function clearSession() {
  SESSION_KEYS.forEach((k) => localStorage.removeItem(k));
  document.cookie = "sessionActive=; path=/; Max-Age=0";
}

/** Clears the backend httpOnly cookie (best-effort) and local state, then returns home. */
export async function logout() {
  await fetch(`${API_BASE}/api/v1/auth/logout`, {
    method: "POST",
    credentials: "include",
  }).catch(() => {});
  clearSession();
  window.location.href = "/";
}

/** What the user was trying to do when we asked them to sign in; tailors the login copy. */
export type LoginIntent = "stream" | "auction" | "register" | "plans";

/** Infers the intent from the page the user is heading to. */
export function intentFor(path: string | null | undefined): LoginIntent | undefined {
  if (!path) return undefined;
  if (path.startsWith("/stream")) return "stream";
  if (path.startsWith("/join")) return "register";
  if (path.startsWith("/auctions")) return "auction";
  if (path.startsWith("/pricing")) return "plans";
  return undefined;
}

/** Full-page login URL (used by middleware, 401 handling and links); returns to `redirect` after sign-in. */
export function loginHref(redirect?: string) {
  const safe = safeRedirect(redirect, "");
  return safe ? `/login?redirect=${encodeURIComponent(safe)}` : "/login";
}

/**
 * Open the login sheet over the current page (AuthProvider listens for this), then go to `redirect`.
 * Without a redirect the user stays on the current page, which reloads signed in.
 */
export function requestLogin(redirect?: string) {
  window.dispatchEvent(new CustomEvent("openLoginModal", { detail: { redirect } }));
}

/** Only allow same-origin relative paths — blocks open-redirect injection. */
export function safeRedirect(path: string | null | undefined, fallback = "/dashboard") {
  return path && path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}
