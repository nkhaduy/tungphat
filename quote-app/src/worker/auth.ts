import type { Context, Next } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { SessionUser } from "../shared/types";
import { auditStatement, writeAudit } from "./audit";
import { base64UrlDecode, base64UrlEncode, constantTimeEqual, hmac, randomToken, sha256 } from "./crypto";
import { HttpError, isAllowedOrigin, isoNow, noStore } from "./http";
import { hashPassword, verifyPassword } from "./password";
import { encryptPassword } from "./password-vault";

const SESSION_COOKIE = "tp_quote_session";
const LOGIN_CSRF_COOKIE = "tp_quote_login_csrf";
const SESSION_SECONDS = 12 * 60 * 60;
const LOGIN_CSRF_SECONDS = 10 * 60;
const LOGIN_WINDOW_SECONDS = 15 * 60;
const MAX_LOGIN_FAILURES = 5;
const DUMMY_PASSWORD_HASH = "v2$pbkdf2-sha256$i=100000$AQIDBAUGBwgJCgsMDQ4PEA$gdQhcY_hx02qNLgzolAdM1V51-8wIGMhWcBqNwS_UPw";

type TokenPayload = { v: 1; sid: string; csrf: string; iat: number; exp: number };
type LoginCsrfPayload = { v: 1; token: string; iat: number; exp: number };
type AuthVariables = { user: SessionUser; csrf: string; sessionHash: string; requestId: string };
export type AppBindings = { Bindings: QuoteAppEnv; Variables: AuthVariables };
export type ResolvedSession = { user: SessionUser; csrf: string; sessionHash: string };

async function encodeSigned(payload: TokenPayload | LoginCsrfPayload, secret: string): Promise<string> {
  const encoded = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  return `${encoded}.${await hmac(encoded, secret)}`;
}

async function decodeSigned<T>(value: string, secret: string): Promise<T | null> {
  const [encoded, signature, extra] = value.split(".");
  if (!encoded || !signature || extra || secret.length < 32) return null;
  if (!(await constantTimeEqual(signature, await hmac(encoded, secret)))) return null;
  try {
    return JSON.parse(new TextDecoder().decode(base64UrlDecode(encoded))) as T;
  } catch {
    return null;
  }
}

function cookieOptions(env: QuoteAppEnv, maxAge: number, path = "/") {
  return {
    httpOnly: true,
    secure: env.ENVIRONMENT === "production",
    sameSite: "Strict" as const,
    path,
    maxAge,
  };
}

function requestCookie(request: Request, name: string): string {
  return (request.headers.get("Cookie") ?? "").split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) ?? "";
}

async function loginKeys(request: Request, secret: string, username: string): Promise<[string, string]> {
  const ip = request.headers.get("CF-Connecting-IP") ?? "local";
  return Promise.all([
    hmac(`quote-login:ip:${ip}`, secret),
    hmac(`quote-login:account:${username.trim().toLowerCase()}`, secret),
  ]);
}

async function loginBlocked(env: QuoteAppEnv, keys: [string, string], now: number): Promise<boolean> {
  const row = await env.DB.prepare("SELECT MAX(locked_until) AS locked_until FROM login_attempts WHERE client_hash IN (?1,?2)")
    .bind(...keys).first<{ locked_until: number }>();
  return Number(row?.locked_until ?? 0) > now;
}

async function recordLoginFailure(env: QuoteAppEnv, key: string, now: number): Promise<void> {
  await env.DB.prepare(`
    INSERT INTO login_attempts(client_hash, failure_count, window_started_at, locked_until, updated_at)
    VALUES(?1,1,?2,0,?2)
    ON CONFLICT(client_hash) DO UPDATE SET
      failure_count=CASE WHEN window_started_at<=?3 THEN 1 ELSE failure_count+1 END,
      window_started_at=CASE WHEN window_started_at<=?3 THEN ?2 ELSE window_started_at END,
      locked_until=CASE
        WHEN (CASE WHEN window_started_at<=?3 THEN 1 ELSE failure_count+1 END)>=?4 THEN ?5
        ELSE 0
      END,
      updated_at=?2
  `).bind(key, now, now - LOGIN_WINDOW_SECONDS, MAX_LOGIN_FAILURES, now + LOGIN_WINDOW_SECONDS).run();
}

export async function issueLoginCsrf(c: Context<AppBindings>): Promise<Response> {
  noStore(c);
  if (c.env.SESSION_SECRET.length < 32) throw new HttpError(503, "Hệ thống đăng nhập chưa được cấu hình.");
  const now = Math.floor(Date.now() / 1000);
  const token = randomToken();
  const signed = await encodeSigned({ v: 1, token, iat: now, exp: now + LOGIN_CSRF_SECONDS }, c.env.SESSION_SECRET);
  setCookie(c, LOGIN_CSRF_COOKIE, signed, cookieOptions(c.env, LOGIN_CSRF_SECONDS, "/api/auth/login"));
  return c.json({ ok: true, csrf: token });
}

