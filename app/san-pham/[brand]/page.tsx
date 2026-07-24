import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrandPage } from "@/components/BrandPage";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { brands, getBrand } from "@/lib/brands";
import { createPageMetadata } from "@/lib/seo";

type BrandRouteProps = { params: Promise<{ brand: string }> };

export function generateStaticParams() {
  return brands.map((brand) => ({ brand: brand.slug }));
}

export async function generateMetadata({ params }: BrandRouteProps): Promise<Metadata> {
  const { brand: brandSlug } = await params;
  const brand = getBrand(brandSlug);
  return brand
    ? createPageMetadata({
        title: `${brand.name} | Sản phẩm`,
        description: `Sản phẩm và catalogue ${brand.name} tại Tùng Phát.`,
        path: `/san-pham/${brand.slug}/`,
        noIndex: true,
        followWhenNoIndex: true,
      })
    : {};
}

export default async function BrandRoute({ params }: BrandRouteProps) {
  const { brand: brandSlug } = await params;
  const brand = getBrand(brandSlug);
  if (!brand) notFound();

  return (
    <>
      <Header appearance="dark" />
      <BrandPage brand={brand} />
      <Footer />
    </>
  );
}
