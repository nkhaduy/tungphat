import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrandPage } from "@/components/BrandPage";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { brands, getBrand } from "@/lib/brands";

type BrandRouteProps = { params: { brand: string } };

export function generateStaticParams() {
  return brands.map((brand) => ({ brand: brand.slug }));
}

export function generateMetadata({ params }: BrandRouteProps): Metadata {
  const brand = getBrand(params.brand);
  return brand
    ? { title: `${brand.name} | Sản phẩm Tùng Phát`, description: `Sản phẩm và catalogue ${brand.name} tại Tùng Phát.` }
    : {};
}

export default function BrandRoute({ params }: BrandRouteProps) {
  const brand = getBrand(params.brand);
  if (!brand) notFound();

  return (
    <>
      <Header />
      <BrandPage brand={brand} />
      <Footer />
    </>
  );
}
