const ADMIN_COOKIE = "tp_cms_admin";
const SESSION_SECONDS = 12 * 60 * 60;

function encode(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decode(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  return atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
}

async function signature(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signed)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function readCookie(request: Request, name: string) {
  return (request.headers.get("Cookie") || "").split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) || "";
}

async function equal(left: string, right: string) {
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  let difference = x.length ^ y.length;
  for (let index = 0; index < x.length; index += 1) difference |= x[index] ^ y[index];
  return difference === 0;
}

export async function createAdminSessionCookie(secret: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload = encode(JSON.stringify({ role: "admin", iat: now, exp: now + SESSION_SECONDS, nonce: crypto.randomUUID() }));
  const token = `${payload}.${await signature(payload, secret)}`;
  return `${ADMIN_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_SECONDS}`;
}

export function clearAdminSessionCookie() {
  return `${ADMIN_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export async function hasValidAdminSession(request: Request, secret: string) {
  if (!secret || secret.length < 32) return false;
  const token = readCookie(request, ADMIN_COOKIE);
  if (!token.includes(".")) return false;
  const [payload, provided] = token.split(".", 2);
  if (!(await equal(provided, await signature(payload, secret)))) return false;
  try {
    const parsed = JSON.parse(decode(payload)) as { role?: string; iat?: number; exp?: number };
    const now = Math.floor(Date.now() / 1000);
    return parsed.role === "admin" && typeof parsed.iat === "number" && typeof parsed.exp === "number"
      && parsed.iat <= now + 60 && parsed.exp > now;
  } catch {
    return false;
  }
}
