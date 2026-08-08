import type { Context } from "hono";

export class HttpError extends Error {
  constructor(public readonly status: 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 502 | 503, message: string) {
    super(message);
  }
}

export function isoNow(): string {
  return new Date().toISOString();
}

export function isAllowedOrigin(request: Request, env: QuoteAppEnv): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  if (origin === env.APP_ORIGIN) return true;
  try {
    const requestUrl = new URL(request.url);
    const originUrl = new URL(origin);
    const isLocalHost = requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1";
    return isLocalHost && originUrl.origin === requestUrl.origin;
  } catch {
    return false;
  }
}

export function noStore(c: Context): void {
  c.header("Cache-Control", "no-store, private");
  c.header("Pragma", "no-cache");
}

export function requiredParam(c: Context, name: string): string {
  const value = c.req.param(name);
  if (!value) throw new HttpError(404, "Không tìm thấy tài nguyên.");
  return value;
}
