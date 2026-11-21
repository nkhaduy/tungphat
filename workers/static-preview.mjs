/** Preview-only entry point: retain the existing Pages media proxy semantics. */
export default {
  async fetch(request, env) {
    const incoming = new URL(request.url);
    let response;
    if (incoming.pathname.startsWith("/catalog/")) {
      if (request.method !== "GET" && request.method !== "HEAD") {
        response = new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
      } else {
        const upstream = new URL("https://cms.mdftungphat.com");
        upstream.pathname = `/media${incoming.pathname}`;
        upstream.search = incoming.search;
        const headers = new Headers();
        for (const name of ["accept", "range", "if-range", "if-none-match", "if-modified-since"]) {
          const value = request.headers.get(name);
          if (value) headers.set(name, value);
        }
        try {
          response = await fetch(new Request(upstream, {
            method: request.method, headers, redirect: "manual", signal: AbortSignal.timeout(15000),
          }));
        } catch {
          response = new Response("Media origin unavailable", {
            status: 502, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
          });
        }
      }
    } else {
      response = await env.ASSETS.fetch(request);
    }
    const result = new Response(response.body, response);
    result.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return result;
  },
};
