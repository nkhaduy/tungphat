import { createHash } from "node:crypto";
import editorialBaselines from "@/data/cms-editorial-baselines.json";
import {
  articleSchema,
  productSchema,
  projectSchema,
  servicePageSchema,
  type ArticleFrontmatter,
  type ProductFrontmatter,
  type ProjectFrontmatter,
  type ServicePageFrontmatter,
} from "@/lib/content-schema";
import { filterPublishedContent } from "@/lib/listing-indexability";
import { hasMinimumProductEvidence } from "@/lib/content-evidence";
import { resolveMediaUrl, resolvePreviewUploadMediaUrl } from "@/lib/media";
import { mergeProductEditorial } from "@/lib/product-editorial";
import { articleAdditionalSections, articleBodyOverrides } from "@/lib/content-overhaul";
import { cmsManagedMaterialSlugs } from "@/lib/product-ownership";

type MediaMetadata = { width?: number; height?: number; type?: string };
export type ContentEntry<T> = T & { body: string; sourcePath: string; editorContent?: unknown; legacyBodyHidden?: boolean; mediaMetadata?: { featuredImage?: MediaMetadata; ogImage?: MediaMetadata }; wordpress?: { html: string; mediaOrigin: string; allowInsecureLoopback: boolean } };

const cmsOrigin = (process.env.PAYLOAD_CMS_URL || "https://cms.mdftungphat.com").replace(/\/$/u, "");
const collectionCache = new Map<string, Promise<Record<string, unknown>[]>>();

export function payloadCollectionOrigin(
  collection: string,
  defaultCmsOrigin: string,
  articlesOrigin = process.env.PAYLOAD_ARTICLES_URL,
  buildTarget = process.env.STATIC_BUILD_TARGET,
) {
  if (collection !== "articles" || buildTarget !== "preview") return defaultCmsOrigin.replace(/\/+$/u, "");
  if (!articlesOrigin?.trim()) throw new Error("Preview builds require PAYLOAD_ARTICLES_URL to point to the isolated staging CMS.");

  let stagingUrl: URL;
  try { stagingUrl = new URL(articlesOrigin); }
  catch { throw new Error("Preview builds require a valid isolated staging CMS URL."); }
  if (stagingUrl.protocol !== "https:" || stagingUrl.hostname !== "tungphat-payload-cms-staging.nkhaduy.workers.dev" || stagingUrl.username || stagingUrl.password) {
    throw new Error("Preview article builds may only read from the isolated staging CMS over HTTPS.");
  }
  return stagingUrl.origin;
}

export function payloadBuildFetchCache(buildTarget = process.env.STATIC_BUILD_TARGET): RequestCache {
  return buildTarget === "preview" ? "no-store" : "force-cache";
}

/** Guard only fields whose CMS values would otherwise be hidden by repository copy. */
export function cmsEditorialFingerprint(collection: "articles" | "products", doc: Record<string, unknown>) {
  const keys = collection === "articles" ? ["body"] : ["title", "category", "materialType", "supplier", "dimensions", "thicknesses", "surfaces", "standards", "applications", "advantages", "limitations", "orderingSteps", "excerpt", "featuredImage", "featuredImageAlt", "gallery", "video", "catalogue", "quoteCta", "faq", "body"];
  const values = keys.map((key) => doc[key] ?? null);
  if (collection === "products") {
    const seo = object(doc.seo);
    values.push(seo.title ?? null, seo.description ?? null, seo.ogImage ?? null);
  }
  return createHash("sha256").update(JSON.stringify(values)).digest("hex");
}

export function assertCmsEditorialUnchanged(collection: "articles" | "products", doc: Record<string, unknown>, baselines: Record<string, string>) {
  const slug = text(doc.slug);
  const expected = baselines[slug];
  if (doc._status !== "published") return;
  const requiresBaseline = collection === "articles"
    ? Object.hasOwn(articleBodyOverrides, slug)
    : (cmsManagedMaterialSlugs as readonly string[]).includes(slug);
  if (!expected && requiresBaseline) throw new Error(`Missing CMS editorial baseline: ${collection}/${slug}`);
  if (!expected) return;
  if (cmsEditorialFingerprint(collection, doc) !== expected) {
    throw new Error(`CMS editorial conflict: ${collection}/${slug}; review the CMS change against repository-owned fields before updating its baseline.`);
  }
}


