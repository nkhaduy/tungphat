import { authenticateGbpAdmin, validMutation } from "./gbp-auth";
import { decryptToken, encryptToken, googleAuthorizationUrl, selectTungPhatLocation, type BusinessLocation } from "../../src/gbp/oauth";
import { exchangeAuthorizationCode, syncGbp } from "../../src/gbp/sync";
import type { GbpEnv } from "../../src/gbp/types";

export type PagesGbpEnv = GbpEnv & {
  LIGHT_CMS_API: Fetcher;
  ALLOWED_ORIGINS?: string;
  LEGACY_CMS_ORIGIN?: string;
};

const STATE_COOKIE = "tp_gbp_oauth_state";

function headers(publicCache = false, origin?: string) {
  const value = new Headers({
    "Cache-Control": publicCache ? "public, max-age=300, stale-while-revalidate=86400" : "private, no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    "Referrer-Policy": "no-referrer",
  });
  if (origin) { value.set("Access-Control-Allow-Origin", origin); value.set("Vary", "Origin"); }
  return value;
}

function json(data: unknown, status = 200, publicCache = false, origin?: string) { return Response.json(data, { status, headers: headers(publicCache, origin) }); }
function corsOrigin(request: Request, env: PagesGbpEnv) {
  const origin = request.headers.get("Origin") || "";
  return (env.CORS_ALLOWED_ORIGINS || "").split(",").map((value) => value.trim()).includes(origin) ? origin : undefined;
}

