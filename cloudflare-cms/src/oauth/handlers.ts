type OAuthTokenResponse = { access_token?: string; error?: string; error_description?: string };
type GitHubEmail = { email?: string; primary?: boolean; verified?: boolean };
import { clearAdminSessionCookie, createAdminSessionCookie } from "./admin-session";

export type OAuthEnv = {
  CMS_ALLOWED_ORIGINS: string;
  CMS_SITE_IDS: string;
  OAUTH_CALLBACK_URL: string;
  OAUTH_ALLOWED_EMAIL: string;
  GITHUB_REPO_PRIVATE: string;
  GITHUB_OAUTH_ID: string;
  GITHUB_OAUTH_SECRET: string;
  OAUTH_STATE_SECRET: string;
};

type StatePayload = {
  createdAt: number;
  nonce: string;
  origin: string;
  purpose: "cms" | "analytics";
};
const STATE_COOKIE = "decap_oauth_state";
const STATE_MAX_AGE_SECONDS = 600;

function entries(value: string) {
  return value.split(",").map((entry) => entry.trim()).filter(Boolean);
}

function base64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  return atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
}

function readCookie(request: Request, name: string) {
  const cookie = request.headers.get("Cookie") || "";
  return cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) || "";
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function createState(origin: string, purpose: StatePayload["purpose"], env: OAuthEnv) {
  const payload = base64Url(JSON.stringify({
    createdAt: Date.now(),
    nonce: crypto.randomUUID(),
    origin,
    purpose,
  } satisfies StatePayload));
  return `${payload}.${await sign(payload, env.OAUTH_STATE_SECRET)}`;
}

async function readValidState(state: string, cookieState: string, env: OAuthEnv): Promise<StatePayload | null> {
  if (!state || !cookieState || state !== cookieState || !state.includes(".")) return null;
  const [payload, provided] = state.split(".", 2);
  const expected = await sign(payload, env.OAUTH_STATE_SECRET);
  const encoder = new TextEncoder();
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected))
  ]);
  const left = new Uint8Array(providedHash);
  const right = new Uint8Array(expectedHash);
  let difference = left.length ^ right.length;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  if (difference !== 0) return null;
  try {
    const parsed: unknown = JSON.parse(fromBase64Url(payload));
    if (!parsed || typeof parsed !== "object") return null;
    const candidate = parsed as Partial<StatePayload>;
    if (typeof candidate.createdAt !== "number" || typeof candidate.nonce !== "string" || typeof candidate.origin !== "string") return null;
    if (candidate.purpose !== "cms" && candidate.purpose !== "analytics") return null;
    if (Date.now() - candidate.createdAt >= STATE_MAX_AGE_SECONDS * 1000) return null;
    if (!entries(env.CMS_ALLOWED_ORIGINS).includes(candidate.origin)) return null;
    return candidate as StatePayload;
  } catch {
    return null;
  }
}

function responseHeaders(extra: HeadersInit = {}) {
  return {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    ...extra
  };
}

