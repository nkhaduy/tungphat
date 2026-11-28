-- Preserve existing quotes and treat rows without an explicit discount as 0%.
ALTER TABLE quote_items
ADD COLUMN discount_basis_points INTEGER NOT NULL DEFAULT 0
CHECK (discount_basis_points BETWEEN 0 AND 10000);
