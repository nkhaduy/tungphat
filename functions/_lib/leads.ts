import { leadPayloadSchema } from "../../lib/lead-schema";
import { isSameOrigin, json } from "./http";
import { verifyTurnstile } from "./turnstile";

type LeadType = "contact" | "quote";

async function hashRateKey(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash)).slice(0, 16).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function checkRateLimit(db: D1Database, request: Request, type: LeadType) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + 600;
  const key = await hashRateKey(`${ip}:${type}:${new Date().toISOString().slice(0, 10)}`);
  await db.prepare(`
    INSERT INTO rate_limits (bucket_key, hits, expires_at) VALUES (?1, 1, ?2)
    ON CONFLICT(bucket_key) DO UPDATE SET
      hits = CASE WHEN expires_at <= ?3 THEN 1 ELSE hits + 1 END,
      expires_at = CASE WHEN expires_at <= ?3 THEN ?2 ELSE expires_at END
  `).bind(key, expiresAt, now).run();
  const row = await db.prepare("SELECT hits FROM rate_limits WHERE bucket_key = ?1").bind(key).first<{ hits: number }>();
  return { allowed: Boolean(row && row.hits <= 5), ip, now };
}

function safeSourceUrl(raw: string, requestOrigin: string) {
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return url.origin === requestOrigin ? `${url.pathname}${url.search}`.slice(0, 500) : "";
  } catch { return ""; }
}

function safeReferrer(raw: string) {
  if (!raw) return "";
  try { return new URL(raw).hostname.slice(0, 255); } catch { return ""; }
}

function errorCode(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function handleLead(context: EventContext<CloudflareEnv, string, unknown>, type: LeadType) {
  const { request, env } = context;
  const requestId = crypto.randomUUID();
  if (request.method !== "POST") return json({ ok: false, code: "method_not_allowed" }, 405, { Allow: "POST" });
  if (!isSameOrigin(request)) return json({ ok: false, code: "origin_rejected" }, 403);
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > 20_000) return json({ ok: false, code: "payload_too_large" }, 413);

  try {
    const raw = await request.text();
    if (raw.length > 20_000) return json({ ok: false, code: "payload_too_large" }, 413);
    let untrusted: unknown;
    try { untrusted = JSON.parse(raw); } catch { return json({ ok: false, code: "invalid_json" }, 400); }
    const parsed = leadPayloadSchema.safeParse(untrusted);
    if (!parsed.success) return json({ ok: false, code: "validation_failed", fields: parsed.error.issues.map((issue) => issue.path[0]).filter(Boolean) }, 400);
    if (parsed.data.website) return json({ ok: true, id: requestId }, 202);

    const rate = await checkRateLimit(env.DB, request, type);
    if (!rate.allowed) return json({ ok: false, code: "rate_limited" }, 429, { "Retry-After": "600" });

    const hostname = new URL(request.url).hostname;
    const challenge = await verifyTurnstile(parsed.data.turnstile_token, env.TURNSTILE_SECRET_KEY, rate.ip, hostname, env.TURNSTILE_TEST_MODE === "1");
    if (!challenge.ok) return json({ ok: false, code: challenge.reason === "unavailable" ? "verification_unavailable" : "verification_failed" }, challenge.reason === "unavailable" ? 503 : 400);

    const now = new Date().toISOString();
    const origin = new URL(request.url).origin;
    const data = parsed.data;
    try {
      await env.DB.prepare(`
        INSERT INTO leads (
          id, submission_key, type, full_name, phone, email, company, city, material, thickness,
          quantity, cnc_requirement, message, source_url, referrer, utm_source, utm_medium,
          utm_campaign, status, consent_at, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, 'new', ?19, ?20, ?20)
      `).bind(
        requestId, data.submission_id, type, data.full_name, data.phone, data.email || null,
        data.company || null, data.city || null, data.material || null, data.thickness || null,
        data.quantity || null, data.cnc_requirement || null, data.message || null,
        safeSourceUrl(data.source_url, origin) || null, safeReferrer(data.referrer) || null,
        data.utm_source || null, data.utm_medium || null, data.utm_campaign || null, now, now
      ).run();
    } catch (error) {
      if (errorCode(error).includes("UNIQUE")) return json({ ok: true, id: data.submission_id, duplicate: true }, 200);
      throw error;
    }
    context.waitUntil(env.DB.prepare("DELETE FROM rate_limits WHERE expires_at < ?1").bind(rate.now - 86400).run());
    console.log(JSON.stringify({ message: "lead_saved", requestId, type, path: new URL(request.url).pathname }));
    return json({ ok: true, id: requestId }, 201);
  } catch (error) {
    console.error(JSON.stringify({ message: "lead_request_failed", requestId, type, error: errorCode(error).slice(0, 160) }));
    return json({ ok: false, code: "internal_error" }, 500);
  }
}
