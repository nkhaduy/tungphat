import { requireMediaAdmin, validateCsrf, validateMutationRequest } from "../../../_lib/admin-media-security";
import { MEDIA_TYPES, filenameMatchesType, generateMediaKey, isAllowedMediaType, mediaResponseObject, sniffMediaType } from "../../../_lib/media";
import { json } from "../../../_lib/http";

function decodeFilename(request: Request) {
  const encoded = request.headers.get("X-Media-Filename") || "";
  try {
    return decodeURIComponent(encoded).replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 255);
  } catch {
    return "";
  }
}

export const onRequest: PagesFunction<CloudflareEnv> = async (context) => {
  const { request } = context;
  if (request.method !== "POST") return json({ ok: false, code: "method_not_allowed" }, 405, { Allow: "POST" });
  const admin = requireMediaAdmin(request, context.env);
  if (admin instanceof Response) return admin;
  const mutationError = validateMutationRequest(request);
  if (mutationError) return mutationError;
  const csrfError = await validateCsrf(request);
  if (csrfError) return csrfError;

  const contentType = (request.headers.get("Content-Type") || "").split(";", 1)[0].trim().toLowerCase();
  const filename = decodeFilename(request);
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (!isAllowedMediaType(contentType)) return json({ ok: false, code: "unsupported_media_type" }, 415);
  if (!filename || !filenameMatchesType(filename, contentType)) return json({ ok: false, code: "filename_type_mismatch" }, 400);
  if (!Number.isSafeInteger(contentLength) || contentLength <= 0) return json({ ok: false, code: "content_length_required" }, 411);
  if (contentLength > MEDIA_TYPES[contentType].maxBytes) return json({ ok: false, code: "payload_too_large", maxBytes: MEDIA_TYPES[contentType].maxBytes }, 413);

  try {
    const body = await request.arrayBuffer();
    if (body.byteLength !== contentLength || body.byteLength > MEDIA_TYPES[contentType].maxBytes) return json({ ok: false, code: "invalid_content_length" }, 400);
    if (sniffMediaType(body) !== contentType) return json({ ok: false, code: "mime_signature_mismatch" }, 415);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const key = generateMediaKey(filename, contentType);
      if (await context.env.MEDIA.head(key)) continue;
      const uploaded = await context.env.MEDIA.put(key, body, {
        onlyIf: new Headers({ "If-None-Match": "*" }),
        httpMetadata: {
          contentType,
          cacheControl: "public, max-age=31536000, immutable",
          contentDisposition: `inline; filename="${key.split("/").pop()}"`
        },
        customMetadata: { originalName: filename, uploadedBy: admin.email }
      });
      if (!uploaded) continue;
      return json({ ok: true, media: mediaResponseObject(uploaded, context.env.NEXT_PUBLIC_MEDIA_BASE_URL) }, 201);
    }
    return json({ ok: false, code: "duplicate_key" }, 409);
  } catch (error) {
    console.error(JSON.stringify({ message: "media_upload_failed", error: error instanceof Error ? error.message.slice(0, 160) : "unknown" }));
    return json({ ok: false, code: "storage_unavailable" }, 503);
  }
};
