import { base64UrlDecode, base64UrlEncode, constantTimeEqual, hmac, randomToken, sha256 } from "./crypto";
import { validOrigin } from "./http";

export const SESSION_COOKIE = "tp_cms_session";
export const LOGIN_CSRF_COOKIE = "tp_cms_login_csrf";
export const SESSION_SECONDS = 12 * 60 * 60;
const LOGIN_CSRF_SECONDS = 10 * 60;

type SessionEnv = Pick<CloudflareCmsEnv, "DB" | "CMS_SESSION_SECRET" | "CMS_ALLOWED_ORIGINS">;
type TokenPayload = { v: 1; sid: string; csrf: string; iat: number; exp: number };
type LoginPayload = { v: 1; token: string; iat: number; exp: number };

function cookieValue(request: Request, name: string) {
  const part = (request.headers.get("Cookie") || "").split(";").map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));
  return part?.slice(name.length + 1) || "";
}
async function encodeSigned(payload: TokenPayload | LoginPayload, secret: string) {
  const value = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  return `${value}.${await hmac(value, secret)}`;
}

async function decodeSigned<T>(value: string, secret: string): Promise<T | null> {
  const [payload, provided, extra] = value.split(".");
  if (!payload || !provided || extra || secret.length < 32) return null;
  if (!constantTimeEqual(provided, await hmac(payload, secret))) return null;
  try {
    return JSON.parse(new TextDecoder().decode(base64UrlDecode(payload))) as T;
  } catch {
    return null;
  }
}

function sessionCookie(token: string, maxAge = SESSION_SECONDS) {
  return `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

export function clearLegacyCookies() {
  return [
    "tp_cms_admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0",
    "decap_oauth_state=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0",
  ];
}

export async function createLoginCsrf(secret: string, now = Math.floor(Date.now() / 1000)) {
  const token = randomToken();
  const signed = await encodeSigned({ v: 1, token, iat: now, exp: now + LOGIN_CSRF_SECONDS }, secret);
  return {
    token,
    cookie: `${LOGIN_CSRF_COOKIE}=${signed}; HttpOnly; Secure; SameSite=Strict; Path=/api/auth/login; Max-Age=${LOGIN_CSRF_SECONDS}`,
  };
}

export function clearLoginCsrfCookie() {
  return `${LOGIN_CSRF_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/api/auth/login; Max-Age=0`;
}

export async function verifyLoginCsrf(request: Request, secret: string, token: string, now = Math.floor(Date.now() / 1000)) {
  const payload = await decodeSigned<LoginPayload>(cookieValue(request, LOGIN_CSRF_COOKIE), secret);
  return Boolean(payload?.v === 1 && payload.iat <= now + 60 && payload.exp > now && constantTimeEqual(payload.token, token));
}

export async function createSession(env: SessionEnv, username: string, now = Math.floor(Date.now() / 1000)) {
  const sid = randomToken();
  const csrf = randomToken();
  const payload: TokenPayload = { v: 1, sid, csrf, iat: now, exp: now + SESSION_SECONDS };
  await env.DB.prepare(`
    INSERT INTO cms_sessions(session_hash, username, csrf_hash, created_at, expires_at, last_seen_at)
    VALUES(?1, ?2, ?3, ?4, ?5, ?4)
  `).bind(await sha256(sid), username, await sha256(csrf), now, payload.exp).run();
  return { csrf, cookie: sessionCookie(await encodeSigned(payload, env.CMS_SESSION_SECRET)), expiresAt: payload.exp };
}

export type VerifiedSession = { username: string; csrf: string; expiresAt: number; sessionHash: string };

export async function verifySession(request: Request, env: SessionEnv, now = Math.floor(Date.now() / 1000)): Promise<VerifiedSession | null> {
  const payload = await decodeSigned<TokenPayload>(cookieValue(request, SESSION_COOKIE), env.CMS_SESSION_SECRET);
  if (!payload || payload.v !== 1 || payload.iat > now + 60 || payload.exp <= now || payload.exp - payload.iat !== SESSION_SECONDS) return null;
  const sessionHash = await sha256(payload.sid);
  const row = await env.DB.prepare(`
    SELECT username, csrf_hash, expires_at FROM cms_sessions
    WHERE session_hash=?1 AND expires_at>?2
  `).bind(sessionHash, now).first<{ username: string; csrf_hash: string; expires_at: number }>();
  if (!row || row.expires_at !== payload.exp || !constantTimeEqual(row.csrf_hash, await sha256(payload.csrf))) return null;
  return { username: row.username, csrf: payload.csrf, expiresAt: payload.exp, sessionHash };
}

export async function revokeSession(request: Request, env: SessionEnv) {
  const session = await verifySession(request, env);
  if (session) await env.DB.prepare("DELETE FROM cms_sessions WHERE session_hash=?1").bind(session.sessionHash).run();
}

export async function validMutation(request: Request, env: SessionEnv, session: VerifiedSession) {
  if (!validOrigin(request, env)) return false;
  const header = request.headers.get("X-CSRF-Token") || request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "";
  return constantTimeEqual(header, session.csrf);
}
