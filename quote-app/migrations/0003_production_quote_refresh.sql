-- Production-safe refresh: retain quote/version/audit history while adding shared data.
ALTER TABLE users ADD COLUMN phone TEXT NOT NULL DEFAULT '';

CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  identity_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  normalized_name TEXT NOT NULL DEFAULT '',
  normalized_phone TEXT NOT NULL DEFAULT '',
  search_text TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_customers_updated ON customers(updated_at DESC);
CREATE INDEX idx_customers_normalized_phone ON customers(normalized_phone);
CREATE INDEX idx_customers_normalized_name ON customers(normalized_name);

WITH normalized_quotes AS (
  SELECT
    id,
    customer_name,
    customer_phone,
    customer_address,
    lower(trim(replace(replace(replace(customer_name, '  ', ' '), '  ', ' '), '  ', ' '))) AS normalized_name,
    replace(replace(replace(replace(replace(replace(replace(customer_phone,' ',''),'.',''),'-',''),'(',''),')',''),'+',''),'/','') AS normalized_phone,
    lower(trim(replace(replace(replace(customer_address, '  ', ' '), '  ', ' '), '  ', ' '))) AS normalized_address,
    created_at,
    updated_at
  FROM quotes
  WHERE deleted_at IS NULL
    AND (trim(customer_name) != '' OR trim(customer_phone) != '' OR trim(customer_address) != '')
), identified_quotes AS (
  SELECT
    *,
    CASE
      WHEN normalized_phone != '' AND normalized_name != '' THEN 'contact:' || normalized_phone || '|' || normalized_name
      WHEN normalized_phone != '' THEN 'phone:' || normalized_phone
      ELSE 'details:' || normalized_name || '|' || normalized_address
    END AS identity_key
  FROM normalized_quotes
), ranked_quotes AS (
  SELECT
    *,
    MIN(created_at) OVER (PARTITION BY identity_key) AS first_created_at,
    MAX(updated_at) OVER (PARTITION BY identity_key) AS last_updated_at,
    ROW_NUMBER() OVER (PARTITION BY identity_key ORDER BY updated_at DESC, created_at DESC, id DESC) AS identity_rank
  FROM identified_quotes
)
INSERT INTO customers(
  id,identity_key,name,phone,address,normalized_name,normalized_phone,search_text,created_at,updated_at
)
SELECT
  'customer-' || lower(hex(randomblob(16))),
  identity_key,
  customer_name,
  customer_phone,
  customer_address,
  normalized_name,
  normalized_phone,
  lower(trim(customer_name || ' ' || customer_phone || ' ' || customer_address)),
  first_created_at,
  last_updated_at
FROM ranked_quotes
WHERE identity_rank=1;

UPDATE branches
SET name='Tùng Phát 2', address='81B Tam Bình, Hiệp Bình, TP.HCM', code='TP81', is_active=1, updated_at=datetime('now')
WHERE id='branch-tp81' OR code='TP81';

INSERT INTO branches(id,code,name,address,phone,is_active,created_at,updated_at)
SELECT 'branch-tp81','TP81','Tùng Phát 2','81B Tam Bình, Hiệp Bình, TP.HCM','0909 259 160',1,datetime('now'),datetime('now')
WHERE NOT EXISTS(SELECT 1 FROM branches WHERE code='TP81' AND deleted_at IS NULL);

INSERT INTO branches(id,code,name,address,phone,is_active,created_at,updated_at)
SELECT 'branch-tp14','TP14','Tùng Phát 1','14 Tam Bình, Hiệp Bình, TP.HCM','',1,datetime('now'),datetime('now')
WHERE NOT EXISTS(SELECT 1 FROM branches WHERE code='TP14' AND deleted_at IS NULL);

UPDATE branches
SET name='Tùng Phát 1', address='14 Tam Bình, Hiệp Bình, TP.HCM', code='TP14', is_active=1, updated_at=datetime('now')
WHERE id='branch-tp14' OR code='TP14';

UPDATE branches
SET is_active=0, updated_at=datetime('now')
WHERE code NOT IN ('TP14','TP81') AND deleted_at IS NULL;

ALTER TABLE quotes DROP COLUMN valid_until;

UPDATE settings
SET value_json=json_set(
  value_json,
  '$.headerContactName', COALESCE(json_extract(value_json, '$.headerContactName'), 'Mr. Tùng'),
  '$.headerPhone', COALESCE(json_extract(value_json, '$.headerPhone'), json_extract(value_json, '$.phone'), '0909 259 160'),
  '$.address', '81B Tam Bình, Hiệp Bình, TP.HCM'
)
WHERE key='company';

UPDATE settings
SET value_json=json_remove(value_json, '$.validDays')
WHERE key='defaults';
