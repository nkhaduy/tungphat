ALTER TABLE users ADD COLUMN access_subject TEXT;
ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled'));
ALTER TABLE users ADD COLUMN last_login_at TEXT;

UPDATE users
SET display_name = name,
    status = CASE WHEN active = 1 THEN 'active' ELSE 'disabled' END
WHERE display_name IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_access_subject_unique_idx
  ON users(access_subject) WHERE access_subject IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_identity_lookup_idx
  ON users(email, status, access_subject);
