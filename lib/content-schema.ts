import { z } from "zod";

const slug = z.string().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang");
const imagePath = z.string().regex(/^\/[^\s]+\.(?:avif|webp|png|jpe?g)$/i, "Ảnh phải là đường dẫn tuyệt đối trong public và đúng định dạng ảnh");
const optionalCanonical = z.union([
  z.literal(""),
  z.string().url().refine((value) => new URL(value).origin === "https://mdftungphat.com", "Canonical phải thuộc https://mdftungphat.com")
]).default("");
const faqItem = z.object({ question: z.string().min(10).max(180), answer: z.string().min(20).max(1200) });

const seoFields = {
  seoTitle: z.string().min(20).max(65),
  seoDescription: z.string().min(80).max(170),
  canonical: optionalCanonical,
  noindex: z.boolean().default(false)
};

export const articleSchema = z.object({
  title: z.string().min(10).max(120),
  slug,
  excerpt: z.string().min(40).max(240),
  publishedAt: z.string().date(),
  updatedAt: z.string().date(),
  author: z.string().min(2).max(80),
  category: z.string().min(2).max(80),
  tags: z.array(z.string().min(2).max(50)).default([]),
  featuredImage: imagePath,
  featuredImageAlt: z.string().min(10).max(180),
  gallery: z.array(imagePath).default([]),
  draft: z.boolean().default(true),
  featured: z.boolean().default(false),
  ...seoFields,
  relatedProducts: z.array(slug).default([]),
  relatedArticles: z.array(slug).default([]),
  faq: z.array(faqItem).default([])
});

export const productSchema = z.object({
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
  featuredImage: imagePath,
  featuredImageAlt: z.string().min(10).max(180),
  gallery: z.array(imagePath).default([]),
  status: z.enum(["available", "discontinued"]),
  quoteCta: z.string().min(5).max(100),
  publishedAt: z.string().date(),
  updatedAt: z.string().date(),
  draft: z.boolean().default(true),
  ...seoFields,
  faq: z.array(faqItem).default([]),
  relatedArticles: z.array(slug).default([])
});

export const projectSchema = z.object({
  title: z.string().min(8).max(120),
  slug,
  completedAt: z.string().date(),
  materialType: z.string().min(2).max(100),
  thickness: z.string().min(1).max(80),
  workItems: z.array(z.string().min(3).max(160)).min(1),
  customerRequirement: z.string().min(20).max(800),
  process: z.array(z.string().min(10).max(300)).min(1),
  result: z.string().min(20).max(800),
  beforeImages: z.array(imagePath).default([]),
  afterImages: z.array(imagePath).default([]),
  gallery: z.array(imagePath).default([]),
  featuredImage: imagePath,
  featuredImageAlt: z.string().min(10).max(180),
  quoteCta: z.string().min(5).max(100),
  draft: z.boolean().default(true),
  publishedAt: z.string().date(),
  updatedAt: z.string().date(),
  ...seoFields
});

export const servicePageSchema = z.object({
  title: z.string().min(8).max(120),
  slug,
  eyebrow: z.string().min(2).max(80),
  excerpt: z.string().min(40).max(300),
  materialTypes: z.array(z.string().min(2).max(120)).min(1),
  workItems: z.array(z.string().min(3).max(160)).min(1),
  process: z.array(z.string().min(10).max(300)).min(1),
  fileGuidance: z.array(z.string().min(5).max(220)).min(1),
  featuredImage: imagePath,
  featuredImageAlt: z.string().min(10).max(180),
  quoteCta: z.string().min(5).max(100),
  publishedAt: z.string().date(),
  updatedAt: z.string().date(),
  draft: z.boolean().default(true),
  ...seoFields,
  faq: z.array(faqItem).default([])
});

export type ArticleFrontmatter = z.infer<typeof articleSchema>;
export type ProductFrontmatter = z.infer<typeof productSchema>;
export type ProjectFrontmatter = z.infer<typeof projectSchema>;
export type ServicePageFrontmatter = z.infer<typeof servicePageSchema>;
