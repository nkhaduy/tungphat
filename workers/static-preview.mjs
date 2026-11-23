const STAGING_CMS_ORIGIN = "https://tungphat-payload-cms-staging.nkhaduy.workers.dev";
const MEDIA_ALLOWLIST_PATH = "/_preview-media-allowlist.json";

/** Preview-only entry point. Staging R2 uploads are exposed only when referenced by published articles. */
export default {
  async fetch(request, env) {
    const incoming = new URL(request.url);
    let response;
    if (incoming.pathname === "/robots.txt") {
      response = new Response("User-agent: *\nDisallow: /\n", { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
    } else if (/^\/sitemap(?:-\d+)?\.xml$/iu.test(incoming.pathname)) {
      response = new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
    } else if (incoming.pathname === MEDIA_ALLOWLIST_PATH) {
      response = new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
    } else if (isPreviewUploadPath(incoming.pathname)) {
      if (request.method !== "GET" && request.method !== "HEAD") {
        response = new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
      } else if (!(await isPublishedUpload(incoming.pathname, env))) {
        response = new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
      } else {
        response = await proxyMedia(request, incoming, STAGING_CMS_ORIGIN);
      }
    } else if (incoming.pathname.startsWith("/catalog/")) {
      if (request.method !== "GET" && request.method !== "HEAD") {
        response = new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
      } else {
        response = await proxyMedia(request, incoming, "https://cms.mdftungphat.com");
      }
    } else {
      response = await env.ASSETS.fetch(request);
    }
    const result = new Response(response.body, response);
    result.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return result;
  },
};

function isPreviewUploadPath(pathname) {
  return /^\/(?:uploads|uploads-thumbnails)\//u.test(pathname);
}

async function isPublishedUpload(pathname, env) {
  try {
    const asset = await env.ASSETS.fetch(new Request(new URL(MEDIA_ALLOWLIST_PATH, "https://preview-assets.invalid")));
    if (!asset.ok) return false;
    const paths = await asset.json();
    return Array.isArray(paths) && paths.includes(pathname);
  } catch {
    return false;
  }
}

async function proxyMedia(request, incoming, origin) {
  const upstream = new URL(origin);
  upstream.pathname = `/media${incoming.pathname}`;
  upstream.search = incoming.search;
  const headers = new Headers();
  for (const name of ["accept", "range", "if-range", "if-none-match", "if-modified-since"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    return await fetch(new Request(upstream, {
      method: request.method, headers, redirect: "manual", signal: AbortSignal.timeout(15000),
    }));
  } catch {
    return new Response("Media origin unavailable", {
      status: 502, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    });
  }
}
