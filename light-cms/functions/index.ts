const canonicalHost = "cms.mdftungphat.com";
const productionPagesHost = "tungphat-light-cms-production.pages.dev";

export async function onRequest(context: { request: Request; next: () => Promise<Response> }) {
  const url = new URL(context.request.url);
  if (url.hostname !== productionPagesHost) return context.next();
  url.hostname = canonicalHost;
  url.protocol = "https:";
  url.port = "";
  return new Response(null, { status: 308, headers: { Location: url.toString(), "Cache-Control": "no-store" } });
}
