import type { AnalyticsEnv } from "./types";

type TokenCache = { token: string; expiresAt: number };
const tokenCache = new Map<string, TokenCache>();

function base64Url(input: string | ArrayBuffer) {
  let binary = "";
  if (typeof input === "string") {
    const bytes = new TextEncoder().encode(input);
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  } else {
    new Uint8Array(input).forEach((byte) => { binary += String.fromCharCode(byte); });
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function pemBytes(pem: string) {
  const normalized = pem.replace(/\\n/g, "\n").replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const binary = atob(normalized);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0)).buffer;
}

export function googleConfigured(env: AnalyticsEnv) {
  return Boolean(env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY);
}

async function accessToken(env: AnalyticsEnv, scope: string) {
  if (!googleConfigured(env)) throw new Error("google_not_configured");
  const cached = tokenCache.get(scope);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(JSON.stringify({
    iss: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    scope,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${claim}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemBytes(env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || ""),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const assertion = `${unsigned}.${base64Url(signed)}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const result = await response.json() as { access_token?: string; expires_in?: number; error?: string };
  if (!response.ok || !result.access_token) throw new Error(result.error || "google_token_failed");
  tokenCache.set(scope, { token: result.access_token, expiresAt: Date.now() + (result.expires_in || 3600) * 1000 });
  return result.access_token;
}

export async function ga4Realtime(env: AnalyticsEnv) {
  if (!env.GA4_PROPERTY_ID) throw new Error("ga4_not_configured");
  const token = await accessToken(env, "https://www.googleapis.com/auth/analytics.readonly");
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(env.GA4_PROPERTY_ID)}:runRealtimeReport`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ metrics: [{ name: "activeUsers" }] }),
    },
  );
  const result = await response.json() as { rows?: Array<{ metricValues?: Array<{ value?: string }> }>; error?: { status?: string } };
  if (!response.ok) throw new Error(result.error?.status || "ga4_realtime_failed");
  return Number(result.rows?.[0]?.metricValues?.[0]?.value || 0);
}

export type SearchRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

export async function searchConsoleRows(
  env: AnalyticsEnv,
  startDate: string,
  endDate: string,
  dimensions: string[],
) {
  if (!env.SEARCH_CONSOLE_SITE_URL) throw new Error("search_console_not_configured");
  const token = await accessToken(env, "https://www.googleapis.com/auth/webmasters.readonly");
  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(env.SEARCH_CONSOLE_SITE_URL)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions,
        rowLimit: 1000,
        dataState: "final",
      }),
    },
  );
  const result = await response.json() as { rows?: SearchRow[]; error?: { status?: string } };
  if (!response.ok) throw new Error(result.error?.status || "search_console_failed");
  return result.rows || [];
}
