export const securityHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow"
};

type CorsEnv = {
  ENVIRONMENT: string;
  CORS_ALLOWED_ORIGINS: string;
  CORS_ALLOWED_ORIGIN_SUFFIXES?: string;
};

function entries(value: string | undefined) {
  return (value || "").split(",").map((entry) => entry.trim()).filter(Boolean);
}

export function allowedOrigin(request: Request, env: CorsEnv) {
  const origin = request.headers.get("Origin");
  if (!origin) return null;
  if (entries(env.CORS_ALLOWED_ORIGINS).includes(origin)) return origin;
  if (env.ENVIRONMENT !== "production") {
    try {
      const hostname = new URL(origin).hostname;
      if (entries(env.CORS_ALLOWED_ORIGIN_SUFFIXES).some((suffix) => hostname.endsWith(suffix))) return origin;
    } catch {
      return null;
    }
  }
  return null;
}

export function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    Vary: "Origin"
  };
}

export function json(data: unknown, status = 200, origin?: string | null, extraHeaders: HeadersInit = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...securityHeaders,
      ...(origin ? corsHeaders(origin) : {}),
      ...extraHeaders
    }
  });
}

export function preflight(request: Request, env: CorsEnv) {
  const origin = allowedOrigin(request, env);
  if (!origin) return json({ ok: false, code: "origin_rejected" }, 403);
  return new Response(null, { status: 204, headers: { ...securityHeaders, ...corsHeaders(origin) } });
}