function bootstrapCookie(request: Request) {
  return (request.headers.get("Cookie") || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${STATE_COOKIE}=`))?.slice(STATE_COOKIE.length + 1) || "";
}

async function googleGet<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const body = await response.json() as T & { error?: { status?: string } };
  if (!response.ok) throw new Error(body.error?.status || "google_lookup_failed");
  return body;
}

export async function publicReviews(request: Request, env: PagesGbpEnv) {
  if (request.method !== "GET") return json({ ok: false, code: "method_not_allowed" }, 405);
  const origin = corsOrigin(request, env);
  const now = Math.floor(Date.now() / 1000);
  const connection = await env.DB.prepare("SELECT location_name,location_title,location_maps_uri,last_sync_succeeded_at FROM gbp_connection WHERE id=1 AND location_name IS NOT NULL").first<Record<string, string | number | null>>();
  if (!connection?.location_name) return json({ status: "empty", reviews: [] }, 200, true, origin);
  const reviews = await env.DB.prepare("SELECT review_id,reviewer_display_name,reviewer_photo_url,rating,comment,create_time,update_time,owner_reply FROM gbp_reviews WHERE location_name=?1 AND available=1 AND expires_at>?2 ORDER BY COALESCE(update_time,create_time) DESC LIMIT 8").bind(connection.location_name, now).all<Record<string, unknown>>();
  const summary = await env.DB.prepare("SELECT COUNT(*) AS count,ROUND(AVG(rating),1) AS average FROM gbp_reviews WHERE location_name=?1 AND available=1 AND expires_at>?2").bind(connection.location_name, now).first<{ count: number; average: number }>();
  return json({ status: reviews.results.length ? "ready" : "empty", location: connection.location_title, mapsUrl: connection.location_maps_uri, lastSyncedAt: connection.last_sync_succeeded_at, count: Number(summary?.count || 0), averageRating: Number(summary?.average || 0), reviews: reviews.results }, 200, true, origin);
}

export async function oauthStart(request: Request, env: PagesGbpEnv) {
  const session = await authenticateGbpAdmin(request, env.LIGHT_CMS_API);
  if (!session && env.GBP_OAUTH_BOOTSTRAP !== "enabled") return json({ ok: false, code: "unauthorized" }, 401);
  if (!env.GBP_GOOGLE_CLIENT_ID || !env.GBP_GOOGLE_REDIRECT_URI || !env.GBP_TOKEN_ENCRYPTION_KEY) return json({ ok: false, code: "not_configured" }, 503);
  const state = crypto.randomUUID();
  const encrypted = await encryptToken(`${state}:${session?.userId || "bootstrap"}:${Date.now()}`, env.GBP_TOKEN_ENCRYPTION_KEY);
  return new Response(null, { status: 302, headers: { Location: googleAuthorizationUrl(env.GBP_GOOGLE_CLIENT_ID, env.GBP_GOOGLE_REDIRECT_URI, state), "Set-Cookie": `${STATE_COOKIE}=${encodeURIComponent(encrypted)}; HttpOnly; Secure; SameSite=Lax; Path=/api/gbp/oauth; Max-Age=600`, "Cache-Control": "no-store" } });
}

export async function oauthAuthorize(request: Request, env: PagesGbpEnv) {
  if (env.GBP_OAUTH_BOOTSTRAP !== "enabled" || !env.GBP_GOOGLE_CLIENT_ID || !env.GBP_GOOGLE_REDIRECT_URI || !env.GBP_TOKEN_ENCRYPTION_KEY) return json({ ok: false, code: "not_found" }, 404);
  const encrypted = bootstrapCookie(request);
  if (!encrypted) return json({ ok: false, code: "oauth_state_missing" }, 400);
  const payload = await decryptToken(decodeURIComponent(encrypted), env.GBP_TOKEN_ENCRYPTION_KEY).catch(() => "");
  const [state, , created] = payload.split(":");
  if (!state || Date.now() - Number(created) > 600_000) return json({ ok: false, code: "oauth_state_expired" }, 400);
  return new Response(null, { status: 302, headers: { Location: googleAuthorizationUrl(env.GBP_GOOGLE_CLIENT_ID, env.GBP_GOOGLE_REDIRECT_URI, state), "Cache-Control": "no-store" } });
}

export async function oauthCallback(request: Request, env: PagesGbpEnv) {
  const url = new URL(request.url); const state = url.searchParams.get("state") || ""; const code = url.searchParams.get("code") || "";
  const encoded = request.headers.get("Cookie")?.match(new RegExp(`(?:^|;\\s*)${STATE_COOKIE}=([^;]+)`))?.[1];
  if (!encoded || !state || !code || !env.GBP_TOKEN_ENCRYPTION_KEY) return new Response("OAuth request invalid", { status: 400 });
  const cookie = await decryptToken(decodeURIComponent(encoded), env.GBP_TOKEN_ENCRYPTION_KEY).catch(() => "");
  const [expected, , created] = cookie.split(":");
  if (expected !== state || Date.now() - Number(created) > 600_000) return new Response("OAuth state expired", { status: 400 });
  const token = await exchangeAuthorizationCode(env, code);
  const accounts = await googleGet<{ accounts?: Array<{ name: string }> }>("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", token.access_token || "");
  let accountName = ""; let selected: BusinessLocation | null = null;
  for (const account of accounts.accounts || []) {
    const fields = "name,title,websiteUri,metadata";
    const locations = await googleGet<{ locations?: BusinessLocation[] }>(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=${encodeURIComponent(fields)}&pageSize=100`, token.access_token || "");
    selected = selectTungPhatLocation(locations.locations || []);
    if (selected) { accountName = account.name; break; }
  }
  if (!selected || !accountName) return new Response("Tùng Phát location was not found", { status: 404 });
  const now = Math.floor(Date.now() / 1000); const expiry = now + Number(token.expires_in || 3600);
  await env.DB.prepare(`INSERT INTO gbp_connection(id,project_id,account_name,location_name,location_title,location_maps_uri,location_place_id,access_token_ciphertext,refresh_token_ciphertext,token_expires_at,scope,status,updated_at) VALUES(1,?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,'connected',?11) ON CONFLICT(id) DO UPDATE SET project_id=?1,account_name=?2,location_name=?3,location_title=?4,location_maps_uri=?5,location_place_id=?6,access_token_ciphertext=?7,refresh_token_ciphertext=COALESCE(?8,refresh_token_ciphertext),token_expires_at=?9,scope=?10,status='connected',last_error_safe=NULL,updated_at=?11`)
    .bind(env.GBP_GOOGLE_PROJECT_ID || "", accountName, `${accountName}/${selected.name}`, selected.title || "Tùng Phát", selected.metadata?.mapsUri || null, selected.metadata?.placeId || null, await encryptToken(token.access_token || "", env.GBP_TOKEN_ENCRYPTION_KEY), token.refresh_token ? await encryptToken(token.refresh_token, env.GBP_TOKEN_ENCRYPTION_KEY) : null, expiry, token.scope || "https://www.googleapis.com/auth/business.manage", now).run();
  return new Response(null, { status: 302, headers: { Location: "/?gbp=connected", "Set-Cookie": `${STATE_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/api/gbp/oauth; Max-Age=0`, "Cache-Control": "no-store" } });
}

