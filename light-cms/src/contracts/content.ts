import { z } from "zod";

export const collectionNames = ["products", "articles", "projects", "pages"] as const;
export const settingNames = ["business-settings", "seo-defaults", "static-pages", "material-categories", "brands"] as const;
export const roles = ["super-admin", "admin", "editor"] as const;
export const contentStatuses = ["draft", "published"] as const;

export type CollectionName = (typeof collectionNames)[number];
export type SettingName = (typeof settingNames)[number];
export type UserRole = (typeof roles)[number];
export type ContentStatus = (typeof contentStatuses)[number];

const reservedSlugs = new Set([
  "admin", "api", "bao-gia", "bai-viet", "catalogue", "chinh-sach-bao-mat",
  "dieu-khoan-su-dung", "du-an", "lien-he", "san-pham",
]);

export const slugSchema = z.string().min(2).max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang")
  .refine((value) => !reservedSlugs.has(value), "Slug thuộc route hệ thống");

const dateSchema = z.string().date();
const mediaPathSchema = z.string().regex(/^\/[a-zA-Z0-9][^\s?#]*\.(?:avif|webp|png|jpe?g)$/i);
const optionalMediaPathSchema = z.union([z.literal(""), mediaPathSchema]).default("");
const optionalFilePathSchema = z.union([
  z.literal(""),
  z.string().regex(/^\/[a-zA-Z0-9][^\s?#]*\.(?:mp4|webm|pdf)$/i),
]).default("");
const canonicalSchema = z.union([
  z.literal(""),
  z.string().url().refine((value) => new URL(value).origin === "https://mdftungphat.com"),
]).default("");
const stringItem = z.string().min(1).max(300);
const stringArray = z.array(stringItem).default([]);
const requiredStringArray = z.array(stringItem).min(1);
const faqSchema = z.array(z.object({ question: z.string().min(5).max(180), answer: z.string().min(10).max(1200) })).default([]);

const seoShape = {
  seoTitle: z.string().min(20).max(65),
  seoDescription: z.string().min(80).max(170),
  canonical: canonicalSchema,
  noindex: z.boolean().default(false),
  ogImage: optionalMediaPathSchema,
};

const publicationShape = {
  publishedAt: dateSchema,
  updatedAt: dateSchema,
  featured: z.boolean().default(false),
};

const fileShape = {
  featuredImage: mediaPathSchema,
  featuredImageAlt: z.string().min(10).max(180),
  gallery: z.array(mediaPathSchema).default([]),
  video: optionalFilePathSchema,
  catalogue: optionalFilePathSchema,
};

const productSchema = z.object({
  title: z.string().min(5).max(120), slug: slugSchema, category: z.string().min(2).max(80),
  excerpt: z.string().min(40).max(260), materialType: z.string().min(2).max(100), supplier: z.string().max(100).default(""),
  thicknesses: stringArray, dimensions: stringArray, surfaces: stringArray, standards: stringArray,
  applications: requiredStringArray, advantages: requiredStringArray, limitations: requiredStringArray, orderingSteps: requiredStringArray,
  status: z.enum(["available", "discontinued"]), quoteCta: z.string().min(5).max(100), relatedArticles: z.array(slugSchema).default([]),
  faq: faqSchema, body: z.string().min(1).max(100_000), ...fileShape, ...publicationShape, ...seoShape,
}).strict();

const articleSchema = z.object({
  title: z.string().min(10).max(120), slug: slugSchema, excerpt: z.string().min(40).max(240),
  category: z.string().min(2).max(80), tags: stringArray, author: z.string().min(2).max(80),
  relatedProducts: z.array(slugSchema).default([]), relatedArticles: z.array(slugSchema).default([]), faq: faqSchema,
  body: z.string().min(1).max(150_000), ...fileShape, ...publicationShape, ...seoShape,
}).strict();

const projectSchema = z.object({
  title: z.string().min(8).max(120), slug: slugSchema, materialType: z.string().min(2).max(100),
  processingType: z.string().min(2).max(120), thickness: z.string().min(1).max(80), area: z.string().max(120).default(""),
  workItems: requiredStringArray, customerRequirement: z.string().min(20).max(800), process: requiredStringArray,
  result: z.string().min(20).max(800), beforeImages: z.array(mediaPathSchema).default([]), afterImages: z.array(mediaPathSchema).default([]),
  completedAt: dateSchema, quoteCta: z.string().min(5).max(100), body: z.string().min(1).max(100_000),
  ...fileShape, ...publicationShape, ...seoShape,
}).strict();

const pageSchema = z.object({
  title: z.string().min(8).max(120), slug: slugSchema, eyebrow: z.string().min(2).max(80),
  excerpt: z.string().min(40).max(300), materialTypes: requiredStringArray, workItems: requiredStringArray,
  process: requiredStringArray, fileGuidance: requiredStringArray, quoteCta: z.string().min(5).max(100),
  faq: faqSchema, body: z.string().min(1).max(100_000), ...fileShape, ...publicationShape, ...seoShape,
}).strict();

export const collectionSchemas = {
  products: productSchema,
  articles: articleSchema,
  projects: projectSchema,
  pages: pageSchema,
} satisfies Record<CollectionName, z.ZodType>;

const businessSettingsSchema = z.object({
  businessName: z.string().min(3).max(160), displayName: z.string().min(2).max(100), taxId: z.string().min(8).max(30),
  website: z.literal("https://mdftungphat.com"), phoneDisplay: z.string().min(8).max(30), phoneE164: z.string().regex(/^\+[1-9]\d{7,14}$/),
  zaloUrl: z.string().url(), email: z.union([z.literal(""), z.string().email()]), openingHours: stringArray, serviceAreas: requiredStringArray,
  locations: z.array(z.object({ id: slugSchema, shortId: z.string().min(2).max(20), name: z.string().min(3).max(120),
    address: z.string().min(10).max(240), streetAddress: z.string().min(3).max(160), addressLocality: z.string().min(2).max(100),
    addressRegion: z.string().min(2).max(100), addressCountry: z.string().length(2), image: mediaPathSchema,
    imageAlt: z.string().min(10).max(180), embedSrc: z.string().url(), directionsUrl: z.string().url() })).min(1),
  socialLinks: z.array(z.string().url()).default([]), footerDescription: z.string().min(40).max(300),
  primaryCtaLabel: z.string().min(3).max(80), primaryCtaUrl: z.string().startsWith("/"), localBusinessType: z.literal("LocalBusiness"),
}).strict();

const seoDefaultsSchema = z.object({ siteUrl: z.literal("https://mdftungphat.com"), siteName: z.string().min(2).max(80),
  defaultTitle: z.string().min(20).max(65), defaultDescription: z.string().min(80).max(170), defaultOgImage: mediaPathSchema }).strict();
const staticPagesSchema = z.object({ updatedAt: dateSchema, homeHeroDescription: z.string().min(80).max(260),
  contactIntro: z.string().min(40).max(300), quoteIntro: z.string().min(80).max(300) }).strict();
const materialCategoriesSchema = z.object({ title: z.string().min(2).max(120), items: z.array(z.object({ name: z.string().min(2).max(120), slug: slugSchema })).min(1) }).strict();
const brandsSchema = z.object({ items: z.array(z.object({ slug: slugSchema, name: z.string().min(2).max(100), logo: optionalMediaPathSchema,
  description: z.string().min(20).max(300), catalogues: z.array(z.object({ name: z.string().min(2).max(120), thumbnail: optionalMediaPathSchema,
    description: z.string().max(300).default(""), pdf: z.union([z.literal(""), z.string().regex(/^\/[^\s]+\.pdf$/i)]).default("") })).default([]) })).min(1) }).strict();

export const settingSchemas = {
  "business-settings": businessSettingsSchema,
  "seo-defaults": seoDefaultsSchema,
  "static-pages": staticPagesSchema,
  "material-categories": materialCategoriesSchema,
  brands: brandsSchema,
} satisfies Record<SettingName, z.ZodType>;

const publicRecordSchema = z.object({
  collection: z.enum(collectionNames),
  status: z.literal("published"),
  slug: slugSchema,
  data: z.record(z.string(), z.unknown()),
}).strict();

const publicMediaSchema = z.object({ id: z.string().uuid(), url: z.string().startsWith("/api/public/media/"),
  thumbnailUrl: z.string().startsWith("/api/public/media/").optional(), filename: z.string().min(1).max(180),
  mimeType: z.string().min(1).max(100), alt: z.string().min(3).max(180), width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable() }).strict();

export const publicSnapshotSchema = z.object({
  schemaVersion: z.literal(1), generatedAt: z.string().datetime(), checksum: z.string().regex(/^[a-f0-9]{64}$/),
  records: z.array(publicRecordSchema), settings: z.partialRecord(z.enum(settingNames), z.record(z.string(), z.unknown())),
  media: z.array(publicMediaSchema),
}).strict();

export type PublicSnapshot = z.infer<typeof publicSnapshotSchema>;

export function parseCollectionData(collection: CollectionName, value: unknown) {
  return collectionSchemas[collection].parse(value);
}

export function parseSettingData(setting: SettingName, value: unknown) {
  return settingSchemas[setting].parse(value);
}
