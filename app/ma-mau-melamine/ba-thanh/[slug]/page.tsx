import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryView, { generateMetadata as generateCategoryMetadata } from "@/app/ma-mau-melamine/ba-thanh/_views/category";
import CodeView, { generateMetadata as generateCodeMetadata } from "@/app/ma-mau-melamine/ba-thanh/_views/code";
import { SiteShell } from "@/components/site/SiteShell";
import { baThanhCategories, getBaThanhCategory, getBaThanhCode, getBaThanhCodes } from "@/lib/catalog/ba-thanh";

type RouteProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return [
    ...baThanhCategories.filter((category) => category.count > 0).map((category) => ({ slug: category.slug })),
    ...getBaThanhCodes().map((record) => ({ slug: record.slug })),
  ];
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  if (getBaThanhCategory(slug)) {
    return generateCategoryMetadata({ params: Promise.resolve({ category: slug }) });
  }
  if (getBaThanhCode(slug)) {
    return generateCodeMetadata({ params: Promise.resolve({ code: slug }) });
  }
  return {};
}

export default async function BaThanhSlugPage({ params }: RouteProps) {
  const { slug } = await params;
  if (getBaThanhCategory(slug)) {
    return <SiteShell><CategoryView params={Promise.resolve({ category: slug })} /></SiteShell>;
  }
  if (getBaThanhCode(slug)) {
    return <SiteShell><CodeView params={Promise.resolve({ code: slug })} /></SiteShell>;
  }
  notFound();
}
