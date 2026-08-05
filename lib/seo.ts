import type { Metadata } from "next";
import business from "@/content/settings/business.json";
import seo from "@/content/settings/seo.json";

export const SITE_URL = seo.siteUrl;
export const SITE_NAME = seo.siteName;
export const BUSINESS_NAME = business.businessName;
export const TAX_ID = business.taxId;
export const PHONE_DISPLAY = business.phoneDisplay;
export const PHONE_E164 = business.phoneE164;
export const PHONE_HREF = `tel:${business.phoneE164}`;
export const ZALO_URL = business.zaloUrl;
export const FOOTER_DESCRIPTION = business.footerDescription;
export const GOOGLE_REVIEWS_URL =
  "https://www.google.com/maps/search/?api=1&query=C%E1%BB%ADa%20H%C3%A0ng%20G%E1%BB%97%20Gh%C3%A9p%20T%C3%B9ng%20Ph%C3%A1t";

export const DEFAULT_DESCRIPTION = seo.defaultDescription;

const OG_IMAGE = {
  url: seo.defaultOgImage,
  width: 899,
  height: 250,
  alt: "Tùng Phát – Vật liệu gỗ và giải pháp gia công CNC"
};

export function absoluteUrl(path = "/") {
  const url = new URL(path, SITE_URL);
  const lastSegment = url.pathname.split("/").filter(Boolean).at(-1) || "";
  if (!url.pathname.endsWith("/") && !lastSegment.includes(".")) {
    url.pathname = `${url.pathname}/`;
  }
  return url.toString();
}

type PageMetadata = {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
};

export function createPageMetadata({ title, description, path, noIndex = false }: PageMetadata): Metadata {
  const canonicalUrl = absoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
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
      url: canonicalUrl,
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
