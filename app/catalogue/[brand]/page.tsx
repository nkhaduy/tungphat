import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CatalogueView } from "@/components/CatalogueView";
import { brands, getBrand } from "@/lib/brands";

type RouteProps = { params: { brand: string } };

export function generateStaticParams() {
  return brands
    .filter((b) => b.slug !== "kes")
    .map((brand) => ({ brand: brand.slug }));
}

export function generateMetadata({ params }: RouteProps): Metadata {
  const brand = getBrand(params.brand);
  if (!brand) return {};
  return {
    title: `Catalogue ${brand.name} | Tùng Phát`,
    description: `Catalogue sản phẩm chính thức ${brand.name} tại Tùng Phát. Tải file PDF hoặc liên hệ nhận catalogue mới nhất.`
  };
}

export default function CatalogueRoute({ params }: RouteProps) {
  const brand = getBrand(params.brand);
  if (!brand || brand.slug === "kes") notFound();

  return (
    <>
      <Header />
      <CatalogueView brand={brand} />
      <Footer />
    </>
  );
}