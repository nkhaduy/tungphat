import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CatalogueView } from "@/components/CatalogueView";
import { catalogueStaticParams, getBrand } from "@/lib/brands";

type RouteProps = { params: Promise<{ brand: string }> };

export function generateStaticParams() {
  return catalogueStaticParams();
}

export const dynamicParams = false;

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { brand: brandSlug } = await params;
  const brand = getBrand(brandSlug);
  if (!brand) return {};
  return {
    title: `Catalogue ${brand.name} | Tùng Phát`,
    description: `Catalogue sản phẩm chính thức ${brand.name} tại Tùng Phát. Tải file PDF hoặc liên hệ nhận catalogue mới nhất.`
  };
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
