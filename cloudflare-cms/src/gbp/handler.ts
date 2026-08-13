import { validMutation, verifySession } from "../auth/session";
import { decryptToken, encryptToken, googleAuthorizationUrl, selectTungPhatLocation, type BusinessLocation } from "./oauth";
import { exchangeAuthorizationCode, syncGbp } from "./sync";
import { publicReviewQuery } from "./storage";
import type { GbpEnv } from "./types";

const STATE_COOKIE = "tp_gbp_oauth_state";

function responseHeaders(publicCache = false, origin?: string) {
  return { "Cache-Control": publicCache ? "public, max-age=300, stale-while-revalidate=86400" : "private, no-store", "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow, noarchive", "Referrer-Policy": "no-referrer", ...(origin ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {}) };
}
function json(data: unknown, status = 200, publicCache = false) { return Response.json(data, { status, headers: responseHeaders(publicCache) }); }
function validOrigin(request: Request, env: GbpEnv) { const origin = request.headers.get("Origin"); return Boolean(origin && env.CMS_ALLOWED_ORIGINS.split(",").map((x) => x.trim()).includes(origin)); }

async function googleGet<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const body = await response.json() as T & { error?: { status?: string } };
  if (!response.ok) throw new Error(body.error?.status || "google_lookup_failed");
  return body;
}

export async function handlePublicReviews(request: Request, env: GbpEnv) {
  if (request.method !== "GET") return json({ ok: false, code: "method_not_allowed" }, 405);
  const origin = request.headers.get("Origin") || "";
  const allowedOrigin = (env.CORS_ALLOWED_ORIGINS || "").split(",").map((value) => value.trim()).includes(origin) ? origin : undefined;
  const now = Math.floor(Date.now() / 1000);
  const connection = await env.DB.prepare("SELECT location_name,location_title,location_maps_uri,last_sync_succeeded_at FROM gbp_connection WHERE id=1 AND location_name IS NOT NULL").first<Record<string, string | number | null>>();
  if (!connection?.location_name) return Response.json({ status: "empty", reviews: [] }, { headers: responseHeaders(true, allowedOrigin) });
  const result = await publicReviewQuery(env.DB, String(connection.location_name), now).all<Record<string, unknown>>();
  const summary = await env.DB.prepare("SELECT COUNT(*) AS count,ROUND(AVG(rating),1) AS average FROM gbp_reviews WHERE location_name=?1 AND available=1 AND expires_at>?2").bind(connection.location_name, now).first<{ count: number; average: number }>();
  return Response.json({ status: result.results.length ? "ready" : "empty", location: connection.location_title, mapsUrl: connection.location_maps_uri, lastSyncedAt: connection.last_sync_succeeded_at, count: Number(summary?.count || 0), averageRating: Number(summary?.average || 0), reviews: result.results }, { headers: responseHeaders(true, allowedOrigin) });
}

export async function handleGbpOAuthStart(request: Request, env: GbpEnv) {
  const session = await verifySession(request, env);
  if (!session) return json({ ok: false, code: "unauthorized" }, 401);
  if (!env.GBP_GOOGLE_CLIENT_ID || !env.GBP_GOOGLE_REDIRECT_URI || !env.GBP_TOKEN_ENCRYPTION_KEY) return json({ ok: false, code: "not_configured" }, 503);
  const state = crypto.randomUUID();
  const encrypted = await encryptToken(`${state}:${session.username}:${Date.now()}`, env.GBP_TOKEN_ENCRYPTION_KEY);
  return new Response(null, { status: 302, headers: { Location: googleAuthorizationUrl(env.GBP_GOOGLE_CLIENT_ID, env.GBP_GOOGLE_REDIRECT_URI, state), "Set-Cookie": `${STATE_COOKIE}=${encodeURIComponent(encrypted)}; HttpOnly; Secure; SameSite=Lax; Path=/api/gbp/oauth; Max-Age=600`, "Cache-Control": "no-store" } });
}