export async function adminGbp(request: Request, env: PagesGbpEnv) {
  const session = await authenticateGbpAdmin(request, env.LIGHT_CMS_API);
  if (!session) return json({ ok: false, code: "unauthorized" }, 401);
  const route = new URL(request.url).pathname.replace(/^\/api\/admin\/gbp\/?/u, "").replace(/\/$/u, "");
  if (request.method === "POST" && !validMutation(request, session, env.ALLOWED_ORIGINS || "")) return json({ ok: false, code: "request_rejected" }, 403);
  if (route === "sync" && request.method === "POST") {
    try { return json({ ok: true, data: await syncGbp(env) }); }
    catch (error) { console.error(JSON.stringify({ message: "gbp_manual_sync_failed", error: error instanceof Error ? error.message.slice(0, 100) : "unknown" })); return json({ ok: false, code: "sync_failed" }, 503); }
  }
  if (request.method !== "GET") return json({ ok: false, code: "method_not_allowed" }, 405);
  const connection = await env.DB.prepare("SELECT project_id,account_name,location_name,location_title,location_maps_uri,status,last_sync_started_at,last_sync_succeeded_at,last_sync_failed_at,last_error_safe FROM gbp_connection WHERE id=1").first();
  const reviews = await env.DB.prepare("SELECT COUNT(*) AS total,ROUND(AVG(rating),1) AS average,MAX(fetched_at) AS last_sync FROM gbp_reviews WHERE available=1").first();
  const latest = await env.DB.prepare("SELECT reviewer_display_name,rating,comment,update_time FROM gbp_reviews WHERE available=1 ORDER BY COALESCE(update_time,create_time) DESC LIMIT 10").all();
  const metrics = await env.DB.prepare("SELECT metric_date,metric_name,metric_value FROM gbp_performance_daily ORDER BY metric_date DESC,metric_name LIMIT 400").all();
  const keywords = await env.DB.prepare("SELECT month,keyword,impressions,threshold FROM gbp_search_keywords_monthly ORDER BY month DESC,COALESCE(impressions,threshold) DESC LIMIT 300").all();
  return json({ ok: true, data: { configured: Boolean(env.GBP_GOOGLE_CLIENT_ID), connection, reviews: { ...reviews, latest: latest.results }, metrics: metrics.results, keywords: keywords.results, retentionDays: 30 } });
}

export async function cronGbp(request: Request, env: PagesGbpEnv) {
  if (request.method !== "POST") return json({ ok: false }, 405);
  const provided = request.headers.get("Authorization")?.replace(/^Bearer\s+/iu, "") || "";
  if (!env.GBP_CRON_SECRET || provided !== env.GBP_CRON_SECRET) return json({ ok: false }, 401);
  try { return json({ ok: true, data: await syncGbp(env) }); }
  catch (error) { console.error(JSON.stringify({ message: "gbp_cron_failed", error: error instanceof Error ? error.message.slice(0, 100) : "unknown" })); return json({ ok: false }, 503); }
}
