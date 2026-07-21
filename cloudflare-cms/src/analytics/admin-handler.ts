import { validMutation, verifySession } from "../auth/session";
import { ga4Realtime, googleConfigured, searchConsoleRows } from "./google";
import type { AnalyticsEnv } from "./types";

const LEAD_EVENTS = "'click_phone','click_zalo','click_email','click_quote','form_submit'";
const TIMEZONE = "Asia/Ho_Chi_Minh";

type DateRange = {
  from: string;
  to: string;
  start: number;
  end: number;
  previousStart: number;
  previousEnd: number;
};

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "Referrer-Policy": "no-referrer",
    },
  });
}

export function dateInVietnam(timestamp = Date.now(), offsetDays = 0) {
  const now = new Date(timestamp + 7 * 3600_000 + offsetDays * 86400_000);
  return now.toISOString().slice(0, 10);
}

export function dateRange(url: URL): DateRange | null {
  const from = url.searchParams.get("from") || dateInVietnam();
  const to = url.searchParams.get("to") || from;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) return null;
  const start = Math.floor(Date.parse(`${from}T00:00:00+07:00`) / 1000);
  const end = Math.floor(Date.parse(`${to}T00:00:00+07:00`) / 1000) + 86400;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end - start > 400 * 86400) return null;
  const duration = end - start;
  return { from, to, start, end, previousStart: start - duration, previousEnd: start };
}

function metricDelta(current: number, previous: number) {
  return previous === 0 ? (current === 0 ? 0 : 100) : ((current - previous) / previous) * 100;
}

async function metrics(db: D1Database, start: number, end: number) {
  const row = await db.prepare(`
    SELECT
      COUNT(DISTINCT visitor_id) AS visitors,
      COUNT(DISTINCT session_id) AS sessions,
      SUM(CASE WHEN event_name='page_view' THEN 1 ELSE 0 END) AS pageviews,
      SUM(CASE WHEN event_name='click_zalo' THEN 1 ELSE 0 END) AS zalo,
      SUM(CASE WHEN event_name='click_maps' THEN 1 ELSE 0 END) AS maps,
      SUM(CASE WHEN event_name='click_phone' THEN 1 ELSE 0 END) AS phone,
      COUNT(DISTINCT CASE WHEN event_name IN (${LEAD_EVENTS}) THEN session_id END) AS leads
    FROM analytics_events
    WHERE occurred_at >= ?1 AND occurred_at < ?2 AND is_test=0
  `).bind(start, end).first<Record<string, number>>();
  const sessions = Number(row?.sessions || 0);
  const leads = Number(row?.leads || 0);
  return {
    visitors: Number(row?.visitors || 0),
    sessions,
    pageviews: Number(row?.pageviews || 0),
    zalo: Number(row?.zalo || 0),
    maps: Number(row?.maps || 0),
    phone: Number(row?.phone || 0),
    leads,
    conversionRate: sessions ? leads / sessions : 0,
  };
}

async function overview(env: AnalyticsEnv, range: DateRange) {
  const [current, previous, active] = await Promise.all([
    metrics(env.DB, range.start, range.end),
    metrics(env.DB, range.previousStart, range.previousEnd),
    env.DB.prepare("SELECT COUNT(*) AS value FROM analytics_sessions WHERE last_activity_at >= ?1 AND is_bot=0")
      .bind(Math.floor(Date.now() / 1000) - 1800).first<{ value: number }>(),
  ]);
  return {
    range: { from: range.from, to: range.to, timezone: TIMEZONE },
    metrics: {
      ...current,
      active: Number(active?.value || 0),
    },
    comparison: Object.fromEntries(
      Object.keys(current).map((key) => [
        key,
        metricDelta(current[key as keyof typeof current], previous[key as keyof typeof previous]),
      ]),
    ),
    activeDefinition: "Hoạt động trong 30 phút gần nhất",
    updatedAt: Math.floor(Date.now() / 1000),
  };
}

async function timeseries(env: AnalyticsEnv, range: DateRange) {
  const hourly = range.from === range.to;
  const bucket = hourly
    ? "strftime('%H:00', occurred_at, 'unixepoch', '+7 hours')"
    : "strftime('%Y-%m-%d', occurred_at, 'unixepoch', '+7 hours')";
  const result = await env.DB.prepare(`
    SELECT ${bucket} AS bucket,
      SUM(CASE WHEN event_name='page_view' THEN 1 ELSE 0 END) AS pageviews,
      COUNT(DISTINCT session_id) AS sessions,
      SUM(CASE WHEN event_name='click_zalo' THEN 1 ELSE 0 END) AS zalo,
      SUM(CASE WHEN event_name='click_phone' THEN 1 ELSE 0 END) AS phone
    FROM analytics_events
    WHERE occurred_at>=?1 AND occurred_at<?2 AND is_test=0
    GROUP BY bucket ORDER BY bucket
  `).bind(range.start, range.end).all();
  return { granularity: hourly ? "hour" : "day", rows: result.results };
}

