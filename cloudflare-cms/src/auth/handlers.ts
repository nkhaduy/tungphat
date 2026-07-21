import { constantTimeEqual } from "./crypto";
import { json, readJson, validOrigin } from "./http";
import { clearLoginFailures, clientKey, loginBlocked, recordLoginFailure } from "./rate-limit";
import { verifyPassword } from "./password";
import {
  clearLegacyCookies,
  clearLoginCsrfCookie,
  clearSessionCookie,
  createLoginCsrf,
  createSession,
  revokeSession,
  validMutation,
  verifyLoginCsrf,
  verifySession,
} from "./session";

type AuthEnv = Pick<CloudflareCmsEnv,
  "DB" | "CMS_ALLOWED_ORIGINS" | "CMS_ADMIN_USERNAME" | "CMS_ADMIN_PASSWORD_HASH" | "CMS_SESSION_SECRET"
> & {
  CMS_ADMIN_PASSWORD_HASH_ARGON2ID?: string;
};

function configuredPasswordHash(env: AuthEnv) {
  return env.CMS_ADMIN_PASSWORD_HASH_ARGON2ID || env.CMS_ADMIN_PASSWORD_HASH;
}

function withCookies(response: Response, cookies: string[]) {
  const headers = new Headers(response.headers);
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function failedLogin(cookies: string[] = []) {
  return withCookies(json({ ok: false, code: "invalid_credentials", message: "Tên đăng nhập hoặc mật khẩu không đúng." }, 401), cookies);
}

export async function handleLoginCsrf(request: Request, env: AuthEnv) {
  if (request.method !== "GET") return json({ ok: false, code: "method_not_allowed" }, 405, { Allow: "GET" });
  if (!env.CMS_SESSION_SECRET || env.CMS_SESSION_SECRET.length < 32) return json({ ok: false, code: "auth_unavailable" }, 503);
  const result = await createLoginCsrf(env.CMS_SESSION_SECRET);
  return withCookies(json({ ok: true, csrf: result.token }), [result.cookie]);
}

export async function handleLogin(request: Request, env: AuthEnv) {
  if (request.method !== "POST") return json({ ok: false, code: "method_not_allowed" }, 405, { Allow: "POST" });
  if (!validOrigin(request, env)) return json({ ok: false, code: "origin_rejected" }, 403);
  const passwordHash = configuredPasswordHash(env);
  if (!env.CMS_SESSION_SECRET || env.CMS_SESSION_SECRET.length < 32 || !passwordHash) {
    return json({ ok: false, code: "auth_unavailable" }, 503);
  }
  const body = await readJson<{ username?: unknown; password?: unknown; csrf?: unknown }>(request);
  if (!body || typeof body.username !== "string" || typeof body.password !== "string" || typeof body.csrf !== "string"
    || body.username.length > 128 || body.password.length > 1024 || body.csrf.length > 256) {
    return failedLogin([clearLoginCsrfCookie()]);
  }
  if (!(await verifyLoginCsrf(request, env.CMS_SESSION_SECRET, body.csrf))) {
    return json({ ok: false, code: "request_rejected" }, 403);
  }

  const key = await clientKey(request, env.CMS_SESSION_SECRET);
  if (await loginBlocked(env, key)) return failedLogin([clearLoginCsrfCookie()]);

  const usernameMatches = constantTimeEqual(body.username, env.CMS_ADMIN_USERNAME || "");
  const passwordMatches = await verifyPassword(body.password, passwordHash);
  if (!usernameMatches || !passwordMatches) {
    await recordLoginFailure(env, key);
    return failedLogin([clearLoginCsrfCookie()]);
  }

  await revokeSession(request, env);
  const session = await createSession(env, env.CMS_ADMIN_USERNAME);
  await clearLoginFailures(env, key);
  return withCookies(json({ ok: true, user: { username: env.CMS_ADMIN_USERNAME }, csrf: session.csrf, expiresAt: session.expiresAt }), [
    session.cookie,
    clearLoginCsrfCookie(),
    ...clearLegacyCookies(),
  ]);
}

export async function handleSession(request: Request, env: AuthEnv) {
  if (request.method !== "GET") return json({ ok: false, code: "method_not_allowed" }, 405, { Allow: "GET" });
  const session = await verifySession(request, env);
  if (!session) return withCookies(json({ authenticated: false }, 401), [clearSessionCookie(), ...clearLegacyCookies()]);
  return withCookies(json({ authenticated: true, user: { username: session.username }, csrf: session.csrf, expiresAt: session.expiresAt }), clearLegacyCookies());
}

export async function handleLogout(request: Request, env: AuthEnv) {
  if (request.method !== "POST") return json({ ok: false, code: "method_not_allowed" }, 405, { Allow: "POST" });
  const session = await verifySession(request, env);
  if (session && !(await validMutation(request, env, session))) return json({ ok: false, code: "request_rejected" }, 403);
  await revokeSession(request, env);
  return withCookies(json({ ok: true }), [clearSessionCookie(), clearLoginCsrfCookie(), ...clearLegacyCookies()]);
}

export async function handleGatewayStatus(request: Request, env: AuthEnv) {
  if (request.method !== "GET") return json({ ok: false, code: "method_not_allowed" }, 405, { Allow: "GET" });
  const session = await verifySession(request, env);
  return session ? json({ ok: true, user: { username: session.username } }) : json({ ok: false, code: "unauthorized" }, 401);
}
