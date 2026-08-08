PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super-admin', 'admin', 'editor')),
  password_hash TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  session_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER
);
CREATE INDEX IF NOT EXISTS sessions_user_expiry_idx ON sessions(user_id, expires_at);

CREATE TABLE IF NOT EXISTS login_attempts (
  client_key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  window_started_at INTEGER NOT NULL,
  blocked_until INTEGER
);

CREATE TABLE IF NOT EXISTS content_records (
  id TEXT PRIMARY KEY,
  collection TEXT NOT NULL CHECK (collection IN ('products', 'articles', 'projects', 'pages')),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  excerpt TEXT NOT NULL DEFAULT '',
  featured_image TEXT NOT NULL DEFAULT '',
  content_json TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL REFERENCES users(id),
  updated_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT,
  deleted_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS content_collection_slug_active_idx
  ON content_records(collection, slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS content_list_idx
  ON content_records(collection, deleted_at, updated_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS content_public_idx
  ON content_records(status, deleted_at, collection, slug);

CREATE TABLE IF NOT EXISTS settings_records (
  key TEXT PRIMARY KEY CHECK (key IN ('business-settings', 'seo-defaults', 'static-pages', 'material-categories', 'brands')),
  content_json TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_by TEXT NOT NULL REFERENCES users(id),
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  state TEXT NOT NULL CHECK (state IN ('pending', 'ready', 'deleted')),
  filename TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  thumbnail_key TEXT,
  mime_type TEXT NOT NULL,
  declared_size INTEGER NOT NULL,
  actual_size INTEGER,
  sha256 TEXT,
  alt TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  width INTEGER,
  height INTEGER,
  uploaded_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  ready_at TEXT,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS media_state_created_idx ON media(state, created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS versions (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL CHECK (scope IN ('content', 'setting')),
  collection_key TEXT NOT NULL,
  record_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  snapshot_json TEXT NOT NULL,
  actor_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  UNIQUE(scope, record_id, version)
);
CREATE INDEX IF NOT EXISTS versions_record_idx ON versions(scope, record_id, version DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  collection_key TEXT NOT NULL,
  record_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS audit_created_idx ON audit_logs(created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS preview_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  record_id TEXT NOT NULL,
  record_version INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER
);
