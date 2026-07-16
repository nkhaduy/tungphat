import type { Metadata } from "next";

export const SITE_URL = "https://www.mdftungphat.com";
export const SITE_NAME = "Tùng Phát";
export const BUSINESS_NAME = "Công ty TNHH TMDV Gỗ Tùng Phát";
export const PHONE_DISPLAY = "0909 259 160";
export const PHONE_E164 = "+84909259160";
export const PHONE_HREF = "tel:0909259160";
export const ZALO_URL = "https://zalo.me/0909259160";

export const DEFAULT_DESCRIPTION =
  "Tùng Phát cung cấp vật liệu gỗ công nghiệp và gia công CNC theo kích thước, bản vẽ cho xưởng nội thất, thợ mộc, đơn vị thiết kế và doanh nghiệp.";

const OG_IMAGE = {
  url: "/og-logo.png?v=20260630",
  width: 899,
  height: 250,
  alt: "Tùng Phát – Vật liệu gỗ và giải pháp gia công CNC"
};

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

type PageMetadata = {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
};

export function createPageMetadata({ title, description, path, noIndex = false }: PageMetadata): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large" }
        },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: "vi_VN",
      type: "website",
      images: [OG_IMAGE]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE.url]
    }
  };
}

export type BreadcrumbItem = { name: string; path: string };

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  };
}
