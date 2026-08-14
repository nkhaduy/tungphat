-- Store old debt separately so it never changes quote totals or existing rows.
ALTER TABLE quotes ADD COLUMN old_debt_amount INTEGER NOT NULL DEFAULT 0
  CHECK (old_debt_amount >= 0);
