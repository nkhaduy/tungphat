-- Anonymous business analytics. No raw IP, full user-agent or fingerprint data.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS analytics_visitors (
  visitor_id TEXT PRIMARY KEY,
  first_seen_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS analytics_sessions (
  session_id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  last_activity_at INTEGER NOT NULL,
  ended_at INTEGER,
  landing_path TEXT NOT NULL,
  landing_title TEXT,
  referrer_host TEXT,
  source TEXT,
  medium TEXT,
  campaign TEXT,
  term TEXT,
  content TEXT,
  device_category TEXT,
  browser_family TEXT,
  os_family TEXT,
  country_code TEXT,
  region_code TEXT,
  consent_status TEXT,
  is_bot INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(visitor_id) REFERENCES analytics_visitors(visitor_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS analytics_events (
  event_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  event_name TEXT NOT NULL CHECK(event_name IN (
    'page_view','article_view','article_engaged','product_view','scroll_depth',
    'engagement_time','click_phone','click_zalo','click_email','click_maps',
    'click_catalogue','click_quote','form_start','form_submit'
  )),
  occurred_at INTEGER NOT NULL,
  path TEXT NOT NULL,
  page_title TEXT,
  content_type TEXT,
  content_id TEXT,
  content_title TEXT,
  content_category TEXT,
  cta_location TEXT,
  target_type TEXT,
  scroll_percent INTEGER,
  engagement_seconds INTEGER,
  metadata_json TEXT,
  is_test INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(session_id) REFERENCES analytics_sessions(session_id) ON DELETE CASCADE,
  FOREIGN KEY(visitor_id) REFERENCES analytics_visitors(visitor_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS analytics_daily_aggregates (
  date TEXT NOT NULL,
  timezone TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  dimension_key TEXT NOT NULL DEFAULT '',
  dimension_value TEXT NOT NULL DEFAULT '',
  metric_value REAL NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(date, timezone, metric_name, dimension_key, dimension_value)
);

CREATE TABLE IF NOT EXISTS analytics_search_console_cache (
  cache_key TEXT PRIMARY KEY,
  date_from TEXT NOT NULL,
  date_to TEXT NOT NULL,
  dimensions TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  fetched_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS analytics_sync_status (
  provider TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  last_started_at INTEGER,
  last_succeeded_at INTEGER,
  last_failed_at INTEGER,
  last_error_safe TEXT,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_visitor ON analytics_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_started ON analytics_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_activity ON analytics_sessions(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_source ON analytics_sessions(source);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_medium ON analytics_sessions(medium);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_landing ON analytics_sessions(landing_path);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor ON analytics_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_occurred ON analytics_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_path ON analytics_events(path);
CREATE INDEX IF NOT EXISTS idx_analytics_events_content ON analytics_events(content_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_cta ON analytics_events(cta_location);
CREATE INDEX IF NOT EXISTS idx_analytics_events_reporting ON analytics_events(is_test, occurred_at, event_name);