async function readCollection<T>(folder: string, schema: { parse: (value: unknown) => T }): Promise<ContentEntry<T>[]> {
  const docs = await payloadCollection(folder);
  return docs.map((doc) => {
    if (folder === "articles" || folder === "products") assertCmsEditorialUnchanged(folder, doc, editorialBaselines[folder]);
    const frontmatter = schema.parse(mapPayloadDocument(doc, folder));
    const seo = object(doc.seo);
    return {
      ...frontmatter,
      body: text(doc.body),
      editorContent: doc.editorContent,
      legacyBodyHidden: folder === "articles" && doc.legacyBodyHidden === true,
      sourcePath: `payload://${folder}/${text(doc.slug)}`,
      mediaMetadata: { featuredImage: mediaMetadata(doc.featuredImage), ogImage: mediaMetadata(seo.ogImage) },
    };
  });
}

async function payloadCollection(collection: string) {
  let request = collectionCache.get(collection);
  if (!request) {
    const origin = payloadCollectionOrigin(collection, cmsOrigin);
    request = fetch(`${origin}/api/${collection}?limit=100&depth=1&sort=slug`, { cache: payloadBuildFetchCache() })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Payload ${collection} fetch failed: HTTP ${response.status}`);
        const value = await response.json() as { docs?: Record<string, unknown>[]; hasNextPage?: boolean };
        if (value.hasNextPage) throw new Error(`Payload ${collection} exceeds the configured build limit`);
        return value.docs ?? [];
      });
    collectionCache.set(collection, request);
  }
  return request;
}

export function applyArticleEditorial<T extends { slug: string; body: string; updatedAt: string }>(entry: T): T {
  if (typeof entry.body !== "string" || !entry.body.trim()) throw new Error(`CMS article ${entry.slug} has no body`);
  const override = articleBodyOverrides[entry.slug];
  const addition = articleAdditionalSections[entry.slug];
  const updatedAt = entry.updatedAt > "2026-11-13" ? entry.updatedAt : "2026-11-13";
  if (override) return { ...entry, body: override, updatedAt };
  if (!addition) return entry;
  const heading = addition.text.split("\n")[0];
  const existingCount = entry.body.split(heading).length - 1;
  if (existingCount > 1) throw new Error(`Duplicate editorial heading in CMS article ${entry.slug}`);
  if (existingCount === 1) return entry;
  if (addition.before === "__END_OF_ARTICLE__") return { ...entry, body: `${entry.body}\n\n${addition.text}`, updatedAt };
  const parts = entry.body.split(addition.before);
  if (parts.length !== 2) throw new Error(`CMS article ${entry.slug} has missing or ambiguous editorial heading; review placement`);
  return { ...entry, body: `${parts[0]}${addition.text}\n\n${addition.before}${parts[1]}`, updatedAt };
}

export async function getArticles(options: { includeDrafts?: boolean } = {}) {
  const source = process.env.BLOG_CONTENT_PROVIDER || "payload";
  if (source === "wordpress") {
    const baseUrl = process.env.WORDPRESS_BASE_URL;
    if (!baseUrl) throw new Error("WORDPRESS_BASE_URL is required when BLOG_CONTENT_PROVIDER=wordpress");
    const { getWordPressArticles } = await import("@/lib/wordpress/provider");
    const entries = await getWordPressArticles({ baseUrl, allowInsecureLoopback: process.env.WORDPRESS_ALLOW_LOCAL_HTTP === "1" });
    return (options.includeDrafts ? entries : filterPublishedContent(entries)).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }
  if (source !== "payload") throw new Error(`Unknown BLOG_CONTENT_PROVIDER: ${source}`);
  const entries = await readCollection<ArticleFrontmatter>("articles", articleSchema);
  return (options.includeDrafts ? entries : filterPublishedContent(entries))
    .map(applyArticleEditorial)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getPublishedArticles() { return getArticles(); }
export async function getArticle(slug: string, options: { includeDrafts?: boolean } = {}) {
  // The WordPress adapter only returns published posts. Keep a published noindex
  // article reachable directly while excluding it from listings and indexes.
  const includeDrafts = options.includeDrafts || process.env.BLOG_CONTENT_PROVIDER === "wordpress";
  return (await getArticles({ includeDrafts })).find((entry) => entry.slug === slug);
}

export async function getProducts(options: { includeDrafts?: boolean } = {}) {
  return mergeProductEditorial(await readCollection<ProductFrontmatter>("products", productSchema))
    .filter((entry) => options.includeDrafts || (!entry.draft && !entry.noindex && hasMinimumProductEvidence(entry)))
    .sort((a, b) => a.title.localeCompare(b.title, "vi"));
}

export async function getProduct(slug: string, options: { includeDrafts?: boolean } = {}) { return (await getProducts(options)).find((entry) => entry.slug === slug); }

export async function getProjects(options: { includeDrafts?: boolean } = {}) {
  const entries = await readCollection<ProjectFrontmatter>("projects", projectSchema);
  return (options.includeDrafts ? entries : filterPublishedContent(entries)).sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

export async function getPublishedProjects() { return getProjects(); }
export async function getProject(slug: string, options: { includeDrafts?: boolean } = {}) { return (await getProjects(options)).find((entry) => entry.slug === slug); }

export async function getServicePages(options: { includeDrafts?: boolean } = {}) {
  return (await readCollection<ServicePageFrontmatter>("pages", servicePageSchema))
    .filter((entry) => options.includeDrafts || (!entry.draft && !entry.noindex))
    .sort((a, b) => a.title.localeCompare(b.title, "vi"));
}

export async function getServicePage(slug: string, options: { includeDrafts?: boolean } = {}) { return (await getServicePages(options)).find((entry) => entry.slug === slug); }

function mapPayloadDocument(doc: Record<string, unknown>, collection: string) {
  const seo = object(doc.seo);
  const previewArticleMedia = collection === "articles" && process.env.STATIC_BUILD_TARGET === "preview";
  return {
    ...doc,
    tags: values(doc.tags), relatedProducts: values(doc.relatedProducts), relatedArticles: values(doc.relatedArticles),
    dimensions: values(doc.dimensions), thicknesses: values(doc.thicknesses), surfaces: values(doc.surfaces), standards: values(doc.standards),
    applications: values(doc.applications), advantages: values(doc.advantages), limitations: values(doc.limitations), orderingSteps: values(doc.orderingSteps),
    materialTypes: values(doc.materialTypes), workItems: values(doc.workItems), process: values(doc.process), fileGuidance: values(doc.fileGuidance),
    beforeImages: mediaList(doc.beforeImages), afterImages: mediaList(doc.afterImages), gallery: mediaList(doc.gallery, previewArticleMedia),
    featuredImage: mediaURL(doc.featuredImage, previewArticleMedia), video: mediaURL(doc.video), catalogue: mediaURL(doc.catalogue), ogImage: mediaURL(seo.ogImage, previewArticleMedia),
    publishedAt: date(doc.publishedAt), completedAt: date(doc.completedAt), updatedAt: date(doc.updatedAt),
    draft: doc._status !== "published", status: doc.availability,
    seoTitle: seo.title, seoDescription: seo.description, canonical: seo.canonical || "", noindex: seo.noindex === true,
  };
}

function values(value: unknown): string[] { return Array.isArray(value) ? value.map((item) => text(object(item).value || item)).filter(Boolean) : []; }
function mediaList(value: unknown, previewArticleMedia = false): string[] { return Array.isArray(value) ? value.map((item) => mediaURL(object(item).image || item, previewArticleMedia)).filter(Boolean) : []; }
function mediaURL(value: unknown, previewArticleMedia = false): string {
  const raw = typeof value === "string" ? value : text(object(value).url);
  if (!raw) return "";
  return previewArticleMedia
    ? resolvePreviewUploadMediaUrl(raw, process.env.NEXT_PUBLIC_PREVIEW_MEDIA_BASE_URL)
    : resolveMediaUrl(raw);
}
function mediaMetadata(value: unknown): MediaMetadata | undefined {
  const media = object(value);
  if (!Object.keys(media).length) return undefined;
  return {
    width: typeof media.width === "number" ? media.width : undefined,
    height: typeof media.height === "number" ? media.height : undefined,
    type: text(media.mimeType) || undefined,
  };
}
function date(value: unknown): string { return text(value).slice(0, 10); }
function object(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function text(value: unknown): string { return typeof value === "string" ? value : ""; }
