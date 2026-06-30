import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n-context";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
  variable: "--font-montserrat",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tungphatwood.vn"),
  title: "Tùng Phát | Vật liệu gỗ & Gia công CNC",
  description:
    "Phân phối vật liệu gỗ và gia công CNC theo kích thước, bản vẽ cho xưởng nội thất, thợ mộc, kiến trúc sư và doanh nghiệp.",
  alternates: {
    canonical: "/"
  },
  manifest: "/site.webmanifest?v=20260630-favicon2",
  icons: {
    icon: [
      { url: "/favicon.ico?v=20260630-favicon2", sizes: "any" },
      { url: "/favicon-16x16.png?v=20260630-favicon2", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png?v=20260630-favicon2", sizes: "32x32", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png?v=20260630-favicon2", sizes: "180x180", type: "image/png" }]
  },
  openGraph: {
    title: "Tùng Phát | Vật liệu gỗ & Gia công CNC",
    description:
      "Phân phối vật liệu gỗ và gia công CNC theo kích thước, bản vẽ cho xưởng nội thất, thợ mộc, kiến trúc sư và doanh nghiệp.",
    url: "/",
    siteName: "Tùng Phát",
    locale: "vi_VN",
    type: "website",
    images: [{ url: "/og-logo.png?v=20260630", width: 899, height: 250, alt: "Tùng Phát Wood & CNC Solutions" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Tùng Phát | Vật liệu gỗ & Gia công CNC",
    description:
      "Phân phối vật liệu gỗ và gia công CNC theo kích thước, bản vẽ cho xưởng nội thất, thợ mộc, kiến trúc sư và doanh nghiệp.",
    images: ["/og-logo.png?v=20260630"]
  }
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Công ty TNHH TMDV Gỗ Tùng Phát",
  url: "https://tungphatwood.vn",
  logo: "https://tungphatwood.vn/logo-vertical.png",
  telephone: "+84909259160",
  taxID: "0319115830",
  address: [
    {
      "@type": "PostalAddress",
      streetAddress: "14 Tam Bình, Phường Hiệp Bình",
      addressLocality: "TP. Hồ Chí Minh",
      addressCountry: "VN"
    },
    {
      "@type": "PostalAddress",
      streetAddress: "81B Tam Bình, Phường Hiệp Bình",
      addressLocality: "TP. Hồ Chí Minh",
      addressCountry: "VN"
    }
  ]
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={montserrat.variable}>
      <head>
        <link rel="preload" as="image" href="/images/hero-workshop.png" type="image/png" fetchPriority="high" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
