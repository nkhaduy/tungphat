import { leadPayloadSchema } from "../../lib/lead-schema";
import { isSameOrigin, json } from "./http";
import { verifyTurnstile } from "./turnstile";

type LeadType = "contact" | "quote";
const MAX_BODY_BYTES = 20_000;

export async function readBoundedText(request: Request, maxBytes = MAX_BODY_BYTES) {
  if (!request.body) return { text: "", tooLarge: false } as const;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { text: "", tooLarge: true } as const;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { text: new TextDecoder().decode(bytes), tooLarge: false } as const;
}

async function hashPrivacyValue(value: string, salt: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${value}`));
  return Array.from(new Uint8Array(hash)).slice(0, 16).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function checkRateLimit(db: D1Database, request: Request, type: LeadType, salt: string) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + 600;
  const ipHash = await hashPrivacyValue(ip, salt);
  const key = await hashPrivacyValue(`${ipHash}:${type}`, salt);
  await db.prepare(`
    INSERT INTO rate_limits (bucket_key, hits, expires_at) VALUES (?1, 1, ?2)
    ON CONFLICT(bucket_key) DO UPDATE SET
      hits = CASE WHEN expires_at <= ?3 THEN 1 ELSE hits + 1 END,
      expires_at = CASE WHEN expires_at <= ?3 THEN ?2 ELSE expires_at END
  `).bind(key, expiresAt, now).run();
  const row = await db.prepare("SELECT hits FROM rate_limits WHERE bucket_key = ?1").bind(key).first<{ hits: number }>();
  return { allowed: Boolean(row && row.hits <= 5), remoteIp: ip, ipHash, now };
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
  if (contentLength > MAX_BODY_BYTES) return json({ ok: false, code: "payload_too_large" }, 413);

  try {
    const body = await readBoundedText(request);
    if (body.tooLarge) return json({ ok: false, code: "payload_too_large" }, 413);
    let untrusted: unknown;
    try { untrusted = JSON.parse(body.text); } catch { return json({ ok: false, code: "invalid_json" }, 400); }
    const parsed = leadPayloadSchema.safeParse(untrusted);
    if (!parsed.success) return json({ ok: false, code: "validation_failed", fields: parsed.error.issues.map((issue) => issue.path[0]).filter(Boolean) }, 400);
    if (parsed.data.website) return json({ ok: true, id: requestId }, 202);
    if (type === "quote" && !parsed.data.material) {
      return json({ ok: false, code: "validation_failed", fields: ["material"] }, 400);
    }
    if (type === "contact" && !parsed.data.message) {
      return json({ ok: false, code: "validation_failed", fields: ["message"] }, 400);
    }

    if (!env.IP_HASH_SALT || env.IP_HASH_SALT.length < 32) {
      console.error(JSON.stringify({ message: "lead_config_invalid", requestId, type }));
      return json({ ok: false, code: "service_unavailable" }, 503);
    }
    const rate = await checkRateLimit(env.DB, request, type, env.IP_HASH_SALT);
    if (!rate.allowed) return json({ ok: false, code: "rate_limited" }, 429, { "Retry-After": "600" });

    const hostname = new URL(request.url).hostname;
    const challenge = await verifyTurnstile(parsed.data.turnstile_token, env.TURNSTILE_SECRET_KEY, rate.remoteIp, hostname);
    if (!challenge.ok) {
      const unavailable = challenge.reason === "unavailable" || challenge.reason === "upstream";
      return json({ ok: false, code: unavailable ? "verification_unavailable" : "verification_failed" }, unavailable ? 503 : 400);
    }

    const now = new Date().toISOString();
    const origin = new URL(request.url).origin;
    const data = parsed.data;
    try {
      await env.DB.prepare(`
        INSERT INTO leads (
          id, submission_key, type, full_name, phone, email, company, city, product, material,
          thickness, dimensions, quantity, cnc_requirement, message, source_url, referrer,
          utm_source, utm_medium, utm_campaign, status, consent_at, ip_hash, user_agent,
          created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, 'new', ?21, ?22, ?23, ?24, ?24)
      `).bind(
        requestId, data.submission_id, type, data.full_name, data.phone, data.email || null,
        data.company || null, data.city || null, data.product || null, data.material || null,
        data.thickness || null, data.dimensions || null, data.quantity || null,
        data.cnc_requirement || null, data.message || null,
        safeSourceUrl(data.source_url, origin) || null, safeReferrer(data.referrer) || null,
        data.utm_source || null, data.utm_medium || null, data.utm_campaign || null, now,
        rate.ipHash, (request.headers.get("User-Agent") || "").slice(0, 500) || null, now
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
