import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import {
  ColorCodeSearch,
  type ColorCardRecord,
} from "@/components/catalog/ColorCodeSearch";
import { MaterialDisclaimer } from "@/components/catalog/MaterialDisclaimer";
import { ProductInquiryCTA } from "@/components/catalog/ProductInquiryCTA";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer } from "@/components/ui/PageContainer";
import {
  baThanhCategories,
  getBaThanhCategory,
  getBaThanhCodes,
} from "@/lib/catalog/ba-thanh";
import { buildBaThanhCollectionSchema } from "@/lib/catalog/ba-thanh-seo";
import { createPageMetadata } from "@/lib/seo";

type RouteProps = { params: Promise<{ category: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return baThanhCategories
    .filter((category) => category.count > 0)
    .map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: RouteProps): Promise<Metadata> {
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
  const sourceRecords = getBaThanhCodes().filter(
    (record) => record.category === category.slug,
  );
  const records: ColorCardRecord[] = sourceRecords.map(
    ({
      slug: codeSlug,
      displayName,
      codeNormalized,
      category: recordCategory,
      patternGroup,
      images,
      seoStatus,
    }) => ({
      slug: codeSlug,
      displayName,
      codeNormalized,
      category: recordCategory,
      patternGroup,
      images: images.slice(0, 1),
      seoStatus,
    }),
  );
  const schema = buildBaThanhCollectionSchema({
    name: `Mã Melamine Ba Thanh ${category.label}`,
    path: `/ma-mau-melamine/ba-thanh/${category.slug}/`,
    items: sourceRecords,
  });
  return (
    <>
      <JsonLd data={schema} />
      <div className="bg-[#fbfcf9]">
        <section className="relative overflow-hidden border-b border-forest-900/10 bg-[#f7f8f5] py-7 sm:py-9 lg:py-12">
          <div
            className="page-hero-pattern pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-25"
            aria-hidden="true"
          />
          <PageContainer className="relative">
            <Breadcrumbs
              items={[
                { label: "Trang chủ", href: "/" },
                {
                  label: "Bảng mã Melamine Ba Thanh",
                  href: "/ma-mau-melamine/ba-thanh/",
                },
                { label: category.label },
              ]}
            />
            <div className="mt-4 max-w-4xl">
              <p className="eyebrow">Nhóm {category.sourceLabel}</p>
              <h1 className="mt-3 text-balance text-3xl font-extrabold leading-tight tracking-[-.035em] text-forest-950 sm:text-4xl lg:text-5xl">
                Mã Melamine Ba Thanh {category.label.toLowerCase()}
              </h1>
              <p className="mt-3 max-w-3xl text-pretty text-sm leading-7 text-slate-700 sm:text-base">
                {category.intro}
              </p>
            </div>
            <div className="mt-6">
              <ColorCodeSearch
                records={records}
                categoryOptions={[
                  { slug: category.slug, label: category.label },
                ]}
                fixedCategory={category.slug}
              />
            </div>
          </PageContainer>
        </section>
        <section className="border-y border-forest-900/10 bg-[#f4f6f1] py-14 lg:py-20">
          <div className="container-shell grid gap-10 lg:grid-cols-2">
            <div>
              <p className="eyebrow">ỨNG DỤNG GỢI Ý</p>
              <h2 className="mt-4 font-display text-3xl font-extrabold text-forest-950 sm:text-4xl">
                Chọn bề mặt theo vị trí và cách gia công.
              </h2>
              <ul className="mt-6 grid gap-3">
                {category.applications.map((application) => (
                  <li
                    key={application}
                    className="flex gap-3 text-sm font-semibold leading-6 text-slate-700"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-wood-500" />
                    {application}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-forest-900/12 bg-white p-6 sm:p-8">
              <p className="text-xs font-extrabold uppercase tracking-[.14em] text-wood-700">
                Gợi ý chọn mã
              </p>
              <p className="mt-4 text-base leading-7 text-slate-600">
                {category.choosing}
              </p>
              <Link
                href="/thuong-hieu/ba-thanh/"
                className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-forest-950 underline decoration-wood-500 decoration-2 underline-offset-4"
              >
                Xem quy trình gửi mã <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
        <section className="py-14 lg:py-20">
          <div className="container-shell">
            <MaterialDisclaimer />
            <div className="mt-8">
              <ProductInquiryCTA />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
