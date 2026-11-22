-- Each creation key is scoped to its employee and committed with the quote.
CREATE TABLE quote_create_requests (
  user_id TEXT NOT NULL REFERENCES users(id),
  request_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  quote_id TEXT NOT NULL REFERENCES quotes(id),
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, request_key)
);
