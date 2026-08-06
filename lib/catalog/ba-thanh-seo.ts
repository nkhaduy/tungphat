import type { Metadata } from "next";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";
import type { SupplierColorCode } from "@/lib/catalog/types";
import { baThanhCategories, getBaThanhIndexableCodes } from "@/lib/catalog/ba-thanh";

const brandPath = "/thuong-hieu/ba-thanh/";
const hubPath = "/ma-mau-melamine/ba-thanh/";

export function buildBaThanhCodeMetadata(record: SupplierColorCode): Metadata {
  const title = `Mã Melamine Ba Thanh ${record.displayName} – Tra mã và báo giá`;
  const description = record.editorialDescription || `Tra cứu mã Melamine Ba Thanh ${record.displayName}, nhóm ${record.patternGroup || record.category}, hình mẫu và hướng dẫn gửi mã cho Tùng Phát kiểm tra.`;
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`${hubPath}${record.slug}/`) },
    robots: record.seoStatus === "READY_TO_INDEX" && record.published ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`${hubPath}${record.slug}/`),
      siteName: SITE_NAME,
      locale: "vi_VN",
      type: "website",
      images: record.images.length ? [{ url: absoluteUrl(record.images[0].src), alt: record.images[0].alt }] : undefined,
    },
  };
}

export function buildBaThanhProductSchema(record: SupplierColorCode) {
  const description = record.editorialDescription || `Mã Melamine Ba Thanh ${record.displayName}, thuộc nhóm ${record.patternGroup || record.category}. Liên hệ Tùng Phát để kiểm tra quy cách và tình trạng mã.`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Melamine Ba Thanh mã ${record.displayName}`,
    sku: record.displayName,
    brand: { "@type": "Brand", name: "Ba Thanh" },
    category: "Melamine",
    image: record.images.map((image) => absoluteUrl(image.src)),
    description,
    url: absoluteUrl(`${hubPath}${record.slug}/`),
  };
}

export function buildBaThanhCollectionSchema(input: { name: string; path: string; items: SupplierColorCode[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    url: absoluteUrl(input.path),
    isPartOf: { "@type": "WebSite", url: absoluteUrl("/") },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: input.items.length,
      itemListElement: input.items.map((record, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `Melamine Ba Thanh ${record.displayName}`,
        url: absoluteUrl(`${hubPath}${record.slug}/`),
      })),
    },
  };
}

export function getBaThanhSitemapPaths() {
  return [
    brandPath,
    hubPath,
    ...baThanhCategories.filter((category) => category.count > 0).map((category) => `${hubPath}${category.slug}/`),
    ...getBaThanhIndexableCodes().map((record) => `${hubPath}${record.slug}/`),
  ];
}
