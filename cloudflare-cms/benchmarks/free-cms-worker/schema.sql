CREATE TABLE IF NOT EXISTS benchmark_content (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('products', 'articles', 'projects', 'pages')),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS benchmark_content_type_updated_idx
  ON benchmark_content(type, updated_at DESC);

INSERT OR IGNORE INTO benchmark_content(id, type, slug, title, body, updated_at)
VALUES
  ('product-01', 'products', 'san-pham-01', 'San pham benchmark 01', 'Noi dung benchmark gon nhe.', '2026-08-04T00:00:01Z'),
  ('product-02', 'products', 'san-pham-02', 'San pham benchmark 02', 'Noi dung benchmark gon nhe.', '2026-08-04T00:00:02Z'),
  ('product-03', 'products', 'san-pham-03', 'San pham benchmark 03', 'Noi dung benchmark gon nhe.', '2026-08-04T00:00:03Z'),
  ('product-04', 'products', 'san-pham-04', 'San pham benchmark 04', 'Noi dung benchmark gon nhe.', '2026-08-04T00:00:04Z'),
  ('product-05', 'products', 'san-pham-05', 'San pham benchmark 05', 'Noi dung benchmark gon nhe.', '2026-08-04T00:00:05Z'),
  ('product-06', 'products', 'san-pham-06', 'San pham benchmark 06', 'Noi dung benchmark gon nhe.', '2026-08-04T00:00:06Z'),
  ('product-07', 'products', 'san-pham-07', 'San pham benchmark 07', 'Noi dung benchmark gon nhe.', '2026-08-04T00:00:07Z'),
  ('product-08', 'products', 'san-pham-08', 'San pham benchmark 08', 'Noi dung benchmark gon nhe.', '2026-08-04T00:00:08Z'),
  ('product-09', 'products', 'san-pham-09', 'San pham benchmark 09', 'Noi dung benchmark gon nhe.', '2026-08-04T00:00:09Z'),
  ('product-10', 'products', 'san-pham-10', 'San pham benchmark 10', 'Noi dung benchmark gon nhe.', '2026-08-04T00:00:10Z'),
  ('product-11', 'products', 'san-pham-11', 'San pham benchmark 11', 'Noi dung benchmark gon nhe.', '2026-08-04T00:00:11Z'),
  ('product-12', 'products', 'san-pham-12', 'San pham benchmark 12', 'Noi dung benchmark gon nhe.', '2026-08-04T00:00:12Z'),
  ('product-13', 'products', 'san-pham-13', 'San pham benchmark 13', 'Noi dung benchmark gon nhe.', '2026-08-04T00:00:13Z'),
  ('product-14', 'products', 'san-pham-14', 'San pham benchmark 14', 'Noi dung benchmark gon nhe.', '2026-08-04T00:00:14Z'),
  ('product-15', 'products', 'san-pham-15', 'San pham benchmark 15', 'Noi dung benchmark gon nhe.', '2026-08-04T00:00:15Z'),
  ('product-16', 'products', 'san-pham-16', 'San pham benchmark 16', 'Noi dung benchmark gon nhe.', '2026-08-04T00:00:16Z'),
  ('product-17', 'products', 'san-pham-17', 'San pham benchmark 17', 'Noi dung benchmark gon nhe.', '2026-08-04T00:00:17Z'),
  ('product-18', 'products', 'san-pham-18', 'San pham benchmark 18', 'Noi dung benchmark gon nhe.', '2026-08-04T00:00:18Z'),
  ('product-19', 'products', 'san-pham-19', 'San pham benchmark 19', 'Noi dung benchmark gon nhe.', '2026-08-04T00:00:19Z'),
  ('product-20', 'products', 'san-pham-20', 'San pham benchmark 20', 'Noi dung benchmark gon nhe.', '2026-08-04T00:00:20Z');
