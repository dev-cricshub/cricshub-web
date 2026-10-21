// Client-side session helpers shared by headers, dashboard, profile and pricing.
// The real JWT lives in an httpOnly cookie on the API domain; these keys only
// drive UI state and the `sessionActive` cookie that proxy.ts checks.

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

/** Clears the backend httpOnly cookie (best-effort) and local state, then shows the login page. */
export async function logout() {
  await fetch(`${API_BASE}/api/v1/auth/logout`, {
    method: "POST",
    credentials: "include",
  }).catch(() => {});
  clearSession();
  window.location.href = "/login";
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

/** The login page URL; returns to `redirect` after sign-in. All sign-in goes through /login. */
export function loginHref(redirect?: string) {
  const safe = safeRedirect(redirect, "");
  return safe ? `/login?redirect=${encodeURIComponent(safe)}` : "/login";
}

/** Send the user to /login, then on to `redirect` (default: back to the current page). */
export function requestLogin(redirect?: string) {
  window.location.href = loginHref(redirect ?? window.location.pathname + window.location.search);
}

/** Only allow same-origin relative paths — blocks open-redirect injection. */
export function safeRedirect(path: string | null | undefined, fallback = "/dashboard") {
  return path && path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}
