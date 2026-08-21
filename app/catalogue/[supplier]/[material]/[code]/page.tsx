import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CopyColorCodeButton } from "@/components/catalog/CopyColorCodeButton";
import { PageContainer } from "@/components/ui/PageContainer";
import { buildSupplierZaloInquiryUrl } from "@/lib/catalog/inquiry";
import { getPublicColorCodes } from "@/lib/catalog/color-codes/public";
import { supplierDefinitions } from "@/lib/catalog/core/registry";
import { absoluteUrl, breadcrumbSchema, createPageMetadata, ZALO_URL } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/site/SiteShell";
import { humanizeCatalogLabel } from "@/lib/catalog/ui";
import { SupplierMediaGallery } from "@/components/catalog/SupplierMediaGallery";

type RouteProps = { params: Promise<{ supplier: string; material: string; code: string }> };
const imagePriority = ["swatch", "fullsheet", "actual-photo", "product", "application"] as const;

export function generateStaticParams() {
  return getPublicColorCodes().map((record) => ({ supplier: record.supplier, material: record.materialType, code: record.slug }));
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { supplier, material, code } = await params;
  const record = getPublicColorCodes().find((item) => item.supplier === supplier && item.materialType === material && item.slug === code);
  if (!record) return {};
  return createPageMetadata({ title: `${record.codeRaw} · ${record.displayName ?? "Mã màu"}`, description: `Mã màu ${record.codeRaw} của ${supplierDefinitions.find((item) => item.id === supplier)?.displayName ?? supplier}.`, path: record.canonicalRoute, noIndex: record.seoStatus !== "READY_TO_INDEX", followWhenNoIndex: true });
}

export default async function SupplierColorCodeRoute({ params }: RouteProps) {
  const { supplier, material, code } = await params;
  const record = getPublicColorCodes().find((item) => item.supplier === supplier && item.materialType === material && item.slug === code);
  if (!record) notFound();
  const supplierName = supplierDefinitions.find((item) => item.id === record.supplier)?.displayName ?? record.supplier;
  const materialLabel = humanizeCatalogLabel(material);
  const images = imagePriority.flatMap((role) => record.images.filter((image) => image.role === role && image.localPath));
  const galleryImages = images.map((image) => ({
    src: image.localPath!,
    thumbnailSrc: image.thumbnailSrc,
    originalUrl: image.originalUrl,
    alt: `${record.codeRaw} ${image.role}`,
  }));
  const path = record.canonicalRoute;
  return <SiteShell>
    <JsonLd data={[
      breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Mã màu", path: "/catalogue/" }, { name: supplierName, path: `/catalogue/${record.supplier}/` }, { name: materialLabel, path: `/catalogue/${record.supplier}/${material}/` }, { name: record.codeRaw, path }]),
      { "@context": "https://schema.org", "@type": "Product", name: record.displayName ?? record.codeRaw, sku: record.codeRaw, brand: { "@type": "Brand", name: supplierName }, category: materialLabel, url: absoluteUrl(path), ...(images.length ? { image: images.map((image) => absoluteUrl(image.localPath!)) } : {}) },
    ]} />
    <section className="border-b border-forest-900/10 bg-[#f7f8f5] pb-8 pt-[calc(2rem+4.5rem)] sm:pb-10 sm:pt-[calc(2.5rem+4.5rem)] lg:pb-14 lg:pt-[calc(3.5rem+4.5rem)]">
      <PageContainer>
        <Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "Mã màu", href: "/catalogue/" }, { label: supplierName, href: `/catalogue/${record.supplier}/` }, { label: materialLabel, href: `/catalogue/${record.supplier}/${material}/` }, { label: record.codeRaw }]} />
        <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,.8fr)] lg:items-start">
          <div><SupplierMediaGallery images={galleryImages} /></div>
          <div className="border border-forest-900/10 bg-white p-6 shadow-card sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-wood-600">{supplierName} · {materialLabel}</p>
            <h1 className="mt-3 break-words font-mono text-3xl font-extrabold text-forest-950" translate="no">{record.codeRaw}</h1>
            <h2 className="mt-3 text-xl font-extrabold text-forest-950">{record.displayName ?? record.codeRaw}</h2>
            <dl className="mt-6 grid gap-3 text-sm text-slate-700"><div><dt className="font-bold text-forest-950">Bề mặt</dt><dd>{record.surfaceEffect || "Đang đối chiếu theo nguồn supplier"}</dd></div><div><dt className="font-bold text-forest-950">Loại vân</dt><dd>{record.patternType || "Chưa công bố"}</dd></div><div><dt className="font-bold text-forest-950">Bộ sưu tập</dt><dd>{record.collection || "Chưa công bố"}</dd></div></dl>
            <CopyColorCodeButton code={record.codeRaw} />
            <a href={buildSupplierZaloInquiryUrl(ZALO_URL, supplierName, record.codeRaw)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-wood-500 px-4 text-sm font-extrabold text-white hover:bg-wood-600"><MessageCircle size={17} aria-hidden="true" />Gửi mã qua Zalo</a>
            <p className="mt-5 text-xs leading-5 text-slate-500">Màu hiển thị chỉ để đối chiếu. Media rights: UNCONFIRMED. Vui lòng xác nhận mẫu thực tế trước khi đặt.</p>
          </div>
        </div>
      </PageContainer>
    </section>
  </SiteShell>;
}
