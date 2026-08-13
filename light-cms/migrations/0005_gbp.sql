CREATE TABLE IF NOT EXISTS gbp_connection (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  project_id TEXT NOT NULL,
  account_name TEXT,
  location_name TEXT,
  location_title TEXT,
  location_maps_uri TEXT,
  location_place_id TEXT,
  access_token_ciphertext TEXT,
  refresh_token_ciphertext TEXT,
  token_expires_at INTEGER,
  scope TEXT,
  status TEXT NOT NULL DEFAULT 'not_configured',
  last_sync_started_at INTEGER,
  last_sync_succeeded_at INTEGER,
  last_sync_failed_at INTEGER,
  last_error_safe TEXT,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS gbp_reviews (
  review_id TEXT PRIMARY KEY,
  location_name TEXT NOT NULL,
  reviewer_display_name TEXT NOT NULL,
  reviewer_photo_url TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  create_time TEXT,
  update_time TEXT,
  owner_reply TEXT,
  owner_reply_update_time TEXT,
  available INTEGER NOT NULL DEFAULT 1,
  fetched_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_gbp_reviews_location_available ON gbp_reviews(location_name, available, update_time DESC);
CREATE INDEX IF NOT EXISTS idx_gbp_reviews_expires_at ON gbp_reviews(expires_at);

CREATE TABLE IF NOT EXISTS gbp_performance_daily (
  location_name TEXT NOT NULL,
  metric_date TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value INTEGER NOT NULL,
  fetched_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  PRIMARY KEY (location_name, metric_date, metric_name)
);
CREATE INDEX IF NOT EXISTS idx_gbp_performance_expiry ON gbp_performance_daily(expires_at);

CREATE TABLE IF NOT EXISTS gbp_search_keywords_monthly (
  location_name TEXT NOT NULL,
  month TEXT NOT NULL,
  keyword TEXT NOT NULL,
  impressions INTEGER,
  threshold INTEGER,
  fetched_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  PRIMARY KEY (location_name, month, keyword)
);
CREATE INDEX IF NOT EXISTS idx_gbp_keywords_expiry ON gbp_search_keywords_monthly(expires_at);
