const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// Central fetch wrapper — always sends cookies, redirects to login on 401, adds fallback header
async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const headers = new Headers(options?.headers || {});

  if (typeof window !== "undefined") {
    // UPDATED: Now looks for "jwtToken" to match your login function
    const token = localStorage.getItem("jwtToken"); 
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const res = await fetch(url, { 
    ...options, 
    credentials: "include",
    headers 
  });

  if (res.status === 401 && typeof window !== "undefined") {
    // UPDATED: Now removes "jwtToken" on logout/401
    ["userUUID", "userName", "hasSubscription", "jwtToken"].forEach(
      (k) => localStorage.removeItem(k),
    );
    const returnPath = encodeURIComponent(window.location.pathname);
    window.location.href = `/?login=true&redirect=${returnPath}`;
  }
  
  return res;
}

// Cookie-based auth — no Authorization header needed for web
// Mobile app sends Bearer token directly; web relies on httpOnly cookie
function authHeaders() {
  return { "Content-Type": "application/json" };
}

export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiFetch(`${API_BASE}/api/v1/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("File upload failed");
  const json = await res.json();
  return json.url as string;
}

// ═══════════════════════════════════════════════════════════════════════════
// MATCHES
// ═══════════════════════════════════════════════════════════════════════════

/** Fetch all matches, filter client-side to those where user is creator or operator */
export async function fetchUserMatches(userId: string) {
  const res = await apiFetch(`${API_BASE}/api/v1/matches`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  const all = (json.data ?? json) as any[];
  // Role detection: creator OR in matchOps
  return all.filter(
    (m) =>
      m.creatorId === userId || // match.creator.id — now exposed directly
      (m.matchOps ?? []).includes(userId),
  );
}

/** Fetch single match details (used by stream dashboard) */
export async function fetchMatchById(matchId: string) {
  const res = await apiFetch(`${API_BASE}/api/v1/matches/${matchId}`, {
    headers: authHeaders(),
  });
  return res.json();
}

/** Fetch live match state for score overlay */
export async function fetchMatchState(matchId: string) {
  const res = await apiFetch(`${API_BASE}/api/v1/matches/matchstate/${matchId}`, {
    headers: authHeaders(),
  });
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════════════
// STREAM SESSION (lock)
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchStreamSession(matchId: string) {
  const res = await apiFetch(`${API_BASE}/api/v1/stream/${matchId}/session`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  return json.data; // { locked, lockedByUserId, lockedByName, lockedAt }
}

export async function claimStreamLock(
  matchId: string,
  userId: string,
  userName: string,
) {
  const res = await apiFetch(`${API_BASE}/api/v1/stream/${matchId}/claim`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ userId, userName }),
  });
  const json = await res.json();
  if (res.status === 409) return { success: false, message: json.message };
  return { success: json.success };
}

export async function releaseStreamLock(matchId: string, userId: string) {
  await fetch(`${API_BASE}/api/v1/stream/${matchId}/release`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ userId }),
  });
}

/** Call every 60 seconds to keep the stream lock alive */
export async function streamHeartbeat(matchId: string, userId: string) {
  await fetch(`${API_BASE}/api/v1/stream/${matchId}/heartbeat`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ userId }),
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// STREAM STATE (active banner — for OBS page)
// ═══════════════════════════════════════════════════════════════════════════

/** OBS page polls this every 2s OR subscribes via WebSocket /topic/stream/{matchId} */
export async function fetchStreamState(matchId: string) {
  const res = await apiFetch(`${API_BASE}/api/v1/stream/${matchId}/state`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  return json.data; // { activeBanner, activeTemplateId, updatedAt }
}

export async function pushActiveBanner(
  matchId: string,
  userId: string,
  banner: string,
  templateId: string | null,
) {
  const res = await apiFetch(`${API_BASE}/api/v1/stream/${matchId}/banner`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ userId, banner, templateId }),
  });
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION STATUS
// ═══════════════════════════════════════════════════════════════════════════

/** Used by stream dashboard (both admin + operator) */
export async function fetchMatchSubscription(matchId: string) {
  const res = await apiFetch(`${API_BASE}/api/v1/stream/${matchId}/subscription`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  return json.data; // { adminHasSubscription, purchasedTemplateIds }
}

/** Used by dashboard navbar + pricing page */
export async function fetchUserSubscription(userId: string) {
  const res = await apiFetch(`${API_BASE}/api/v1/subscriptions/user/${userId}`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  return json.data; // { hasSubscription, plan, ownedTemplateIds }
}

/** Used by pricing page /my endpoint for full history */
export async function fetchMySubscription(userId: string) {
  const res = await apiFetch(
    `${API_BASE}/api/v1/subscriptions/my?userId=${userId}`,
    { headers: authHeaders() },
  );
  const json = await res.json();
  return json.data; // { hasActiveSubscription, plan, expiresAt, history[] }
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION PURCHASE
// ═══════════════════════════════════════════════════════════════════════════

/** Step 1: Create Razorpay order */
export async function createSubscriptionOrder(
  userId: string,
  plan: "MONTHLY" | "SIX_MONTH",
) {
  const res = await apiFetch(`${API_BASE}/api/v1/subscriptions/order`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ userId, plan }),
  });
  const json = await res.json();
  return json.data; // { orderId, amount, currency, plan }
}

/** Step 2: Verify payment after Razorpay checkout success */
export async function verifySubscriptionPayment(payload: {
  userId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  plan: string;
}) {
  const res = await apiFetch(`${API_BASE}/api/v1/subscriptions/verify`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  return json.data; // { subscriptionId, plan, status, expiresAt }
}

// ═══════════════════════════════════════════════════════════════════════════
// ADD-ON PURCHASES (per match premium templates)
// ═══════════════════════════════════════════════════════════════════════════

/** Step 1: Create Razorpay order for a per-match premium overlay */
export async function createAddonOrder(
  matchId: string,
  payload: {
    userId: string;
    templateId: string;
    templateName: string;
    tier: string;
    amount: number;
  },
) {
  const res = await apiFetch(`${API_BASE}/api/v1/stream/${matchId}/addon/order`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  return json.data; // { orderId, amount, currency }
}

/** Step 2: Verify add-on payment after Razorpay checkout success */
export async function verifyAddonPayment(
  matchId: string,
  payload: {
    userId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    templateId: string;
  },
) {
  const res = await apiFetch(`${API_BASE}/api/v1/stream/${matchId}/addon/verify`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  return json.data; // { templateId, templateName, status }
}

// ═══════════════════════════════════════════════════════════════════════════
// WEBSOCKET (replaces polling in stream dashboard + OBS page)
// ═══════════════════════════════════════════════════════════════════════════
//
// Install: npm install @stomp/stompjs sockjs-client
//
// Usage in stream/[matchId]/page.tsx:
//
//   import { Client } from '@stomp/stompjs';
//   import SockJS from 'sockjs-client';
//
//   const stompClient = new Client({
//     webSocketFactory: () => new SockJS(`${API_BASE}/ws`),
//     reconnectDelay: 5000,
//   });
//
//   stompClient.onConnect = () => {
//     // Match state updates (score, over, wickets)
//     stompClient.subscribe(`/topic/match/${matchId}`, (msg) => {
//       setMatchState(JSON.parse(msg.body));
//     });
//     // Banner state updates (which overlay is active on OBS)
//     stompClient.subscribe(`/topic/stream/${matchId}`, (msg) => {
//       const { activeBanner, activeTemplateId } = JSON.parse(msg.body);
//       setActiveBanner(activeBanner);
//     });
//   };
//
//   stompClient.activate();
//   return () => stompClient.deactivate();
//
// The backend already broadcasts to /topic/match/{matchId} from MatchService.
// StreamService.setBanner() broadcasts to /topic/stream/{matchId}.

// ═══════════════════════════════════════════════════════════════════════════
// AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════════════

export async function sendOtp(phone: string) {
  // Spring Boot expects @RequestParam, so we append to the URL
  const res = await apiFetch(
    `${API_BASE}/api/v1/auth/send?phone=${encodeURIComponent(phone)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
  );
  return res.json(); // Returns BaseApiResponse<String>
}

