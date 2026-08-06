import type { Metadata } from "next";
import { SiteShell } from "@/components/site/SiteShell";
import { ThanhThuyBrandPage } from "@/components/thanh-thuy/ThanhThuyBrand";
import { createThanhThuyBrandMetadata, thanhThuyZaloUrl } from "@/lib/thanh-thuy-seo";
import { getThanhThuyCatalog } from "@/lib/thanh-thuy";
import business from "@/content/settings/business.json";

export const metadata: Metadata = createThanhThuyBrandMetadata();

export default function ThanhThuyBrandRoute() {
  const catalog = getThanhThuyCatalog();
  const items = catalog.products.map((product) => ({
    slug: product.slug,
    code: product.code,
    name: product.name,
    categorySlug: product.categorySlug,
    categoryName: product.categoryName,
    seriesName: product.seriesName,
    color: product.color,
    pattern: product.pattern,
    image: product.image,
    imageAlt: product.imageAlt,
    imageWidth: product.imageWidth,
    imageHeight: product.imageHeight,
    imageSrcSet: product.imageSrcSet,
    seoStatus: product.seoStatus,
  }));
  return (
    <SiteShell>
      <ThanhThuyBrandPage
        items={items}
        categories={catalog.categories}
        zaloUrl={thanhThuyZaloUrl()}
        locations={business.locations.map(({ id, name, address }) => ({ id, name, address }))}
      />
    </SiteShell>
  );
}
