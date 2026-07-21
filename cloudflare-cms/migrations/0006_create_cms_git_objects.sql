CREATE TABLE IF NOT EXISTS cms_git_objects (
  session_hash TEXT NOT NULL,
  object_sha TEXT NOT NULL,
  object_kind TEXT NOT NULL CHECK(object_kind IN ('blob', 'tree', 'commit')),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  PRIMARY KEY (session_hash, object_sha)
);

CREATE INDEX IF NOT EXISTS idx_cms_git_objects_expires_at ON cms_git_objects(expires_at);
