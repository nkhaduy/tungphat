import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { ColorCodeSearch, type ColorCardRecord } from "@/components/catalog/ColorCodeSearch";
import { MaterialDisclaimer } from "@/components/catalog/MaterialDisclaimer";
import { ProductInquiryCTA } from "@/components/catalog/ProductInquiryCTA";
import { baThanhCategories, getBaThanhCategory, getBaThanhCodes } from "@/lib/catalog/ba-thanh";
import { buildBaThanhCollectionSchema } from "@/lib/catalog/ba-thanh-seo";
import { createPageMetadata } from "@/lib/seo";

type RouteProps = { params: Promise<{ category: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return baThanhCategories.filter((category) => category.count > 0).map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getBaThanhCategory(slug);
  if (!category) return {};
  return createPageMetadata({
    title: `Mã Melamine Ba Thanh ${category.label} – Bảng màu và ứng dụng`,
    description: `${category.intro} Tra cứu ${category.count} mã và gửi yêu cầu cho Tùng Phát kiểm tra quy cách.`,
    path: `/ma-mau-melamine/ba-thanh/${category.slug}/`,
  });
}

export default async function BaThanhCategoryPage({ params }: RouteProps) {
  const { category: slug } = await params;
  const category = getBaThanhCategory(slug);
  if (!category) notFound();
  const sourceRecords = getBaThanhCodes().filter((record) => record.category === category.slug);
  const records: ColorCardRecord[] = sourceRecords.map(({ slug: codeSlug, displayName, codeNormalized, category: recordCategory, patternGroup, images, seoStatus }) => ({ slug: codeSlug, displayName, codeNormalized, category: recordCategory, patternGroup, images: images.slice(0, 1), seoStatus }));
  const schema = buildBaThanhCollectionSchema({ name: `Mã Melamine Ba Thanh ${category.label}`, path: `/ma-mau-melamine/ba-thanh/${category.slug}/`, items: sourceRecords });
  return (
    <>
      <Header appearance="dark" />
      <JsonLd data={schema} />
      <main className="bg-[#fbfcf9] pt-[76px]">
        <section className="bg-forest-950 py-14 text-white lg:py-20"><div className="container-shell"><nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-white/65"><Link href="/" className="min-h-11 content-center hover:text-white">Trang chủ</Link><span aria-hidden="true">/</span><Link href="/ma-mau-melamine/ba-thanh/" className="min-h-11 content-center hover:text-white">Bảng mã Melamine Ba Thanh</Link><span aria-hidden="true">/</span><span className="text-white" aria-current="page">{category.label}</span></nav><div className="mt-10 max-w-4xl"><p className="eyebrow text-wood-300">NHÓM {category.sourceLabel}</p><h1 className="mt-5 text-balance font-display text-4xl font-extrabold tracking-[-.04em] sm:text-5xl lg:text-6xl">Mã Melamine Ba Thanh {category.label.toLowerCase()}</h1><p className="mt-5 max-w-3xl text-pretty text-base leading-8 text-white/72">{category.intro}</p></div></div></section>
        <section className="py-12 lg:py-16"><div className="container-shell"><div className="grid gap-4 border-y border-forest-900/12 py-6 sm:grid-cols-3"><div><p className="text-2xl font-extrabold text-forest-950">{category.count}</p><p className="mt-1 text-xs font-bold uppercase tracking-[.14em] text-slate-500">mã trong nhóm</p></div><div><p className="text-2xl font-extrabold text-forest-950">{category.label}</p><p className="mt-1 text-xs font-bold uppercase tracking-[.14em] text-slate-500">loại bề mặt</p></div><div><p className="text-2xl font-extrabold text-forest-950">Tùng Phát</p><p className="mt-1 text-xs font-bold uppercase tracking-[.14em] text-slate-500">kiểm tra theo nhu cầu</p></div></div><div className="mt-10"><ColorCodeSearch records={records} categoryOptions={[{ slug: category.slug, label: category.label }]} fixedCategory={category.slug} /></div></div></section>
        <section className="border-y border-forest-900/10 bg-[#f4f6f1] py-14 lg:py-20"><div className="container-shell grid gap-10 lg:grid-cols-2"><div><p className="eyebrow">ỨNG DỤNG GỢI Ý</p><h2 className="mt-4 font-display text-3xl font-extrabold text-forest-950 sm:text-4xl">Chọn bề mặt theo vị trí và cách gia công.</h2><ul className="mt-6 grid gap-3">{category.applications.map((application) => <li key={application} className="flex gap-3 text-sm font-semibold leading-6 text-slate-700"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-wood-500" />{application}</li>)}</ul></div><div className="border border-forest-900/12 bg-white p-6 sm:p-8"><p className="text-xs font-extrabold uppercase tracking-[.14em] text-wood-600">Gợi ý chọn mã</p><p className="mt-4 text-base leading-7 text-slate-600">{category.choosing}</p><Link href="/thuong-hieu/ba-thanh/" className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-forest-950 underline decoration-wood-500 decoration-2 underline-offset-4">Xem quy trình gửi mã <ArrowRight size={16} aria-hidden="true" /></Link></div></div></section>
        <section className="py-14 lg:py-20"><div className="container-shell"><MaterialDisclaimer /><div className="mt-8"><ProductInquiryCTA /></div></div></section>
      </main>
      <Footer />
    </>
  );
}