async function sources(env: AnalyticsEnv, range: DateRange) {
  const result = await env.DB.prepare(`
    SELECT COALESCE(s.source,'direct') AS source, COALESCE(s.medium,'none') AS medium,
      COUNT(DISTINCT e.visitor_id) AS visitors, COUNT(DISTINCT e.session_id) AS sessions,
      SUM(CASE WHEN e.event_name='page_view' THEN 1 ELSE 0 END) AS pageviews,
      COUNT(DISTINCT CASE WHEN e.event_name IN ('article_engaged','engagement_time') THEN e.session_id END) AS engaged_sessions,
      SUM(CASE WHEN e.event_name='click_zalo' THEN 1 ELSE 0 END) AS zalo,
      SUM(CASE WHEN e.event_name='click_maps' THEN 1 ELSE 0 END) AS maps,
      SUM(CASE WHEN e.event_name='click_phone' THEN 1 ELSE 0 END) AS phone,
      COUNT(DISTINCT CASE WHEN e.event_name IN (${LEAD_EVENTS}) THEN e.session_id END) AS leads
    FROM analytics_events e JOIN analytics_sessions s ON s.session_id=e.session_id
    WHERE e.occurred_at>=?1 AND e.occurred_at<?2 AND e.is_test=0
    GROUP BY s.source,s.medium ORDER BY sessions DESC LIMIT 100
  `).bind(range.start, range.end).all();
  return { rows: result.results };
}

async function landingPages(env: AnalyticsEnv, range: DateRange) {
  const result = await env.DB.prepare(`
    SELECT s.landing_path AS path, MAX(s.landing_title) AS title,
      COUNT(DISTINCT e.session_id) AS sessions,
      COUNT(DISTINCT CASE WHEN e.event_name IN (${LEAD_EVENTS}) THEN e.session_id END) AS leads,
      SUM(CASE WHEN e.event_name='click_zalo' THEN 1 ELSE 0 END) AS zalo,
      SUM(CASE WHEN e.event_name='click_phone' THEN 1 ELSE 0 END) AS phone
    FROM analytics_sessions s JOIN analytics_events e ON e.session_id=s.session_id
    WHERE e.occurred_at>=?1 AND e.occurred_at<?2 AND e.is_test=0
    GROUP BY s.landing_path ORDER BY sessions DESC LIMIT 100
  `).bind(range.start, range.end).all();
  return { rows: result.results };
}

async function content(env: AnalyticsEnv, range: DateRange) {
  const result = await env.DB.prepare(`
    SELECT v.content_id, MAX(v.content_title) AS title, MAX(v.content_type) AS type,
      MAX(v.content_category) AS category, COUNT(DISTINCT v.event_id) AS views,
      COUNT(DISTINCT v.session_id) AS readers,
      COUNT(DISTINCT CASE WHEN g.event_name='article_engaged' THEN g.session_id END) AS engaged,
      COUNT(DISTINCT CASE WHEN g.event_name='scroll_depth' AND g.scroll_percent>=90 THEN g.session_id END) AS near_complete,
      ROUND(AVG(CASE WHEN g.event_name='engagement_time' THEN g.engagement_seconds END),1) AS avg_engagement_seconds,
      COUNT(DISTINCT CASE WHEN c.event_name='click_zalo' THEN c.session_id END) AS assisted_zalo,
      COUNT(DISTINCT CASE WHEN c.event_name='click_phone' THEN c.session_id END) AS assisted_phone,
      COUNT(DISTINCT c.session_id) AS assisted_conversions
    FROM analytics_events v
    LEFT JOIN analytics_events g ON g.session_id=v.session_id AND g.content_id=v.content_id
      AND g.occurred_at>=v.occurred_at AND g.is_test=0
    LEFT JOIN analytics_events c ON c.session_id=v.session_id AND c.event_name IN (${LEAD_EVENTS})
      AND c.occurred_at>v.occurred_at AND c.is_test=0
    WHERE v.event_name IN ('article_view','product_view') AND v.occurred_at>=?1
      AND v.occurred_at<?2 AND v.is_test=0
    GROUP BY v.content_id ORDER BY views DESC LIMIT 200
  `).bind(range.start, range.end).all();
  return { rows: result.results, assistedDefinition: "Nội dung được xem trước hành động liên hệ trong cùng phiên." };
}

