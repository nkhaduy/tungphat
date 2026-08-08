-- Keep both official branches on the confirmed shared Mr. Tùng contact.
UPDATE branches
SET phone='0909 259 160', updated_at=datetime('now')
WHERE code IN ('TP14', 'TP81') AND deleted_at IS NULL;
