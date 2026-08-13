const DAY_SECONDS = 86_400;
const VIETNAM_OFFSET_SECONDS = 7 * 3_600;

type Env = {
  DB: D1Database;
  GBP_SYNC_URL?: string;
  GBP_CRON_SECRET?: string;
};

export function previousVietnamDay(nowMs: number) {
  const nowSeconds = Math.floor(nowMs / 1_000);
  const localDay = Math.floor((nowSeconds + VIETNAM_OFFSET_SECONDS) / DAY_SECONDS);
  const targetDay = localDay - 1;
  const start = targetDay * DAY_SECONDS - VIETNAM_OFFSET_SECONDS;
  const end = start + DAY_SECONDS;
  const date = new Date(targetDay * DAY_SECONDS * 1_000).toISOString().slice(0, 10);
  return { date, start, end };
}

export function retentionCutoffs(nowMs: number) {
  const now = Math.floor(nowMs / 1_000);
  const local = new Date(nowMs + VIETNAM_OFFSET_SECONDS * 1_000);
  const aggregateCutoff = new Date(Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth() - 25,
    local.getUTCDate(),
  )).toISOString().slice(0, 10);
  return {
    now,
    raw: now - 90 * DAY_SECONDS,
    test: now - 7 * DAY_SECONDS,
    aggregateCutoff,
  };
}

const aggregateMetrics = [
  {
    name: "visitors",
    expression: "COUNT(DISTINCT visitor_id)",
    predicate: "1=1",
  },
  {
    name: "sessions",
    expression: "COUNT(DISTINCT session_id)",
    predicate: "1=1",
  },
  {
    name: "page_views",
    expression: "COUNT(*)",
    predicate: "event_name='page_view'",
  },
  {
    name: "lead_sessions",
    expression: "COUNT(DISTINCT session_id)",
    predicate: "event_name IN ('click_phone','click_zalo','click_email','click_quote','form_submit')",
  },
  {
    name: "click_phone",
    expression: "COUNT(*)",
    predicate: "event_name='click_phone'",
  },
  {
    name: "click_zalo",
    expression: "COUNT(*)",
    predicate: "event_name='click_zalo'",
  },
] as const;

export async function runMaintenance(db: D1Database, nowMs: number) {
  const day = previousVietnamDay(nowMs);
  const cutoffs = retentionCutoffs(nowMs);
  const aggregateStatements = aggregateMetrics.map((metric) => db.prepare(`
    INSERT INTO analytics_daily_aggregates (
      date, timezone, metric_name, dimension_key, dimension_value, metric_value, updated_at
    )
    SELECT ?1, 'Asia/Ho_Chi_Minh', ?2, '', '', ${metric.expression}, ?3
    FROM analytics_events
    WHERE is_test=0 AND occurred_at>=?4 AND occurred_at<?5 AND ${metric.predicate}
    ON CONFLICT(date,timezone,metric_name,dimension_key,dimension_value)
    DO UPDATE SET metric_value=excluded.metric_value, updated_at=excluded.updated_at
  `).bind(day.date, metric.name, cutoffs.now, day.start, day.end));

  const results = await db.batch([
    ...aggregateStatements,
    db.prepare(
      "DELETE FROM analytics_events WHERE (is_test=1 AND occurred_at<?1) OR (is_test=0 AND occurred_at<?2)",
    ).bind(cutoffs.test, cutoffs.raw),
    db.prepare(`
      DELETE FROM analytics_sessions
      WHERE last_activity_at<?1
        AND NOT EXISTS (
          SELECT 1 FROM analytics_events e WHERE e.session_id=analytics_sessions.session_id
        )
    `).bind(cutoffs.raw),
    db.prepare(`
      DELETE FROM analytics_visitors
      WHERE NOT EXISTS (
        SELECT 1 FROM analytics_sessions s WHERE s.visitor_id=analytics_visitors.visitor_id
      )
    `),
    db.prepare("DELETE FROM analytics_search_console_cache WHERE expires_at<?1").bind(cutoffs.now),
    db.prepare("DELETE FROM analytics_daily_aggregates WHERE date<?1").bind(cutoffs.aggregateCutoff),
    db.prepare("DELETE FROM rate_limits WHERE expires_at<?1").bind(cutoffs.now),
  ]);

  return {
    date: day.date,
    statements: results.length,
    rowsWritten: results.reduce((sum, result) => sum + (result.meta?.rows_written || 0), 0),
  };
}

export async function runGbpSync(env: Env) {
  if (!env.GBP_SYNC_URL || !env.GBP_CRON_SECRET) return { status: "not_configured" };
  const response = await fetch(env.GBP_SYNC_URL, { method: "POST", headers: { Authorization: `Bearer ${env.GBP_CRON_SECRET}` } });
  if (!response.ok) throw new Error(`gbp_sync_${response.status}`);
  return { status: "ok" };
}

export default {
  async scheduled(controller: ScheduledController, env: Env) {
    const [result, gbp] = await Promise.all([runMaintenance(env.DB, controller.scheduledTime), runGbpSync(env)]);
    console.log(JSON.stringify({
      message: "analytics_maintenance_complete",
      date: result.date,
      statements: result.statements,
      rowsWritten: result.rowsWritten,
      gbp: gbp.status,
    }));
  },
  fetch() {
    return new Response("Not found", {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  },
} satisfies ExportedHandler<Env>;
