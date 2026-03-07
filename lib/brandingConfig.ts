import { BrandingConfig, DEFAULT_BRANDING_CONFIG } from "@/app/overlays/premium/matchAddOn/BrandingOverlay";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── Fetch saved config (called by both dashboard and OBS page) ───────────────
// OBS page has no token — that's fine, endpoint is in PUBLIC_URLS
export async function fetchBrandingConfig(matchId: string): Promise<BrandingConfig> {
  try {
    const res = await fetch(`${BASE}/api/v1/stream/${matchId}/branding`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return DEFAULT_BRANDING_CONFIG;
    const json = await res.json();
    const data = json.data ?? json;
    return { ...DEFAULT_BRANDING_CONFIG, ...data };
  } catch {
    return DEFAULT_BRANDING_CONFIG;
  }
}

// ── Save config (dashboard only — requires JWT) ──────────────────────────────
export async function saveBrandingConfig(
  matchId: string,
  config: BrandingConfig,
): Promise<boolean> {
  try {
    const userId = localStorage.getItem("userUUID");
    const token  = localStorage.getItem("jwtToken");
    if (!userId || !token) return false;

    const res = await fetch(`${BASE}/api/v1/stream/${matchId}/branding`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ ...config, userId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}