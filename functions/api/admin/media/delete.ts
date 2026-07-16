import { requireMediaAdmin, validateCsrf, validateMutationRequest } from "../../../_lib/admin-media-security";
import { isExactObjectKey } from "../../../_lib/media";
import { json } from "../../../_lib/http";

type DeletePayload = { key?: unknown; confirmation?: unknown };

export const onRequest: PagesFunction<CloudflareEnv> = async (context) => {
  const { request } = context;
  if (request.method !== "POST" && request.method !== "DELETE") return json({ ok: false, code: "method_not_allowed" }, 405, { Allow: "POST, DELETE" });
  const admin = requireMediaAdmin(request, context.env);
  if (admin instanceof Response) return admin;
  const mutationError = validateMutationRequest(request);
  if (mutationError) return mutationError;
  const csrfError = await validateCsrf(request);
  if (csrfError) return csrfError;
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (!Number.isSafeInteger(contentLength) || contentLength <= 0 || contentLength > 4096) return json({ ok: false, code: "invalid_payload_size" }, 413);

  let payload: DeletePayload;
  try {
    payload = await request.json<DeletePayload>();
  } catch {
    return json({ ok: false, code: "invalid_json" }, 400);
  }
  const key = typeof payload.key === "string" ? payload.key : "";
  if (!isExactObjectKey(key) || payload.confirmation !== key) return json({ ok: false, code: "delete_confirmation_required" }, 400);

  try {
    const source = await context.env.MEDIA.get(key);
    if (!source) return json({ ok: false, code: "not_found" }, 404);
    const now = new Date();
    const datePath = [now.getUTCFullYear(), String(now.getUTCMonth() + 1).padStart(2, "0"), String(now.getUTCDate()).padStart(2, "0")].join("/");
    const trashKey = `trash/${datePath}/${crypto.randomUUID()}-${key.split("/").pop()}`;
    await context.env.MEDIA.put(trashKey, source.body, {
      httpMetadata: source.httpMetadata,
      customMetadata: {
        ...(source.customMetadata || {}),
        originalKey: key,
        deletedAt: now.toISOString(),
        deletedBy: admin.email
      }
    });
    await context.env.MEDIA.delete(key);
    return json({ ok: true, key, trashKey }, 200);
  } catch (error) {
    console.error(JSON.stringify({ message: "media_delete_failed", key, error: error instanceof Error ? error.message.slice(0, 160) : "unknown" }));
    return json({ ok: false, code: "storage_unavailable" }, 503);
  }
};