export async function login(c: Context<AppBindings>): Promise<Response> {
  noStore(c);
  if (!isAllowedOrigin(c.req.raw, c.env)) throw new HttpError(403, "Yêu cầu đăng nhập không hợp lệ.");
  const body = await c.req.json<{ username?: unknown; password?: unknown; csrf?: unknown }>();
  if (typeof body.username !== "string" || typeof body.password !== "string" || typeof body.csrf !== "string") {
    throw new HttpError(401, "Tên đăng nhập hoặc mật khẩu không đúng.");
  }
  const signedCsrf = getCookie(c, LOGIN_CSRF_COOKIE) ?? "";
  const csrfPayload = await decodeSigned<LoginCsrfPayload>(signedCsrf, c.env.SESSION_SECRET);
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (!csrfPayload || csrfPayload.exp <= nowSeconds || !(await constantTimeEqual(csrfPayload.token, body.csrf))) {
    throw new HttpError(403, "Phiên đăng nhập đã hết hạn. Vui lòng thử lại.");
  }
  deleteCookie(c, LOGIN_CSRF_COOKIE, { path: "/api/auth/login" });
  const normalizedUsername = body.username.trim().toLowerCase();
  if (normalizedUsername.length < 3 || normalizedUsername.length > 100 || body.password.length > 1_024 || body.csrf.length > 128) {
    throw new HttpError(401, "Tên đăng nhập hoặc mật khẩu không đúng.");
  }
  const keys = await loginKeys(c.req.raw, c.env.SESSION_SECRET, normalizedUsername);
  if (await loginBlocked(c.env, keys, nowSeconds)) throw new HttpError(429, "Đăng nhập tạm khóa 15 phút do có quá nhiều lần thử.");

  const row = await c.env.DB.prepare(`
    SELECT u.id, u.username, u.password_hash, u.full_name, u.phone, u.role, u.branch_id, u.is_active, u.must_change_password,
           b.code AS branch_code, b.name AS branch_name
    FROM users u LEFT JOIN branches b ON b.id=u.branch_id
    WHERE u.username=?1 COLLATE NOCASE AND u.deleted_at IS NULL
  `).bind(normalizedUsername).first<{
    id: string; username: string; password_hash: string; full_name: string; phone: string; role: "ADMIN" | "EMPLOYEE";
    branch_id: string | null; is_active: number; must_change_password: number; branch_code: string | null; branch_name: string | null;
  }>();
  const passwordValid = await verifyPassword(body.password, row?.password_hash ?? DUMMY_PASSWORD_HASH);
  if (!row || !passwordValid || row.is_active !== 1) {
    await Promise.all(keys.map((key) => recordLoginFailure(c.env, key, nowSeconds)));
    await writeAudit(c.env, { actorUserId: null, action: "LOGIN_FAILED", entityType: "AUTH", requestId: c.get("requestId") });
    throw new HttpError(401, "Tên đăng nhập hoặc mật khẩu không đúng.");
  }

  const sid = randomToken();
  const csrf = randomToken();
  const exp = nowSeconds + SESSION_SECONDS;
  const payload: TokenPayload = { v: 1, sid, csrf, iat: nowSeconds, exp };
  const now = isoNow();
  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM login_attempts WHERE client_hash IN (?1,?2)").bind(...keys),
    c.env.DB.prepare(`INSERT INTO sessions(id_hash,user_id,csrf_hash,created_at,expires_at,last_seen_at) VALUES(?1,?2,?3,?4,?5,?4)`)
      .bind(await sha256(sid), row.id, await sha256(csrf), now, new Date(exp * 1000).toISOString()),
    c.env.DB.prepare("UPDATE users SET last_login_at=?1, updated_at=?1 WHERE id=?2").bind(now, row.id),
  ]);
  await writeAudit(c.env, { actorUserId: row.id, action: "LOGIN_SUCCEEDED", entityType: "AUTH", entityId: row.id, requestId: c.get("requestId") });
  setCookie(c, SESSION_COOKIE, await encodeSigned(payload, c.env.SESSION_SECRET), cookieOptions(c.env, SESSION_SECONDS));
  return c.json({ ok: true, user: mapSessionUser(row), csrf });
}

function mapSessionUser(row: {
  id: string; username: string; full_name: string; phone: string; role: "ADMIN" | "EMPLOYEE"; branch_id: string | null;
  branch_code: string | null; branch_name: string | null; must_change_password?: number;
}): SessionUser {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    phone: row.phone,
    role: row.role,
    branchId: row.branch_id,
    branchCode: row.branch_code,
    branchName: row.branch_name,
    mustChangePassword: row.must_change_password === 1,
  };
}

