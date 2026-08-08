PRAGMA foreign_keys = ON;

CREATE TABLE branches (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'EMPLOYEE')),
  branch_id TEXT REFERENCES branches(id),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  last_login_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE sessions (
  id_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  csrf_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE TABLE login_attempts (
  client_hash TEXT PRIMARY KEY,
  failure_count INTEGER NOT NULL DEFAULT 0,
  window_started_at INTEGER NOT NULL,
  locked_until INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE TABLE quote_counters (
  branch_id TEXT NOT NULL REFERENCES branches(id),
  quote_date TEXT NOT NULL,
  last_sequence INTEGER NOT NULL,
  PRIMARY KEY (branch_id, quote_date)
);

CREATE TABLE quotes (
  id TEXT PRIMARY KEY,
  quote_number TEXT NOT NULL UNIQUE,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  created_by TEXT NOT NULL REFERENCES users(id),
  quote_date TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  customer_name TEXT NOT NULL DEFAULT '',
  customer_phone TEXT NOT NULL DEFAULT '',
  customer_address TEXT NOT NULL DEFAULT '',
  delivery_note TEXT NOT NULL DEFAULT '',
  general_note TEXT NOT NULL DEFAULT '',
  subtotal INTEGER NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount INTEGER NOT NULL DEFAULT 0 CHECK (discount >= 0),
  shipping_fee INTEGER NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  processing_fee INTEGER NOT NULL DEFAULT 0 CHECK (processing_fee >= 0),
  vat_amount INTEGER NOT NULL DEFAULT 0 CHECK (vat_amount >= 0),
  grand_total INTEGER NOT NULL DEFAULT 0 CHECK (grand_total >= 0),
  deposit_amount INTEGER NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
  remaining_amount INTEGER NOT NULL DEFAULT 0 CHECK (remaining_amount >= 0),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ISSUED','DEPOSITED','PAID','CANCELLED')),
  pre_cancel_status TEXT CHECK (pre_cancel_status IS NULL OR pre_cancel_status IN ('DRAFT','ISSUED','DEPOSITED','PAID')),
  latest_pdf_key TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  cancelled_at TEXT,
  cancelled_by TEXT REFERENCES users(id),
  deleted_at TEXT
);

CREATE TABLE quote_items (
  id TEXT PRIMARY KEY,
  quote_id TEXT NOT NULL REFERENCES quotes(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL,
  product_name TEXT NOT NULL DEFAULT '',
  specification TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit TEXT NOT NULL DEFAULT '',
  unit_price INTEGER NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  line_total INTEGER NOT NULL DEFAULT 0 CHECK (line_total >= 0),
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE (quote_id, position)
);

CREATE TABLE quote_versions (
  id TEXT PRIMARY KEY,
  quote_id TEXT NOT NULL REFERENCES quotes(id),
  version_number INTEGER NOT NULL,
  snapshot_json TEXT NOT NULL,
  pdf_key TEXT NOT NULL,
  pdf_size INTEGER NOT NULL,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  UNIQUE (quote_id, version_number)
);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_data TEXT,
  new_data TEXT,
  request_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_quotes_created_by_date ON quotes(created_by, quote_date DESC);
CREATE INDEX idx_quotes_branch_date ON quotes(branch_id, quote_date DESC);
CREATE INDEX idx_quotes_status_date ON quotes(status, quote_date DESC);
CREATE INDEX idx_quotes_customer_phone ON quotes(customer_phone);
CREATE INDEX idx_quote_items_quote ON quote_items(quote_id, position);
CREATE INDEX idx_quote_versions_quote ON quote_versions(quote_id, version_number DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_actor ON audit_logs(actor_user_id, created_at DESC);

INSERT INTO branches (id, code, name, address, phone, created_at, updated_at)
VALUES ('branch-tp81', 'TP81', 'Chi nhánh Tam Bình', '81B Tam Bình, TP. Thủ Đức, TP.HCM', '0909 259 160', datetime('now'), datetime('now'));

INSERT INTO settings (key, value_json, created_at, updated_at) VALUES
('company', '{"name":"CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ GỖ TÙNG PHÁT","address":"81B Tam Bình, TP. Thủ Đức, TP.HCM","phone":"0909 259 160","website":"mdftungphat.com","logoPath":"/logo-horizontal.png"}', datetime('now'), datetime('now')),
('bank', '{"accountNumber":"3191158","bankCode":"ACB","holder":"CTY TNHH THUONG MAI DICH VU GO TUNG PHAT","store":"TUNG PHAT"}', datetime('now'), datetime('now')),
('defaults', '{"validDays":7,"generalNote":"Báo giá chưa bao gồm các hạng mục không được liệt kê. Vui lòng kiểm tra quy cách trước khi xác nhận.","deliveryNote":"Thời gian và chi phí giao hàng được xác nhận theo từng đơn hàng."}', datetime('now'), datetime('now'));
