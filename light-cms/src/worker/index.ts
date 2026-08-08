import { collectionSchemas, collectionNames, settingNames, settingSchemas, type CollectionName, type SettingName } from "../contracts/content";
import { createContent, getContent, listContent, listVersions, restoreVersion, softDeleteContent, updateContent } from "./repository";
import { constantTimeEqual, hmac, randomToken } from "./security/crypto";
import { authorize, type Permission } from "./security/rbac";
import { BaogiaJwtError } from "./security/baogia-jwt";
import { BaogiaSsoError, completeBaogiaSso, startBaogiaSso } from "./security/baogia-sso";
import { clearSessionCookie, requireMutation, revokeSession, verifySession, type VerifiedSession } from "./security/session";
import { jsonError, jsonResponse, readBoundedJson, requestId, securityHeaders } from "./http";
import { isAllowedImageType, matchesMagicBytes } from "./media/mime";
import { mediaObjectKey } from "./media/object-key";
import { fixedLengthStream, inspectAndHashStream } from "./media/stream";

export type LightCmsEnv = {
  DB: D1Database;
  MEDIA: R2Bucket;
  APP_SECRET: string;
  SESSION_SECRET: string;
  BAOGIA_SSO_ISSUER: string;
  BAOGIA_SSO_AUD: string;
  BAOGIA_SSO_PUBLIC_JWK: string;
  BAOGIA_SSO_KEY_ID: string;
  ENVIRONMENT?: string;
  ALLOWED_ORIGINS?: string;
  SERVICE_NAME?: string;
};

const collectionByRoute = new Map(collectionNames.map((name) => [name, name]));
const settingByRoute = new Map(settingNames.map((name) => [name, name]));
const maxMediaBytes = 15 * 1024 * 1024;

function allowedOrigins(env: LightCmsEnv) {
  return (env.ALLOWED_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean);
}

function withCors(response: Response, origin: string | null, env: LightCmsEnv) {
  if (!origin || !allowedOrigins(env).includes(origin)) return response;
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Vary", "Origin");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function idLike(value: string) {
  return /^[A-Za-z0-9_-]{1,120}$/u.test(value);
}

function collectionFromPath(value: string): CollectionName | null {
  return collectionByRoute.get(value as CollectionName) || null;
}

function settingFromPath(value: string): SettingName | null {
  return settingByRoute.get(value as SettingName) || null;
}

function currentUser(session: VerifiedSession) {
  return { id: session.userId, email: session.email, name: session.name, role: session.role };
}

function requirePermission(session: VerifiedSession, permission: Permission, id: string) {
  return authorize(session.role, permission) ? null : jsonError(id, 403, "forbidden", "Bạn không có quyền thực hiện thao tác này");
}

function isoNow() { return new Date().toISOString(); }

async function authenticate(
  request: Request,
  env: LightCmsEnv,
  id: string,
): Promise<{ session: VerifiedSession } | { response: Response }> {
  if (!env.SESSION_SECRET) return { response: jsonError(id, 503, "internal_error", "Phiên quản trị chưa được cấu hình") } as const;
  const session = await verifySession(request, env);
  return session ? { session } as const : { response: jsonError(id, 401, "unauthorized", "Phiên xác thực không hợp lệ") } as const;
}

async function usersRoute(request: Request, env: LightCmsEnv, id: string, session: VerifiedSession, userId?: string) {
  if (request.method === "GET" && !userId) {
    const denied = requirePermission(session, "users:read", id); if (denied) return denied;
    const rows = await env.DB.prepare(`SELECT id,baogia_username,COALESCE(display_name,name) AS display_name,role,status,last_login_at
      FROM users WHERE baogia_subject IS NOT NULL ORDER BY created_at ASC LIMIT 50`).all();
    return jsonResponse({ ok: true, data: rows.results, requestId: id }, 200, id);
  }
  return jsonError(id, 405, "method_not_allowed");
}

