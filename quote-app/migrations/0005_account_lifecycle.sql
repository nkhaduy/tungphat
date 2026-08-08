ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0 CHECK (must_change_password IN (0, 1));
ALTER TABLE users ADD COLUMN password_ciphertext TEXT;

UPDATE users
SET must_change_password=1
WHERE role='EMPLOYEE' AND last_login_at IS NULL AND deleted_at IS NULL;
