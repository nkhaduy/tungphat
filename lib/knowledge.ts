import business from "@/content/settings/business.json";
import seo from "@/content/settings/seo.json";
import { getArticles, getProducts, getProjects, getServicePages } from "@/lib/content";
import { absolutePageUrl, absoluteUrl } from "@/lib/seo";
import { resolveMediaUrl } from "@/lib/media";
import materialDataset from "@/data/materials/materials.json";
import cncPreflight from "@/data/cnc-preflight-checklist.json";

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

export async function buildKnowledgeIndex() {
  const [productEntries, serviceEntries, articleEntries, projectEntries] = await Promise.all([
    getProducts(),
    getServicePages(),
    getArticles(),
    getProjects(),
  ]);
  const products: KnowledgePage[] = productEntries.map((entry) => ({
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
  const services: KnowledgePage[] = serviceEntries.map((entry) => ({
    url: absolutePageUrl(`/${entry.slug}`),
    type: "Service",
    name: entry.title,
    description: entry.excerpt,
    updatedAt: entry.updatedAt,
    applications: entry.workItems,
  }));
  const articles: KnowledgePage[] = articleEntries.map((entry) => ({
    url: absolutePageUrl(`/bai-viet/${entry.slug}`),
    type: "Article",
    name: entry.title,
    description: entry.excerpt,
    updatedAt: entry.updatedAt,
    category: entry.category,
  }));
  const projects: KnowledgePage[] = projectEntries.map((entry) => ({
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
      return { ...location, image: resolveMediaUrl(location.image) };
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
      {
        url: absoluteUrl("/cnc-preflight-checklist.csv"),
        type: "DataDownload",
        name: "Checklist chuẩn bị dữ liệu CNC",
        updatedAt: cncPreflight.lastVerified,
        recordCount: cncPreflight.items.length,
        sourceCount: cncPreflight.sourceUrls.length,
      },
    ],
    pages: [...products, ...services, ...articles, ...projects],
  };
}
