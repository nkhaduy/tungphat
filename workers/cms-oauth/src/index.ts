type OAuthTokenResponse = { access_token?: string; error?: string; error_description?: string };

function base64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function readCookie(request: Request, name: string) {
  const cookie = request.headers.get("Cookie") || "";
  return cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) || "";
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function createState(env: Env) {
  const payload = base64Url(JSON.stringify({ createdAt: Date.now(), nonce: crypto.randomUUID() }));
  return `${payload}.${await sign(payload, env.OAUTH_STATE_SECRET)}`;
}

async function validState(state: string, cookieState: string, env: Env) {
  if (!state || state !== cookieState || !state.includes(".")) return false;
  const [payload, provided] = state.split(".", 2);
  const expected = await sign(payload, env.OAUTH_STATE_SECRET);
  const [a, b] = await Promise.all([crypto.subtle.digest("SHA-256", new TextEncoder().encode(provided)), crypto.subtle.digest("SHA-256", new TextEncoder().encode(expected))]);
  const left = new Uint8Array(a);
  const right = new Uint8Array(b);
  let difference = left.length ^ right.length;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  if (difference !== 0) return false;
  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed: unknown = JSON.parse(json);
    return Boolean(parsed && typeof parsed === "object" && "createdAt" in parsed && typeof parsed.createdAt === "number" && Date.now() - parsed.createdAt < 600_000);
  } catch { return false; }
}

function htmlResponse(status: "success" | "error", token: string, origin: string) {
  const message = `authorization:github:${status}:${JSON.stringify({ token })}`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Decap OAuth</title></head><body><p>Đang hoàn tất đăng nhập…</p><script>const origin=${JSON.stringify(origin)};const message=${JSON.stringify(message)};function receive(){window.opener.postMessage(message,origin);window.removeEventListener('message',receive);window.close()}window.addEventListener('message',receive);window.opener.postMessage('authorizing:github',origin);setTimeout(receive,800);</script></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Content-Security-Policy": `default-src 'none'; script-src 'unsafe-inline'; style-src 'none'; img-src 'none'; frame-ancestors 'none'; base-uri 'none'`, "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow" } });
}

async function handleAuth(env: Env) {
  const state = await createState(env);
  const scope = env.GITHUB_REPO_PRIVATE === "1" ? "repo" : "public_repo";
  const target = new URL("https://github.com/login/oauth/authorize");
  target.search = new URLSearchParams({ client_id: env.GITHUB_OAUTH_ID, redirect_uri: env.OAUTH_CALLBACK_URL, scope, state }).toString();
  return new Response(null, { status: 302, headers: { Location: target.toString(), "Cache-Control": "no-store", "Set-Cookie": `decap_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600` } });
}

async function handleCallback(request: Request, env: Env) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  if (!code || !(await validState(state, readCookie(request, "decap_oauth_state"), env))) return htmlResponse("error", "invalid_oauth_state", env.CMS_ORIGIN);
  const response = await fetch("https://github.com/login/oauth/access_token", { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify({ client_id: env.GITHUB_OAUTH_ID, client_secret: env.GITHUB_OAUTH_SECRET, code, redirect_uri: env.OAUTH_CALLBACK_URL }) });
  const result: OAuthTokenResponse = await response.json();
  if (!response.ok || !result.access_token) {
    console.error(JSON.stringify({ message: "oauth_exchange_failed", error: result.error || response.status }));
    return htmlResponse("error", "oauth_exchange_failed", env.CMS_ORIGIN);
  }
  return htmlResponse("success", result.access_token, env.CMS_ORIGIN);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/auth" && request.method === "GET") return handleAuth(env);
      if (url.pathname === "/callback" && request.method === "GET") return handleCallback(request, env);
      if (url.pathname === "/logout") return new Response(null, { status: 302, headers: { Location: `${env.CMS_ORIGIN}/admin/`, "Set-Cookie": "decap_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0", "Cache-Control": "no-store" } });
      if (url.pathname === "/health") return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
      return new Response("Not found", { status: 404 });
    } catch (error) {
      console.error(JSON.stringify({ message: "oauth_request_failed", path: url.pathname, error: error instanceof Error ? error.message.slice(0, 160) : "unknown" }));
      return htmlResponse("error", "internal_error", env.CMS_ORIGIN);
    }
  }
} satisfies ExportedHandler<Env>;
