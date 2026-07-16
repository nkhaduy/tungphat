import { requireMediaAdmin, issueCsrfToken } from "../../../_lib/admin-media-security";
import { isAllowedMediaType, isSafeListPrefix, mediaResponseObject } from "../../../_lib/media";
import { json } from "../../../_lib/http";

export const onRequest: PagesFunction<CloudflareEnv> = async (context) => {
  const { request } = context;
  if (request.method !== "GET") return json({ ok: false, code: "method_not_allowed" }, 405, { Allow: "GET" });
  const admin = requireMediaAdmin(request, context.env);
  if (admin instanceof Response) return admin;

  const url = new URL(request.url);
  const prefix = url.searchParams.get("prefix")?.trim() || "";
  const cursor = url.searchParams.get("cursor")?.trim() || undefined;
  const rawLimit = Number(url.searchParams.get("limit") || 30);
  const mime = url.searchParams.get("mime")?.trim().toLowerCase() || "";
  if (!Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > 100) return json({ ok: false, code: "invalid_limit" }, 400);
  if (!isSafeListPrefix(prefix) || (cursor && cursor.length > 2048)) return json({ ok: false, code: "invalid_pagination" }, 400);
  if (mime && mime !== "image" && mime !== "video" && mime !== "document" && !isAllowedMediaType(mime)) return json({ ok: false, code: "invalid_mime" }, 400);

  try {
    const listed = await context.env.MEDIA.list({ limit: rawLimit, prefix, cursor, include: ["httpMetadata", "customMetadata"] });
    const items = listed.objects
      .filter((object) => !object.key.startsWith("trash/"))
      .filter((object) => {
        const contentType = object.httpMetadata?.contentType || "";
        if (!mime) return true;
        if (mime === "image" || mime === "video") return contentType.startsWith(`${mime}/`);
        if (mime === "document") return contentType === "application/pdf";
        return contentType === mime;
      })
      .map((object) => mediaResponseObject(object, context.env.NEXT_PUBLIC_MEDIA_BASE_URL));
    const csrf = issueCsrfToken(request);
    return json({ ok: true, items, cursor: listed.truncated ? listed.cursor : null, truncated: listed.truncated, csrfToken: csrf.token, baseUrl: context.env.NEXT_PUBLIC_MEDIA_BASE_URL?.replace(/\/+$/, "") || null }, 200, { "Set-Cookie": csrf.cookie });
  } catch (error) {
    console.error(JSON.stringify({ message: "media_list_failed", error: error instanceof Error ? error.message.slice(0, 160) : "unknown" }));
    return json({ ok: false, code: "storage_unavailable" }, 503);
  }
};
