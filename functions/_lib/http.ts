export const securityHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow"
};

export function json(data: unknown, status = 200, extraHeaders: HeadersInit = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...securityHeaders, ...extraHeaders } });
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  return origin === new URL(request.url).origin;
}
