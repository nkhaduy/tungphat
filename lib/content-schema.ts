import { z } from "zod";

const slug = z
  .string()
  .min(2)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang");

export const imagePathSchema = z
  .string()
  .regex(/^\/[^\s]+\.(?:avif|webp|png|jpe?g)$/i, "Ảnh phải nằm trong public và dùng AVIF, WebP, PNG hoặc JPEG");

const optionalImage = z.union([z.literal(""), imagePathSchema]).default("");
const optionalVideo = z
  .union([z.literal(""), z.string().regex(/^\/[^\s]+\.(?:mp4|webm)$/i, "Video phải nằm trong public và dùng MP4/WebM")])
  .default("");
const optionalPdf = z
  .union([z.literal(""), z.string().regex(/^\/[^\s]+\.pdf$/i, "PDF phải nằm trong public")])
  .default("");
const optionalCanonical = z
  .union([
    z.literal(""),
    z.string().url().refine(
      (value) => new URL(value).origin === "https://mdftungphat.com",
      "Canonical phải thuộc https://mdftungphat.com"
    )
  ])
  .default("");
const date = z.string().date("Ngày phải có định dạng YYYY-MM-DD");
const faqItem = z.object({
  question: z.string().min(10).max(180),
  answer: z.string().min(20).max(1200)
});

const seoFields = {
  seoTitle: z.string().min(20).max(65),
  seoDescription: z.string().min(80).max(170),
  canonical: optionalCanonical,
  noindex: z.boolean().default(false)
};

function chronological<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.superRefine((value, context) => {
    const dated = value as { publishedAt?: string; updatedAt?: string };
    if (dated.publishedAt && dated.updatedAt && dated.updatedAt < dated.publishedAt) {
      context.addIssue({
        code: "custom",
        path: ["updatedAt"],
        message: "Ngày cập nhật không được trước ngày đăng"
      });
    }
  });
}

export const articleSchema = chronological(z.object({
  title: z.string().min(10).max(120),
  slug,
  excerpt: z.string().min(40).max(240),
  publishedAt: date,
  updatedAt: date,
  author: z.string().min(2).max(80),
  category: z.string().min(2).max(80),
  tags: z.array(z.string().min(2).max(50)).default([]),
  featuredImage: imagePathSchema,
  featuredImageAlt: z.string().min(10).max(180),
  gallery: z.array(imagePathSchema).default([]),
  video: optionalVideo,
  catalogue: optionalPdf,
  ogImage: optionalImage,
  draft: z.boolean().default(true),
  featured: z.boolean().default(false),
  ...seoFields,
  relatedProducts: z.array(slug).default([]),
  relatedArticles: z.array(slug).default([]),
  faq: z.array(faqItem).default([])
}));

export const productSchema = chronological(z.object({
  title: z.string().min(5).max(120),
  slug,
  category: z.string().min(2).max(80),
  materialType: z.string().min(2).max(100),
  supplier: z.string().max(100).default(""),
  dimensions: z.array(z.string().min(2).max(100)).default([]),
  thicknesses: z.array(z.string().min(1).max(100)).default([]),
  surfaces: z.array(z.string().min(2).max(100)).default([]),
  standards: z.array(z.string().min(2).max(120)).default([]),
  applications: z.array(z.string().min(3).max(160)).min(1),
  advantages: z.array(z.string().min(3).max(180)).min(1),
  limitations: z.array(z.string().min(3).max(180)).min(1),
  orderingSteps: z.array(z.string().min(3).max(180)).min(1),
  excerpt: z.string().min(40).max(260),
  featuredImage: imagePathSchema,
  featuredImageAlt: z.string().min(10).max(180),
  gallery: z.array(imagePathSchema).default([]),
  video: optionalVideo,
  catalogue: optionalPdf,
  ogImage: optionalImage,
  status: z.enum(["available", "discontinued"]),
  quoteCta: z.string().min(5).max(100),
  publishedAt: date,
  updatedAt: date,
  draft: z.boolean().default(true),
  featured: z.boolean().default(false),
  ...seoFields,
  faq: z.array(faqItem).default([]),
  relatedArticles: z.array(slug).default([])
}));

