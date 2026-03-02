const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

function authHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MATCHES
// ═══════════════════════════════════════════════════════════════════════════

/** Fetch all matches, filter client-side to those where user is creator or operator */
export async function fetchUserMatches(userId: string) {
  const res = await fetch(`${API_BASE}/api/v1/matches`, {
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
  const res = await fetch(`${API_BASE}/api/v1/matches/${matchId}`, {
    headers: authHeaders(),
  });
  return res.json();
}

/** Fetch live match state for score overlay */
export async function fetchMatchState(matchId: string) {
  const res = await fetch(`${API_BASE}/api/v1/matches/matchstate/${matchId}`, {
    headers: authHeaders(),
  });
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════════════
// STREAM SESSION (lock)
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchStreamSession(matchId: string) {
  const res = await fetch(`${API_BASE}/api/v1/stream/${matchId}/session`, {
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
  const res = await fetch(`${API_BASE}/api/v1/stream/${matchId}/claim`, {
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
  const res = await fetch(`${API_BASE}/api/v1/stream/${matchId}/state`, {
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
  const res = await fetch(`${API_BASE}/api/v1/stream/${matchId}/banner`, {
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
  const res = await fetch(`${API_BASE}/api/v1/stream/${matchId}/subscription`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  return json.data; // { adminHasSubscription, purchasedTemplateIds }
}

/** Used by dashboard navbar + pricing page */
export async function fetchUserSubscription(userId: string) {
  const res = await fetch(`${API_BASE}/api/v1/subscriptions/user/${userId}`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  return json.data; // { hasSubscription, plan, ownedTemplateIds }
}

/** Used by pricing page /my endpoint for full history */
export async function fetchMySubscription(userId: string) {
  const res = await fetch(
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
  const res = await fetch(`${API_BASE}/api/v1/subscriptions/order`, {
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
  const res = await fetch(`${API_BASE}/api/v1/subscriptions/verify`, {
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
  const res = await fetch(`${API_BASE}/api/v1/stream/${matchId}/addon/order`, {
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
  const res = await fetch(`${API_BASE}/api/v1/stream/${matchId}/addon/verify`, {
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
  const res = await fetch(
    `${API_BASE}/api/v1/auth/send?phone=${encodeURIComponent(phone)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
  );
  return res.json(); // Returns BaseApiResponse<String>
}

export async function verifyOtp(phone: string, otp: string) {
  const res = await fetch(
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
  const res = await fetch(
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
  const res = await fetch(`${API_BASE}/api/v1/profile/current`, {
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

  // We need a specific header setup for FormData (do NOT set Content-Type to application/json)
  const token =
    typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
  const headers: HeadersInit = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const res = await fetch(`${API_BASE}/api/v1/profile/update`, {
    method: "PUT",
    headers: headers, // Browser automatically sets multipart/form-data boundary
    body: formData,
  });

  return res.json();
}

export async function fetchAvailableTemplates() {
  const res = await fetch(`${API_BASE}/api/v1/stream/templates`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  return json.data || [];
}
