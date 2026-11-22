import { absoluteMediaUrl } from "@/lib/media";
import { allMaterialCards } from "@/lib/product-taxonomy";
import { SITE_URL, absolutePageUrl, schemaPageId } from "@/lib/seo";

type ProductLandingSchemaInput = {
  slug: string;
  status: "available" | "discontinued" | "guide";
  title: string;
  excerpt: string;
  featuredImage: string;
  category: string;
  materialType: string;
  supplier: string;
  dimensions: string[];
  thicknesses: string[];
  surfaces: string[];
};

type ServiceLandingSchemaInput = {
  slug: string;
  title: string;
  excerpt: string;
};

// These routes describe material families with multiple possible specifications.
// CMS availability is not evidence of a single SKU or a priced offer.
const materialFamilySlugs = new Set(allMaterialCards.map((card) => card.href.replace(/^\//u, "").replace(/\/$/u, "")));

export function isMaterialCollection(product: Pick<ProductLandingSchemaInput, "slug" | "status">) {
  return product.status === "guide" || materialFamilySlugs.has(product.slug);
}

export function buildProductLandingSchema(product: ProductLandingSchemaInput) {
  const path = `/${product.slug}`;
  const common = {
    "@context": "https://schema.org",
    name: product.title,
    description: product.excerpt,
    image: [absoluteMediaUrl(product.featuredImage, SITE_URL)],
    url: absolutePageUrl(path),
  };

  if (isMaterialCollection(product)) {
    return {
      ...common,
      "@type": "CollectionPage",
      "@id": schemaPageId(path, "webpage"),
    };
  }

  return {
    ...common,
    "@type": "Product",
    "@id": schemaPageId(path, "product"),
    category: product.category,
    material: product.materialType,
    brand: product.supplier
      ? { "@type": "Brand", name: product.supplier }
      : undefined,
    additionalProperty: [
      ...product.dimensions.map((value) => ({
        "@type": "PropertyValue",
        name: "Kích thước",
        value,
      })),
      ...product.thicknesses.map((value) => ({
        "@type": "PropertyValue",
        name: "Độ dày",
        value,
      })),
      ...product.surfaces.map((value) => ({
        "@type": "PropertyValue",
        name: "Bề mặt",
        value,
      })),
    ],
  };
}

export function buildServiceLandingSchema(page: ServiceLandingSchemaInput) {
  const path = `/${page.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": schemaPageId(path, "service"),
    name: page.title,
    description: page.excerpt,
    serviceType: "Gia công CNC ván gỗ",
    url: absolutePageUrl(path),
    areaServed: { "@type": "City", name: "TP. Hồ Chí Minh" },
    provider: { "@id": `${SITE_URL}/#organization` },
  };
}
