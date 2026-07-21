import { hmac } from "./crypto";

export const MAX_LOGIN_FAILURES = 5;
export const LOCKOUT_SECONDS = 15 * 60;
const WINDOW_SECONDS = 15 * 60;

type RateEnv = Pick<CloudflareCmsEnv, "DB" | "CMS_SESSION_SECRET">;

export async function clientKey(request: Request, secret: string) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  return hmac(`login:${ip}`, secret);
}
export async function loginBlocked(env: RateEnv, key: string, now = Math.floor(Date.now() / 1000)) {
  const row = await env.DB.prepare("SELECT locked_until FROM cms_login_attempts WHERE client_hash=?1")
    .bind(key).first<{ locked_until: number }>();
  return Number(row?.locked_until || 0) > now;
}

export async function recordLoginFailure(env: RateEnv, key: string, now = Math.floor(Date.now() / 1000)) {
  const row = await env.DB.prepare("SELECT failure_count, window_started_at FROM cms_login_attempts WHERE client_hash=?1")
    .bind(key).first<{ failure_count: number; window_started_at: number }>();
  const count = !row || row.window_started_at <= now - WINDOW_SECONDS ? 1 : row.failure_count + 1;
  const started = !row || row.window_started_at <= now - WINDOW_SECONDS ? now : row.window_started_at;
  const lockedUntil = count >= MAX_LOGIN_FAILURES ? now + LOCKOUT_SECONDS : 0;
  await env.DB.prepare(`
    INSERT INTO cms_login_attempts(client_hash,failure_count,window_started_at,locked_until,updated_at)
    VALUES(?1,?2,?3,?4,?5)
    ON CONFLICT(client_hash) DO UPDATE SET failure_count=?2,window_started_at=?3,locked_until=?4,updated_at=?5
  `).bind(key, count, started, lockedUntil, now).run();
  return { count, lockedUntil };
}

export async function clearLoginFailures(env: RateEnv, key: string) {
  await env.DB.prepare("DELETE FROM cms_login_attempts WHERE client_hash=?1").bind(key).run();
}
