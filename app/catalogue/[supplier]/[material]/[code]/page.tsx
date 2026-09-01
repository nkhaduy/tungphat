import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CopyColorCodeButton } from "@/components/catalog/CopyColorCodeButton";
import { PageContainer } from "@/components/ui/PageContainer";
import { buildSupplierZaloInquiryUrl } from "@/lib/catalog/inquiry";
import { getPublicColorCode, getPublicColorCodeRelatedCodes, getPublicColorCodes } from "@/lib/catalog/color-codes/public";
import { buildCatalogueCodeSeo, catalogueCodeProductSchema } from "@/lib/catalog/code-seo";
import { supplierDefinitions } from "@/lib/catalog/core/registry";
import { breadcrumbSchema, createPageMetadata, ZALO_URL } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/site/SiteShell";
import { SupplierMediaGallery } from "@/components/catalog/SupplierMediaGallery";

type RouteProps = { params: Promise<{ supplier: string; material: string; code: string }> };
const imagePriority = ["swatch", "fullsheet", "actual-photo", "product", "application"] as const;

export function generateStaticParams() {
  return getPublicColorCodes().map((record) => ({ supplier: record.supplier, material: record.materialType, code: record.slug }));
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { supplier, material, code } = await params;
  const record = getPublicColorCode(supplier, material, code);
  if (!record) return {};
  const supplierName = supplierDefinitions.find((item) => item.id === supplier)?.displayName ?? supplier;
  const seo = buildCatalogueCodeSeo(record, { supplierName });
  return createPageMetadata({ title: seo.title, description: seo.description, path: record.canonicalRoute, noIndex: !seo.indexable, followWhenNoIndex: true });
}

export default async function SupplierColorCodeRoute({ params }: RouteProps) {
  const { supplier, material, code } = await params;
  const record = getPublicColorCode(supplier, material, code);
  if (!record) notFound();
  const supplierName = supplierDefinitions.find((item) => item.id === record.supplier)?.displayName ?? record.supplier;
  const seo = buildCatalogueCodeSeo(record, { supplierName });
  const materialLabel = seo.materialLabel;
  const relatedCodes = seo.indexable ? getPublicColorCodeRelatedCodes(record) : [];
  const images = imagePriority.flatMap((role) => record.images.filter((image) => image.role === role && image.localPath));
  const galleryImages = images.map((image) => ({
    src: image.localPath!,
    thumbnailSrc: image.thumbnailSrc,
    originalUrl: image.originalUrl,
    alt: seo.imageAlt,
  }));
  const path = record.canonicalRoute;
  return <SiteShell>
    <JsonLd data={[
      breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Mã màu", path: "/catalogue/" }, { name: supplierName, path: `/catalogue/${record.supplier}/` }, { name: materialLabel, path: `/catalogue/${record.supplier}/${material}/` }, { name: record.codeRaw, path }]),
      catalogueCodeProductSchema(record, seo, supplierName),
    ]} />
    <section className="border-b border-forest-900/10 bg-[#f7f8f5] pb-8 pt-[calc(2rem+4.5rem)] sm:pb-10 sm:pt-[calc(2.5rem+4.5rem)] lg:pb-14 lg:pt-[calc(3.5rem+4.5rem)]">
      <PageContainer>
        <Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "Mã màu", href: "/catalogue/" }, { label: supplierName, href: `/catalogue/${record.supplier}/` }, { label: materialLabel, href: `/catalogue/${record.supplier}/${material}/` }, { label: record.codeRaw }]} />
        <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,.8fr)] lg:items-start">
          <div><SupplierMediaGallery images={galleryImages} /></div>
          <div className="border border-forest-900/10 bg-white p-6 shadow-card sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-wood-600">{supplierName} · {materialLabel}</p>
            <h1 className="mt-3 break-words text-3xl font-extrabold leading-tight text-forest-950" translate="no">{seo.h1}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-700">Tra cứu mã bề mặt theo dữ liệu catalogue đã xác minh.</p>
            <dl className="mt-6 grid gap-3 text-sm text-slate-700"><div><dt className="font-bold text-forest-950">Mã</dt><dd translate="no">{record.codeRaw}</dd></div><div><dt className="font-bold text-forest-950">Tên</dt><dd>{record.displayName ?? record.codeRaw}</dd></div><div><dt className="font-bold text-forest-950">Bề mặt</dt><dd>{record.surfaceEffect || materialLabel}</dd></div><div><dt className="font-bold text-forest-950">Loại vân</dt><dd>{record.patternType || "Chưa công bố"}</dd></div><div><dt className="font-bold text-forest-950">Bộ sưu tập</dt><dd>{record.collection || "Chưa công bố"}</dd></div><div><dt className="font-bold text-forest-950">Nguồn catalogue</dt><dd><a href={record.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-wood-600 hover:text-wood-700">Mở nguồn</a></dd></div></dl>
            <CopyColorCodeButton code={record.codeRaw} />
            <a href={buildSupplierZaloInquiryUrl(ZALO_URL, supplierName, record.codeRaw)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-wood-500 px-4 text-sm font-extrabold text-white hover:bg-wood-600"><MessageCircle size={17} aria-hidden="true" />{seo.ctaLabel}</a>
            <p className="mt-5 text-xs leading-5 text-slate-500">Màu trên màn hình có thể khác mẫu thật; nên xem mẫu thực tế trước khi đặt.</p>
          </div>
        </div>
        {relatedCodes.length ? <section className="mt-8 border-t border-forest-900/10 pt-6" aria-labelledby="related-codes-heading"><h2 id="related-codes-heading" className="text-xl font-extrabold text-forest-950">Mã cùng tên {record.colorFamily}</h2><p className="mt-2 text-sm leading-6 text-slate-700">Các mã dưới đây cùng thuộc nhóm {record.colorFamily} trong catalogue {supplierName}.</p><div className="mt-4 flex flex-wrap gap-2">{relatedCodes.map((related) => <Link key={related.id} href={related.canonicalRoute} className="pressable inline-flex min-h-11 items-center border border-forest-900/15 bg-white px-4 text-sm font-bold text-forest-950 hover:border-wood-500" translate="no">{related.displayName ?? related.codeRaw}</Link>)}</div></section> : null}
      </PageContainer>
    </section>
  </SiteShell>;
}
