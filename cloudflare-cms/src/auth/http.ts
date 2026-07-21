export const MAX_AUTH_BODY_BYTES = 8 * 1024;

export function securityHeaders(extra: HeadersInit = {}) {
  return new Headers({
    "Cache-Control": "private, no-store, max-age=0",
    Pragma: "no-cache",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    "Referrer-Policy": "no-referrer",
    ...extra,
  });
}
export function json(data: unknown, status = 200, extra: HeadersInit = {}) {
  return Response.json(data, { status, headers: securityHeaders(extra) });
}

export function allowedOrigins(env: Pick<CloudflareCmsEnv, "CMS_ALLOWED_ORIGINS">) {
  return env.CMS_ALLOWED_ORIGINS.split(",").map((value) => value.trim()).filter(Boolean);
}

export function validOrigin(request: Request, env: Pick<CloudflareCmsEnv, "CMS_ALLOWED_ORIGINS">) {
  const origin = request.headers.get("Origin");
  return Boolean(origin && allowedOrigins(env).includes(origin));
}

export async function readJson<T>(request: Request, maximum = MAX_AUTH_BODY_BYTES): Promise<T | null> {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if ((contentLength && !Number.isFinite(contentLength)) || contentLength > maximum) return null;
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > maximum) return null;
  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}
