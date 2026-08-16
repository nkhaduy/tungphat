import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import {
  ColorCodeSearch,
  type ColorCardRecord,
} from "@/components/catalog/ColorCodeSearch";
import { MaterialDisclaimer } from "@/components/catalog/MaterialDisclaimer";
import { ProductInquiryCTA } from "@/components/catalog/ProductInquiryCTA";
import { SiteShell } from "@/components/site/SiteShell";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer } from "@/components/ui/PageContainer";
import {
  baThanhCategories,
  getBaThanhCodes,
  getBaThanhHubFeaturedCodes,
} from "@/lib/catalog/ba-thanh";
import { buildBaThanhCollectionSchema } from "@/lib/catalog/ba-thanh-seo";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Mã màu Melamine Ba Thanh – Bảng màu và tra mã nhanh",
  description:
    "Tra cứu bảng màu Melamine Ba Thanh theo mã, nhóm vân gỗ, đơn sắc, vân đá và vân vải. Gửi mã cho Tùng Phát kiểm tra ván, cắt, dán cạnh và CNC.",
  path: "/catalogue/ba-thanh/melamine/",
  noIndex: true,
  followWhenNoIndex: true,
});

const records: ColorCardRecord[] = getBaThanhCodes().map(
  ({
    slug,
    displayName,
    codeNormalized,
    category,
    patternGroup,
    images,
    seoStatus,
  }) => ({
    slug,
    displayName,
    codeNormalized,
    category,
    patternGroup,
    images: images.slice(0, 1),
    seoStatus,
  }),
);
const featuredCodes = getBaThanhHubFeaturedCodes();
const schema = buildBaThanhCollectionSchema({
  name: "Bảng mã Melamine Ba Thanh",
  path: "/catalogue/ba-thanh/melamine/",
  items: getBaThanhCodes(),
});