export const projectSchema = chronological(z.object({
  title: z.string().min(8).max(120),
  slug,
  completedAt: date,
  materialType: z.string().min(2).max(100),
  processingType: z.string().min(2).max(120),
  thickness: z.string().min(1).max(80),
  area: z.string().max(120).default(""),
  workItems: z.array(z.string().min(3).max(160)).min(1),
  customerRequirement: z.string().min(20).max(800),
  process: z.array(z.string().min(10).max(300)).min(1),
  result: z.string().min(20).max(800),
  beforeImages: z.array(imagePathSchema).default([]),
  afterImages: z.array(imagePathSchema).default([]),
  gallery: z.array(imagePathSchema).default([]),
  featuredImage: imagePathSchema,
  video: optionalVideo,
  catalogue: optionalPdf,
  ogImage: optionalImage,
  featuredImageAlt: z.string().min(10).max(180),
  quoteCta: z.string().min(5).max(100),
  draft: z.boolean().default(true),
  publishedAt: date,
  updatedAt: date,
  ...seoFields
}));

export const servicePageSchema = chronological(z.object({
  title: z.string().min(8).max(120),
  slug,
  eyebrow: z.string().min(2).max(80),
  excerpt: z.string().min(40).max(300),
  materialTypes: z.array(z.string().min(2).max(120)).min(1),
  workItems: z.array(z.string().min(3).max(160)).min(1),
  process: z.array(z.string().min(10).max(300)).min(1),
  fileGuidance: z.array(z.string().min(5).max(220)).min(1),
  featuredImage: imagePathSchema,
  video: optionalVideo,
  catalogue: optionalPdf,
  ogImage: optionalImage,
  featuredImageAlt: z.string().min(10).max(180),
  quoteCta: z.string().min(5).max(100),
  publishedAt: date,
  updatedAt: date,
  draft: z.boolean().default(true),
  ...seoFields,
  faq: z.array(faqItem).default([])
}));

export const businessSettingsSchema = z.object({
  businessName: z.string().min(3).max(160),
  displayName: z.string().min(2).max(100),
  taxId: z.string().min(8).max(30),
  website: z.literal("https://mdftungphat.com"),
  phoneDisplay: z.string().min(8).max(30),
  phoneE164: z.string().regex(/^\+[1-9]\d{7,14}$/),
  zaloUrl: z.string().url(),
  email: z.union([z.literal(""), z.string().email()]),
  openingHours: z.array(z.string().min(5).max(80)).default([]),
  serviceAreas: z.array(z.string().min(2).max(100)).min(1),
  locations: z.array(z.object({
    id: slug,
    shortId: z.string().min(2).max(20),
    name: z.string().min(3).max(120),
    address: z.string().min(10).max(240),
    streetAddress: z.string().min(3).max(160),
    addressLocality: z.string().min(2).max(100),
    addressRegion: z.string().min(2).max(100),
    addressCountry: z.string().length(2),
    embedSrc: z.string().url(),
    directionsUrl: z.string().url()
  })).min(1),
  socialLinks: z.array(z.string().url()).default([]),
  footerDescription: z.string().min(40).max(300),
  primaryCtaLabel: z.string().min(3).max(80),
  primaryCtaUrl: z.string().startsWith("/"),
  localBusinessType: z.literal("LocalBusiness")
});

export const seoSettingsSchema = z.object({
  siteUrl: z.literal("https://mdftungphat.com"),
  siteName: z.string().min(2).max(80),
  defaultTitle: z.string().min(20).max(65),
  defaultDescription: z.string().min(80).max(170),
  defaultOgImage: imagePathSchema
});

export const staticPagesSettingsSchema = z.object({
  updatedAt: date,
  homeHeroDescription: z.string().min(80).max(260),
  contactIntro: z.string().min(80).max(300),
  quoteIntro: z.string().min(80).max(300)
});

export const materialCategoriesSchema = z.object({
  title: z.string().min(2).max(120),
  items: z.array(z.object({ name: z.string().min(2).max(100), slug })).min(1)
});

export const brandCategoriesSchema = z.object({
  items: z.array(z.object({
    slug,
    name: z.string().min(2).max(100),
    logo: z.union([z.literal(""), imagePathSchema]).default(""),
    description: z.string().min(20).max(300),
    catalogues: z.array(z.object({
      name: z.string().min(2).max(120),
      thumbnail: z.union([z.literal(""), imagePathSchema]).default(""),
      description: z.string().max(300).default(""),
      pdfUrl: z.union([z.literal(""), z.string().regex(/^\/[^\s]+\.pdf$/i)]).default("")
    })).default([]),
    products: z.array(z.unknown()).default([])
  })).min(1)
});

export type ArticleFrontmatter = z.infer<typeof articleSchema>;
export type ProductFrontmatter = z.infer<typeof productSchema>;
export type ProjectFrontmatter = z.infer<typeof projectSchema>;
export type ServicePageFrontmatter = z.infer<typeof servicePageSchema>;
export type BusinessSettings = z.infer<typeof businessSettingsSchema>;
