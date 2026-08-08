import type { SessionUser } from "../../contracts/api";
import { constantTimeEqual, hmac, randomToken, sha256 } from "./crypto";

export const SESSION_COOKIE = "tp_light_session";
export const SESSION_SECONDS = 30 * 60;

type SessionEnv = { DB: D1Database; SESSION_SECRET: string };
type SessionPayload = { version: 1; sid: string; csrf: string; userId: string; iat: number; exp: number };
export type VerifiedSession = {
  userId: string;
  csrf: string;
  expiresAt: number;
  role: SessionUser["role"];
  email: string;
  name: string;
  sessionHash: string;
};

function encode(value: string): string {
  return btoa(value).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function decode(value: string): string {
  return atob(value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "="));
}

function validSecret(secret: string): boolean {
  return new TextEncoder().encode(secret).byteLength >= 32;
}

async function signPayload(payload: SessionPayload, secret: string): Promise<string> {
  if (!validSecret(secret)) throw new Error("SESSION_SECRET must contain at least 32 bytes");
  const body = encode(JSON.stringify(payload));
  return `${body}.${await hmac(body, secret)}`;
}

async function verifyPayload(value: string, secret: string): Promise<SessionPayload | null> {
  if (!value || value.length > 4_096 || !validSecret(secret)) return null;
  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [body, signature] = parts;
  if (!body || !signature || !constantTimeEqual(signature, await hmac(body, secret))) return null;
  try {
    const parsed = JSON.parse(decode(body)) as Record<string, unknown>;
    if (
      parsed.version !== 1 || typeof parsed.sid !== "string" || !parsed.sid
      || typeof parsed.csrf !== "string" || !parsed.csrf || typeof parsed.userId !== "string" || !parsed.userId
      || typeof parsed.iat !== "number" || !Number.isSafeInteger(parsed.iat)
      || typeof parsed.exp !== "number" || !Number.isSafeInteger(parsed.exp)
    ) return null;
    return parsed as SessionPayload;
  } catch {
    return null;
  }
}

function cookieHeader(value: string, secure: boolean): string {
  return `${SESSION_COOKIE}=${value}; HttpOnly; ${secure ? "Secure; " : ""}SameSite=Lax; Path=/; Max-Age=${SESSION_SECONDS}`;
}

function readCookie(request: Request): string {
  return (request.headers.get("Cookie") || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1) || "";
}

export function parseSessionCookie(cookie: string): string | null {
  const value = cookie.split(";")[0]?.split("=").slice(1).join("=") || "";
  return value || null;
}

export async function createSession(
  env: Pick<SessionEnv, "DB" | "SESSION_SECRET"> & { COOKIE_SECURE?: boolean },
  user: Pick<SessionUser, "id" | "email" | "role"> & Partial<Pick<SessionUser, "name">>,
  now = Math.floor(Date.now() / 1000),
) {
  const sid = randomToken(32);
  const csrf = randomToken(24);
  const payload: SessionPayload = { version: 1, sid, csrf, userId: user.id, iat: now, exp: now + SESSION_SECONDS };
  await env.DB.prepare("INSERT INTO sessions(session_hash,user_id,csrf_hash,created_at,expires_at) VALUES(?1,?2,?3,?4,?5)")
    .bind(await sha256(sid), user.id, await sha256(csrf), now, payload.exp).run();
  return { cookie: cookieHeader(await signPayload(payload, env.SESSION_SECRET), Boolean(env.COOKIE_SECURE)), csrf, expiresAt: payload.exp };
}

export async function verifySession(
  request: Request,
  env: Pick<SessionEnv, "DB" | "SESSION_SECRET">,
  now = Math.floor(Date.now() / 1000),
): Promise<VerifiedSession | null> {
  const payload = await verifyPayload(readCookie(request), env.SESSION_SECRET);
  if (!payload || payload.exp <= now || payload.iat > now || payload.exp - payload.iat !== SESSION_SECONDS) return null;
  const sessionHash = await sha256(payload.sid);
  const row = await env.DB.prepare(`SELECT s.user_id,s.csrf_hash,s.expires_at,u.email,u.name,u.role FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.session_hash=?1 AND s.revoked_at IS NULL AND s.expires_at>?2 AND u.active=1 AND u.status='active' LIMIT 1`)
    .bind(sessionHash, now).first<{ user_id: string; csrf_hash: string; expires_at: number; email: string; name: string; role: SessionUser["role"] }>();
  if (!row || row.expires_at !== payload.exp || !constantTimeEqual(row.csrf_hash, await sha256(payload.csrf))) return null;
  return { userId: row.user_id, csrf: payload.csrf, expiresAt: row.expires_at, role: row.role, email: row.email, name: row.name, sessionHash };
}

export async function revokeSession(
  request: Request,
  env: Pick<SessionEnv, "DB" | "SESSION_SECRET">,
  now = Math.floor(Date.now() / 1000),
): Promise<void> {
  const payload = await verifyPayload(readCookie(request), env.SESSION_SECRET);
  if (payload) await env.DB.prepare("UPDATE sessions SET revoked_at=?1 WHERE session_hash=?2 AND revoked_at IS NULL").bind(now, await sha256(payload.sid)).run();
}

export async function requireMutation(request: Request, env: { allowedOrigins: string[] }, session: VerifiedSession): Promise<boolean> {
  const origin = request.headers.get("Origin");
  const csrf = request.headers.get("X-CSRF-Token") || "";
  return Boolean(origin && env.allowedOrigins.includes(origin) && constantTimeEqual(csrf, session.csrf));
}

export function clearSessionCookie(secure = true): string {
  return `${SESSION_COOKIE}=; HttpOnly; ${secure ? "Secure; " : ""}SameSite=Lax; Path=/; Max-Age=0`;
}
