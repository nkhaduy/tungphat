import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrandPage } from "@/components/BrandPage";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/site/SiteShell";
import { brands, getBrand } from "@/lib/brands";
import { breadcrumbSchema, createPageMetadata } from "@/lib/seo";

type BrandRouteProps = { params: Promise<{ brand: string }> };

export function generateStaticParams() {
  return brands.map((brand) => ({ brand: brand.slug }));
}

export async function generateMetadata({ params }: BrandRouteProps): Promise<Metadata> {
  const { brand: brandSlug } = await params;
  const brand = getBrand(brandSlug);
  return brand
    ? createPageMetadata({
        title: `${brand.name} | Sản phẩm Tùng Phát`,
        description: `Sản phẩm và catalogue ${brand.name} tại Tùng Phát. Gửi mã màu hoặc nhóm vật liệu để kiểm tra hàng thực tế.`,
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
    <SiteShell>
      <JsonLd data={breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Thương hiệu", path: "/san-pham" }, { name: brand.name, path: `/san-pham/${brand.slug}` }])} />
      <BrandPage brand={brand} />
    </SiteShell>
  );
}
