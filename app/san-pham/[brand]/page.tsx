import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrandPage } from "@/components/BrandPage";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { brands, getBrand } from "@/lib/brands";
import { breadcrumbSchema, createPageMetadata } from "@/lib/seo";

type BrandRouteProps = { params: { brand: string } };

export function generateStaticParams() {
  return brands.map((brand) => ({ brand: brand.slug }));
}

export function generateMetadata({ params }: BrandRouteProps): Metadata {
  const brand = getBrand(params.brand);
  return brand
    ? createPageMetadata({
        title: `Vật liệu ${brand.name}`,
        description: `Thông tin dòng vật liệu mang thương hiệu ${brand.name} tại Tùng Phát. Trang đang được bổ sung catalogue và dữ liệu sản phẩm.`,
        path: `/san-pham/${brand.slug}`,
        noIndex: true
      })
    : {};
}

export default function BrandRoute({ params }: BrandRouteProps) {
  const brand = getBrand(params.brand);
  if (!brand) notFound();

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Trang chủ", path: "/" },
          { name: "Sản phẩm", path: "/san-pham" },
          { name: brand.name, path: `/san-pham/${brand.slug}` }
        ])}
      />
      <Header />
      <BrandPage brand={brand} />
      <Footer />
    </>
  );
}
