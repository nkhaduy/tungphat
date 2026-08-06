import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrandPage } from "@/components/BrandPage";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/site/SiteShell";
import { ThanhThuyCategoryPage } from "@/components/thanh-thuy/ThanhThuyCategory";
import { brands, getBrand } from "@/lib/brands";
import { breadcrumbSchema, createPageMetadata } from "@/lib/seo";
import { getThanhThuyCatalog, getThanhThuyCategory, getThanhThuyTopCategories } from "@/lib/thanh-thuy";
import { createThanhThuyCategoryMetadata, thanhThuyZaloUrl } from "@/lib/thanh-thuy-seo";

type BrandRouteProps = { params: Promise<{ brand: string }> };

export function generateStaticParams() {
  return [
    ...brands.filter((brand) => brand.slug !== "thanh-thuy").map((brand) => ({ brand: brand.slug })),
    ...getThanhThuyTopCategories().map((category) => ({ brand: category.slug })),
  ];
}

export async function generateMetadata({ params }: BrandRouteProps): Promise<Metadata> {
  const { brand: brandSlug } = await params;
  const brand = getBrand(brandSlug);
  const category = getThanhThuyCategory(brandSlug);

  if (!brand && category) {
    return createThanhThuyCategoryMetadata(category, `/san-pham/${category.slug}/`);
  }

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
  const category = getThanhThuyCategory(brandSlug);

  if (!brand && category) {
    const catalog = getThanhThuyCatalog();
    const items = catalog.products
      .filter((product) => product.categorySlug === category.slug)
      .map((product) => ({
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
        <ThanhThuyCategoryPage
          category={category}
          items={items}
          categories={catalog.categories}
          zaloUrl={thanhThuyZaloUrl()}
        />
      </SiteShell>
    );
  }

  if (!brand) notFound();

  return (
    <SiteShell>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Trang chủ", path: "/" },
          { name: "Thương hiệu", path: "/san-pham" },
          { name: brand.name, path: `/san-pham/${brand.slug}` },
        ])}
      />
      <BrandPage brand={brand} />
    </SiteShell>
  );
}
