ALTER TABLE users ADD COLUMN baogia_subject TEXT;
ALTER TABLE users ADD COLUMN baogia_username TEXT;

CREATE UNIQUE INDEX users_baogia_subject_unique_idx
  ON users(baogia_subject) WHERE baogia_subject IS NOT NULL;

CREATE TABLE sso_assertion_uses (
  jti_hash TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER NOT NULL
);

CREATE INDEX sso_assertion_expiry_idx ON sso_assertion_uses(expires_at);
