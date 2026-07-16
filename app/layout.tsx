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
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Tùng Phát | Vật liệu gỗ công nghiệp & Gia công CNC",
    template: "%s | Tùng Phát"
  },
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: absoluteUrl("/") },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" }
  },
  manifest: "/site.webmanifest?v=20260630-favicon2",
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
    title: "Tùng Phát | Vật liệu gỗ công nghiệp & Gia công CNC",
    description: DEFAULT_DESCRIPTION,
    url: absoluteUrl("/"),
    siteName: SITE_NAME,
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: "/og-logo.png?v=20260630",
        width: 899,
        height: 250,
        alt: "Tùng Phát – Vật liệu gỗ và giải pháp gia công CNC"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Tùng Phát | Vật liệu gỗ công nghiệp & Gia công CNC",
    description: DEFAULT_DESCRIPTION,
    images: ["/og-logo.png?v=20260630"]
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
      taxID: "0319115830",
      department: [
        { "@id": `${SITE_URL}/#chi-nhanh-1` },
        { "@id": `${SITE_URL}/#chi-nhanh-2` }
      ]
    },
    {
      "@type": "LocalBusiness",
      "@id": `${SITE_URL}/#chi-nhanh-1`,
      name: "Tùng Phát – Chi nhánh 1",
      url: `${SITE_URL}/lien-he#chi-nhanh-1`,
      telephone: PHONE_E164,
      parentOrganization: { "@id": `${SITE_URL}/#organization` },
      address: {
        "@type": "PostalAddress",
        streetAddress: "14 Tam Bình, phường Hiệp Bình",
        addressLocality: "TP. Hồ Chí Minh",
        addressCountry: "VN"
      }
    },
    {
      "@type": "LocalBusiness",
      "@id": `${SITE_URL}/#chi-nhanh-2`,
      name: "Tùng Phát – Chi nhánh 2",
      url: `${SITE_URL}/lien-he#chi-nhanh-2`,
      telephone: PHONE_E164,
      parentOrganization: { "@id": `${SITE_URL}/#organization` },
      address: {
        "@type": "PostalAddress",
        streetAddress: "81B Tam Bình, phường Hiệp Bình",
        addressLocality: "TP. Hồ Chí Minh",
        addressCountry: "VN"
      }
    }
  ]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <head>
        <JsonLd data={siteSchema} />
      </head>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
