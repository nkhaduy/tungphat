-- Upgrade the pre-deploy schema without discarding local or staging data.
ALTER TABLE quotes ADD COLUMN pdf_version INTEGER NOT NULL DEFAULT 0 CHECK (pdf_version >= 0);
ALTER TABLE quotes ADD COLUMN revision_token TEXT NOT NULL DEFAULT '';

ALTER TABLE quote_items RENAME TO quote_items_legacy;

CREATE TABLE quote_items (
  id TEXT PRIMARY KEY,
  quote_id TEXT NOT NULL REFERENCES quotes(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL,
  product_name TEXT NOT NULL DEFAULT '',
  specification TEXT NOT NULL DEFAULT '',
  quantity_milli INTEGER NOT NULL DEFAULT 0 CHECK (quantity_milli >= 0),
  unit TEXT NOT NULL DEFAULT '',
  unit_price INTEGER NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  line_total INTEGER NOT NULL DEFAULT 0 CHECK (line_total >= 0),
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

INSERT INTO quote_items(
  id,quote_id,position,product_name,specification,quantity_milli,unit,unit_price,line_total,note,created_at,updated_at,deleted_at
)
SELECT
  id,quote_id,position,product_name,specification,quantity * 1000,unit,unit_price,line_total,note,created_at,updated_at,deleted_at
FROM quote_items_legacy;

DROP TABLE quote_items_legacy;

CREATE INDEX idx_quote_items_quote ON quote_items(quote_id, position);
CREATE UNIQUE INDEX uq_quote_items_active_position
ON quote_items(quote_id, position)
WHERE deleted_at IS NULL;

ALTER TABLE quote_counters RENAME TO quote_counters_legacy;

CREATE TABLE quote_counters (
  branch_id TEXT NOT NULL REFERENCES branches(id),
  quote_date TEXT NOT NULL,
  last_sequence INTEGER NOT NULL CHECK (last_sequence >= 0),
  PRIMARY KEY (branch_id, quote_date)
);

INSERT INTO quote_counters(branch_id,quote_date,last_sequence)
SELECT branch_id,quote_date,last_sequence FROM quote_counters_legacy;

DROP TABLE quote_counters_legacy;

CREATE UNIQUE INDEX uq_quote_versions_pdf_key ON quote_versions(pdf_key);
CREATE INDEX idx_sessions_user ON sessions(user_id);
