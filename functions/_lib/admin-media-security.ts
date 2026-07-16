import { isSameOrigin, json } from "./http";

const CSRF_COOKIE = "tp_media_csrf";

function cookieValue(request: Request, name: string) {
  const cookies = request.headers.get("Cookie") || "";
  for (const part of cookies.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return "";
}

function isLocalRequest(request: Request) {
  const hostname = new URL(request.url).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

export function requireMediaAdmin(request: Request, env: CloudflareEnv) {
  if (isLocalRequest(request) && env.MEDIA_LOCAL_DEV_BYPASS === "1") return { email: "local-media-admin@test.invalid" } as const;
  const email = request.headers.get("Cf-Access-Authenticated-User-Email")?.trim().toLowerCase() || "";
  const assertion = request.headers.get("Cf-Access-Jwt-Assertion")?.trim() || "";
  if (!email || !assertion) return json({ ok: false, code: "unauthorized" }, 401);
  const allowlist = (env.MEDIA_ADMIN_EMAILS || "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  if (allowlist.length > 0 && !allowlist.includes(email)) return json({ ok: false, code: "forbidden" }, 403);
  return { email } as const;
}

export function validateMutationRequest(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get("Host");
  if (!host || host !== url.host || !isSameOrigin(request)) return json({ ok: false, code: "origin_rejected" }, 403);
  return null;
}

export function issueCsrfToken(request: Request) {
  const token = crypto.randomUUID();
  const secure = isLocalRequest(request) ? "" : " Secure;";
  return {
    token,
    cookie: `${CSRF_COOKIE}=${encodeURIComponent(token)}; Path=/api/admin/media;${secure} SameSite=Strict; Max-Age=3600`
  };
}

async function secureEqual(left: string, right: string) {
  const encoder = new TextEncoder();
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right))
  ]);
  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let difference = leftBytes.length ^ rightBytes.length;
  for (let index = 0; index < leftBytes.length; index += 1) difference |= leftBytes[index] ^ rightBytes[index];
  return difference === 0;
}

export async function validateCsrf(request: Request) {
  const header = request.headers.get("X-CSRF-Token") || "";
  const cookie = cookieValue(request, CSRF_COOKIE);
  if (!header || !cookie || !(await secureEqual(header, cookie))) return json({ ok: false, code: "csrf_rejected" }, 403);
  return null;
}
