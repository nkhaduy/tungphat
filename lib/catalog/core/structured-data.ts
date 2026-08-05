import { absoluteUrl } from "@/lib/seo";
import type { SupplierDefinition } from "./types";

type ProductJsonLdInput = {
  name: string;
  code?: string;
  description?: string;
  category?: string;
  canonicalRoute: string;
  images?: string[];
};

export function buildSupplierProductJsonLd(
  supplier: SupplierDefinition,
  input: ProductJsonLdInput,
) {
  return {
    "@context": "https://schema.org" as const,
    "@type": "Product" as const,
    name: input.name,
    ...(input.code ? { sku: input.code } : {}),
    brand: { "@type": "Brand" as const, name: supplier.brandName },
    ...(input.category ? { category: input.category } : {}),
    ...(input.description ? { description: input.description } : {}),
    ...(input.images?.length ? { image: input.images.map(absoluteUrl) } : {}),
    url: absoluteUrl(input.canonicalRoute),
  };
}