export async function handleGbpOAuthCallback(request: Request, env: GbpEnv) {
  const url = new URL(request.url); const state = url.searchParams.get("state") || ""; const code = url.searchParams.get("code") || "";
  const encoded = request.headers.get("Cookie")?.match(new RegExp(`(?:^|;\\s*)${STATE_COOKIE}=([^;]+)`))?.[1];
  if (!encoded || !state || !code || !env.GBP_TOKEN_ENCRYPTION_KEY) return new Response("OAuth request invalid", { status: 400 });
  const cookie = await decryptToken(decodeURIComponent(encoded), env.GBP_TOKEN_ENCRYPTION_KEY).catch(() => "");
  const [expected, , created] = cookie.split(":"); if (expected !== state || Date.now() - Number(created) > 600_000) return new Response("OAuth state expired", { status: 400 });
  const token = await exchangeAuthorizationCode(env, code);
  const accounts = await googleGet<{ accounts?: Array<{ name: string }> }>("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", token.access_token || "");
  let selectedAccount = ""; let selected: BusinessLocation | null = null;
  for (const account of accounts.accounts || []) {
    const fields = "name,title,websiteUri,metadata";
    const locations = await googleGet<{ locations?: BusinessLocation[] }>(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=${encodeURIComponent(fields)}&pageSize=100`, token.access_token || "");
    selected = selectTungPhatLocation(locations.locations || []); if (selected) { selectedAccount = account.name; break; }
  }
  if (!selected || !selectedAccount) return new Response("Tùng Phát location was not found", { status: 404 });
  const now = Math.floor(Date.now() / 1000); const expiry = now + Number(token.expires_in || 3600);
  await env.DB.prepare(`INSERT INTO gbp_connection(id,project_id,account_name,location_name,location_title,location_maps_uri,location_place_id,access_token_ciphertext,refresh_token_ciphertext,token_expires_at,scope,status,updated_at) VALUES(1,?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,'connected',?11) ON CONFLICT(id) DO UPDATE SET project_id=?1,account_name=?2,location_name=?3,location_title=?4,location_maps_uri=?5,location_place_id=?6,access_token_ciphertext=?7,refresh_token_ciphertext=COALESCE(?8,refresh_token_ciphertext),token_expires_at=?9,scope=?10,status='connected',last_error_safe=NULL,updated_at=?11`)
    .bind(env.GBP_GOOGLE_PROJECT_ID, selectedAccount, `${selectedAccount}/${selected.name}`, selected.title || "Tùng Phát", selected.metadata?.mapsUri || null, selected.metadata?.placeId || null, await encryptToken(token.access_token || "", env.GBP_TOKEN_ENCRYPTION_KEY), token.refresh_token ? await encryptToken(token.refresh_token, env.GBP_TOKEN_ENCRYPTION_KEY) : null, expiry, token.scope || "https://www.googleapis.com/auth/business.manage", now).run();
  return new Response(null, { status: 302, headers: { Location: "/?view=gbp&connected=1", "Set-Cookie": `${STATE_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/api/gbp/oauth; Max-Age=0`, "Cache-Control": "no-store" } });
}

export async function handleAdminGbp(context: EventContext<GbpEnv, string, unknown>) {
  const { request, env } = context; const session = await verifySession(request, env); if (!session) return json({ ok: false, code: "unauthorized" }, 401);
  const route = new URL(request.url).pathname.replace(/^\/api\/admin\/gbp\/?/, "").replace(/\/$/, "");
  if (request.method === "POST" && (!(await validMutation(request, env, session)) || !validOrigin(request, env))) return json({ ok: false, code: "request_rejected" }, 403);
  if (route === "sync" && request.method === "POST") return json(await syncGbp(env));
  if (request.method !== "GET") return json({ ok: false, code: "method_not_allowed" }, 405);
  const connection = await env.DB.prepare("SELECT project_id,account_name,location_name,location_title,location_maps_uri,status,last_sync_started_at,last_sync_succeeded_at,last_sync_failed_at,last_error_safe FROM gbp_connection WHERE id=1").first();
  const reviews = await env.DB.prepare("SELECT COUNT(*) AS total,ROUND(AVG(rating),1) AS average,MAX(fetched_at) AS last_sync FROM gbp_reviews WHERE available=1").first();
  const latest = await env.DB.prepare("SELECT reviewer_display_name,rating,comment,update_time FROM gbp_reviews WHERE available=1 ORDER BY COALESCE(update_time,create_time) DESC LIMIT 10").all();
  const metrics = await env.DB.prepare("SELECT metric_date,metric_name,metric_value FROM gbp_performance_daily ORDER BY metric_date DESC,metric_name LIMIT 400").all();
  const keywords = await env.DB.prepare("SELECT month,keyword,impressions,threshold FROM gbp_search_keywords_monthly ORDER BY month DESC,COALESCE(impressions,threshold) DESC LIMIT 300").all();
  return json({ configured: Boolean(env.GBP_GOOGLE_CLIENT_ID), connection, reviews: { ...reviews, latest: latest.results }, metrics: metrics.results, keywords: keywords.results, retentionDays: 30 });
}
