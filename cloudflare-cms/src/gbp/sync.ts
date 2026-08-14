import { decryptToken, encryptToken } from "./oauth";
import { fetchAllReviews, fetchDailyMetrics, fetchMonthlyKeywordImpressions } from "./google";
import { GBP_RETENTION_SECONDS, cleanupStatements, reviewUpsertStatements } from "./storage";
import type { GbpEnv, GbpTokenResponse } from "./types";

type Connection = {
  id: number;
  access_token_ciphertext: string | null;
  refresh_token_ciphertext: string | null;
  token_expires_at: number | null;
  account_name: string | null;
  location_name: string | null;
  location_title: string | null;
  location_maps_uri: string | null;
  branch_key: string;
};

function dateOnly(timestamp: number) { return new Date(timestamp).toISOString().slice(0, 10); }
function monthOnly(timestamp: number) { return new Date(timestamp).toISOString().slice(0, 7); }

async function tokenResponse(response: Response) {
  const body = await response.json() as GbpTokenResponse;
  if (!response.ok || !body.access_token) throw new Error(body.error || "gbp_token_exchange_failed");
  return body;
}

export async function exchangeAuthorizationCode(env: GbpEnv, code: string) {
  if (!env.GBP_GOOGLE_CLIENT_ID || !env.GBP_GOOGLE_CLIENT_SECRET || !env.GBP_GOOGLE_REDIRECT_URI) throw new Error("gbp_oauth_not_configured");
  return tokenResponse(await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: env.GBP_GOOGLE_CLIENT_ID, client_secret: env.GBP_GOOGLE_CLIENT_SECRET, redirect_uri: env.GBP_GOOGLE_REDIRECT_URI, grant_type: "authorization_code" }),
  }));
}

async function refreshAccessToken(env: GbpEnv, refreshToken: string) {
  if (!env.GBP_GOOGLE_CLIENT_ID || !env.GBP_GOOGLE_CLIENT_SECRET) throw new Error("gbp_oauth_not_configured");
  return tokenResponse(await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ refresh_token: refreshToken, client_id: env.GBP_GOOGLE_CLIENT_ID, client_secret: env.GBP_GOOGLE_CLIENT_SECRET, grant_type: "refresh_token" }),
  }));
}

async function connections(env: GbpEnv) {
  const result = await env.DB.prepare("SELECT * FROM gbp_connection WHERE location_name IS NOT NULL AND status != 'disconnected' ORDER BY display_order,branch_key").all<Connection>();
  return result.results;
}

export async function currentAccessToken(env: GbpEnv, row: Connection, now = Math.floor(Date.now() / 1000)) {
  if (!env.GBP_TOKEN_ENCRYPTION_KEY) throw new Error("gbp_not_connected");
  if (row.access_token_ciphertext && Number(row.token_expires_at || 0) > now + 120) return decryptToken(row.access_token_ciphertext, env.GBP_TOKEN_ENCRYPTION_KEY);
  if (!row.refresh_token_ciphertext) throw new Error("gbp_refresh_token_missing");
  const refreshed = await refreshAccessToken(env, await decryptToken(row.refresh_token_ciphertext, env.GBP_TOKEN_ENCRYPTION_KEY));
  const expires = now + Number(refreshed.expires_in || 3600);
  await env.DB.prepare("UPDATE gbp_connection SET access_token_ciphertext=?1,token_expires_at=?2,status='connected',updated_at=?3 WHERE account_name=?4")
    .bind(await encryptToken(refreshed.access_token || "", env.GBP_TOKEN_ENCRYPTION_KEY), expires, now, row.account_name).run();
  return refreshed.access_token || "";
}

async function updateSyncStatus(env: GbpEnv, id: number, status: string, now: number, error: string | null = null) {
  const column = status === "connected" ? "last_sync_succeeded_at" : status === "syncing" ? "last_sync_started_at" : "last_sync_failed_at";
  await env.DB.prepare(`UPDATE gbp_connection SET status=?1,${column}=?2,last_error_safe=?3,updated_at=?2 WHERE id=?4`).bind(status, now, error, id).run();
}

async function syncLocation(env: GbpEnv, row: Connection, token: string, now: number) {
  if (!row.location_name) throw new Error("gbp_location_missing");
  await updateSyncStatus(env, row.id, "syncing", now);
  try {
    const start = dateOnly((now - 29 * 86_400) * 1000);
    const end = dateOnly(now * 1000);
    const month = monthOnly(now * 1000);
    const [reviews, metrics, keywords] = await Promise.all([
      fetchAllReviews(token, row.location_name), fetchDailyMetrics(token, row.location_name.replace(/^accounts\/[^/]+\//, ""), start, end),
      fetchMonthlyKeywordImpressions(token, row.location_name.replace(/^accounts\/[^/]+\//, ""), month, month),
    ]);
    const expires = now + GBP_RETENTION_SECONDS;
    const statements = [
      ...reviewUpsertStatements(env.DB, row.location_name, reviews, now),
      ...metrics.map((metric) => env.DB.prepare("INSERT INTO gbp_performance_daily(location_name,metric_date,metric_name,metric_value,fetched_at,expires_at) VALUES(?1,?2,?3,?4,?5,?6) ON CONFLICT(location_name,metric_date,metric_name) DO UPDATE SET metric_value=?4,fetched_at=?5,expires_at=?6").bind(row.location_name, metric.date, metric.metric, metric.value, now, expires)),
      ...keywords.map((keyword) => env.DB.prepare("INSERT INTO gbp_search_keywords_monthly(location_name,month,keyword,impressions,threshold,fetched_at,expires_at) VALUES(?1,?2,?3,?4,?5,?6,?7) ON CONFLICT(location_name,month,keyword) DO UPDATE SET impressions=?4,threshold=?5,fetched_at=?6,expires_at=?7").bind(row.location_name, month, keyword.keyword, keyword.impressions, keyword.threshold, now, expires)),
      ...cleanupStatements(env.DB, now),
    ];
    for (let index = 0; index < statements.length; index += 100) await env.DB.batch(statements.slice(index, index + 100));
    await updateSyncStatus(env, row.id, "connected", now);
    return { branchKey: row.branch_key, status: "ready" as const, reviews: reviews.length, metrics: metrics.length, keywords: keywords.length, syncedAt: now };
  } catch (error) {
    const safe = error instanceof Error ? error.message.slice(0, 100) : "gbp_sync_failed";
    await updateSyncStatus(env, row.id, "error", now, safe);
    return { branchKey: row.branch_key, status: "error" as const, reviews: 0, metrics: 0, keywords: 0, syncedAt: now, errorCode: safe };
  }
}

export async function syncGbp(env: GbpEnv, now = Math.floor(Date.now() / 1000)) {
  const rows = await connections(env);
  if (!rows.length) throw new Error("gbp_location_missing");
  const token = await currentAccessToken(env, rows[0], now);
  const branches = await Promise.all(rows.map((row) => syncLocation(env, row, token, now)));
  return { branches, syncedAt: now };
}
