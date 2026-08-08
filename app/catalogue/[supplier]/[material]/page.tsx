import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SupplierColorCodeSearch } from "@/components/catalog/AnCuongCatalogueSearch";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer } from "@/components/ui/PageContainer";
import { getPublicColorCodeMaterials } from "@/lib/catalog/color-codes/public";
import { supplierDefinitions } from "@/lib/catalog/core/registry";
import { getSupplierSearchIndex } from "@/lib/catalog/suppliers/search-index";
import { breadcrumbSchema, createPageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/site/SiteShell";
import { humanizeCatalogLabel } from "@/lib/catalog/ui";

type RouteProps = { params: Promise<{ supplier: string; material: string }> };

export function generateStaticParams() {
  return supplierDefinitions.flatMap((supplier) => {
    const materials = getPublicColorCodeMaterials(supplier.id);
    return materials.map((material) => ({ supplier: supplier.id, material }));
  });
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { supplier, material } = await params;
  const definition = supplierDefinitions.find((item) => item.id === supplier);
  if (!definition) return {};
  const materialLabel = humanizeCatalogLabel(material);
  return createPageMetadata({ title: `Mã màu ${materialLabel} ${definition.displayName}`, description: `Tra cứu mã màu ${materialLabel} của ${definition.displayName}.`, path: `/catalogue/${supplier}/${material}/` });
}

export default async function SupplierMaterialRoute({ params }: RouteProps) {
  const { supplier, material } = await params;
  const definition = supplierDefinitions.find((item) => item.id === supplier);
  if (!definition) notFound();
  const entries = getSupplierSearchIndex().records.filter((record) => record.supplierId === supplier && record.category === material);
  if (!entries.length) notFound();
  const materialLabel = humanizeCatalogLabel(material);
  const path = `/catalogue/${supplier}/${material}/`;
  return <SiteShell>
    <JsonLd data={breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Mã màu", path: "/catalogue/" }, { name: definition.displayName, path: `/catalogue/${supplier}/` }, { name: materialLabel, path }])} />
    <section className="border-b border-forest-900/10 bg-[#f7f8f5] py-8 sm:py-10 lg:py-12">
      <PageContainer>
        <Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "Mã màu", href: "/catalogue/" }, { label: definition.displayName, href: `/catalogue/${supplier}/` }, { label: materialLabel }]} />
        <h1 className="mt-5 text-3xl font-extrabold text-forest-950 sm:text-4xl">Mã màu {materialLabel} · {definition.displayName}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">{entries.length} mã màu đã xác minh. Trang này chỉ chứa mã bề mặt thực tế, không gồm dòng sản phẩm hoặc tài liệu kỹ thuật.</p>
        <SupplierColorCodeSearch entries={entries} supplierId={supplier as "an-cuong" | "ba-thanh" | "thanh-thuy"} supplierLabel={definition.displayName} />
      </PageContainer>
    </section>
  </SiteShell>;
}
