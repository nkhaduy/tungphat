-- Production/preview migration 3: complete the 26-column lead schema.
ALTER TABLE leads ADD COLUMN product TEXT;
ALTER TABLE leads ADD COLUMN dimensions TEXT;
ALTER TABLE leads ADD COLUMN ip_hash TEXT;
ALTER TABLE leads ADD COLUMN user_agent TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_ip_hash_created_at
ON leads(ip_hash, created_at DESC);
