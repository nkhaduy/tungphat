const PRODUCTION_CMS_ORIGIN = "https://cms.mdftungphat.com";
const STAGING_CMS_ORIGIN = "https://tungphat-payload-cms-staging.nkhaduy.workers.dev";
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://cdn.mdftungphat.com https://cms.mdftungphat.com https://media.mdftungphat.com https://*.googleusercontent.com https://www.googletagmanager.com; font-src 'self' data:; connect-src 'self' https://cms.mdftungphat.com https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://www.google.com https://challenges.cloudflare.com; frame-src https://www.google.com https://challenges.cloudflare.com; media-src 'self' https://cdn.mdftungphat.com https://cms.mdftungphat.com https://media.mdftungphat.com; object-src 'none'; base-uri 'self'; frame-ancestors 'self' https://cms.mdftungphat.com https://tungphat-cms.pages.dev https://preview.tungphat-cms.pages.dev http://127.0.0.1:4174 http://localhost:4174; form-action 'self'; upgrade-insecure-requests",
};

const staticWorker = {
  async fetch(request, env) {
    const incoming = new URL(request.url);
    const isReleaseStaging = env.RELEASE_STAGING === "true";
    const isAnalyticsEndpoint = incoming.pathname === "/api/analytics/track";
    const applyWorkerHeaders = (response) => {
      const headers = new Headers(response.headers);
      for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
        if (!headers.has(name)) headers.set(name, value);
      }
      if (incoming.protocol === "https:" && !headers.has("Strict-Transport-Security")) {
        headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
      }
      if (isReleaseStaging || isAnalyticsEndpoint) {
        headers.set("X-Robots-Tag", "noindex, nofollow");
      }
      if (isAnalyticsEndpoint && !headers.has("Cache-Control")) {
        headers.set("Cache-Control", "no-store");
      }
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    };

    if (isReleaseStaging && incoming.pathname === "/robots.txt") {
      return applyWorkerHeaders(
        new Response("User-agent: *\nAllow: /\n", {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }),
      );
    }

    // Keep staging writes isolated even if its deploy-time analytics vars are missing or wrong.
    const analyticsOrigin = isReleaseStaging
      ? STAGING_CMS_ORIGIN
      : env.ANALYTICS_ORIGIN || env.CMS_ORIGIN || PRODUCTION_CMS_ORIGIN;
    const mediaOrigin = env.MEDIA_ORIGIN || env.CMS_ORIGIN || PRODUCTION_CMS_ORIGIN;

    if (incoming.pathname === "/api/analytics/track") {
      if (request.method !== "POST") {
        return applyWorkerHeaders(
          new Response(null, { status: 405, headers: { Allow: "POST" } }),
        );
      }

      const contentType = request.headers.get("content-type") || "text/plain;charset=UTF-8";
      if (!/^(?:text\/plain|application\/json)(?:;|$)/i.test(contentType)) {
        return applyWorkerHeaders(new Response(null, { status: 415 }));
      }

      try {
        const analyticsUrl = new URL("/api/analytics/track", analyticsOrigin);
        const analyticsRequest = new Request(analyticsUrl, {
          method: "POST",
          headers: { "Content-Type": contentType },
          body: request.body,
          duplex: "half",
          signal: AbortSignal.timeout(15_000),
        });
        if (typeof env.ANALYTICS_SERVICE?.fetch === "function") {
          return applyWorkerHeaders(
            await env.ANALYTICS_SERVICE.fetch(analyticsRequest),
          );
        }
        return applyWorkerHeaders(await fetch(analyticsRequest));
      } catch {
        return applyWorkerHeaders(
          new Response(null, { status: 502, headers: { "Cache-Control": "no-store" } }),
        );
      }
    }

    if (!incoming.pathname.startsWith("/catalog/")) {
      return applyWorkerHeaders(await env.ASSETS.fetch(request));
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return applyWorkerHeaders(
        new Response(null, {
          status: 405,
          headers: { Allow: "GET, HEAD", "X-Content-Type-Options": "nosniff" },
        }),
      );
    }

    const upstream = new URL(mediaOrigin);
    upstream.pathname = `/media${incoming.pathname}`;
    upstream.search = incoming.search;
    const headers = new Headers();
    for (const name of ["accept", "range", "if-range", "if-none-match", "if-modified-since"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }

    try {
      return applyWorkerHeaders(await fetch(new Request(upstream, {
        method: request.method,
        headers,
        redirect: "manual",
        signal: AbortSignal.timeout(15_000),
      })));
    } catch {
      return applyWorkerHeaders(
        new Response("Media origin unavailable", {
          status: 502,
          headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
        }),
      );
    }
  },
};

export default staticWorker;
