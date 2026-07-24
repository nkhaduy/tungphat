import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CatalogueView } from "@/components/CatalogueView";
import { brands, getBrand } from "@/lib/brands";
import { createPageMetadata } from "@/lib/seo";

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
    description: `Catalogue sản phẩm chính thức ${brand.name} tại Tùng Phát. Tải file PDF hoặc liên hệ nhận catalogue mới nhất.`,
    path: `/catalogue/${brand.slug}/`,
    noIndex: true,
    followWhenNoIndex: true,
  });
}

export default async function CatalogueRoute({ params }: RouteProps) {
  const { brand: brandSlug } = await params;
  const brand = getBrand(brandSlug);
  if (!brand || brand.slug === "kes") notFound();

  return (
    <>
      <Header appearance="dark" />
      <CatalogueView brand={brand} />
      <Footer />
    </>
  );
}
