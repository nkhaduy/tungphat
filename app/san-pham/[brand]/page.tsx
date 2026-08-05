import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrandPage } from "@/components/BrandPage";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { brands, getBrand } from "@/lib/brands";
import { createPageMetadata } from "@/lib/seo";
import { getThanhThuyCatalog, getThanhThuyCategory, getThanhThuyTopCategories } from "@/lib/thanh-thuy";
import { createThanhThuyCategoryMetadata, thanhThuyZaloUrl } from "@/lib/thanh-thuy-seo";
import { ThanhThuyCategoryPage } from "@/components/thanh-thuy/ThanhThuyCategory";

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
  if (!brand && category) return createThanhThuyCategoryMetadata(category, `/san-pham/${category.slug}/`);
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
  const category = getThanhThuyCategory(brandSlug);
  if (!brand && category) {
    const catalog = getThanhThuyCatalog();
    const copy = catalog.products.filter((product) => product.categorySlug === category.slug).map((product) => ({
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
    return <><Header appearance="dark" /><ThanhThuyCategoryPage category={category} items={copy} categories={catalog.categories} zaloUrl={thanhThuyZaloUrl()} /><Footer /></>;
  }
  if (!brand) notFound();

  return (
    <>
      <Header appearance="dark" />
      <BrandPage brand={brand} />
      <Footer />
    </>
  );
}