export async function verifyOtp(phone: string, otp: string) {
  const res = await apiFetch(
    `${API_BASE}/api/v1/auth/verify?phone=${encodeURIComponent(phone)}&otp=${encodeURIComponent(otp)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
  );
  return res.json(); // Returns BaseApiResponse<LoginResponse>
}

export async function fetchTransactionHistory() {
  const userId =
    typeof window !== "undefined" ? localStorage.getItem("userUUID") : null;
  if (!userId) return [];

  // Call our new unified subscription/addon billing endpoint
  const res = await apiFetch(
    `${API_BASE}/api/v1/subscriptions/billing-history?userId=${userId}`,
    {
      headers: authHeaders(),
    },
  );
  const json = await res.json();
  return json.data || [];
}

// ═══════════════════════════════════════════════════════════════════════════
// USER PROFILE
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchCurrentUserProfile() {
  const res = await apiFetch(`${API_BASE}/api/v1/profile/current`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  // The React Native app expects response.data.data or response.data
  return json.data ?? json;
}

export async function updateUserProfile(data: {
  name?: string;
  email?: string | null;
}) {
  // Your React Native app sends this as FormData, so we must do the same here!
  const formData = new FormData();
  if (data.name) formData.append("name", data.name);
  if (data.email) formData.append("email", data.email);

  // No Content-Type header — browser sets multipart/form-data boundary automatically
  // credentials:"include" is handled by apiFetch so the jwt cookie is sent
  const res = await apiFetch(`${API_BASE}/api/v1/profile/update`, {
    method: "PUT",
    body: formData,
  });

  return res.json();
}

export async function fetchAvailableTemplates() {
  const res = await apiFetch(`${API_BASE}/api/v1/stream/templates`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  return json.data || [];
}

export async function fetchAvailableBundles() {
  const res = await apiFetch(`${API_BASE}/api/v1/stream/bundles`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  return json.data || [];
}

export async function createBundleOrder(
  matchId: string,
  payload: {
    userId: string;
    bundleId: string;
    bundleName: string;
    amount: number;
  },
) {
  const res = await apiFetch(`${API_BASE}/api/v1/stream/${matchId}/bundle/order`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  return json.data; // { orderId, amount, currency }
}

export async function verifyBundlePayment(
  matchId: string,
  payload: {
    userId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    bundleId: string;
  },
) {
  const res = await apiFetch(`${API_BASE}/api/v1/stream/${matchId}/bundle/verify`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  return json.data; // { bundleId, bundleName, status }
}

// ═══════════════════════════════════════════════════════════════════════════
// MANUAL UPI PAYMENT FLOW — add these to lib/api.ts
// ═══════════════════════════════════════════════════════════════════════════

/** Get UPI QR info — NO DB write. Call when modal opens. */
export async function getSubscriptionQrInfo(plan: "MONTHLY" | "SIX_MONTH") {
  const res = await apiFetch(
    `${API_BASE}/api/v1/payments/manual/subscription/qr-info?plan=${plan}`,
    { headers: authHeaders() }
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to get QR info.");
  return json.data as { upiString: string; upiId: string; amount: number; amountWithGst: number };
}

export async function getAddonQrInfo(amount: number) {
  const res = await apiFetch(
    `${API_BASE}/api/v1/payments/manual/addon/qr-info?amount=${amount}`,
    { headers: authHeaders() }
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to get QR info.");
  return json.data as { upiString: string; upiId: string; amount: number; amountWithGst: number };
}

/**
 * Create payment intent — called when user clicks "I've Paid".
 * Creates PENDING_UTR record so refresh resumes on UTR entry screen.
 * Idempotent — returns existing record if already pending.
 */
export async function createSubscriptionIntent(userId: string, plan: "MONTHLY" | "SIX_MONTH") {
  const res = await apiFetch(
    `${API_BASE}/api/v1/payments/manual/subscription/intent`,
    { method: "POST", headers: authHeaders(), body: JSON.stringify({ userId, plan }) }
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to create intent.");
  return json.data as { paymentId: string; status: string; amount: number };
}

export async function createAddonIntent(
  matchId: string,
  payload: { userId: string; templateId: string; templateName: string; tier: string; amount: number }
) {
  const res = await apiFetch(
    `${API_BASE}/api/v1/payments/manual/addon/intent`,
    { method: "POST", headers: authHeaders(), body: JSON.stringify({ matchId, ...payload }) }
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to create intent.");
  return json.data as { paymentId: string; status: string; amount: number };
}

/**
 * Submit UTR — transitions PENDING_UTR → PENDING_VERIFICATION, emails owner.
 */
export async function submitUtr(paymentId: string, utrNumber: string) {
  const res = await apiFetch(
    `${API_BASE}/api/v1/payments/manual/${paymentId}/submit-utr`,
    { method: "POST", headers: authHeaders(), body: JSON.stringify({ utrNumber }) }
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to submit UTR.");
  return json.data as { paymentId: string; status: string; message: string };
}

/** Poll payment status every ~8s after UTR submission. */
export async function pollManualPaymentStatus(paymentId: string) {
  const res = await apiFetch(
    `${API_BASE}/api/v1/payments/manual/${paymentId}/status`,
    { headers: authHeaders() }
  );
  const json = await res.json();
  return json.data as {
    paymentId: string;
    status: "PENDING_UTR" | "PENDING_VERIFICATION" | "CONFIRMED" | "REJECTED" | "CANCELLED";
    paymentType: "SUBSCRIPTION" | "ADDON";
    amount: number;
    utrNumber: string | null;
    confirmedAt: string | null;
    plan?: string;
    templateId?: string;
    templateName?: string;
    matchId?: string;
  };
}

/** Check for any pending payment on checkout open — returns PENDING_UTR or PENDING_VERIFICATION record. */
export async function checkPendingSubscription(userId: string, plan: string) {
  const res = await apiFetch(
    `${API_BASE}/api/v1/payments/manual/subscription/pending?userId=${userId}&plan=${plan}`,
    { headers: authHeaders() }
  );
  if (res.status === 404) return null;
  const json = await res.json();
  return json.data as { paymentId: string; status: string; utrNumber: string | null; amount: number } | null;
}

export async function checkPendingAddon(userId: string, matchId: string, templateId: string) {
  const res = await apiFetch(
    `${API_BASE}/api/v1/payments/manual/addon/pending?userId=${userId}&matchId=${matchId}&templateId=${templateId}`,
    { headers: authHeaders() }
  );
  if (res.status === 404) return null;
  const json = await res.json();
  return json.data as { paymentId: string; status: string; utrNumber: string | null; amount: number; templateName: string } | null;
}

export async function getBundleQrInfo(amount: number) {
  const res = await apiFetch(
    `${API_BASE}/api/v1/payments/manual/bundle/qr-info?amount=${amount}`,
    { headers: authHeaders() }
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to get QR info.");
  return json.data as { upiString: string; upiId: string; amount: number; amountWithGst: number };
}

export async function createBundleManualIntent(payload: {
  userId: string;
  matchId: string;
  bundleId: string;
  bundleName: string;
  amount: number;
}) {
  const res = await apiFetch(`${API_BASE}/api/v1/payments/manual/bundle/intent`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to create intent.");
  return json.data as { paymentId: string; status: string; amount: number };
}

export async function unlockBundleWithSubscription(
  matchId: string,
  payload: { userId: string; bundleId: string; bundleName: string },
) {
  const res = await apiFetch(
    `${API_BASE}/api/v1/stream/${matchId}/bundle/unlock`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    },
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to unlock bundle.");
  return json.data as { bundleId: string; bundleName: string; freeWithSubscription: boolean; status: string };
}

export async function checkPendingBundle(userId: string, matchId: string, bundleId: string) {
  const res = await apiFetch(
    `${API_BASE}/api/v1/payments/manual/bundle/pending?userId=${userId}&matchId=${matchId}&bundleId=${bundleId}`,
    { headers: authHeaders() }
  );
  if (res.status === 404) return null;
  const json = await res.json();
  return json.data as { paymentId: string; status: string; utrNumber: string | null; amount: number; bundleName: string } | null;
}

/** Cancel a pending payment — user chose to start over. */
export async function cancelManualPayment(paymentId: string, userId: string) {
  const res = await apiFetch(
    `${API_BASE}/api/v1/payments/manual/${paymentId}/cancel`,
    { method: "POST", headers: authHeaders(), body: JSON.stringify({ userId }) }
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to cancel payment.");
  return json.data as { paymentId: string; status: string; message: string };
}

// ═══════════════════════════════════════════════════════════════════════════
// MEDIA REEL (tpl-pro-5)
// ═══════════════════════════════════════════════════════════════════════════

export interface MediaAsset {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO";
  fileName: string;
  createdAt: string;
}

export async function uploadMediaAsset(file: File, userId: string): Promise<MediaAsset> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("userId", userId);
  const res = await apiFetch(`${API_BASE}/api/v1/media/upload`, {
    method: "POST",
    body: formData,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Upload failed.");
  return json.data as MediaAsset;
}

export async function fetchMediaLibrary(userId: string): Promise<MediaAsset[]> {
  const res = await apiFetch(`${API_BASE}/api/v1/media/library?userId=${userId}`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  return (json.data ?? []) as MediaAsset[];
}

export async function deleteMediaAsset(id: string, userId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/api/v1/media/${id}?userId=${userId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Delete failed.");
}

export async function fetchMatchPlaylist(matchId: string): Promise<MediaAsset[]> {
  const res = await apiFetch(`${API_BASE}/api/v1/stream/${matchId}/playlist`);
  const json = await res.json();
  return (json.data ?? []) as MediaAsset[];
}

export async function saveMatchPlaylist(matchId: string, userId: string, assets: MediaAsset[]): Promise<boolean> {
  const res = await apiFetch(`${API_BASE}/api/v1/stream/${matchId}/playlist`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ userId, assets }),
  });
  const json = await res.json();
  return json.success === true;
}