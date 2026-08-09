import { randomToken, sha256 } from "./crypto";
import { verifyBaogiaAssertion } from "./baogia-jwt";
import { createSession } from "./session";

export const SSO_STATE_COOKIE = "tp_light_sso_state";
export const SSO_STATE_SECONDS = 10 * 60;
export const BAOGIA_SSO_START = "https://baogia.mdftungphat.com/api/auth/sso/cms";

type BaogiaSsoEnv = {
  DB: D1Database;
  SESSION_SECRET: string;
  BAOGIA_SSO_ISSUER: string;
  BAOGIA_SSO_AUD: string;
  BAOGIA_SSO_PUBLIC_JWK: string;
  BAOGIA_SSO_KEY_ID: string;
  COOKIE_SECURE?: boolean;
};

type UserIdentityRow = { id: string; baogia_subject: string | null; active: number; status: "active" | "disabled" };

export class BaogiaSsoError extends Error {
  constructor(
    public readonly code: "invalid_request" | "invalid_state" | "invalid_configuration" | "assertion_replayed" | "disabled_user" | "subject_collision",
    public readonly status: number,
  ) {
    super(code);
    this.name = "BaogiaSsoError";
  }
}

function secureCookie(request: Request, configured?: boolean): boolean {
  return configured ?? new URL(request.url).protocol === "https:";
}

function stateCookie(state: string, secure: boolean): string {
  const sameSite = secure ? "SameSite=None" : "SameSite=Lax";
  return `${SSO_STATE_COOKIE}=${state}; HttpOnly; ${secure ? "Secure; " : ""}${sameSite}; Path=/api/auth/sso/callback; Max-Age=${SSO_STATE_SECONDS}`;
}

function clearStateCookie(secure: boolean): string {
  const sameSite = secure ? "SameSite=None" : "SameSite=Lax";
  return `${SSO_STATE_COOKIE}=; HttpOnly; ${secure ? "Secure; " : ""}${sameSite}; Path=/api/auth/sso/callback; Max-Age=0`;
}

function readCookie(request: Request, name: string): string {
  return (request.headers.get("Cookie") || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) || "";
}

function stateValid(value: string): boolean {
  return /^[A-Za-z0-9_-]{32,128}$/u.test(value);
}

function constantStateEqual(left: string, right: string): boolean {
  const encoder = new TextEncoder();
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  let mismatch = a.length ^ b.length;
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) mismatch |= (a[index] || 0) ^ (b[index] || 0);
  return mismatch === 0;
}

function parsePublicJwk(value: string): JsonWebKey {
  try {
    const parsed = JSON.parse(value) as JsonWebKey;
    if (!parsed || typeof parsed !== "object") throw new Error("invalid_jwk");
    return parsed;
  } catch {
    throw new BaogiaSsoError("invalid_configuration", 503);
  }
}

function auditStatement(
  db: D1Database,
  values: { id: string; actorId: string | null; action: string; recordId: string; requestId: string; metadata: Record<string, unknown>; now: string },
) {
  return db.prepare(`INSERT INTO audit_logs(id,actor_id,action,collection_key,record_id,request_id,metadata_json,created_at)
    VALUES(?1,?2,?3,'auth',?4,?5,?6,?7)`)
    .bind(values.id, values.actorId, values.action, values.recordId, values.requestId, JSON.stringify(values.metadata), values.now);
}

export function startBaogiaSso(request: Request, options: { COOKIE_SECURE?: boolean } = {}): Response {
  const state = randomToken(32);
  const location = new URL(BAOGIA_SSO_START);
  location.searchParams.set("state", state);
  return new Response(null, {
    status: 302,
    headers: {
      Location: location.toString(),
      "Set-Cookie": stateCookie(state, secureCookie(request, options.COOKIE_SECURE)),
      "Cache-Control": "no-store, private",
      "Referrer-Policy": "no-referrer",
    },
  });
}

