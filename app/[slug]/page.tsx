import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductLanding } from "@/components/content/ProductLanding";
import { ServiceLanding } from "@/components/content/ServiceLanding";
import { getProducts, getServicePages } from "@/lib/content";
import { createContentMetadata } from "@/lib/content-metadata";
import { isReservedRootSlug } from "@/lib/reserved-slugs";
import { dynamicRootContentParams } from "@/lib/root-content-routes";

type RootContentRouteProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

function rootContent(slug: string) {
  if (isReservedRootSlug(slug)) return undefined;
  return getProducts().find((entry) => entry.slug === slug) ?? getServicePages().find((entry) => entry.slug === slug);
}

export function generateStaticParams() {
  return dynamicRootContentParams([
    ...getProducts().map((entry) => ({ ...entry, collection: "products" as const })),
    ...getServicePages().map((entry) => ({ ...entry, collection: "pages" as const }))
  ]);
}

export async function generateMetadata({ params }: RootContentRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = rootContent(slug);
  return entry ? createContentMetadata(entry, `/${entry.slug}`) : {};
}

export default async function RootContentRoute({ params }: RootContentRouteProps) {
  const { slug } = await params;
  const entry = rootContent(slug);
  if (!entry) notFound();

  return "status" in entry ? <ProductLanding product={entry} /> : <ServiceLanding page={entry} />;
}