async function previewRoute(request: Request, env: LightCmsEnv, id: string, session: VerifiedSession | null, recordId: string) {
  if (!idLike(recordId)) return jsonError(id, 400, "validation_failed", "ID không hợp lệ");
  if (request.method === "POST") {
    if (!session) return jsonError(id, 401, "unauthorized", "Đăng nhập để tiếp tục");
    const denied = requirePermission(session, "preview:create", id); if (denied) return denied;
    if (!(await requireMutation(request, { allowedOrigins: allowedOrigins(env) }, session))) return jsonError(id, 403, "request_rejected", "CSRF hoặc Origin không hợp lệ");
    const record = await env.DB.prepare("SELECT id,version FROM content_records WHERE id=?1 AND deleted_at IS NULL").bind(recordId).first<{ id: string; version: number }>();
    if (!record) return jsonError(id, 404, "not_found", "Không tìm thấy nội dung");
    const payload = btoa(JSON.stringify({ id: record.id, version: record.version, exp: Math.floor(Date.now() / 1000) + 10 * 60 })).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
    return jsonResponse({ ok: true, data: { token: `${payload}.${await hmac(payload, env.APP_SECRET)}`, expiresIn: 600 }, requestId: id }, 200, id);
  }
  if (request.method === "GET") {
    const token = new URL(request.url).searchParams.get("token") || ""; const [body, signature] = token.split(".");
    if (!body || !signature || !constantTimeEqual(signature, await hmac(body, env.APP_SECRET))) return jsonError(id, 401, "unauthorized", "Preview token không hợp lệ");
    try {
      const padded = body.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(body.length / 4) * 4, "=");
      const payload = JSON.parse(atob(padded)) as { id: string; version: number; exp: number };
      if (payload.id !== recordId || payload.exp <= Math.floor(Date.now() / 1000)) return jsonError(id, 401, "unauthorized", "Preview token đã hết hạn");
      const record = await env.DB.prepare("SELECT id,collection,slug,title,status,content_json,version,updated_at FROM content_records WHERE id=?1 AND version=?2 AND deleted_at IS NULL").bind(recordId, payload.version).first();
      return record ? jsonResponse({ ok: true, data: record, requestId: id }, 200, id) : jsonError(id, 409, "version_conflict", "Nội dung preview đã thay đổi");
    } catch { return jsonError(id, 401, "unauthorized", "Preview token không hợp lệ"); }
  }
  return jsonError(id, 405, "method_not_allowed");
}

async function dashboard(env: LightCmsEnv, id: string) {
  const counts = await Promise.all(collectionNames.map(async (collection) => {
    const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM content_records WHERE collection=?1 AND deleted_at IS NULL").bind(collection).first<{ count: number }>();
    return [collection, Number(row?.count || 0)] as const;
  }));
  const published = await env.DB.prepare("SELECT COUNT(*) AS count FROM content_records WHERE status='published' AND deleted_at IS NULL").first<{ count: number }>();
  return jsonResponse({ ok: true, data: { counts: Object.fromEntries(counts), published: Number(published?.count || 0) }, requestId: id }, 200, id);
}

