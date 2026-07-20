import { readBoundedText } from "../leads/handler";
import { allowedOrigin, preflight } from "../leads/http";
import type { AnalyticsEnv } from "./types";
import { analyticsPayloadSchema, attribution, isBot, parseDevice, sanitizePath } from "./validation";

const MAX_BODY_BYTES = 8_192;

function headers(origin?: string | null, extra: HeadersInit = {}) {
  return {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex, nofollow",
    ...(origin ? {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
      Vary: "Origin",
    } : {}),
    ...extra,
  };
}

async function shortHash(value: string, salt: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${value}`));
  return Array.from(new Uint8Array(digest)).slice(0, 16).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function rateAllowed(db: D1Database, request: Request, salt: string, now: number) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const tenMinuteBucket = Math.floor(now / 600);
  const key = await shortHash(`analytics:${ip}:${tenMinuteBucket}`, salt);
  const expires = now + 720;
  await db.prepare(`
    INSERT INTO rate_limits (bucket_key, hits, expires_at) VALUES (?1, 1, ?2)
    ON CONFLICT(bucket_key) DO UPDATE SET hits = hits + 1, expires_at = ?2
  `).bind(key, expires).run();
  const row = await db.prepare("SELECT hits FROM rate_limits WHERE bucket_key = ?1").bind(key).first<{ hits: number }>();
  return Boolean(row && row.hits <= 180);
}

function safeError(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 120) : "unknown_error";
}

export async function handleAnalyticsTrack(context: EventContext<AnalyticsEnv, string, unknown>) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return preflight(request, env);
  if (request.method !== "POST") return new Response(null, { status: 405, headers: headers(null, { Allow: "POST, OPTIONS" }) });
  const origin = allowedOrigin(request, env);
  if (!origin) return new Response(null, { status: 403, headers: headers() });
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
    return new Response(null, { status: 415, headers: headers(origin) });
  }
  if (Number(request.headers.get("Content-Length") || 0) > MAX_BODY_BYTES) {
    return new Response(null, { status: 413, headers: headers(origin) });
  }
  const userAgent = request.headers.get("User-Agent") || "";
  if (isBot(userAgent)) return new Response(null, { status: 204, headers: headers(origin) });

  try {
    const bounded = await readBoundedText(request, MAX_BODY_BYTES);
    if (bounded.tooLarge) return new Response(null, { status: 413, headers: headers(origin) });
    let json: unknown;
    try { json = JSON.parse(bounded.text); } catch { return new Response(null, { status: 400, headers: headers(origin) }); }
    const parsed = analyticsPayloadSchema.safeParse(json);
    if (!parsed.success) return new Response(null, { status: 400, headers: headers(origin) });
    const data = parsed.data;
    const path = sanitizePath(data.path);
    if (path.startsWith("/admin") || path.startsWith("/analytics") || path.includes("/preview")) {
      return new Response(null, { status: 204, headers: headers(origin) });
    }

    const now = Math.floor(Date.now() / 1000);
    const salt = env.ANALYTICS_HASH_SALT || env.IP_HASH_SALT;
    if (!salt || salt.length < 32) {
      console.error(JSON.stringify({ message: "analytics_config_invalid", hasRateLimitSalt: Boolean(salt) }));
      return new Response(null, { status: 503, headers: headers(origin) });
    }
    if (!(await rateAllowed(env.DB, request, salt, now))) {
      return new Response(null, { status: 429, headers: headers(origin, { "Retry-After": "600" }) });
    }
    const existingSession = await env.DB.prepare(
      "SELECT visitor_id FROM analytics_sessions WHERE session_id = ?1",
    ).bind(data.session_id).first<{ visitor_id: string }>();
    if (existingSession && existingSession.visitor_id !== data.visitor_id) {
      return new Response(null, { status: 409, headers: headers(origin) });
    }

    const occurredAt = Math.abs(data.occurred_at - now) <= 600 ? data.occurred_at : now;
    const attr = attribution(data.attribution);
    const device = parseDevice(userAgent);
    const cf = request.cf as { country?: string; regionCode?: string } | undefined;
    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO analytics_visitors (visitor_id, first_seen_at, last_seen_at, created_at, updated_at)
        VALUES (?1, ?2, ?2, ?2, ?2)
        ON CONFLICT(visitor_id) DO UPDATE SET last_seen_at=?2, updated_at=?2
      `).bind(data.visitor_id, occurredAt),
      env.DB.prepare(`
        INSERT INTO analytics_sessions (
          session_id, visitor_id, started_at, last_activity_at, landing_path, landing_title,
          referrer_host, source, medium, campaign, term, content, device_category,
          browser_family, os_family, country_code, region_code, consent_status, is_bot,
          created_at, updated_at
        ) VALUES (?1,?2,?3,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,'implicit',0,?3,?3)
        ON CONFLICT(session_id) DO UPDATE SET
          last_activity_at=MAX(last_activity_at,excluded.last_activity_at), updated_at=excluded.updated_at
      `).bind(
        data.session_id, data.visitor_id, occurredAt, path, data.page_title || null,
        data.attribution?.referrer_host || null, attr.source, attr.medium, attr.campaign,
        attr.term, attr.content, device.device, device.browser, device.os,
        cf?.country || null, cf?.regionCode || null,
      ),
      env.DB.prepare(`
        INSERT OR IGNORE INTO analytics_events (
          event_id, session_id, visitor_id, event_name, occurred_at, path, page_title,
          content_type, content_id, content_title, content_category, cta_location,
          target_type, scroll_percent, engagement_seconds, metadata_json, is_test, created_at
        ) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,NULL,0,?16)
      `).bind(
        data.event_id, data.session_id, data.visitor_id, data.event_name, occurredAt,
        path, data.page_title || null, data.content_type || null, data.content_id || null,
        data.content_title || null, data.content_category || null, data.cta_location || null,
        data.target_type || null, data.scroll_percent || null, data.engagement_seconds || null, now,
      ),
    ]);

    if (Math.random() < 0.005) {
      context.waitUntil(env.DB.prepare("DELETE FROM rate_limits WHERE expires_at < ?1").bind(now).run());
    }
    return new Response(null, { status: 204, headers: headers(origin) });
  } catch (error) {
    console.error(JSON.stringify({ message: "analytics_track_failed", error: safeError(error) }));
    return new Response(null, { status: 503, headers: headers(origin) });
  }
}