export async function authenticate(c: Context<AppBindings>, next: Next): Promise<void> {
  noStore(c);
  const resolved = await resolveAuthenticatedUser(c.req.raw, c.env);
  if (!resolved) {
    if (getCookie(c, SESSION_COOKIE)) deleteCookie(c, SESSION_COOKIE, { path: "/" });
    throw new HttpError(401, "Vui lòng đăng nhập.");
  }
  c.set("user", resolved.user);
  c.set("csrf", resolved.csrf);
  c.set("sessionHash", resolved.sessionHash);
  await next();
}

export async function resolveAuthenticatedUser(
  request: Request,
  env: Pick<QuoteAppEnv, "DB" | "SESSION_SECRET">,
  now = Math.floor(Date.now() / 1000),
): Promise<ResolvedSession | null> {
  const token = requestCookie(request, SESSION_COOKIE);
  const payload = await decodeSigned<TokenPayload>(token, env.SESSION_SECRET);
  if (!payload || payload.v !== 1 || payload.exp <= now || payload.iat > now + 60) return null;
  const sessionHash = await sha256(payload.sid);
  const row = await env.DB.prepare(`
    SELECT u.id, u.username, u.full_name, u.phone, u.role, u.branch_id, u.is_active, u.must_change_password,
           b.code AS branch_code, b.name AS branch_name, s.csrf_hash, s.expires_at
    FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN branches b ON b.id=u.branch_id
    WHERE s.id_hash=?1 AND s.expires_at>?2 AND u.deleted_at IS NULL
  `).bind(sessionHash, new Date(now * 1000).toISOString()).first<{
    id: string; username: string; full_name: string; phone: string; role: "ADMIN" | "EMPLOYEE"; branch_id: string | null;
    is_active: number; must_change_password: number; branch_code: string | null; branch_name: string | null; csrf_hash: string; expires_at: string;
  }>();
  if (!row || row.is_active !== 1 || !(await constantTimeEqual(row.csrf_hash, await sha256(payload.csrf)))) return null;
  return { user: mapSessionUser(row), csrf: payload.csrf, sessionHash };
}

export function sessionInfo(c: Context<AppBindings>): Response {
  return c.json({ authenticated: true, user: c.get("user"), csrf: c.get("csrf") });
}

export async function changePasswordHandler(c: Context<AppBindings>): Promise<Response> {
  const body = await c.req.json<{ currentPassword?: unknown; newPassword?: unknown }>();
  if (typeof body.currentPassword !== "string" || typeof body.newPassword !== "string" || body.newPassword.length < 10 || body.newPassword.length > 1_024) {
    throw new HttpError(422, "Mật khẩu mới phải có ít nhất 10 ký tự.");
  }
  const user = c.get("user");
  const row = await c.env.DB.prepare("SELECT password_hash FROM users WHERE id=?1 AND deleted_at IS NULL").bind(user.id).first<{ password_hash: string }>();
  if (!row || !(await verifyPassword(body.currentPassword, row.password_hash))) throw new HttpError(401, "Mật khẩu hiện tại không đúng.");
  const now = isoNow();
  const [passwordHash, passwordCiphertext] = await Promise.all([
    hashPassword(body.newPassword),
    encryptPassword(body.newPassword, c.env.SESSION_SECRET),
  ]);
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE users SET password_hash=?1,password_ciphertext=?2,must_change_password=0,updated_at=?3 WHERE id=?4")
      .bind(passwordHash, passwordCiphertext, now, user.id),
    auditStatement(c.env, { actorUserId: user.id, action: "USER_PASSWORD_CHANGED", entityType: "USER", entityId: user.id, newData: { forcedFirstLogin: user.mustChangePassword }, requestId: c.get("requestId") }),
  ]);
  return c.json({ ok: true });
}

export async function requirePasswordChanged(c: Context<AppBindings>, next: Next): Promise<void> {
  if (c.get("user").mustChangePassword && !c.req.path.startsWith("/api/auth/")) throw new HttpError(409, "Vui lòng đổi mật khẩu trước khi tiếp tục.");
  await next();
}

export async function requireMutation(c: Context<AppBindings>, next: Next): Promise<void> {
  if (!isAllowedOrigin(c.req.raw, c.env)) throw new HttpError(403, "Nguồn yêu cầu không hợp lệ.");
  const provided = c.req.header("X-CSRF-Token") ?? "";
  if (!(await constantTimeEqual(provided, c.get("csrf")))) throw new HttpError(403, "CSRF token không hợp lệ.");
  await next();
}

export async function requireAdmin(c: Context<AppBindings>, next: Next): Promise<void> {
  if (c.get("user").role !== "ADMIN") throw new HttpError(403, "Bạn không có quyền truy cập trang quản trị.");
  await next();
}

export async function logout(c: Context<AppBindings>): Promise<Response> {
  await c.env.DB.prepare("DELETE FROM sessions WHERE id_hash=?1").bind(c.get("sessionHash")).run();
  await writeAudit(c.env, { actorUserId: c.get("user").id, action: "LOGOUT", entityType: "AUTH", requestId: c.get("requestId") });
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.json({ ok: true });
}
