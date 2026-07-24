import type { Metadata } from "next";
import business from "@/content/settings/business.json";
import seo from "@/content/settings/seo.json";
import {
  createSocialImage,
  twitterSocialImage,
  type SocialImage,
} from "@/lib/social-images";
import { OPEN_GRAPH_LOCALE } from "@/lib/locale";

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

const TITLE_BRAND = "Tùng Phát";
const TITLE_SUFFIX = ` | ${TITLE_BRAND}`;

export const DEFAULT_SOCIAL_IMAGE = createSocialImage({
  url: seo.defaultOgImage,
  alt: "Tùng Phát – Vật liệu gỗ và giải pháp gia công CNC",
});

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

const PAGE_FILE_EXTENSION = /\.[a-z0-9]{1,10}$/iu;

export function absolutePageUrl(path = "/") {
  const value = path.trim();
  if (!value) throw new Error("Page URL must not be empty.");

  const canonicalOrigin = new URL(SITE_URL);
  const url = new URL(value, canonicalOrigin);
  const isInternalHost =
    url.hostname === canonicalOrigin.hostname ||
    url.hostname === `www.${canonicalOrigin.hostname}`;

  if (!isInternalHost) return value;

  url.protocol = canonicalOrigin.protocol;
  url.host = canonicalOrigin.host;
  url.pathname = url.pathname.replace(/\/{2,}/gu, "/");

  const pathWithoutTrailingSlash = url.pathname.replace(/\/$/u, "");
  if (PAGE_FILE_EXTENSION.test(pathWithoutTrailingSlash)) {
    throw new Error(`Page URL must not reference a file asset: ${value}`);
  }

  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url.toString();
}

export function schemaPageId(path: string, fragment: string) {
  const normalizedFragment = fragment.trim().replace(/^#/u, "");
  if (!normalizedFragment) throw new Error("Schema fragment must not be empty.");

  const url = new URL(absolutePageUrl(path));
  url.hash = normalizedFragment;
  return url.toString();
}

export function formatPageTitle(title: string) {
  let normalized = title
    .split("|")
    .map((segment) => segment.replace(/\s+/gu, " ").trim())
    .filter(Boolean)
    .join(" | ");

  if (!normalized) throw new Error("Page title must not be empty.");

  while (normalized.endsWith(TITLE_SUFFIX)) {
    normalized = normalized.slice(0, -TITLE_SUFFIX.length).trim();
  }

  if (!normalized || normalized === TITLE_BRAND) return TITLE_BRAND;
  if (normalized.startsWith(`${TITLE_BRAND} | `)) return normalized;
  return `${normalized}${TITLE_SUFFIX}`;
}

type PageMetadata = {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
  followWhenNoIndex?: boolean;
  socialImages?: SocialImage[];
};

export function createPageMetadata({
  title,
  description,
  path,
  noIndex = false,
  followWhenNoIndex = false,
  socialImages = [DEFAULT_SOCIAL_IMAGE],
}: PageMetadata): Metadata {
  const canonicalUrl = absoluteUrl(path);
  const formattedTitle = formatPageTitle(title);
  return {
    title: { absolute: formattedTitle },
    description,
    alternates: { canonical: canonicalUrl },
    robots: noIndex
      ? {
          index: false,
          follow: followWhenNoIndex,
          googleBot: { index: false, follow: followWhenNoIndex },
        }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large" }
        },
    openGraph: {
      title: formattedTitle,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: OPEN_GRAPH_LOCALE,
      type: "website",
      images: socialImages,
    },
    twitter: {
      card: "summary_large_image",
      title: formattedTitle,
      description,
      images: socialImages.map(twitterSocialImage),
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
      item: absolutePageUrl(item.path)
    }))
  };
}
