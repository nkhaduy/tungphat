PRAGMA foreign_keys = OFF;

ALTER TABLE gbp_connection RENAME TO gbp_connection_single;

CREATE TABLE gbp_connection (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  account_name TEXT,
  location_name TEXT UNIQUE,
  location_title TEXT,
  location_maps_uri TEXT,
  location_place_id TEXT,
  branch_key TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL,
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

INSERT INTO gbp_connection (
  project_id, account_name, location_name, location_title, location_maps_uri,
  location_place_id, branch_key, display_order, access_token_ciphertext,
  refresh_token_ciphertext, token_expires_at, scope, status,
  last_sync_started_at, last_sync_succeeded_at, last_sync_failed_at,
  last_error_safe, updated_at
)
SELECT
  project_id, account_name, location_name, location_title, location_maps_uri,
  location_place_id, 'tp1', 1, access_token_ciphertext,
  refresh_token_ciphertext, token_expires_at, scope, status,
  last_sync_started_at, last_sync_succeeded_at, last_sync_failed_at,
  last_error_safe, updated_at
FROM gbp_connection_single
WHERE id = 1;

DROP TABLE gbp_connection_single;

CREATE INDEX idx_gbp_connection_display_order
  ON gbp_connection(display_order, branch_key);
CREATE UNIQUE INDEX idx_gbp_connection_place_id
  ON gbp_connection(location_place_id)
  WHERE location_place_id IS NOT NULL;

PRAGMA foreign_keys = ON;
