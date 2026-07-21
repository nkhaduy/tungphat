import type { ContentEntry } from "@/lib/content";
import type { ArticleFrontmatter, ProductFrontmatter, ProjectFrontmatter, ServicePageFrontmatter } from "@/lib/content-schema";

export const CMS_PREVIEW_MAX_BYTES = 512 * 1024;
export const CMS_PREVIEW_COLLECTIONS = ["articles", "products", "projects", "pages"] as const;
export type CmsPreviewCollection = (typeof CMS_PREVIEW_COLLECTIONS)[number];

export type CmsPreviewDraft = {
  collection: CmsPreviewCollection;
  data: Record<string, unknown>;
  updatedAt?: number;
};

const allowedFields: Record<CmsPreviewCollection, Set<string>> = {
  articles: new Set(["title", "slug", "excerpt", "body", "featuredImage", "featuredImageAlt", "category", "tags", "author", "publishedAt", "updatedAt", "draft", "faq", "relatedProducts", "relatedArticles"]),
  products: new Set(["title", "slug", "category", "excerpt", "body", "featuredImage", "featuredImageAlt", "materialType", "supplier", "dimensions", "thicknesses", "surfaces", "standards", "applications", "advantages", "limitations", "orderingSteps", "status", "quoteCta", "publishedAt", "updatedAt", "draft", "faq", "relatedArticles"]),
  projects: new Set(["title", "slug", "body", "featuredImage", "featuredImageAlt", "materialType", "processingType", "thickness", "area", "workItems", "customerRequirement", "process", "result", "completedAt", "publishedAt", "updatedAt", "quoteCta", "draft"]),
  pages: new Set(["title", "slug", "eyebrow", "excerpt", "body", "featuredImage", "featuredImageAlt", "materialTypes", "workItems", "process", "fileGuidance", "quoteCta", "publishedAt", "updatedAt", "draft", "faq"]),
};

function cleanString(value: unknown, max = 2_000) {
  return typeof value === "string" ? value.replaceAll("\0", "").slice(0, max) : "";
}

function cleanMarkdown(value: unknown) {
  return cleanString(value, 200_000)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<(?:iframe|object|embed)\b[^>]*>[\s\S]*?<\/(?:iframe|object|embed)\s*>/gi, "")
    .replace(/<(?:iframe|object|embed)\b[^>]*\/?\s*>/gi, "");
}

function cleanList(value: unknown, max = 60) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, max).map((item) => cleanString(
    typeof item === "object" && item !== null && "value" in item ? (item as { value?: unknown }).value : item,
    500,
  )).filter(Boolean);
}

function cleanFaq(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 30).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const question = cleanString((item as { question?: unknown }).question, 300);
    const answer = cleanString((item as { answer?: unknown }).answer, 2_000);
    return question && answer ? [{ question, answer }] : [];
  });
}

function cleanMedia(value: unknown) {
  const media = cleanString(value, 2_048).trim();
  if (/^\/[A-Za-z0-9_./-]+$/.test(media)) return media;
  try {
    const url = new URL(media);
    if (url.protocol === "https:" && ["mdftungphat.com", "cms.mdftungphat.com"].includes(url.hostname)) return url.toString();
  } catch { /* use fallback */ }
  return "/logo-horizontal.png";
}

export function sanitizeCmsPreviewDraft(value: unknown): CmsPreviewDraft | null {
  if (!value || typeof value !== "object") return null;
  let serialized = "";
  try { serialized = JSON.stringify(value); } catch { return null; }
  if (new TextEncoder().encode(serialized).byteLength > CMS_PREVIEW_MAX_BYTES) return null;
  const input = value as { collection?: unknown; data?: unknown; updatedAt?: unknown };
  if (!CMS_PREVIEW_COLLECTIONS.includes(input.collection as CmsPreviewCollection) || !input.data || typeof input.data !== "object" || Array.isArray(input.data)) return null;
  const collection = input.collection as CmsPreviewCollection;
  const source = input.data as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  for (const field of allowedFields[collection]) {
    if (!(field in source)) continue;
    if (field === "body") data[field] = cleanMarkdown(source[field]);
    else if (field === "faq") data[field] = cleanFaq(source[field]);
    else if (["tags", "relatedProducts", "relatedArticles", "dimensions", "thicknesses", "surfaces", "standards", "applications", "advantages", "limitations", "orderingSteps", "workItems", "process", "materialTypes", "fileGuidance"].includes(field)) data[field] = cleanList(source[field]);
    else if (field === "featuredImage") data[field] = cleanMedia(source[field]);
    else if (field === "draft") data[field] = source[field] !== false;
    else data[field] = cleanString(source[field]);
  }
  return { collection, data, updatedAt: typeof input.updatedAt === "number" ? input.updatedAt : Date.now() };
}

const today = new Date().toISOString().slice(0, 10);
const common = {
  title: "Chưa có tiêu đề",
  slug: "ban-nhap",
  excerpt: "Nội dung xem trước sẽ cập nhật theo các trường đang chỉnh sửa trong CMS.",
  body: "",
  featuredImage: "/logo-horizontal.png",
  featuredImageAlt: "Logo Tùng Phát",
  publishedAt: today,
  updatedAt: today,
  draft: true,
  featured: false,
  seoTitle: "Bản xem trước nội dung Tùng Phát",
  seoDescription: "Bản xem trước nội dung trong hệ thống quản trị Tùng Phát, không được lập chỉ mục hoặc lưu công khai.",
  canonical: "",
  noindex: true,
  ogImage: "",
  gallery: [],
  video: "",
  catalogue: "",
  faq: [],
  sourcePath: "cms-preview",
};

export function previewEntry(draft: CmsPreviewDraft) {
  const data = { ...common, ...draft.data };
  if (draft.collection === "articles") return { collection: draft.collection, entry: { ...data, author: "Ban biên tập Tùng Phát", category: "Bài viết", tags: [], relatedProducts: [], relatedArticles: [], ...draft.data } as ContentEntry<ArticleFrontmatter> } as const;
  if (draft.collection === "products") return { collection: draft.collection, entry: { ...data, category: "Sản phẩm", materialType: "Vật liệu gỗ", supplier: "", dimensions: [], thicknesses: [], surfaces: [], standards: [], applications: [], advantages: [], limitations: [], orderingSteps: [], status: "available", quoteCta: "Nhận báo giá", relatedArticles: [], ...draft.data } as ContentEntry<ProductFrontmatter> } as const;
  if (draft.collection === "projects") return { collection: draft.collection, entry: { ...data, completedAt: today, materialType: "Vật liệu gỗ", processingType: "Gia công CNC", thickness: "", area: "", workItems: [], customerRequirement: "Đang cập nhật yêu cầu.", process: [], result: "Đang cập nhật kết quả.", beforeImages: [], afterImages: [], quoteCta: "Nhận báo giá", ...draft.data } as ContentEntry<ProjectFrontmatter> } as const;
  return { collection: draft.collection, entry: { ...data, eyebrow: "Gia công CNC", materialTypes: [], workItems: [], process: [], fileGuidance: [], quoteCta: "Gửi file nhận báo giá", ...draft.data } as ContentEntry<ServicePageFrontmatter> } as const;
}
