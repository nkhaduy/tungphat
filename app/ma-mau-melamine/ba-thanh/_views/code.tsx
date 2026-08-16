import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Ruler } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { MaterialDisclaimer } from "@/components/catalog/MaterialDisclaimer";
import { ProductInquiryCTA } from "@/components/catalog/ProductInquiryCTA";
import { CodeInquiryActions } from "@/components/catalog/CodeInquiryActions";
import { SupplierMediaGallery } from "@/components/catalog/SupplierMediaGallery";
import { getBaThanhCode, getBaThanhCodes } from "@/lib/catalog/ba-thanh";
import {
  buildBaThanhCodeMetadata,
  buildBaThanhProductSchema,
} from "@/lib/catalog/ba-thanh-seo";
import { absoluteUrl } from "@/lib/seo";

type RouteProps = { params: Promise<{ code: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getBaThanhCodes().map((record) => ({ code: record.slug }));
}

export async function generateMetadata({
  params,
}: RouteProps): Promise<Metadata> {
  const { code } = await params;
  const record = getBaThanhCode(code);
  return record ? buildBaThanhCodeMetadata(record) : {};
}

export default async function BaThanhCodePage({ params }: RouteProps) {
  const { code } = await params;
  const record = getBaThanhCode(code);
  if (!record) notFound();
  const related = getBaThanhCodes()
    .filter(
      (item) => item.category === record.category && item.slug !== record.slug,
    )
    .slice(0, 6);
  const productSchema = buildBaThanhProductSchema(record);
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Trang chủ",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Bảng mã Melamine Ba Thanh",
        item: absoluteUrl("/ma-mau-melamine/ba-thanh/"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: record.patternGroup || record.category,
        item: absoluteUrl(`/ma-mau-melamine/ba-thanh/${record.category}/`),
      },
      { "@type": "ListItem", position: 4, name: record.displayName },
    ],
  };
  return (
    <>
      <JsonLd data={[productSchema, breadcrumbSchema]} />
      <div className="bg-[#fbfcf9]">
        <section className="bg-forest-950 pb-10 pt-[calc(2.5rem+4.5rem)] text-white lg:pb-14 lg:pt-[calc(3.5rem+4.5rem)]">
          <div className="container-shell">
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-2 text-sm text-white/65"
            >
              <Link
                href="/"
                className="min-h-11 content-center hover:text-white"
              >
                Trang chủ
              </Link>
              <span aria-hidden="true">/</span>
              <Link
                href="/ma-mau-melamine/ba-thanh/"
                className="min-h-11 content-center hover:text-white"
              >
                Bảng mã Melamine Ba Thanh
              </Link>
              <span aria-hidden="true">/</span>
              <Link
                href={`/ma-mau-melamine/ba-thanh/${record.category}/`}
                className="min-h-11 content-center hover:text-white"
              >
                {record.patternGroup || record.category}
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-white" aria-current="page">
                {record.displayName}
              </span>
            </nav>
          </div>
        </section>
        <section className="py-10 lg:py-16">
          <div className="container-shell grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <SupplierMediaGallery images={record.images} />
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Ảnh trong catalogue được lưu tại Tùng Phát để tránh phụ thuộc
                tải ảnh từ website nguồn.
              </p>
            </div>
            <div>
              <p className="eyebrow">BA THANH · MÃ MELAMINE</p>
              <h1 className="mt-4 font-display text-5xl font-extrabold tracking-[-.05em] text-forest-950 sm:text-6xl">
                {record.displayName}
              </h1>
              <p className="mt-4 text-base font-semibold text-slate-600">
                Nhóm:{" "}
                <Link
                  href={`/ma-mau-melamine/ba-thanh/${record.category}/`}
                  className="text-forest-950 underline decoration-wood-500 decoration-2 underline-offset-4"
                >
                  {record.patternGroup || record.category}
                </Link>
              </p>
              <div className="mt-6">
                <CodeInquiryActions
                  code={record.displayName}
                  supplierName="Ba Thanh"
                />
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="border border-forest-900/12 bg-white p-4">
                  <p className="text-xs font-extrabold uppercase tracking-[.13em] text-slate-500">
                    Mã chuẩn
                  </p>
                  <p className="mt-2 text-lg font-extrabold text-forest-950">
                    {record.displayName}
                  </p>
                </div>
                <div className="border border-forest-900/12 bg-white p-4">
                  <p className="text-xs font-extrabold uppercase tracking-[.13em] text-slate-500">
                    Nhà cung cấp
                  </p>
                  <p className="mt-2 text-lg font-extrabold text-forest-950">
                    Ba Thanh
                  </p>
                </div>
              </div>
              {record.dimensions?.length ? (
                <div className="mt-4 border border-forest-900/12 bg-white p-4">
                  <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.13em] text-slate-500">
                    <Ruler
                      size={15}
                      className="text-wood-600"
                      aria-hidden="true"
                    />{" "}
                    Quy cách nguồn có ghi
                  </p>
                  {record.dimensions.map((dimension) => (
                    <p
                      key={dimension.raw}
                      className="mt-2 text-lg font-extrabold text-forest-950"
                    >
                      {dimension.raw}
                    </p>
                  ))}
                </div>
              ) : null}
              <div className="mt-8">
                {record.editorialDescription ? (
                  <p className="text-base leading-8 text-slate-700">
                    {record.editorialDescription}
                  </p>
                ) : (
                  <p className="text-base leading-8 text-slate-600">
                    Mã này được giữ trong bộ tra cứu để đối chiếu nhanh với
                    catalogue. Tùng Phát cần xác nhận thêm quy cách, cốt ván và
                    tình trạng thực tế trước khi báo giá.
                  </p>
                )}
              </div>
              {record.applications?.length ? (
                <div className="mt-8">
                  <h2 className="text-xl font-extrabold text-forest-950">
                    Ứng dụng tham khảo
                  </h2>
                  <ul className="mt-4 grid gap-3">
                    {record.applications.map((item) => (
                      <li
                        key={item}
                        className="flex gap-3 text-sm font-semibold leading-6 text-slate-700"
                      >
                        <Check
                          size={17}
                          className="mt-1 shrink-0 text-wood-600"
                          aria-hidden="true"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="mt-8">
                <MaterialDisclaimer />
              </div>
              <div className="mt-8">
                <ProductInquiryCTA code={record.displayName} />
              </div>
            </div>
          </div>
        </section>
        <section className="border-y border-forest-900/10 bg-[#f4f6f1] py-12 lg:py-16">
          <div className="container-shell grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-forest-950 sm:text-3xl">
                Cần kiểm tra mã {record.displayName}?
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Gửi mã cùng loại ván, kích thước, độ dày và số lượng. Không nên
                tự kết luận còn hàng chỉ dựa trên trang catalogue.
              </p>
            </div>
            <Link
              href="/bao-gia/"
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-forest-950 px-5 text-sm font-extrabold text-white transition-[transform,background-color] duration-[180ms] ease-out hover:-translate-y-0.5 hover:bg-forest-900 active:scale-[.97]"
            >
              Mở biểu mẫu báo giá <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </section>
        {related.length ? (
          <section className="py-12 lg:py-16">
            <div className="container-shell">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">CÙNG NHÓM</p>
                  <h2 className="mt-3 font-display text-2xl font-extrabold text-forest-950 sm:text-3xl">
                    Mã liên quan để đối chiếu
                  </h2>
                </div>
                <Link
                  href={`/ma-mau-melamine/ba-thanh/${record.category}/`}
                  className="hidden items-center gap-2 text-sm font-extrabold text-forest-950 sm:inline-flex"
                >
                  Xem cả nhóm <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {related.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/ma-mau-melamine/ba-thanh/${item.slug}/`}
                    className="border border-forest-900/12 bg-white p-4 text-center transition-[transform,border-color] duration-[180ms] ease-out hover:-translate-y-0.5 hover:border-wood-500/60"
                  >
                    <span className="block text-lg font-extrabold text-forest-950">
                      {item.displayName}
                    </span>
                    <span className="mt-2 block text-[.65rem] font-bold uppercase tracking-[.12em] text-slate-500">
                      {item.category}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
