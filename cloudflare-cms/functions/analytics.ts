export const onRequest: PagesFunction<CloudflareCmsEnv> = async ({ request }) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return Response.json({ ok: false, code: "method_not_allowed" }, {
      status: 405,
      headers: { Allow: "GET, HEAD", "Cache-Control": "private, no-store" },
    });
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/?view=analytics",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "X-Frame-Options": "DENY",
    },
  });
};
