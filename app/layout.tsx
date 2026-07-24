import type { Metadata } from "next";
import { Analytics } from "@/components/Analytics";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { JsonLd } from "@/components/JsonLd";
import { OPEN_GRAPH_LOCALE, SCHEMA_LANGUAGE, SITE_LANGUAGE } from "@/lib/locale";
import {
  BUSINESS_NAME,
  DEFAULT_DESCRIPTION,
  DEFAULT_SOCIAL_IMAGE,
  PHONE_E164,
  SITE_NAME,
  SITE_URL,
  absolutePageUrl,
  absoluteUrl,
  schemaPageId,
} from "@/lib/seo";
import { twitterSocialImage } from "@/lib/social-images";
import { locations } from "@/lib/locations";
import business from "@/content/settings/business.json";
import seo from "@/content/settings/seo.json";
import { montserratVariables } from "@/app/fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: seo.defaultTitle,
    template: "%s | Tùng Phát",
  },
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: absoluteUrl("/") },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      {
        url: "/apple-icon.png",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  },
  openGraph: {
    title: seo.defaultTitle,
    description: DEFAULT_DESCRIPTION,
    url: absoluteUrl("/"),
    siteName: SITE_NAME,
    locale: OPEN_GRAPH_LOCALE,
    type: "website",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: seo.defaultTitle,
    description: DEFAULT_DESCRIPTION,
    images: [twitterSocialImage(DEFAULT_SOCIAL_IMAGE)],
  },
};

const siteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": schemaPageId("/", "website"),
      url: absolutePageUrl("/"),
      name: SITE_NAME,
      inLanguage: SCHEMA_LANGUAGE,
      publisher: { "@id": schemaPageId("/", "organization") },
    },
    {
      "@type": "Organization",
      "@id": schemaPageId("/", "organization"),
      name: BUSINESS_NAME,
      url: absolutePageUrl("/"),
      logo: "https://mdftungphat.com/icon.png",
      telephone: PHONE_E164,
      email: business.email,
      taxID: business.taxId,
      sameAs: business.socialLinks,
      department: locations.map((location) => ({
        "@id": schemaPageId("/", location.id),
      })),
    },
    ...locations.map((location) => ({
      "@type": business.localBusinessType,
      "@id": schemaPageId("/", location.id),
      name: location.name,
      url: schemaPageId("/lien-he", location.id),
      telephone: PHONE_E164,
      email: business.email,
      parentOrganization: { "@id": schemaPageId("/", "organization") },
      areaServed: business.serviceAreas,
      ...(business.openingHours.length
        ? { openingHours: business.openingHours }
        : {}),
      address: {
        "@type": "PostalAddress",
        streetAddress: location.streetAddress,
        addressLocality: location.addressLocality,
        addressRegion: location.addressRegion,
        addressCountry: location.addressCountry,
      },
    })),
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={SITE_LANGUAGE} className={montserratVariables}>
      <head>
        <JsonLd data={siteSchema} />
      </head>
      <body>
        {children}
        <Analytics />
        <AnalyticsProvider />
      </body>
    </html>
  );
}
