export const MEDIA_TYPES = {
  "image/jpeg": { extension: "jpg", prefix: "images", maxBytes: 12 * 1024 * 1024 },
  "image/png": { extension: "png", prefix: "images", maxBytes: 12 * 1024 * 1024 },
  "image/webp": { extension: "webp", prefix: "images", maxBytes: 12 * 1024 * 1024 },
  "image/avif": { extension: "avif", prefix: "images", maxBytes: 12 * 1024 * 1024 },
  "video/mp4": { extension: "mp4", prefix: "videos", maxBytes: 50 * 1024 * 1024 },
  "video/webm": { extension: "webm", prefix: "videos", maxBytes: 50 * 1024 * 1024 },
  "application/pdf": { extension: "pdf", prefix: "documents", maxBytes: 20 * 1024 * 1024 }
} as const;

export type AllowedMediaType = keyof typeof MEDIA_TYPES;

const EXTENSION_TYPES: Record<string, AllowedMediaType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
  pdf: "application/pdf"
};

export function isAllowedMediaType(value: string): value is AllowedMediaType {
  return Object.hasOwn(MEDIA_TYPES, value);
}

export function sanitizeFilename(filename: string) {
  const basename = filename.replace(/\\/g, "/").split("/").pop() || "media";
  const withoutExtension = basename.replace(/\.[^.]*$/, "");
  const normalized = withoutExtension
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return normalized || "media";
}

export function filenameMatchesType(filename: string, contentType: AllowedMediaType) {
  const extension = filename.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return Boolean(extension && EXTENSION_TYPES[extension] === contentType);
}

export function generateMediaKey(filename: string, contentType: AllowedMediaType, now = new Date(), uniqueId = crypto.randomUUID()) {
  const definition = MEDIA_TYPES[contentType];
  const datePath = [now.getUTCFullYear(), String(now.getUTCMonth() + 1).padStart(2, "0"), String(now.getUTCDate()).padStart(2, "0")].join("/");
  return `${definition.prefix}/${datePath}/${sanitizeFilename(filename)}-${uniqueId}.${definition.extension}`;
}

export function isExactObjectKey(key: string) {
  return (
    key.length > 0 &&
    key.length <= 512 &&
    !key.startsWith("/") &&
    !key.endsWith("/") &&
    !key.includes("\\") &&
    !key.includes("*") &&
    !key.split("/").includes("..") &&
    /^(?:images|videos|documents|catalogues|og)\/[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(key)
  );
}

export function isSafeListPrefix(prefix: string) {
  return prefix.length <= 200 && !prefix.startsWith("/") && !prefix.includes("\\") && !prefix.includes("..") && !prefix.includes("*");
}

function ascii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

export function sniffMediaType(buffer: ArrayBuffer): AllowedMediaType | null {
  const bytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 32));
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && ascii(bytes, 1, 3) === "PNG" && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "image/png";
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return "image/webp";
  if (bytes.length >= 12 && ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4);
    if (brand === "avif" || brand === "avis") return "image/avif";
    return "video/mp4";
  }
  if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return "video/webm";
  if (bytes.length >= 5 && ascii(bytes, 0, 5) === "%PDF-") return "application/pdf";
  return null;
}

export function publicMediaUrl(baseUrl: string | undefined, key: string) {
  return baseUrl?.trim() ? `${baseUrl.replace(/\/+$/, "")}/${key}` : null;
}

export function mediaResponseObject(object: R2Object, baseUrl?: string) {
  return {
    name: object.customMetadata?.originalName || object.key.split("/").pop() || object.key,
    key: object.key,
    url: publicMediaUrl(baseUrl, object.key),
    size: object.size,
    uploaded: object.uploaded.toISOString(),
    etag: object.etag,
    mimeType: object.httpMetadata?.contentType || "application/octet-stream"
  };
}
