import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CatalogueView } from "@/components/CatalogueView";
import { JsonLd } from "@/components/JsonLd";
import { brands, getBrand } from "@/lib/brands";
import { breadcrumbSchema, createPageMetadata } from "@/lib/seo";

type RouteProps = { params: Promise<{ brand: string }> };

export function generateStaticParams() {
  return brands
    .filter((b) => b.slug !== "kes")
    .map((brand) => ({ brand: brand.slug }));
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { brand: brandSlug } = await params;
  const brand = getBrand(brandSlug);
  if (!brand) return {};
  return createPageMetadata({
    title: `Catalogue ${brand.name}`,
    description: `Trang thông tin catalogue ${brand.name} tại Tùng Phát. Liên hệ để kiểm tra file catalogue và dữ liệu sản phẩm đang có.`,
    path: `/catalogue/${brand.slug}`,
    noIndex: true
  });
}

export default async function CatalogueRoute({ params }: RouteProps) {
  const { brand: brandSlug } = await params;
  const brand = getBrand(brandSlug);
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
