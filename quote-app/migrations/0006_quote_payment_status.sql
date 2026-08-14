ALTER TABLE quotes ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'UNPAID'
  CHECK (payment_status IN ('UNPAID','DEPOSITED','PARTIAL','PAID'));

UPDATE quotes
SET payment_status = CASE
  WHEN status = 'PAID' OR (grand_total > 0 AND deposit_amount >= grand_total) THEN 'PAID'
  WHEN status = 'DEPOSITED' AND deposit_amount > 0 AND deposit_amount < grand_total THEN 'DEPOSITED'
  ELSE 'UNPAID'
END;

CREATE INDEX idx_quotes_payment_status_date ON quotes(payment_status, quote_date DESC);
