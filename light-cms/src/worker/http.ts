import { randomToken } from "./security/crypto";

export const MAX_JSON_BYTES = 64 * 1024;

export type ApiErrorCode =
  | "unauthorized" | "forbidden" | "not_found" | "validation_failed" | "version_conflict"
  | "rate_limited" | "request_rejected" | "payload_too_large" | "method_not_allowed" | "internal_error";

export function requestId(request: Request) {
  const supplied = request.headers.get("X-Request-ID")?.trim();
  return supplied && /^[A-Za-z0-9._-]{8,80}$/u.test(supplied) ? supplied : randomToken(12);
}

export function securityHeaders(id: string, origin?: string) {
  const headers = new Headers({
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "X-Request-ID": id,
  });
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Vary", "Origin");
  }
  return headers;
}

export function jsonResponse(data: unknown, status: number, id: string, headers?: HeadersInit) {
  const responseHeaders = securityHeaders(id);
  new Headers(headers).forEach((value, key) => responseHeaders.set(key, value));
  return new Response(JSON.stringify(data), { status, headers: responseHeaders });
}

export function jsonError(id: string, status: number, code: ApiErrorCode, message = "Yêu cầu không thể thực hiện", fields?: Record<string, string>) {
  return jsonResponse({ ok: false, error: { code, message, requestId: id, ...(fields ? { fields } : {}) } }, status, id);
}

export async function readBoundedJson(request: Request, limit = MAX_JSON_BYTES): Promise<unknown | null> {
  const contentLength = request.headers.get("Content-Length");
  if (contentLength && (!/^\d+$/u.test(contentLength) || Number(contentLength) > limit)) return null;
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > limit) return null;
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    return null;
  }
}

export function parseCookies(request: Request) {
  return new Map((request.headers.get("Cookie") || "").split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const index = part.indexOf("=");
    return [index === -1 ? part : part.slice(0, index), index === -1 ? "" : part.slice(index + 1)] as const;
  }));
}
