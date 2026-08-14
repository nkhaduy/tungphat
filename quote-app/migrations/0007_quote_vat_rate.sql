-- Add VAT rate metadata without rewriting any existing quote rows.
ALTER TABLE quotes ADD COLUMN vat_rate INTEGER CHECK (vat_rate IS NULL OR vat_rate IN (0, 8, 10));