export async function completeBaogiaSso(
  request: Request,
  env: BaogiaSsoEnv,
  now = Math.floor(Date.now() / 1000),
): Promise<Response> {
  const contentType = request.headers.get("Content-Type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (request.method !== "POST" || contentType !== "application/x-www-form-urlencoded") throw new BaogiaSsoError("invalid_request", 415);
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > 16_384) throw new BaogiaSsoError("invalid_request", 413);
  const body = await request.text();
  if (body.length > 16_384) throw new BaogiaSsoError("invalid_request", 413);
  const form = new URLSearchParams(body);
  const assertions = form.getAll("assertion");
  const states = form.getAll("state");
  const state = states[0] || "";
  const expectedState = readCookie(request, SSO_STATE_COOKIE);
  if (assertions.length !== 1 || states.length !== 1 || !stateValid(state) || !stateValid(expectedState) || !constantStateEqual(state, expectedState)) {
    throw new BaogiaSsoError("invalid_state", 401);
  }

  const identity = await verifyBaogiaAssertion(assertions[0], {
    issuer: env.BAOGIA_SSO_ISSUER,
    audience: env.BAOGIA_SSO_AUD,
    publicJwk: parsePublicJwk(env.BAOGIA_SSO_PUBLIC_JWK),
    keyId: env.BAOGIA_SSO_KEY_ID,
  }, now);
  const subjectHash = await sha256(identity.subject);
  const userId = `baogia-${subjectHash.slice(0, 24)}`;
  const email = `sso-${subjectHash.slice(0, 24)}@baogia.invalid`;
  const requestId = randomToken(18);
  const isoNow = new Date(now * 1000).toISOString();
  const rows = await env.DB.prepare(`SELECT id,baogia_subject,active,status FROM users
    WHERE baogia_subject=?1 OR id=?2 LIMIT 2`).bind(identity.subject, userId).all<UserIdentityRow>();
  const subjectOwner = rows.results.find((row) => row.baogia_subject === identity.subject);
  const idOwner = rows.results.find((row) => row.id === userId);
  const collision = Boolean((subjectOwner && subjectOwner.id !== userId) || (idOwner && idOwner.baogia_subject !== identity.subject));
  const jtiHash = await sha256(identity.jti);

  if (collision) {
    await env.DB.batch([
      env.DB.prepare("INSERT INTO sso_assertion_uses(jti_hash,subject,expires_at,used_at) VALUES(?1,?2,?3,?4)").bind(jtiHash, identity.subject, identity.expiresAt, now),
      auditStatement(env.DB, { id: randomToken(18), actorId: null, action: "auth.login.denied", recordId: userId, requestId, metadata: { reason: "subject_collision" }, now: isoNow }),
    ]);
    throw new BaogiaSsoError("subject_collision", 403);
  }
  if (idOwner && (idOwner.active !== 1 || idOwner.status !== "active")) {
    await env.DB.batch([
      env.DB.prepare("INSERT INTO sso_assertion_uses(jti_hash,subject,expires_at,used_at) VALUES(?1,?2,?3,?4)").bind(jtiHash, identity.subject, identity.expiresAt, now),
      auditStatement(env.DB, { id: randomToken(18), actorId: idOwner.id, action: "auth.login.denied", recordId: idOwner.id, requestId, metadata: { reason: "disabled_user" }, now: isoNow }),
    ]);
    throw new BaogiaSsoError("disabled_user", 403);
  }

  try {
    await env.DB.batch([
      env.DB.prepare("DELETE FROM sso_assertion_uses WHERE expires_at<?1").bind(now),
      env.DB.prepare("INSERT INTO sso_assertion_uses(jti_hash,subject,expires_at,used_at) VALUES(?1,?2,?3,?4)").bind(jtiHash, identity.subject, identity.expiresAt, now),
      env.DB.prepare(`INSERT INTO users(id,email,name,display_name,role,active,status,baogia_subject,baogia_username,failed_attempts,created_at,updated_at,last_login_at)
        VALUES(?1,?2,?3,?3,'super-admin',1,'active',?4,?5,0,?6,?6,?6)
        ON CONFLICT(id) DO UPDATE SET name=excluded.name,display_name=excluded.display_name,role='super-admin',baogia_username=excluded.baogia_username,updated_at=excluded.updated_at,last_login_at=excluded.last_login_at
        WHERE users.baogia_subject=excluded.baogia_subject AND users.active=1 AND users.status='active'`)
        .bind(userId, email, identity.displayName, identity.subject, identity.username, isoNow),
      auditStatement(env.DB, { id: randomToken(18), actorId: userId, action: "auth.login", recordId: userId, requestId, metadata: { provider: "baogia-sso" }, now: isoNow }),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/UNIQUE constraint failed: sso_assertion_uses\.jti_hash/u.test(message)) throw new BaogiaSsoError("assertion_replayed", 401);
    if (/UNIQUE constraint failed/u.test(message)) throw new BaogiaSsoError("subject_collision", 403);
    throw error;
  }

  const secure = secureCookie(request, env.COOKIE_SECURE);
  const session = await createSession({ DB: env.DB, SESSION_SECRET: env.SESSION_SECRET, COOKIE_SECURE: secure }, {
    id: userId,
    email,
    name: identity.displayName,
    role: "super-admin",
  }, now);
  const headers = new Headers({ Location: "/", "Cache-Control": "no-store, private", "Referrer-Policy": "no-referrer" });
  headers.append("Set-Cookie", session.cookie);
  headers.append("Set-Cookie", clearStateCookie(secure));
  return new Response(null, { status: 302, headers });
}
