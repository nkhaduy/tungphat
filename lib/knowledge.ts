import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import business from "@/content/settings/business.json";
import seo from "@/content/settings/seo.json";
import { articleSchema, productSchema, projectSchema, servicePageSchema } from "@/lib/content-schema";
import { absolutePageUrl } from "@/lib/seo";
import materialDataset from "@/data/materials/materials.json";

type KnowledgePage = {
  url: string;
  type: "Product" | "CollectionPage" | "Service" | "Article" | "CreativeWork";
  name: string;
  description: string;
  updatedAt: string;
  category?: string;
  materialType?: string;
  applications?: string[];
  advantages?: string[];
  limitations?: string[];
  dimensions?: string[];
  thicknesses?: string[];
  surfaces?: string[];
};

export function buildKnowledgeIndex() {
  function readCollection<T>(folder: string, schema: { parse: (value: unknown) => T }) {
    const directory = path.join(process.cwd(), "content", folder);
    if (!fs.existsSync(directory)) return [] as Array<T & { body: string }>;
    return fs.readdirSync(directory).filter((file) => /\.mdx?$/u.test(file)).map((file) => {
      const parsed = matter(fs.readFileSync(path.join(directory, file), "utf8"));
      return { ...schema.parse(parsed.data), body: parsed.content.trim() };
    });
  }

  const products: KnowledgePage[] = readCollection("products", productSchema).filter((entry) => !entry.draft && !entry.noindex).map((entry) => ({
    url: absolutePageUrl(`/${entry.slug}`),
    type: entry.status === "guide" ? "CollectionPage" : "Product",
    name: entry.title,
    description: entry.excerpt,
    updatedAt: entry.updatedAt,
    category: entry.category,
    materialType: entry.materialType,
    applications: entry.applications,
    advantages: entry.advantages,
    limitations: entry.limitations,
    dimensions: entry.dimensions,
    thicknesses: entry.thicknesses,
    surfaces: entry.surfaces,
  }));
  const services: KnowledgePage[] = readCollection("pages", servicePageSchema).filter((entry) => !entry.draft && !entry.noindex).map((entry) => ({
    url: absolutePageUrl(`/${entry.slug}`),
    type: "Service",
    name: entry.title,
    description: entry.excerpt,
    updatedAt: entry.updatedAt,
    applications: entry.workItems,
  }));
  const articles: KnowledgePage[] = readCollection("articles", articleSchema).filter((entry) => !entry.draft && !entry.noindex).map((entry) => ({
    url: absolutePageUrl(`/bai-viet/${entry.slug}`),
    type: "Article",
    name: entry.title,
    description: entry.excerpt,
    updatedAt: entry.updatedAt,
    category: entry.category,
  }));
  const projects: KnowledgePage[] = readCollection("projects", projectSchema).filter((entry) => !entry.draft && !entry.noindex).map((entry) => ({
    url: absolutePageUrl(`/du-an/${entry.slug}`),
    type: "CreativeWork",
    name: entry.title,
    description: entry.customerRequirement,
    updatedAt: entry.updatedAt,
    materialType: entry.materialType,
  }));

  return {
    schemaVersion: "1.0",
    site: { name: seo.siteName, url: absolutePageUrl("/"), language: "vi-VN" },
    business: {
      name: business.businessName,
      displayName: business.displayName,
      url: absolutePageUrl("/"),
      phone: business.phoneDisplay,
      email: business.email,
      serviceAreas: business.serviceAreas,
      sameAs: business.socialLinks,
    },
    locations: business.locations.map(({ embedSrc, ...location }) => {
      void embedSrc;
      return location;
    }),
    resources: [
      {
        url: absolutePageUrl("/tham-chieu-vat-lieu"),
        type: "Dataset",
        name: "Tham chiếu vật liệu MDF, gỗ ghép và CNC",
        updatedAt: materialDataset.lastVerified,
        recordCount: materialDataset.materials.length,
        sourceCount: materialDataset.sources.length,
      },
    ],
    pages: [...products, ...services, ...articles, ...projects],
  };
}