function htmlResponse(status: "success" | "error", token: string, origin: string, clearCookie = false, adminCookie?: string) {
  const message = `authorization:github:${status}:${JSON.stringify({ token })}`;
  const nonce = base64Url(crypto.randomUUID());
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Decap OAuth</title></head><body><p>Đang hoàn tất đăng nhập…</p><script nonce="${nonce}">const origin=${JSON.stringify(origin)};const message=${JSON.stringify(message)};function receive(){window.opener.postMessage(message,origin);window.removeEventListener('message',receive);window.close()}window.addEventListener('message',receive);window.opener.postMessage('authorizing:github',origin);setTimeout(receive,800);</script></body></html>`;
  const headers = new Headers(responseHeaders({
    "Content-Type": "text/html; charset=utf-8",
    "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'none'; img-src 'none'; frame-ancestors 'none'; base-uri 'none'`,
  }));
  if (clearCookie) headers.append("Set-Cookie", `${STATE_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
  if (adminCookie) headers.append("Set-Cookie", adminCookie);
  return new Response(html, { headers });
}

function analyticsResponse(origin: string, adminCookie: string) {
  const headers = new Headers(responseHeaders({
    Location: new URL("/analytics/", origin).toString(),
  }));
  headers.append("Set-Cookie", `${STATE_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
  headers.append("Set-Cookie", adminCookie);
  return new Response(null, { status: 302, headers });
}

function analyticsError(origin: string, code: string) {
  const retry = new URL("/analytics/login", origin).toString();
  const cms = new URL("/", origin).toString();
  const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Không thể mở Thống kê</title></head><body><main><h1>Chưa thể mở Thống kê</h1><p>Mã lỗi: ${code}</p><p><a href="${retry}">Đăng nhập lại</a> · <a href="${cms}">Quay về quản lý nội dung</a></p></main></body></html>`;
  return new Response(html, {
    status: 401,
    headers: responseHeaders({
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    }),
  });
}

function requestOrigin(request: Request, env: OAuthEnv) {
  const origin = new URL(request.url).origin;
  return entries(env.CMS_ALLOWED_ORIGINS).includes(origin) ? origin : null;
}

async function accountAllowed(accessToken: string, env: OAuthEnv) {
  const response = await fetch("https://api.github.com/user/emails", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "tungphat-decap-cms",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });
  if (!response.ok) return false;
  const emails: unknown = await response.json();
  if (!Array.isArray(emails)) return false;
  const allowed = env.OAUTH_ALLOWED_EMAIL.trim().toLowerCase();
  return emails.some((entry: GitHubEmail) => entry.verified === true && entry.email?.trim().toLowerCase() === allowed);
}

export async function handleAuth(request: Request, env: OAuthEnv) {
  if (request.method !== "GET") return new Response("Method not allowed", { status: 405, headers: responseHeaders({ Allow: "GET" }) });
  const url = new URL(request.url);
  const purpose: StatePayload["purpose"] = url.pathname === "/analytics/login" ? "analytics" : "cms";
  const origin = requestOrigin(request, env);
  const siteId = purpose === "analytics" ? url.hostname : url.searchParams.get("site_id") || "";
  if (!origin || !entries(env.CMS_SITE_IDS).includes(siteId)) {
    return new Response("Invalid CMS site", { status: 403, headers: responseHeaders() });
  }
  if (!env.OAUTH_STATE_SECRET || env.OAUTH_STATE_SECRET.length < 32 || !env.GITHUB_OAUTH_ID) {
    return new Response("OAuth unavailable", { status: 503, headers: responseHeaders() });
  }
  const state = await createState(origin, purpose, env);
  const scope = env.GITHUB_REPO_PRIVATE === "1" ? "repo,user:email" : "public_repo,user:email";
  const target = new URL("https://github.com/login/oauth/authorize");
  target.search = new URLSearchParams({
    client_id: env.GITHUB_OAUTH_ID,
    redirect_uri: env.OAUTH_CALLBACK_URL,
    scope,
    state
  }).toString();
  return new Response(null, {
    status: 302,
    headers: responseHeaders({
      Location: target.toString(),
      "Set-Cookie": `${STATE_COOKIE}=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${STATE_MAX_AGE_SECONDS}`
    })
  });
}

export async function handleCallback(request: Request, env: OAuthEnv) {
  if (request.method !== "GET") return new Response("Method not allowed", { status: 405, headers: responseHeaders({ Allow: "GET" }) });
  const origin = requestOrigin(request, env);
  if (!origin) return new Response("Invalid CMS origin", { status: 403, headers: responseHeaders() });
  const url = new URL(request.url);
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  const statePayload = await readValidState(state, readCookie(request, STATE_COOKIE), env);
  if (!code || !statePayload || statePayload.origin !== origin) {
    if (statePayload?.purpose === "analytics") return analyticsError(origin, "invalid_oauth_state");
    return htmlResponse("error", "invalid_oauth_state", origin, true);
  }

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_OAUTH_ID,
      client_secret: env.GITHUB_OAUTH_SECRET,
      code,
      redirect_uri: env.OAUTH_CALLBACK_URL
    })
  });
  const result: OAuthTokenResponse = await response.json();
  if (!response.ok || !result.access_token) {
    console.error(JSON.stringify({ message: "oauth_exchange_failed", error: result.error || response.status }));
    if (statePayload.purpose === "analytics") return analyticsError(origin, "oauth_exchange_failed");
    return htmlResponse("error", "oauth_exchange_failed", origin, true);
  }
  if (!(await accountAllowed(result.access_token, env))) {
    console.warn(JSON.stringify({ message: "oauth_account_rejected" }));
    if (statePayload.purpose === "analytics") return analyticsError(origin, "unauthorized_account");
    return htmlResponse("error", "unauthorized_account", origin, true);
  }
  const adminCookie = await createAdminSessionCookie(env.OAUTH_STATE_SECRET);
  if (statePayload.purpose === "analytics") return analyticsResponse(origin, adminCookie);
  return htmlResponse("success", result.access_token, origin, true, adminCookie);
}

export function handleHealth(request: Request) {
  if (request.method !== "GET") return new Response("Method not allowed", { status: 405, headers: responseHeaders({ Allow: "GET" }) });
  return Response.json({ ok: true, service: "tungphat-cms" }, { headers: responseHeaders() });
}

export function handleLogout(request: Request, env: OAuthEnv) {
  const origin = requestOrigin(request, env);
  if (!origin) return new Response("Invalid CMS origin", { status: 403, headers: responseHeaders() });
  const headers = new Headers(responseHeaders({
    Location: `${origin}/`,
  }));
  headers.append("Set-Cookie", `${STATE_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
  headers.append("Set-Cookie", clearAdminSessionCookie());
  return new Response(null, {
    status: 302,
    headers,
  });
}
