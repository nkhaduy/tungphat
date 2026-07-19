import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrandPage } from "@/components/BrandPage";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { brands, getBrand } from "@/lib/brands";

type BrandRouteProps = { params: Promise<{ brand: string }> };

export function generateStaticParams() {
  return brands.map((brand) => ({ brand: brand.slug }));
}

export async function generateMetadata({ params }: BrandRouteProps): Promise<Metadata> {
  const { brand: brandSlug } = await params;
  const brand = getBrand(brandSlug);
  return brand
    ? { title: `${brand.name} | Sản phẩm Tùng Phát`, description: `Sản phẩm và catalogue ${brand.name} tại Tùng Phát.` }
    : {};
}

export default async function BrandRoute({ params }: BrandRouteProps) {
  const { brand: brandSlug } = await params;
  const brand = getBrand(brandSlug);
  if (!brand) notFound();

  return (
    <>
      <Header appearance="light" />
      <BrandPage brand={brand} />
      <Footer />
    </>
  );
}
