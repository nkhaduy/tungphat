type EntryEnv = { ACCESS_ADMIN_ORIGIN?: string };

const customAdminHost = "cms.mdftungphat.com";
const accessAdminOrigin = "https://tungphat-light-cms-production.pages.dev";

export async function onRequest(context: { request: Request; env: EntryEnv; next: () => Promise<Response> }) {
  const url = new URL(context.request.url);
  if (url.hostname !== customAdminHost) return context.next();

  if (context.env.ACCESS_ADMIN_ORIGIN !== accessAdminOrigin) {
    return new Response("Admin identity gateway is not configured", { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  const location = new URL(`${url.pathname}${url.search}`, accessAdminOrigin);
  return new Response(null, { status: 302, headers: { Location: location.toString(), "Cache-Control": "no-store" } });
}
