/** Root paths that must never be claimed by CMS product or service content. */
export const SYSTEM_ROOT_SLUGS = [
  "admin",
  "api",
  "_next",
  "favicon.ico",
  "icon.png",
  "apple-icon.png",
  "robots.txt",
  "sitemap.xml",
  "manifest.webmanifest"
] as const;

/** Existing root-level app routes, including reserved future navigation paths. */
export const STATIC_ROOT_SLUGS = [
  "bao-gia",
  "bai-viet",
  "catalogue",
  "chinh-sach-bao-mat",
  "dieu-khoan-su-dung",
  "du-an",
  "gia-cong-cnc",
  "gioi-thieu",
  "lien-he",
  "san-pham"
] as const;

export const RESERVED_ROOT_SLUGS = [...SYSTEM_ROOT_SLUGS, ...STATIC_ROOT_SLUGS] as const;
const reservedRootSlugSet = new Set<string>(RESERVED_ROOT_SLUGS);

export const ROOT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isReservedRootSlug(slug: string) {
  return reservedRootSlugSet.has(slug);
}

export function validateRootSlug(slug: string): string | undefined {
  if (!slug) return "slug không được rỗng";
  if (slug.includes("/") || slug.includes("\\") || slug.includes("..")) return "slug không được chứa path, '/' hoặc path traversal";
  if (!ROOT_SLUG_PATTERN.test(slug)) return "slug chỉ gồm chữ thường, số và một dấu '-' giữa các phần";
  if (slug.startsWith("-") || slug.endsWith("-") || slug.includes("--")) return "slug không được bắt đầu/kết thúc bằng '-' hoặc chứa '--'";
  if (isReservedRootSlug(slug)) return "slug trùng route tĩnh hoặc endpoint hệ thống";
  return undefined;
}
