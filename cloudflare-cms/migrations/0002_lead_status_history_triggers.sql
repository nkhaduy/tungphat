-- Production/preview migration 2: status audit trail.
CREATE TRIGGER IF NOT EXISTS trg_leads_insert_history
AFTER INSERT ON leads
BEGIN
  INSERT INTO lead_status_history (lead_id, from_status, to_status, note, changed_by, changed_at)
  VALUES (NEW.id, NULL, NEW.status, 'Lead created', 'system', NEW.created_at);
END;

CREATE TRIGGER IF NOT EXISTS trg_leads_update_status_history
AFTER UPDATE OF status ON leads
WHEN OLD.status <> NEW.status
BEGIN
  INSERT INTO lead_status_history (lead_id, from_status, to_status, note, changed_by, changed_at)
  VALUES (NEW.id, OLD.status, NEW.status, 'Status updated', NULL, NEW.updated_at);
END;
