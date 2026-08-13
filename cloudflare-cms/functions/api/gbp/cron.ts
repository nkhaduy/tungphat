import { syncGbp } from "../../../src/gbp/sync";

export const onRequest: PagesFunction<CloudflareCmsEnv & { GBP_CRON_SECRET?: string }> = async ({ request, env }) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const expected = env.GBP_CRON_SECRET || "";
  const supplied = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!expected || supplied.length !== expected.length) return new Response("Unauthorized", { status: 401 });
  const left = new TextEncoder().encode(supplied); const right = new TextEncoder().encode(expected); let different = 0;
  for (let index = 0; index < left.length; index += 1) different |= left[index] ^ right[index];
  if (different !== 0) return new Response("Unauthorized", { status: 401 });
  try { return Response.json(await syncGbp(env), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { console.error(JSON.stringify({ message: "gbp_cron_failed", error: error instanceof Error ? error.message.slice(0, 100) : "unknown" })); return Response.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
};
