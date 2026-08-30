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
import { resolveMediaUrl } from "@/lib/media";

type MediaMetadata = { width?: number; height?: number; type?: string };
export type ContentEntry<T> = T & { body: string; sourcePath: string; mediaMetadata?: { featuredImage?: MediaMetadata; ogImage?: MediaMetadata } };

const cmsOrigin = (process.env.PAYLOAD_CMS_URL || "https://cms.mdftungphat.com").replace(/\/$/u, "");
const collectionCache = new Map<string, Promise<Record<string, unknown>[]>>();

async function readCollection<T>(folder: string, schema: { parse: (value: unknown) => T }): Promise<ContentEntry<T>[]> {
  const docs = await payloadCollection(folder);
  return docs.map((doc) => {
    const frontmatter = schema.parse(mapPayloadDocument(doc));
    const seo = object(doc.seo);
    return {
      ...frontmatter,
      body: text(doc.body),
      sourcePath: `payload://${folder}/${text(doc.slug)}`,
      mediaMetadata: { featuredImage: mediaMetadata(doc.featuredImage), ogImage: mediaMetadata(seo.ogImage) },
    };
  });
}

async function payloadCollection(collection: string) {
  let request = collectionCache.get(collection);
  if (!request) {
    request = fetch(`${cmsOrigin}/api/${collection}?limit=100&depth=1&sort=slug`, { cache: "force-cache" })
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

export async function getArticles(options: { includeDrafts?: boolean } = {}) {
  const entries = await readCollection<ArticleFrontmatter>("articles", articleSchema);
  return (options.includeDrafts ? entries : filterPublishedContent(entries)).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getPublishedArticles() { return getArticles(); }
export async function getArticle(slug: string, options: { includeDrafts?: boolean } = {}) { return (await getArticles(options)).find((entry) => entry.slug === slug); }

export async function getProducts(options: { includeDrafts?: boolean } = {}) {
  return (await readCollection<ProductFrontmatter>("products", productSchema))
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

function mapPayloadDocument(doc: Record<string, unknown>) {
  const seo = object(doc.seo);
  return {
    ...doc,
    tags: values(doc.tags), relatedProducts: values(doc.relatedProducts), relatedArticles: values(doc.relatedArticles),
    dimensions: values(doc.dimensions), thicknesses: values(doc.thicknesses), surfaces: values(doc.surfaces), standards: values(doc.standards),
    applications: values(doc.applications), advantages: values(doc.advantages), limitations: values(doc.limitations), orderingSteps: values(doc.orderingSteps),
    materialTypes: values(doc.materialTypes), workItems: values(doc.workItems), process: values(doc.process), fileGuidance: values(doc.fileGuidance),
    beforeImages: mediaList(doc.beforeImages), afterImages: mediaList(doc.afterImages), gallery: mediaList(doc.gallery),
    featuredImage: mediaURL(doc.featuredImage), video: mediaURL(doc.video), catalogue: mediaURL(doc.catalogue), ogImage: mediaURL(seo.ogImage),
    publishedAt: date(doc.publishedAt), completedAt: date(doc.completedAt), updatedAt: date(doc.updatedAt),
    draft: doc._status !== "published", status: doc.availability,
    seoTitle: seo.title, seoDescription: seo.description, canonical: seo.canonical || "", noindex: seo.noindex === true,
  };
}

function values(value: unknown): string[] { return Array.isArray(value) ? value.map((item) => text(object(item).value || item)).filter(Boolean) : []; }
function mediaList(value: unknown): string[] { return Array.isArray(value) ? value.map((item) => mediaURL(object(item).image || item)).filter(Boolean) : []; }
function mediaURL(value: unknown): string {
  const raw = typeof value === "string" ? value : text(object(value).url);
  if (!raw) return "";
  return resolveMediaUrl(raw);
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
