const MEDIA_ROUTE_PREFIX = "/media/";
const PUBLIC_KEY_PREFIXES = ["videos/", "catalog/"];
const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";

type ByteRange = {
  offset: number;
  length: number;
};

type MediaEnv = {
  MEDIA: R2Bucket;
};

const aliasCache = new WeakMap<R2Bucket, Promise<Record<string, string>>>();

function catalogueAliases(bucket: R2Bucket): Promise<Record<string, string>> {
  const cached = aliasCache.get(bucket);
  if (cached) return cached;
  const pending = bucket.get("catalog/_manifest.json").then(async (object) => {
    if (!object) return {};
    const manifest = await object.json<{ aliases?: Record<string, string> }>();
    return manifest.aliases ?? {};
  }).catch(() => ({}));
  aliasCache.set(bucket, pending);
  return pending;
}

function mediaKey(request: Request) {
  const pathname = new URL(request.url).pathname;
  if (!pathname.startsWith(MEDIA_ROUTE_PREFIX)) return null;

  let key: string;
  try {
    key = decodeURIComponent(pathname.slice(MEDIA_ROUTE_PREFIX.length));
  } catch {
    return null;
  }

  if (
    !PUBLIC_KEY_PREFIXES.some((prefix) => key.startsWith(prefix)) ||
    key.length > 512 ||
    key.includes("\\") ||
    key.split("/").includes("..") ||
    !/^(?:videos|catalog)\/[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(key)
  ) {
    return null;
  }

  return key;
}

function parseRange(value: string | null, size: number): ByteRange | null | "invalid" {
  if (!value) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match || (!match[1] && !match[2]) || size <= 0) return "invalid";

  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return "invalid";
    const length = Math.min(suffixLength, size);
    return { offset: size - length, length };
  }

  const offset = Number(match[1]);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset >= size) return "invalid";

  const requestedEnd = match[2] ? Number(match[2]) : size - 1;
  if (!Number.isSafeInteger(requestedEnd) || requestedEnd < offset) return "invalid";
  const end = Math.min(requestedEnd, size - 1);
  return { offset, length: end - offset + 1 };
}

function mediaHeaders(object: R2Object, contentLength: number) {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "video/mp4");
  if (!headers.has("Cache-Control")) headers.set("Cache-Control", IMMUTABLE_CACHE);
  headers.set("Content-Length", String(contentLength));
  headers.set("Accept-Ranges", "bytes");
  headers.set("ETag", object.httpEtag);
  headers.set("Last-Modified", object.uploaded.toUTCString());
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Expose-Headers", "Accept-Ranges, Content-Length, Content-Range, ETag");
  headers.set("Cross-Origin-Resource-Policy", "cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  return headers;
}

function errorResponse(status: number, message: string, extraHeaders: HeadersInit = {}) {
  return new Response(message, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      ...extraHeaders
    }
  });
}

export async function handleMedia(request: Request, env: MediaEnv) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "Range",
        "Access-Control-Max-Age": "86400"
      }
    });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return errorResponse(405, "Method not allowed", { Allow: "GET, HEAD, OPTIONS" });
  }

  const key = mediaKey(request);
  if (!key) return errorResponse(404, "Media not found");

  let resolvedKey = key;
  let metadata: R2Object | null;
  try {
    metadata = await env.MEDIA.head(resolvedKey);
    if (!metadata && resolvedKey.startsWith("catalog/")) {
      const alias = (await catalogueAliases(env.MEDIA))[resolvedKey];
      if (alias) {
        resolvedKey = alias;
        metadata = await env.MEDIA.head(resolvedKey);
      }
    }
  } catch {
    return errorResponse(503, "Media storage unavailable");
  }
  if (!metadata) return errorResponse(404, "Media not found");

  const range = request.method === "GET" ? parseRange(request.headers.get("Range"), metadata.size) : null;
  if (range === "invalid") {
    return errorResponse(416, "Range not satisfiable", {
      "Accept-Ranges": "bytes",
      "Content-Range": `bytes */${metadata.size}`
    });
  }

  if (request.method === "HEAD") {
    return new Response(null, { status: 200, headers: mediaHeaders(metadata, metadata.size) });
  }

  let object: R2ObjectBody | null;
  try {
    object = await env.MEDIA.get(resolvedKey, range ? { range } : undefined);
  } catch {
    return errorResponse(503, "Media storage unavailable");
  }
  if (!object) return errorResponse(404, "Media not found");

  const contentLength = range ? range.length : metadata.size;
  const headers = mediaHeaders(object, contentLength);
  if (range) {
    headers.set("Content-Range", `bytes ${range.offset}-${range.offset + range.length - 1}/${metadata.size}`);
  }

  return new Response(object.body, { status: range ? 206 : 200, headers });
}
