const PRODUCTION_CMS_ORIGIN = "https://cms.mdftungphat.com";
const STAGING_CMS_ORIGIN = "https://tungphat-payload-cms-staging.nkhaduy.workers.dev";

const staticWorker = {
  async fetch(request, env) {
    const incoming = new URL(request.url);
    const isReleaseStaging = env.RELEASE_STAGING === "true";
    const applyStagingNoIndex = (response) => {
      if (!isReleaseStaging) return response;
      const headers = new Headers(response.headers);
      headers.set("X-Robots-Tag", "noindex, nofollow");
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    };

    if (isReleaseStaging && incoming.pathname === "/robots.txt") {
      return applyStagingNoIndex(
        new Response("User-agent: *\nDisallow: /\n", {
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
        return applyStagingNoIndex(
          new Response(null, { status: 405, headers: { Allow: "POST" } }),
        );
      }

      const contentType = request.headers.get("content-type") || "text/plain;charset=UTF-8";
      if (!/^(?:text\/plain|application\/json)(?:;|$)/i.test(contentType)) {
        return applyStagingNoIndex(new Response(null, { status: 415 }));
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
          return applyStagingNoIndex(
            await env.ANALYTICS_SERVICE.fetch(analyticsRequest),
          );
        }
        return applyStagingNoIndex(await fetch(analyticsRequest));
      } catch {
        return applyStagingNoIndex(
          new Response(null, { status: 502, headers: { "Cache-Control": "no-store" } }),
        );
      }
    }

    if (!incoming.pathname.startsWith("/catalog/")) {
      return applyStagingNoIndex(await env.ASSETS.fetch(request));
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return applyStagingNoIndex(
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
      return applyStagingNoIndex(await fetch(new Request(upstream, {
        method: request.method,
        headers,
        redirect: "manual",
        signal: AbortSignal.timeout(15_000),
      })));
    } catch {
      return applyStagingNoIndex(
        new Response("Media origin unavailable", {
          status: 502,
          headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
        }),
      );
    }
  },
};

export default staticWorker;
