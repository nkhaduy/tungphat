import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site/SiteShell";
import { ThanhThuyProductDetail } from "@/components/thanh-thuy/ThanhThuyProductDetail";
import { createThanhThuyMetadata } from "@/lib/thanh-thuy-seo";
import { getThanhThuyCatalog, getThanhThuyProduct, thanhThuyPath } from "@/lib/thanh-thuy";

type ProductRouteProps = { params: Promise<{ category: string; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getThanhThuyCatalog().products.map((product) => ({ category: product.categorySlug, slug: product.slug }));
}

export async function generateMetadata({ params }: ProductRouteProps): Promise<Metadata> {
  const { category, slug } = await params;
  const product = getThanhThuyProduct(category, slug);
  return product ? createThanhThuyMetadata(product, thanhThuyPath(category, slug)) : {};
}

export default async function ThanhThuyProductRoute({ params }: ProductRouteProps) {
  const { category, slug } = await params;
  const product = getThanhThuyProduct(category, slug);
  if (!product) notFound();
  const related = getThanhThuyCatalog().products.filter((item) => item.slug !== product.slug && item.categorySlug === product.categorySlug && (item.seriesSlug === product.seriesSlug || item.pattern === product.pattern)).slice(0, 4);
  return <SiteShell><ThanhThuyProductDetail product={product} related={related} /></SiteShell>;
}