async function contentRoute(request: Request, env: LightCmsEnv, id: string, session: VerifiedSession, collection: CollectionName, recordId?: string) {
  if (request.method === "GET" && !recordId) {
    const denied = requirePermission(session, "content:read", id); if (denied) return denied;
    const url = new URL(request.url);
    return jsonResponse({ ok: true, data: await listContent(env.DB, collection, { limit: Number(url.searchParams.get("limit") || 20), cursor: url.searchParams.get("cursor") || undefined }), requestId: id }, 200, id);
  }
  if (request.method === "GET" && recordId) {
    const denied = requirePermission(session, "content:read", id); if (denied) return denied;
    if (!idLike(recordId)) return jsonError(id, 400, "validation_failed", "ID không hợp lệ");
    const record = await getContent(env.DB, recordId);
    if (!record || record.collection !== collection) return jsonError(id, 404, "not_found", "Không tìm thấy nội dung");
    return jsonResponse({ ok: true, data: record }, 200, id);
  }
  if (!recordId && request.method === "POST") {
    const denied = requirePermission(session, "content:create", id); if (denied) return denied;
    if (!(await requireMutation(request, { allowedOrigins: allowedOrigins(env) }, session))) return jsonError(id, 403, "request_rejected", "CSRF hoặc Origin không hợp lệ");
    const raw = await readBoundedJson(request); const result = collectionSchemas[collection].safeParse(raw);
    if (!result.success) return jsonError(id, 422, "validation_failed", "Dữ liệu nội dung không hợp lệ");
    const data = result.data as Record<string, unknown>;
    const recordIdNew = randomToken(18); const now = isoNow();
    await createContent(env.DB, { id: recordIdNew, collection, actorId: session.userId, requestId: id, now, slug: String(data.slug), title: String(data.title), status: "draft", excerpt: String(data.excerpt || ""), featuredImage: String(data.featuredImage || ""), contentJson: JSON.stringify(data), publishedAt: null });
    return jsonResponse({ ok: true, data: { id: recordIdNew, version: 1 }, requestId: id }, 201, id);
  }
  if (recordId && (request.method === "PATCH" || request.method === "PUT")) {
    const denied = requirePermission(session, "content:update", id); if (denied) return denied;
    if (!(await requireMutation(request, { allowedOrigins: allowedOrigins(env) }, session))) return jsonError(id, 403, "request_rejected", "CSRF hoặc Origin không hợp lệ");
    const raw = await readBoundedJson(request); const value = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    const expectedVersion = Number(value.expectedVersion ?? value.version);
    const result = collectionSchemas[collection].safeParse(value.data ?? value);
    if (!Number.isInteger(expectedVersion) || !result.success) return jsonError(id, 422, "validation_failed", "Dữ liệu hoặc version không hợp lệ");
    const data = result.data as Record<string, unknown>;
    const status = value.status === "published" ? "published" : "draft";
    if (status === "published" && !authorize(session.role, "content:publish")) return jsonError(id, 403, "forbidden", "Bạn không có quyền xuất bản");
    const outcome = await updateContent(env.DB, { id: recordId, collection, expectedVersion, actorId: session.userId, requestId: id, now: isoNow(), slug: String(data.slug), title: String(data.title), status, excerpt: String(data.excerpt || ""), featuredImage: String(data.featuredImage || ""), contentJson: JSON.stringify(data), publishedAt: status === "published" ? isoNow() : null });
    return outcome.conflict ? jsonError(id, 409, "version_conflict", "Nội dung đã được cập nhật; hãy tải lại trước khi lưu") : jsonResponse({ ok: true, data: outcome, requestId: id }, 200, id);
  }
  if (recordId && request.method === "DELETE") {
    const denied = requirePermission(session, "content:delete", id); if (denied) return denied;
    if (!(await requireMutation(request, { allowedOrigins: allowedOrigins(env) }, session))) return jsonError(id, 403, "request_rejected", "CSRF hoặc Origin không hợp lệ");
    const raw = await readBoundedJson(request); const version = raw && typeof raw === "object" ? Number((raw as { expectedVersion?: unknown }).expectedVersion) : NaN;
    if (!Number.isInteger(version)) return jsonError(id, 422, "validation_failed", "Thiếu version");
    const outcome = await softDeleteContent(env.DB, recordId, collection, version, session.userId, id, isoNow());
    return outcome.conflict ? jsonError(id, 409, "version_conflict", "Nội dung đã thay đổi") : jsonResponse({ ok: true, data: { deleted: true }, requestId: id }, 200, id);
  }
  return jsonError(id, 405, "method_not_allowed");
}

async function settingsRoute(request: Request, env: LightCmsEnv, id: string, session: VerifiedSession, setting: SettingName) {
  if (request.method === "GET") {
    const denied = requirePermission(session, "settings:read", id); if (denied) return denied;
    const row = await env.DB.prepare("SELECT key,content_json,version,updated_at FROM settings_records WHERE key=?1").bind(setting).first<{ key: string; content_json: string; version: number; updated_at: string }>();
    if (!row) return jsonError(id, 404, "not_found", "Chưa có setting");
    return jsonResponse({ ok: true, data: { key: row.key, version: row.version, updatedAt: row.updated_at, data: JSON.parse(row.content_json) } }, 200, id);
  }
  if (request.method === "PUT") {
    const denied = requirePermission(session, "settings:update", id); if (denied) return denied;
    if (!(await requireMutation(request, { allowedOrigins: allowedOrigins(env) }, session))) return jsonError(id, 403, "request_rejected", "CSRF hoặc Origin không hợp lệ");
    const raw = await readBoundedJson(request); const value = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    const parsed = settingSchemas[setting].safeParse(value.data ?? value); const expected = Number(value.expectedVersion ?? value.version);
    if (!parsed.success || !Number.isInteger(expected)) return jsonError(id, 422, "validation_failed", "Setting hoặc version không hợp lệ");
    const now = isoNow(); const result = await env.DB.prepare("UPDATE settings_records SET content_json=?1,version=version+1,updated_by=?2,updated_at=?3 WHERE key=?4 AND version=?5").bind(JSON.stringify(parsed.data), session.userId, now, setting, expected).run();
    if (Number(result.meta?.changes || 0) !== 1) return jsonError(id, 409, "version_conflict", "Setting đã được cập nhật");
    return jsonResponse({ ok: true, data: { key: setting, version: expected + 1 }, requestId: id }, 200, id);
  }
  return jsonError(id, 405, "method_not_allowed");
}

