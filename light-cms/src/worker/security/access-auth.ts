import type { UserRole } from "../../contracts/content";
import type { AccessIdentityClaims } from "./access-jwt";
import { constantTimeEqual, hmac, randomToken } from "./crypto";

export type AccessUser = {
  id: string;
  accessSubject: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: "active" | "disabled";
  lastLoginAt: string | null;
};

type IdentityRow = {
  id: string;
  access_subject: string | null;
  email: string;
  display_name: string | null;
  name: string;
  role: UserRole;
  status: "active" | "disabled";
  last_login_at: string | null;
};

export class AccessAuthorizationError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "AccessAuthorizationError";
  }
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

async function writeAudit(db: D1Database, values: { actorId: string | null; action: string; recordId: string; requestId: string; metadata: Record<string, unknown>; now: string }) {
  await db.prepare(`INSERT INTO audit_logs(id,actor_id,action,collection_key,record_id,request_id,metadata_json,created_at)
    VALUES(?1,?2,?3,'auth',?4,?5,?6,?7)`)
    .bind(randomToken(18), values.actorId, values.action, values.recordId, values.requestId, JSON.stringify(values.metadata), values.now).run();
}

function toUser(row: IdentityRow, subject: string): AccessUser {
  return {
    id: row.id,
    accessSubject: subject,
    email: normalizeEmail(row.email),
    displayName: row.display_name || row.name,
    role: row.role,
    status: row.status,
    lastLoginAt: row.last_login_at,
  };
}

export async function resolveAccessUser(
  db: D1Database,
  identity: AccessIdentityClaims,
  requestId: string,
  options: { now: string; auditLogin: boolean },
) {
  const email = normalizeEmail(identity.email);
  const query = await db.prepare(`SELECT id,access_subject,email,display_name,name,role,status,last_login_at
    FROM users WHERE access_subject=?1 OR email=?2 COLLATE NOCASE LIMIT 2`)
    .bind(identity.subject, email).all<IdentityRow>();
  const rows = query.results;
  const bySubject = rows.find((row) => row.access_subject === identity.subject);
  const byEmail = rows.find((row) => normalizeEmail(row.email) === email);

  const deny = async (code: string, actorId: string | null = null) => {
    if (options.auditLogin) await writeAudit(db, { actorId, action: "auth.login.denied", recordId: actorId || "access-identity", requestId, metadata: { reason: code }, now: options.now });
    throw new AccessAuthorizationError(code);
  };

  if (bySubject && byEmail && bySubject.id !== byEmail.id) return deny("subject_collision");
  let row = bySubject || byEmail;
  if (!row) return deny("unknown_user");
  if (bySubject && normalizeEmail(bySubject.email) !== email) return deny("email_mismatch", bySubject.id);
  if (!bySubject && row.access_subject && row.access_subject !== identity.subject) return deny("subject_mismatch", row.id);
  if (row.status !== "active") return deny("disabled_user", row.id);

  if (!row.access_subject) {
    const result = await db.prepare("UPDATE users SET access_subject=?1,updated_at=?2 WHERE id=?3 AND access_subject IS NULL")
      .bind(identity.subject, options.now, row.id).run();
    if (Number(result.meta.changes || 0) !== 1) return deny("subject_collision", row.id);
    row = { ...row, access_subject: identity.subject };
  }

  if (options.auditLogin) {
    await db.batch([
      db.prepare("UPDATE users SET last_login_at=?1,updated_at=?1 WHERE id=?2 AND status='active'").bind(options.now, row.id),
      db.prepare(`INSERT INTO audit_logs(id,actor_id,action,collection_key,record_id,request_id,metadata_json,created_at)
        VALUES(?1,?2,'auth.login','auth',?2,?3,'{}',?4)`).bind(randomToken(18), row.id, requestId, options.now),
    ]);
    row = { ...row, last_login_at: options.now };
  }
  return toUser(row, identity.subject);
}

export async function createAccessCsrf(accessToken: string, secret: string) {
  const parts = accessToken.split(".");
  if (parts.length !== 3 || !parts[2]) throw new AccessAuthorizationError("malformed_token");
  return hmac(`light-cms-csrf-v1:${parts[2]}`, secret);
}

export async function requireAccessMutation(request: Request, origins: string[], accessToken: string, secret: string) {
  const origin = request.headers.get("Origin");
  const received = request.headers.get("X-CSRF-Token") || "";
  if (!origin || !origins.includes(origin) || !received) return false;
  try {
    return constantTimeEqual(received, await createAccessCsrf(accessToken, secret));
  } catch {
    return false;
  }
}