export default function BaThanhMelamineHubPage() {
  return (
    <SiteShell>
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
                { label: "Ba Thanh", href: "/thuong-hieu/ba-thanh/" },
                { label: "Bảng mã Melamine" },
              ]}
            />
            <div className="mt-4 max-w-4xl">
              <p className="eyebrow">Mã màu tra cứu</p>
              <h1 className="mt-3 text-balance text-3xl font-extrabold leading-tight tracking-[-.035em] text-forest-950 sm:text-4xl lg:text-5xl">
                Mã màu Melamine Ba Thanh
              </h1>
              <p className="mt-3 max-w-3xl text-pretty text-sm leading-7 text-slate-700 sm:text-base">
                Tìm nhanh theo mã hoặc nhóm bề mặt. Gửi mã cho Tùng Phát để kiểm
                tra cốt ván, quy cách, tình trạng hàng và dịch vụ gia công phù
                hợp.
              </p>
            </div>
            <div className="mt-6">
              <ColorCodeSearch
                records={records}
                categoryOptions={baThanhCategories.map(({ slug, label }) => ({
                  slug,
                  label,
                }))}
              />
            </div>
          </PageContainer>
        </section>
        <section className="py-12 lg:py-16">
          <div className="container-shell">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {baThanhCategories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/ma-mau-melamine/ba-thanh/${category.slug}/`}
                  className="group flex min-h-14 touch-manipulation items-center justify-between border border-forest-900/12 bg-white px-4 text-sm font-extrabold text-forest-950 transition-[transform,border-color] duration-[180ms] ease-out hover:-translate-y-0.5 hover:border-wood-500/60 focus-visible:ring-2 focus-visible:ring-wood-500 active:scale-[.99] motion-reduce:transform-none motion-reduce:transition-none"
                >
                  <span>
                    {category.label}{" "}
                    <span className="text-slate-600">({category.count})</span>
                  </span>
                  <ArrowRight
                    size={16}
                    className="text-wood-600 transition-transform duration-[180ms] ease-out group-hover:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
            <div className="mt-14 border-t border-forest-900/12 pt-10">
              <div className="max-w-2xl">
                <p className="eyebrow">MÃ ĐÃ BIÊN TẬP</p>
                <h2 className="mt-4 font-display text-3xl font-extrabold tracking-[-.035em] text-forest-950">
                  Trang mã có thêm hướng dẫn ứng dụng.
                </h2>
                <p className="mt-3 leading-7 text-slate-600">
                  Các mã này có nội dung riêng, ảnh local và thông tin gửi yêu
                  cầu để bạn mở trực tiếp từ HTML, không phụ thuộc bộ lọc.
                </p>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {featuredCodes.map((record) => (
                  <Link
                    key={record.slug}
                    href={`/ma-mau-melamine/ba-thanh/${record.slug}/`}
                    className="group flex min-h-16 touch-manipulation items-center justify-between border border-forest-900/12 bg-[#f7f8f5] px-4 py-3 text-forest-950 transition-[transform,border-color] duration-[180ms] ease-out hover:-translate-y-0.5 hover:border-wood-500/60 focus-visible:ring-2 focus-visible:ring-wood-500 motion-reduce:transform-none motion-reduce:transition-none"
                  >
                    <span>
                      <strong className="block text-base" translate="no">
                        {record.displayName}
                      </strong>
                      <span className="mt-1 block text-xs font-bold uppercase tracking-[.1em] text-slate-600">
                        {record.patternGroup || record.category}
                      </span>
                    </span>
                    <ArrowRight
                      size={16}
                      className="shrink-0 text-wood-600 transition-transform duration-[180ms] group-hover:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none"
                      aria-hidden="true"
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="border-y border-forest-900/10 bg-[#f4f6f1] py-14 lg:py-20">
          <div className="container-shell grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="eyebrow">HƯỚNG DẪN GỬI MÃ</p>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-[-.035em] text-forest-950 sm:text-4xl">
                Mã đúng là điểm bắt đầu của báo giá đúng.
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="border border-forest-900/12 bg-white p-5">
                <p className="text-xs font-extrabold uppercase tracking-[.14em] text-wood-700">
                  01
                </p>
                <h3 className="mt-5 font-extrabold text-forest-950">
                  Gửi mã hiển thị
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Ví dụ BT 111, BT 143 hoặc SC 028M. Khoảng trắng và dấu gạch
                  đều được hệ thống nhận diện.
                </p>
              </div>
              <div className="border border-forest-900/12 bg-white p-5">
                <p className="text-xs font-extrabold uppercase tracking-[.14em] text-wood-700">
                  02
                </p>
                <h3 className="mt-5 font-extrabold text-forest-950">
                  Nêu quy cách
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Loại cốt, độ dày, kích thước cắt, số lượng, dán cạnh và file
                  CNC nếu có.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="py-14 lg:py-20">
          <div className="container-shell grid gap-10 lg:grid-cols-[1fr_.9fr] lg:items-center">
            <div>
              <p className="eyebrow">DỊCH VỤ ĐI KÈM</p>
              <h2 className="mt-4 font-display text-3xl font-extrabold text-forest-950 sm:text-4xl">
                Không chỉ tra mã — có thể làm tiếp.
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-slate-600">
                Tùng Phát nhận tư vấn MDF/MFC, cắt ván theo kích thước, dán cạnh
                và gia công CNC sau khi xác nhận mã và quy cách.
              </p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-extrabold text-forest-950">
                <Link
                  href="/van-mdf/"
                  className="underline decoration-wood-500 decoration-2 underline-offset-4"
                >
                  Ván MDF
                </Link>
                <Link
                  href="/mdf-chong-am/"
                  className="underline decoration-wood-500 decoration-2 underline-offset-4"
                >
                  MDF chống ẩm
                </Link>
                <Link
                  href="/gia-cong-cnc/"
                  className="underline decoration-wood-500 decoration-2 underline-offset-4"
                >
                  Gia công CNC
                </Link>
              </div>
            </div>
            <div>
              <MaterialDisclaimer />
              <div className="mt-7">
                <ProductInquiryCTA />
              </div>
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