async function contentDetail(env: AnalyticsEnv, range: DateRange, id: string) {
  const result = await env.DB.prepare(`
    SELECT event_name, scroll_percent, COUNT(*) AS events, COUNT(DISTINCT session_id) AS sessions,
      ROUND(AVG(engagement_seconds),1) AS avg_engagement_seconds
    FROM analytics_events WHERE content_id=?1 AND occurred_at>=?2 AND occurred_at<?3 AND is_test=0
    GROUP BY event_name,scroll_percent ORDER BY event_name,scroll_percent
  `).bind(id, range.start, range.end).all();
  return { contentId: id, rows: result.results };
}

async function conversions(env: AnalyticsEnv, range: DateRange) {
  const result = await env.DB.prepare(`
    SELECT event_name, COALESCE(cta_location,'unknown') AS cta_location, path,
      COUNT(*) AS events, COUNT(DISTINCT session_id) AS sessions, COUNT(DISTINCT visitor_id) AS visitors
    FROM analytics_events
    WHERE event_name IN (${LEAD_EVENTS},'click_maps','click_catalogue')
      AND occurred_at>=?1 AND occurred_at<?2 AND is_test=0
    GROUP BY event_name,cta_location,path ORDER BY events DESC LIMIT 250
  `).bind(range.start, range.end).all();
  return { rows: result.results };
}

function pagination(url: URL) {
  const page = Math.max(1, Math.min(10_000, Number(url.searchParams.get("page") || 1)));
  const pageSize = Math.max(10, Math.min(100, Number(url.searchParams.get("pageSize") || 25)));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

async function journeys(env: AnalyticsEnv, range: DateRange, url: URL) {
  const { page, pageSize, offset } = pagination(url);
  const converted = url.searchParams.get("converted") === "1";
  const source = (url.searchParams.get("source") || "").slice(0, 120);
  const result = await env.DB.prepare(`
    SELECT s.session_id,s.started_at,s.last_activity_at,s.source,s.medium,s.landing_path,
      s.device_category,COUNT(DISTINCT CASE WHEN e.event_name='page_view' THEN e.event_id END) AS pageviews,
      MAX(e.occurred_at) AS last_event_at,
      COUNT(DISTINCT CASE WHEN e.event_name IN (${LEAD_EVENTS}) THEN e.session_id END) AS converted
    FROM analytics_sessions s JOIN analytics_events e ON e.session_id=s.session_id
    WHERE e.occurred_at>=?1 AND e.occurred_at<?2 AND e.is_test=0
      AND (?3=0 OR EXISTS(SELECT 1 FROM analytics_events c WHERE c.session_id=s.session_id AND c.event_name IN (${LEAD_EVENTS}) AND c.is_test=0))
      AND (?4='' OR s.source=?4)
    GROUP BY s.session_id ORDER BY s.started_at DESC LIMIT ?5 OFFSET ?6
  `).bind(range.start, range.end, converted ? 1 : 0, source, pageSize, offset).all();
  return { page, pageSize, rows: result.results };
}

async function journeyDetail(env: AnalyticsEnv, sessionId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) return null;
  const session = await env.DB.prepare(`
    SELECT session_id,started_at,last_activity_at,landing_path,source,medium,campaign,
      device_category,browser_family,os_family,country_code,region_code
    FROM analytics_sessions WHERE session_id=?1 AND is_bot=0
  `).bind(sessionId).first();
  if (!session) return null;
  const events = await env.DB.prepare(`
    SELECT event_name,occurred_at,path,page_title,content_type,content_id,content_title,
      cta_location,target_type,scroll_percent,engagement_seconds
    FROM analytics_events WHERE session_id=?1 AND is_test=0 ORDER BY occurred_at,event_id LIMIT 500
  `).bind(sessionId).all();
  return { session, events: events.results };
}

