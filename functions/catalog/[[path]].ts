/** Preserve legacy catalogue URLs without buffering or substituting media. */
export const onRequest: PagesFunction = async ({ request }) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  }

  const incoming = new URL(request.url);
  const upstream = new URL("https://cms.mdftungphat.com");
  upstream.pathname = `/media${incoming.pathname}`;
  upstream.search = incoming.search;
  const headers = new Headers();
  for (const name of ["accept", "range", "if-range", "if-none-match", "if-modified-since"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    return await fetch(new Request(upstream, {
      method: request.method,
      headers,
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    }));
  } catch {
    return new Response("Media origin unavailable", {
      status: 502,
      headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    });
  }
};
