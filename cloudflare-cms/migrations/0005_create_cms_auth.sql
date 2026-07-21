CREATE TABLE IF NOT EXISTS cms_sessions (
  session_hash TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  csrf_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cms_sessions_expires_at ON cms_sessions(expires_at);

CREATE TABLE IF NOT EXISTS cms_login_attempts (
  client_hash TEXT PRIMARY KEY,
  failure_count INTEGER NOT NULL,
  window_started_at INTEGER NOT NULL,
  locked_until INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cms_login_attempts_updated_at ON cms_login_attempts(updated_at);
