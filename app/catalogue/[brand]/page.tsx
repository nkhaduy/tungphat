import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogueView } from "@/components/CatalogueView";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/site/SiteShell";
import { brands, getBrand } from "@/lib/brands";
import { breadcrumbSchema, createPageMetadata } from "@/lib/seo";

type RouteProps = { params: Promise<{ brand: string }> };

export function generateStaticParams() {
  return brands
    .filter((b) => b.slug !== "kes")
    .map((brand) => ({ brand: brand.slug }));
}

export async function generateMetadata({
  params,
}: RouteProps): Promise<Metadata> {
  const { brand: brandSlug } = await params;
  const brand = getBrand(brandSlug);
  if (!brand) return {};
  return createPageMetadata({
    title: `Catalogue ${brand.name}`,
    description: `Dữ liệu catalogue ${brand.name} hiện có tại Tùng Phát. Liên hệ để kiểm tra mã, quy cách, tình trạng hàng và phạm vi catalogue phù hợp.`,
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
    <SiteShell>
      <JsonLd data={breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Catalogue", path: "/san-pham" }, { name: brand.name, path: `/catalogue/${brand.slug}` }])} />
      <CatalogueView brand={brand} />
    </SiteShell>
  );
}