async function publicSnapshot(env: LightCmsEnv, id: string) {
  const result = await env.DB.prepare("SELECT collection,slug,status,content_json FROM content_records WHERE status='published' AND deleted_at IS NULL ORDER BY collection,slug").all<{ collection: CollectionName; slug: string; status: "published"; content_json: string }>();
  const records = result.results.map((row) => ({ collection: row.collection, status: row.status, slug: row.slug, data: JSON.parse(row.content_json) }));
  const settingsRows = await env.DB.prepare("SELECT key,content_json FROM settings_records").all<{ key: SettingName; content_json: string }>();
  const settings = Object.fromEntries(settingsRows.results.map((row) => [row.key, JSON.parse(row.content_json)]));
  const media = await env.DB.prepare("SELECT id,object_key,filename,mime_type,alt,width,height FROM media WHERE state='ready' AND deleted_at IS NULL").all<{ id: string; object_key: string; filename: string; mime_type: string; alt: string; width: number | null; height: number | null }>();
  const publicMedia = media.results.map((row) => ({ id: row.id, url: `/api/public/media/${encodeURIComponent(row.id)}`, filename: row.filename, mimeType: row.mime_type, alt: row.alt, width: row.width, height: row.height }));
  const generatedAt = new Date().toISOString();
  const unsigned = { schemaVersion: 1 as const, generatedAt, records, settings, media: publicMedia };
  const checksum = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(unsigned)));
  const hex = Array.from(new Uint8Array(checksum), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const stable = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify({ schemaVersion: unsigned.schemaVersion, records, settings, media: publicMedia })));
  const etag = Array.from(new Uint8Array(stable), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const response = jsonResponse({ ...unsigned, checksum: hex }, 200, id);
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  headers.set("ETag", `"${etag}"`);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function mediaRoute(request: Request, env: LightCmsEnv, id: string, session: VerifiedSession | null, mediaId?: string, publicRead = false) {
  if (publicRead && request.method === "GET" && mediaId) {
    const row = await env.DB.prepare("SELECT object_key,mime_type,filename FROM media WHERE id=?1 AND state='ready' AND deleted_at IS NULL").bind(mediaId).first<{ object_key: string; mime_type: string; filename: string }>();
    if (!row) return jsonError(id, 404, "not_found", "Không tìm thấy media");
    const object = await env.MEDIA.get(row.object_key); if (!object) return jsonError(id, 404, "not_found", "Không tìm thấy media");
    const headers = securityHeaders(id); headers.set("Cache-Control", "public, max-age=300"); headers.set("Content-Type", row.mime_type); headers.set("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(row.filename)}`);
    return new Response(object.body, { status: 200, headers });
  }
  if (!session) return jsonError(id, 401, "unauthorized", "Đăng nhập để tiếp tục");
  if (request.method === "GET" && !mediaId) {
    const denied = requirePermission(session, "media:read", id); if (denied) return denied;
    const rows = await env.DB.prepare("SELECT id,state,filename,mime_type,declared_size,actual_size,sha256,alt,width,height,created_at,ready_at FROM media WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 50").all();
    return jsonResponse({ ok: true, data: rows.results }, 200, id);
  }
  if (request.method === "POST" && !mediaId) {
    const denied = requirePermission(session, "media:create", id); if (denied) return denied;
    if (!(await requireMutation(request, { allowedOrigins: allowedOrigins(env) }, session))) return jsonError(id, 403, "request_rejected", "CSRF hoặc Origin không hợp lệ");
    const raw = await readBoundedJson(request); const value = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    const filename = typeof value.filename === "string" ? value.filename : ""; const mimeType = typeof value.mimeType === "string" ? value.mimeType : ""; const size = Number(value.size); const alt = typeof value.alt === "string" ? value.alt.trim() : "";
    if (!filename || filename.includes("/") || filename.includes("\\") || !isAllowedImageType(mimeType) || !Number.isInteger(size) || size < 1 || size > maxMediaBytes || alt.length < 3) return jsonError(id, 422, "validation_failed", "Metadata media không hợp lệ");
    const mediaIdNew = crypto.randomUUID(); const objectKey = mediaObjectKey(env.ENVIRONMENT, mediaIdNew, filename);
    await env.DB.prepare("INSERT INTO media(id,state,filename,object_key,mime_type,declared_size,alt,uploaded_by,created_at) VALUES(?1,'pending',?2,?3,?4,?5,?6,?7,?8)").bind(mediaIdNew, filename, objectKey, mimeType, size, alt, session.userId, isoNow()).run();
    return jsonResponse({ ok: true, data: { id: mediaIdNew, state: "pending", uploadUrl: `/api/media/${mediaIdNew}/file` }, requestId: id }, 201, id);
  }
  if (request.method === "PUT" && mediaId?.endsWith("/file")) {
    const actualId = mediaId.slice(0, -5); const denied = requirePermission(session, "media:create", id); if (denied) return denied;
    if (!(await requireMutation(request, { allowedOrigins: allowedOrigins(env) }, session))) return jsonError(id, 403, "request_rejected", "CSRF hoặc Origin không hợp lệ");
    const row = await env.DB.prepare("SELECT object_key,mime_type,declared_size,filename FROM media WHERE id=?1 AND state='pending' LIMIT 1").bind(actualId).first<{ object_key: string; mime_type: string; declared_size: number; filename: string }>();
    const contentLength = request.headers.get("Content-Length");
    const length = row?.declared_size || 0;
    if (!row || !request.body || length < 1 || length > maxMediaBytes || (contentLength !== null && (!/^\d+$/u.test(contentLength) || Number(contentLength) !== length))) return jsonError(id, 422, "validation_failed", "File upload không hợp lệ");
    if (!isAllowedImageType(row.mime_type)) return jsonError(id, 422, "validation_failed", "MIME không được hỗ trợ");
    const inspected = await inspectAndHashStream(request.body, maxMediaBytes);
    if (!matchesMagicBytes(row.mime_type, inspected.prefix)) return jsonError(id, 422, "validation_failed", "Nội dung file không khớp MIME");
    const fixed = fixedLengthStream(length);
    try {
      const [digest] = await Promise.all([
        inspected.digest,
        inspected.stream.pipeTo(fixed.writable),
        env.MEDIA.put(row.object_key, fixed.readable, { httpMetadata: { contentType: row.mime_type } }),
      ]);
      if (digest.size !== length) {
        await env.MEDIA.delete(row.object_key);
        return jsonError(id, 422, "validation_failed", "Kích thước file không khớp metadata");
      }
      const head = await env.MEDIA.head(row.object_key); if (!head) return jsonError(id, 500, "internal_error", "Không xác minh được file upload");
      const updated = await env.DB.prepare("UPDATE media SET state='ready',actual_size=?1,sha256=?2,ready_at=?3 WHERE id=?4 AND state='pending'").bind(length, digest.sha256, isoNow(), actualId).run();
      if (Number(updated.meta?.changes || 0) !== 1) {
        await env.MEDIA.delete(row.object_key);
        return jsonError(id, 409, "version_conflict", "Media upload đã được xử lý");
      }
      return jsonResponse({ ok: true, data: { id: actualId, state: "ready" }, requestId: id }, 200, id);
    } catch (error) {
      await env.MEDIA.delete(row.object_key).catch(() => undefined);
      if (error instanceof Error && /Upload (?:exceeds|is shorter)/u.test(error.message)) return jsonError(id, 422, "validation_failed", "Kích thước file không khớp metadata");
      throw error;
    }
  }
  if (request.method === "DELETE" && mediaId && !mediaId.includes("/")) {
    const denied = requirePermission(session, "media:delete", id); if (denied) return denied;
    if (!(await requireMutation(request, { allowedOrigins: allowedOrigins(env) }, session))) return jsonError(id, 403, "request_rejected", "CSRF hoặc Origin không hợp lệ");
    const row = await env.DB.prepare("SELECT object_key,thumbnail_key FROM media WHERE id=?1 AND deleted_at IS NULL LIMIT 1").bind(mediaId).first<{ object_key: string; thumbnail_key: string | null }>();
    if (!row) return jsonError(id, 404, "not_found", "Không tìm thấy media");
    await env.MEDIA.delete([row.object_key, ...(row.thumbnail_key ? [row.thumbnail_key] : [])]);
    await env.DB.batch([
      env.DB.prepare("UPDATE media SET state='deleted',deleted_at=?1 WHERE id=?2").bind(isoNow(), mediaId),
      env.DB.prepare("INSERT INTO audit_logs(id,actor_id,action,collection_key,record_id,request_id,metadata_json,created_at) VALUES(?1,?2,'media.delete','media',?3,?4,'{}',?5)").bind(randomToken(18), session.userId, mediaId, id, isoNow()),
    ]);
    return jsonResponse({ ok: true, data: { id: mediaId, deleted: true }, requestId: id }, 200, id);
  }
  return jsonError(id, 405, "method_not_allowed");
}

async function handle(request: Request, env: LightCmsEnv) {
  const id = requestId(request); const url = new URL(request.url); const origin = request.headers.get("Origin");
  if (request.method === "OPTIONS") {
    const headers = securityHeaders(id, allowedOrigins(env).includes(origin || "") ? origin || undefined : undefined);
    headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS"); headers.set("Access-Control-Allow-Headers", "Content-Type, X-CSRF-Token, X-Request-ID"); headers.set("Access-Control-Max-Age", "600");
    return new Response(null, { status: 204, headers });
  }
  if (url.pathname === "/health" && request.method === "GET") return jsonResponse({ ok: true, service: env.SERVICE_NAME || "tungphat-light-cms-api-staging", environment: env.ENVIRONMENT || "staging", requestId: id }, 200, id);
  if (!url.pathname.startsWith("/api/")) return jsonError(id, 404, "not_found", "Không tìm thấy endpoint");
  if (url.pathname === "/api/public/snapshot" && request.method === "GET") return publicSnapshot(env, id);
  if (url.pathname.startsWith("/api/public/media/")) return mediaRoute(request, env, id, null, decodeURIComponent(url.pathname.slice("/api/public/media/".length)), true);
  if (url.pathname === "/api/auth/sso/start" && request.method === "GET") return startBaogiaSso(request);
  if (url.pathname === "/api/auth/sso/callback" && request.method === "POST") return completeBaogiaSso(request, env);
  if (url.pathname.startsWith("/api/auth/") && !["/api/auth/session", "/api/auth/logout"].includes(url.pathname)) {
    return jsonError(id, 404, "not_found", "Không tìm thấy endpoint");
  }
  if (url.pathname === "/api/auth/session" && request.method === "GET") {
    const authenticated = await authenticate(request, env, id);
    if (!("session" in authenticated)) return authenticated.response;
    return jsonResponse({ ok: true, data: { user: currentUser(authenticated.session), csrf: authenticated.session.csrf, expiresAt: authenticated.session.expiresAt }, requestId: id }, 200, id);
  }
  const authenticated = await authenticate(request, env, id);
  if (!("session" in authenticated)) return authenticated.response;
  const session = authenticated.session;
  if (url.pathname === "/api/auth/logout" && request.method === "POST") {
    if (!(await requireMutation(request, { allowedOrigins: allowedOrigins(env) }, session))) return jsonError(id, 403, "request_rejected", "CSRF hoặc Origin không hợp lệ");
    const now = isoNow();
    await revokeSession(request, env);
    await env.DB.prepare(`INSERT INTO audit_logs(id,actor_id,action,collection_key,record_id,request_id,metadata_json,created_at)
      VALUES(?1,?2,'auth.logout','auth',?2,?3,'{}',?4)`).bind(randomToken(18), session.userId, id, now).run();
    const response = jsonResponse({ ok: true, data: { loggedOut: true }, requestId: id }, 200, id);
    response.headers.append("Set-Cookie", clearSessionCookie(new URL(request.url).protocol === "https:"));
    return response;
  }
  const parts = url.pathname.slice("/api/".length).split("/").filter(Boolean).map((part) => decodeURIComponent(part));
  if (parts[0] === "dashboard" && request.method === "GET") return dashboard(env, id);
  if (parts[0] === "users") return usersRoute(request, env, id, session, parts[1]);
  if (parts[0] === "preview" && parts[1]) return previewRoute(request, env, id, session, parts[1]);
  if (parts[0] === "media") return mediaRoute(request, env, id, session, parts.slice(1).join("/") || undefined);
  if (parts[0] === "settings" && parts[1]) {
    const setting = settingFromPath(parts[1]); if (!setting) return jsonError(id, 404, "not_found"); return settingsRoute(request, env, id, session, setting);
  }
  if (parts[0] === "versions" && parts[1] && request.method === "GET") {
    const denied = requirePermission(session, "version:read", id); if (denied) return denied; return jsonResponse({ ok: true, data: await listVersions(env.DB, parts[1]) }, 200, id);
  }
  if (parts[0] === "versions" && parts[1] && parts[2] === "restore" && request.method === "POST") {
    const denied = requirePermission(session, "version:restore", id); if (denied) return denied;
    if (!(await requireMutation(request, { allowedOrigins: allowedOrigins(env) }, session))) return jsonError(id, 403, "request_rejected", "CSRF hoặc Origin không hợp lệ");
    const raw = await readBoundedJson(request); const value = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    const outcome = await restoreVersion(env.DB, parts[1], Number(value.version), Number(value.expectedVersion), session.userId, id, isoNow());
    if (outcome.notFound) return jsonError(id, 404, "not_found", "Không tìm thấy version"); if (outcome.conflict) return jsonError(id, 409, "version_conflict", "Nội dung đã thay đổi"); return jsonResponse({ ok: true, data: outcome, requestId: id }, 200, id);
  }
  if (parts[0] === "audit" && request.method === "GET") {
    const denied = requirePermission(session, "audit:read", id); if (denied) return denied; return jsonResponse({ ok: true, data: (await env.DB.prepare("SELECT id,action,collection_key,record_id,request_id,metadata_json,created_at FROM audit_logs ORDER BY created_at DESC LIMIT 100").all()).results }, 200, id);
  }
  if (parts.length >= 1) {
    const collection = collectionFromPath(parts[0]); if (collection) return contentRoute(request, env, id, session, collection, parts[1]);
  }
  return jsonError(id, 404, "not_found", "Không tìm thấy endpoint");
}

const worker = {
  fetch(request: Request, env: LightCmsEnv) {
    const queryCount = { value: 0 };
    const db = {
      prepare(sql: string) { queryCount.value += 1; return env.DB.prepare(sql); },
      batch(statements: D1PreparedStatement[]) { return env.DB.batch(statements); },
    } as D1Database;
    const scopedEnv = { ...env, DB: db };
    return handle(request, scopedEnv).then((response) => {
      const headers = new Headers(response.headers); headers.set("X-D1-Query-Count", String(queryCount.value));
      return withCors(new Response(response.body, { status: response.status, statusText: response.statusText, headers }), request.headers.get("Origin"), env);
    }).catch((error: unknown) => {
      if (error instanceof BaogiaJwtError || error instanceof BaogiaSsoError) {
        const status = error.status;
        const code = status === 413 ? "payload_too_large" : status === 403 ? "forbidden" : status === 415 ? "request_rejected" : status === 503 ? "internal_error" : "unauthorized";
        const response = jsonError(requestId(request), status, code, status === 403 ? "Bạn không được cấp quyền quản trị" : "Yêu cầu đăng nhập không hợp lệ");
        response.headers.set("X-D1-Query-Count", String(queryCount.value));
        return response;
      }
      console.error(JSON.stringify({ message: "worker_request_failed", error: error instanceof Error ? error.message : "unknown" }));
      const response = jsonError(requestId(request), 500, "internal_error", "Lỗi hệ thống"); response.headers.set("X-D1-Query-Count", String(queryCount.value)); return response;
    });
  },
  async scheduled(_controller: ScheduledController, env: LightCmsEnv) {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const pending = await env.DB.prepare("SELECT id,object_key FROM media WHERE state='pending' AND created_at<?1 LIMIT 50").bind(cutoff).all<{ id: string; object_key: string }>();
    for (const row of pending.results) await env.MEDIA.delete(row.object_key);
    await env.DB.prepare("DELETE FROM media WHERE state='pending' AND created_at<?1").bind(cutoff).run();
  },
};

export default worker;
