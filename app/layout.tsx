import type { Metadata } from "next";
import { Analytics } from "@/components/Analytics";
import { JsonLd } from "@/components/JsonLd";
import { LanguageProvider } from "@/lib/i18n-context";
import {
  BUSINESS_NAME,
  DEFAULT_DESCRIPTION,
  PHONE_E164,
  SITE_NAME,
  SITE_URL,
  absoluteUrl
} from "@/lib/seo";
import { locations } from "@/lib/locations";
import business from "@/content/settings/business.json";
import seo from "@/content/settings/seo.json";
import { montserratVariables } from "@/app/fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: seo.defaultTitle,
    template: "%s | Tùng Phát"
  },
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: absoluteUrl("/") },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" }
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" }
    ],
    shortcut: "/favicon.ico",
    apple: [
      {
        url: "/apple-icon.png",
        type: "image/png",
        sizes: "180x180"
      }
    ]
  },
  openGraph: {
    title: seo.defaultTitle,
    description: DEFAULT_DESCRIPTION,
    url: absoluteUrl("/"),
    siteName: SITE_NAME,
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: "/og-logo.png?v=20260719",
        width: 1200,
        height: 630,
        alt: "Tùng Phát – Vật liệu gỗ và giải pháp gia công CNC"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: seo.defaultTitle,
    description: DEFAULT_DESCRIPTION,
    images: ["/og-logo.png?v=20260719"]
  }
};

const siteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      inLanguage: "vi-VN",
      publisher: { "@id": `${SITE_URL}/#organization` }
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: BUSINESS_NAME,
      url: `${SITE_URL}/`,
      logo: "https://mdftungphat.com/icon.png",
      telephone: PHONE_E164,
      taxID: business.taxId,
      sameAs: business.socialLinks,
      department: locations.map((location) => ({ "@id": `${SITE_URL}/#${location.id}` }))
    },
    ...locations.map((location) => ({
      "@type": business.localBusinessType,
      "@id": `${SITE_URL}/#${location.id}`,
      name: location.name,
      url: `${SITE_URL}/lien-he#${location.id}`,
      telephone: PHONE_E164,
      parentOrganization: { "@id": `${SITE_URL}/#organization` },
      areaServed: business.serviceAreas,
      ...(business.openingHours.length ? { openingHours: business.openingHours } : {}),
      address: {
        "@type": "PostalAddress",
        streetAddress: location.streetAddress,
        addressLocality: location.addressLocality,
        addressRegion: location.addressRegion,
        addressCountry: location.addressCountry
      }
    }))
  ]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={montserratVariables}>
      <head>
        <link rel="preload" as="image" href="/images/hero-workshop-mobile.webp" media="(max-width: 767px)" fetchPriority="high" />
        <link rel="preload" as="image" href="/images/hero-workshop.webp" media="(min-width: 768px)" fetchPriority="high" />
        <JsonLd data={siteSchema} />
      </head>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
