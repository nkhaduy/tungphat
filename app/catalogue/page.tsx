import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import { SupplierCatalogSearch } from "@/components/catalog/shared/SupplierCatalogSearch";
import { SiteShell } from "@/components/site/SiteShell";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer } from "@/components/ui/PageContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { buildSupplierZaloInquiryUrl } from "@/lib/catalog/inquiry";
import { getSupplierSearchEntries } from "@/lib/catalog/suppliers/search";
import { getSupplierTotals } from "@/lib/catalog/suppliers/search-index";
import {
  createPageMetadata,
  PHONE_DISPLAY,
  PHONE_HREF,
  ZALO_URL,
} from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Mã màu vật liệu tại Tùng Phát",
  description:
    "Tìm nhanh mã màu, tên màu hoặc thương hiệu An Cường, Thanh Thuỳ và Ba Thanh theo bề mặt thực tế.",
  path: "/catalogue/",
});

function supplierCards() {
  const totals = getSupplierTotals();
  return [{
    name: "Thanh Thuỳ",
    count: `${totals["thanh-thuy"].colorCodes} mã màu`,
    description:
      "Tra cứu mã bề mặt Thanh Thuỳ theo màu, vân và loại vật liệu.",
    href: "/catalogue/thanh-thuy/",
    action: "Mở mã màu Thanh Thuỳ",
  },
  {
    name: "Ba Thanh",
    count: `${totals["ba-thanh"].colorCodes} mã màu`,
    description:
      "Tra cứu Melamine và Laminate Ba Thanh theo mã màu/bề mặt thực tế.",
    href: "/catalogue/ba-thanh/",
    action: "Mở mã màu Ba Thanh",
  },
  {
    name: "An Cường",
    count: `${totals["an-cuong"].colorCodes} mã màu`,
    description:
      "Tra cứu Melamine, Laminate, Acrylic, Veneer, PPET/PVC, Mặt Top và mã cạnh An Cường.",
    href: "/catalogue/an-cuong/",
    action: "Mở mã màu An Cường",
  }] as const;
}

