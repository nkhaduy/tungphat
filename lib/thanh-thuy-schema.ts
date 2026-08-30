import { absoluteMediaUrl } from "@/lib/media";
import { absoluteUrl, SITE_URL } from "@/lib/seo";

export type ThanhThuySchemaProduct = {
  name: string;
  code?: string;
  slug?: string;
  categorySlug?: string;
  categoryName?: string;
  color?: string;
  description?: string;
  image?: string;
  price?: number | null;
  priceCurrency?: string;
  availability?: string;
};

export type ThanhThuySchemaItem = ThanhThuySchemaProduct & {
  path?: string;
  url?: string;
};

export type ThanhThuyBreadcrumbItem = { name: string; path: string };

function availabilityUrl(value: string): string {
  return value.startsWith("http")
    ? value
    : `https://schema.org/${value.replace(/^https?:\/\/schema\.org\//, "")}`;
}

export function createThanhThuyProductSchema(
  product: ThanhThuySchemaProduct,
  path: string,
) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url: absoluteUrl(path),
    brand: { "@type": "Brand", name: "Thanh Thuỳ" },
  };
  if (product.code) schema.sku = product.code;
  if (product.categoryName) schema.category = product.categoryName;
  if (product.categoryName) schema.material = product.categoryName;
  if (product.color) schema.color = product.color;
  if (product.description) schema.description = product.description;
  if (product.image) schema.image = absoluteMediaUrl(product.image, SITE_URL);
  if (
    typeof product.price === "number" &&
    product.price > 0 &&
    product.priceCurrency &&
    product.availability
  ) {
    schema.offers = {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.priceCurrency,
      availability: availabilityUrl(product.availability),
      url: absoluteUrl(path),
    };
  }
  return schema;
}

export function createThanhThuyBreadcrumbSchema(
  items: ThanhThuyBreadcrumbItem[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function createThanhThuyItemListSchema(
  items: ThanhThuySchemaItem[],
  name: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => {
      const path =
        item.path ||
        item.url ||
        (item.categorySlug && item.slug
          ? `/san-pham/${item.categorySlug}/${item.slug}/`
          : "/thuong-hieu/thanh-thuy/");
      return {
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: absoluteUrl(path),
      };
    }),
  };
}
