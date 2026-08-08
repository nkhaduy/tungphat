interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  BENCHMARK_TOKEN: string;
}

type ContentInput = {
  title?: unknown;
  body?: unknown;
  version?: unknown;
};

const JSON_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: JSON_HEADERS });
}

function bytes(value: string) {
  return new TextEncoder().encode(value);
}

async function digest(value: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes(value)));
}

async function authorized(request: Request, env: Env) {
  const provided = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!provided || !env.BENCHMARK_TOKEN) return false;
  const [left, right] = await Promise.all([digest(provided), digest(env.BENCHMARK_TOKEN)]);
  let difference = left.length ^ right.length;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

function validId(value: string) {
  return /^[a-z0-9-]{1,80}$/.test(value);
}

async function readJson(request: Request): Promise<ContentInput | null> {
  const length = Number(request.headers.get("Content-Length") || "0");
  if (length > 64 * 1024) return null;
  try {
    const value: unknown = await request.json();
    return value && typeof value === "object" ? value as ContentInput : null;
  } catch {
    return null;
  }
}

async function handleContent(request: Request, env: Env, url: URL) {
  const id = url.pathname.slice("/api/content/".length);
  if (request.method === "GET" && !id) {
    const type = url.searchParams.get("type") || "products";
    const requestedLimit = Number(url.searchParams.get("limit") || "20");
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 20;
    if (!new Set(["products", "articles", "projects", "pages"]).has(type)) return json({ ok: false, code: "invalid_type" }, 400);
    const rows = await env.DB.prepare(`
      SELECT id, type, slug, title, version, updated_at
      FROM benchmark_content
      WHERE type = ?1
      ORDER BY updated_at DESC
      LIMIT ?2
    `).bind(type, limit).all();
    return json({ ok: true, items: rows.results });
  }

  if (!validId(id)) return json({ ok: false, code: "invalid_id" }, 400);
  if (request.method === "GET") {
    const row = await env.DB.prepare(`
      SELECT id, type, slug, title, body, version, updated_at
      FROM benchmark_content
      WHERE id = ?1
      LIMIT 1
    `).bind(id).first();
    return row ? json({ ok: true, item: row }) : json({ ok: false, code: "not_found" }, 404);
  }

  if (request.method === "PUT") {
    const input = await readJson(request);
    if (!input || typeof input.title !== "string" || input.title.length < 5 || input.title.length > 160
      || typeof input.body !== "string" || input.body.length < 1 || input.body.length > 50_000
      || !Number.isInteger(input.version)) {
      return json({ ok: false, code: "validation_failed" }, 400);
    }
    const updatedAt = new Date().toISOString();
    const row = await env.DB.prepare(`
      UPDATE benchmark_content
      SET title = ?1, body = ?2, version = version + 1, updated_at = ?3
      WHERE id = ?4 AND version = ?5
      RETURNING id, version, updated_at
    `).bind(input.title, input.body, updatedAt, id, input.version).first();
    return row ? json({ ok: true, item: row }) : json({ ok: false, code: "version_conflict" }, 409);
  }

  return json({ ok: false, code: "method_not_allowed" }, 405);
}

async function handleMedia(request: Request, env: Env, url: URL) {
  const key = url.pathname.slice("/api/media/".length);
  if (!validId(key.replace(/\.[a-z0-9]+$/i, "")) || !/^[a-z0-9.-]{1,100}$/i.test(key)) {
    return json({ ok: false, code: "invalid_key" }, 400);
  }
  if (request.method === "HEAD") {
    const object = await env.MEDIA.head(key);
    return new Response(null, { status: object ? 200 : 404, headers: { "Cache-Control": "no-store" } });
  }
  if (request.method === "GET") {
    const object = await env.MEDIA.get(key);
    if (!object) return json({ ok: false, code: "not_found" }, 404);
    return new Response(object.body, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
        "ETag": object.httpEtag,
      },
    });
  }
  if (request.method === "PUT") {
    const length = Number(request.headers.get("Content-Length") || "0");
    const contentType = request.headers.get("Content-Type") || "";
    if (!request.body || length < 1 || length > 1024 * 1024 || !new Set(["image/webp", "image/png", "application/octet-stream"]).has(contentType)) {
      return json({ ok: false, code: "invalid_media" }, 400);
    }
    const object = await env.MEDIA.put(key, request.body, { httpMetadata: { contentType } });
    return json({ ok: true, key, etag: object.httpEtag }, 201);
  }
  return json({ ok: false, code: "method_not_allowed" }, 405);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") return json({ ok: true, service: "tungphat-light-cms-benchmark" });
    if (!(await authorized(request, env))) return json({ ok: false, code: "unauthorized" }, 401);
    if (url.pathname === "/api/session" && request.method === "GET") {
      const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM benchmark_content").first<{ count: number }>();
      return json({ ok: true, authenticated: true, contentCount: row?.count || 0 });
    }
    if (url.pathname === "/api/content" || url.pathname.startsWith("/api/content/")) return handleContent(request, env, url);
    if (url.pathname.startsWith("/api/media/")) return handleMedia(request, env, url);
    return json({ ok: false, code: "not_found" }, 404);
  },
} satisfies ExportedHandler<Env>;