export default function SupplierCataloguePage() {
  const entries = getSupplierSearchEntries();
  const suppliers = supplierCards();

  return (
    <SiteShell
      thirdMobileAction={{ href: "#tra-cuu-catalogue", label: "Mã màu" }}
    >
      <section
        id="tra-cuu-catalogue"
        className="catalogue-page scroll-mt-28 overflow-clip border-b border-forest-900/10 bg-[#f5f4ef] pb-6 pt-2 sm:pb-8 sm:pt-2.5 lg:pb-10 lg:pt-3"
      >
        <PageContainer className="relative">
          <Breadcrumbs
            compact
            className="catalogue-hero-breadcrumb mb-1 sm:mb-1.5"
            items={[{ label: "Trang chủ", href: "/" }, { label: "Mã màu" }]}
          />
          <div className="catalogue-material-hero relative isolate flex min-h-[300px] overflow-hidden rounded-[1.2rem] border border-white/15 bg-forest-950 shadow-[0_16px_38px_rgba(6,43,29,.13)] sm:min-h-[350px] sm:rounded-[1.4rem] lg:min-h-[390px]">
            <Image
              src="/images/material-color-hero.webp"
              alt="Các tấm ván MDF phủ bề mặt với nhiều màu và vân gỗ"
              fill
              priority
              fetchPriority="high"
              quality={95}
              sizes="(max-width: 767px) calc(100vw - 24px), (max-width: 1279px) calc(100vw - 48px), 1280px"
              className="catalogue-material-hero-image object-cover"
            />
            <div
              className="catalogue-material-hero-shade absolute inset-0 z-10"
              aria-hidden="true"
            />
            <div className="relative z-20 flex w-full items-center px-5 py-8 sm:px-9 sm:py-10 lg:px-14 lg:py-12 xl:px-16">
              <div className="min-w-0 text-white">
                <h1 className="whitespace-nowrap text-[clamp(2rem,9.1vw,2.35rem)] font-extrabold leading-none tracking-[-.045em] text-[#fffdf8] [text-shadow:0_2px_16px_rgba(0,0,0,.16)] sm:text-5xl lg:text-[3.5rem]">
                  Mã màu vật liệu
                </h1>
              </div>
            </div>
          </div>
          <div className="relative mt-4 sm:mt-5 lg:mt-6">
            <SupplierCatalogSearch entries={entries} />
          </div>
        </PageContainer>
      </section>

      <section className="section-space bg-white">
        <PageContainer>
          <SectionHeader
            eyebrow="Theo nhà cung cấp"
            title="Mở bảng mã riêng theo nhà cung cấp"
            description="Tìm mã ở đầu trang trước. Mỗi nhà cung cấp giữ đúng mã, bề mặt và ảnh nguồn đã xác minh."
          />
          <div className="mt-9 grid gap-4 lg:grid-cols-3">
            {suppliers.map((supplier) => (
              <Link
                key={supplier.name}
                href={supplier.href}
                className="pressable group flex min-h-[220px] flex-col border border-forest-900/10 bg-[#fbfaf6] p-6 hover:border-wood-500/50 hover:bg-white hover:shadow-card focus-visible:ring-2 focus-visible:ring-wood-600"
              >
                <p className="text-xs font-extrabold uppercase tracking-[.16em] text-wood-600">
                  Nhà cung cấp
                </p>
                <h2 className="mt-3 text-2xl font-extrabold text-forest-950">
                  {supplier.name}
                </h2>
                <p className="mt-2 text-sm font-bold text-forest-800">
                  {supplier.count}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  {supplier.description}
                </p>
                <span className="mt-auto inline-flex min-h-11 items-center gap-2 pt-5 text-sm font-extrabold text-forest-950">
                  {supplier.action}{" "}
                  <ArrowRight
                    size={16}
                    className="text-wood-600"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            ))}
          </div>
        </PageContainer>
      </section>

      <section className="border-y border-forest-900/10 bg-[#edf4ef] py-12 lg:py-16">
        <PageContainer className="grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
          <div>
            <p className="eyebrow">Hiểu đúng trước khi đặt</p>
            <h2 className="mt-4 max-w-2xl text-3xl font-extrabold tracking-[-.03em] text-forest-950">
              Mã bề mặt tạo màu và vân; cốt ván quyết định nền vật liệu.
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-slate-700">
              Một mã Melamine hoặc Laminate chưa tự xác định MDF thường, MDF
              chống ẩm hay MFC. Hãy gửi mã cùng nhu cầu sử dụng để kiểm tra cốt
              ván, quy cách và dịch vụ cắt, dán cạnh hoặc CNC phù hợp.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-extrabold text-forest-950">
              <Link
                href="/van-mdf/"
                className="inline-flex min-h-11 items-center hover:text-wood-600"
              >
                Ván MDF
              </Link>
              <Link
                href="/mdf-chong-am/"
                className="inline-flex min-h-11 items-center hover:text-wood-600"
              >
                MDF chống ẩm
              </Link>
              <Link
                href="/gia-cong-cnc/"
                className="inline-flex min-h-11 items-center hover:text-wood-600"
              >
                Dịch vụ CNC
              </Link>
            </div>
          </div>
          <div className="border border-forest-900/10 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-extrabold text-forest-950">
              Chưa chắc nên chọn mã màu nào?
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Gửi mã đang có hoặc ảnh tham khảo để Tùng Phát hỗ trợ đối chiếu
              trước khi báo giá.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <a
                href={buildSupplierZaloInquiryUrl(
                  ZALO_URL,
                  "Thanh Thuỳ, Ba Thanh hoặc An Cường",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="pressable inline-flex min-h-12 items-center justify-center gap-2 bg-wood-500 px-4 text-sm font-extrabold text-white hover:bg-wood-600"
              >
                <MessageCircle size={17} aria-hidden="true" />
                Nhắn Zalo tư vấn
              </a>
              <a
                href={PHONE_HREF}
                className="pressable inline-flex min-h-12 items-center justify-center gap-2 border border-forest-900/20 bg-white px-4 text-sm font-extrabold text-forest-950 hover:border-wood-500"
              >
                <Phone size={17} aria-hidden="true" />
                {PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </PageContainer>
      </section>
    </SiteShell>
  );
}
