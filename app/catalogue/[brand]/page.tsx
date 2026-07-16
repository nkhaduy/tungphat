import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CatalogueView } from "@/components/CatalogueView";
import { JsonLd } from "@/components/JsonLd";
import { brands, getBrand } from "@/lib/brands";
import { breadcrumbSchema, createPageMetadata } from "@/lib/seo";

type RouteProps = { params: { brand: string } };

export function generateStaticParams() {
  return brands
    .filter((b) => b.slug !== "kes")
    .map((brand) => ({ brand: brand.slug }));
}

export function generateMetadata({ params }: RouteProps): Metadata {
  const brand = getBrand(params.brand);
  if (!brand) return {};
  return createPageMetadata({
    title: `Catalogue ${brand.name}`,
    description: `Trang thông tin catalogue ${brand.name} tại Tùng Phát. Liên hệ để kiểm tra file catalogue và dữ liệu sản phẩm đang có.`,
    path: `/catalogue/${brand.slug}`,
    noIndex: true
  });
}

export default function CatalogueRoute({ params }: RouteProps) {
  const brand = getBrand(params.brand);
  if (!brand || brand.slug === "kes") notFound();

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Trang chủ", path: "/" },
          { name: "Sản phẩm", path: "/san-pham" },
          { name: `Catalogue ${brand.name}`, path: `/catalogue/${brand.slug}` }
        ])}
      />
      <Header />
      <CatalogueView brand={brand} />
      <Footer />
    </>
  );
}
