-- Production/preview migration 1: core lead storage.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  submission_key TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('contact', 'quote')),
  full_name TEXT NOT NULL CHECK (length(full_name) BETWEEN 2 AND 100),
  phone TEXT NOT NULL CHECK (length(phone) BETWEEN 9 AND 12),
  email TEXT,
  company TEXT,
  city TEXT,
  material TEXT,
  thickness TEXT,
  quantity TEXT,
  cnc_requirement TEXT,
  message TEXT,
  source_url TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'won', 'lost', 'spam', 'archived')),
  consent_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);

CREATE TABLE IF NOT EXISTS lead_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT,
  changed_by TEXT,
  changed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lead_status_history_lead ON lead_status_history(lead_id, changed_at DESC);

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket_key TEXT PRIMARY KEY,
  hits INTEGER NOT NULL DEFAULT 1,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at ON rate_limits(expires_at);