async function searchConsole(env: AnalyticsEnv, range: DateRange, dimensions: string[]) {
  if (!googleConfigured(env) || !env.SEARCH_CONSOLE_SITE_URL) {
    return { status: "not_configured", rows: [], lastSync: null };
  }
  const key = `gsc:${range.from}:${range.to}:${dimensions.join(",")}`;
  const now = Math.floor(Date.now() / 1000);
  const cached = await env.DB.prepare(`
    SELECT payload_json,fetched_at FROM analytics_search_console_cache WHERE cache_key=?1 AND expires_at>?2
  `).bind(key, now).first<{ payload_json: string; fetched_at: number }>();
  if (cached) return { status: "connected", rows: JSON.parse(cached.payload_json), lastSync: cached.fetched_at, cached: true };
  await env.DB.prepare(`
    INSERT INTO analytics_sync_status(provider,status,last_started_at,updated_at)
    VALUES('search_console','syncing',?1,?1)
    ON CONFLICT(provider) DO UPDATE SET status='syncing',last_started_at=?1,updated_at=?1
  `).bind(now).run();
  try {
    const rows = await searchConsoleRows(env, range.from, range.to, dimensions);
    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO analytics_search_console_cache(cache_key,date_from,date_to,dimensions,payload_json,fetched_at,expires_at)
        VALUES(?1,?2,?3,?4,?5,?6,?7)
        ON CONFLICT(cache_key) DO UPDATE SET payload_json=?5,fetched_at=?6,expires_at=?7
      `).bind(key, range.from, range.to, dimensions.join(","), JSON.stringify(rows), now, now + 4 * 3600),
      env.DB.prepare(`
        INSERT INTO analytics_sync_status(provider,status,last_succeeded_at,last_error_safe,updated_at)
        VALUES('search_console','connected',?1,NULL,?1)
        ON CONFLICT(provider) DO UPDATE SET status='connected',last_succeeded_at=?1,last_error_safe=NULL,updated_at=?1
      `).bind(now),
    ]);
    return { status: "connected", rows, lastSync: now, cached: false };
  } catch (error) {
    const safe = error instanceof Error ? error.message.slice(0, 120) : "sync_failed";
    await env.DB.prepare(`
      INSERT INTO analytics_sync_status(provider,status,last_failed_at,last_error_safe,updated_at)
      VALUES('search_console','error',?1,?2,?1)
      ON CONFLICT(provider) DO UPDATE SET status='error',last_failed_at=?1,last_error_safe=?2,updated_at=?1
    `).bind(now, safe).run();
    return { status: "error", rows: [], lastSync: null, error: safe };
  }
}

async function status(env: AnalyticsEnv) {
  let database = "connected";
  let latestEvent: number | null = null;
  let ga4 = env.GA4_PROPERTY_ID && googleConfigured(env) ? "configured" : "not_configured";
  let ga4ActiveUsers: number | null = null;
  try {
    latestEvent = Number((await env.DB.prepare("SELECT MAX(occurred_at) AS value FROM analytics_events WHERE is_test=0").first<{ value: number }>())?.value || 0) || null;
  } catch { database = "error"; }
  const sync = await env.DB.prepare("SELECT provider,status,last_succeeded_at,last_error_safe FROM analytics_sync_status").all().catch(() => ({ results: [] }));
  if (ga4 === "configured") {
    try {
      ga4ActiveUsers = await ga4Realtime(env);
      ga4 = "connected";
    } catch {
      ga4 = "error";
    }
  }
  const searchConsoleSync = (sync.results as Array<{ provider?: string; status?: string }>).find((item) => item.provider === "search_console");
  return {
    firstParty: database === "connected" ? "connected" : "error",
    database,
    latestEvent,
    ga4,
    ga4ActiveUsers,
    searchConsole: searchConsoleSync?.status === "connected"
      ? "connected"
      : env.SEARCH_CONSOLE_SITE_URL && googleConfigured(env) ? "configured" : "not_configured",
    sync: sync.results,
    retention: { rawDays: 90, aggregateMonths: 25, testDays: 7 },
  };
}

async function testEvent(env: AnalyticsEnv) {
  const now = Math.floor(Date.now() / 1000);
  const visitor = crypto.randomUUID();
  const session = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO analytics_visitors VALUES(?1,?2,?2,?2,?2)").bind(visitor, now),
    env.DB.prepare(`
      INSERT INTO analytics_sessions(session_id,visitor_id,started_at,last_activity_at,landing_path,source,medium,device_category,consent_status,is_bot,created_at,updated_at)
      VALUES(?1,?2,?3,?3,'/analytics-test','admin_test','test','desktop','admin_test',0,?3,?3)
    `).bind(session, visitor, now),
    env.DB.prepare(`
      INSERT INTO analytics_events(event_id,session_id,visitor_id,event_name,occurred_at,path,page_title,metadata_json,is_test,created_at)
      VALUES(?1,?2,?3,'page_view',?4,'/analytics-test','Admin test event','{"test":true}',1,?4)
    `).bind(crypto.randomUUID(), session, visitor, now),
  ]);
  return { ok: true, markedAsTest: true };
}

async function refresh(env: AnalyticsEnv) {
  const now = Math.floor(Date.now() / 1000);
  const rawCutoff = now - 90 * 86400;
  const testCutoff = now - 7 * 86400;
  await env.DB.batch([
    env.DB.prepare("DELETE FROM analytics_events WHERE (is_test=1 AND occurred_at<?1) OR (is_test=0 AND occurred_at<?2)").bind(testCutoff, rawCutoff),
    env.DB.prepare("DELETE FROM analytics_sessions WHERE last_activity_at<?1 AND NOT EXISTS(SELECT 1 FROM analytics_events e WHERE e.session_id=analytics_sessions.session_id)").bind(rawCutoff),
    env.DB.prepare("DELETE FROM analytics_visitors WHERE NOT EXISTS(SELECT 1 FROM analytics_sessions s WHERE s.visitor_id=analytics_visitors.visitor_id)"),
    env.DB.prepare("DELETE FROM analytics_search_console_cache WHERE expires_at<?1").bind(now),
    env.DB.prepare("DELETE FROM rate_limits WHERE expires_at<?1").bind(now),
  ]);
  return { ok: true, refreshedAt: now };
}

function validAdminOrigin(request: Request, env: AnalyticsEnv) {
  const origin = request.headers.get("Origin");
  return Boolean(origin && (env.CMS_ALLOWED_ORIGINS || "").split(",").map((item) => item.trim()).includes(origin));
}

export async function handleAdminAnalytics(context: EventContext<AnalyticsEnv, string, unknown>) {
  const { request, env } = context;
  const session = await verifySession(request, env);
  if (!session) return json({ ok: false, code: "unauthorized" }, 401);
  const url = new URL(request.url);
  const route = url.pathname.replace(/^\/api\/admin\/analytics\/?/, "").replace(/\/$/, "");
  const range = dateRange(url);
  if (!range) return json({ ok: false, code: "invalid_date_range" }, 400);
  const isPost = request.method === "POST";
  if (isPost && (!(await validMutation(request, env, session)) || !validAdminOrigin(request, env))) {
    return json({ ok: false, code: "request_rejected" }, 403);
  }
  if (!["GET", "POST"].includes(request.method)) return json({ ok: false, code: "method_not_allowed" }, 405);

  try {
    if (!route || route === "overview") return json(await overview(env, range));
    if (route === "timeseries") return json(await timeseries(env, range));
    if (route === "sources") return json(await sources(env, range));
    if (route === "landing-pages") return json(await landingPages(env, range));
    if (route === "content") return json(await content(env, range));
    if (route.startsWith("content/")) return json(await contentDetail(env, range, decodeURIComponent(route.slice(8))));
    if (route === "conversions") return json(await conversions(env, range));
    if (route === "journeys") return json(await journeys(env, range, url));
    if (route.startsWith("journeys/")) {
      const result = await journeyDetail(env, route.slice(9));
      return result ? json(result) : json({ ok: false, code: "not_found" }, 404);
    }
    if (route === "search-console" || route === "search-console/queries") {
      return json(await searchConsole(env, range, ["query"]));
    }
    if (route === "search-console/pages") return json(await searchConsole(env, range, ["page"]));
    if (route === "search-console/query-pages") return json(await searchConsole(env, range, ["query", "page"]));
    if (route === "realtime") {
      if (!env.GA4_PROPERTY_ID || !googleConfigured(env)) return json({ status: "not_configured", activeUsers: null });
      try { return json({ status: "connected", activeUsers: await ga4Realtime(env) }); }
      catch (error) { return json({ status: "error", activeUsers: null, error: error instanceof Error ? error.message.slice(0, 120) : "ga4_error" }); }
    }
    if (route === "status") return json(await status(env));
    if (route === "test-event" && isPost) return json(await testEvent(env), 201);
    if (route === "refresh" && isPost) return json(await refresh(env));
    return json({ ok: false, code: "not_found" }, 404);
  } catch (error) {
    console.error(JSON.stringify({ message: "admin_analytics_failed", route, error: error instanceof Error ? error.message.slice(0, 120) : "unknown" }));
    return json({ ok: false, code: "analytics_unavailable" }, 503);
  }
}
