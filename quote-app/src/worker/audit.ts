import { isoNow } from "./http";

type AuditInput = {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldData?: unknown;
  newData?: unknown;
  requestId: string;
};

export function auditStatement(env: QuoteAppEnv, input: AuditInput): D1PreparedStatement {
  return env.DB.prepare(`
    INSERT INTO audit_logs(id, actor_user_id, action, entity_type, entity_id, old_data, new_data, request_id, created_at)
    VALUES(?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
  `).bind(
    crypto.randomUUID(),
    input.actorUserId,
    input.action,
    input.entityType,
    input.entityId ?? null,
    input.oldData === undefined ? null : JSON.stringify(input.oldData),
    input.newData === undefined ? null : JSON.stringify(input.newData),
    input.requestId,
    isoNow(),
  );
}

export async function writeAudit(env: QuoteAppEnv, input: AuditInput): Promise<void> {
  await auditStatement(env, input).run();
}
