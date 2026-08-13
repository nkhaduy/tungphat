import Link from "next/link";
import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import { SupplierCatalogSearch } from "@/components/catalog/shared/SupplierCatalogSearch";
import { SiteShell } from "@/components/site/SiteShell";
import { PageContainer } from "@/components/ui/PageContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { buildSupplierZaloInquiryUrl } from "@/lib/catalog/inquiry";
import { getAllSupplierSearchEntriesForCatalogue } from "@/lib/catalog/suppliers/search";
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
  const entries = getAllSupplierSearchEntriesForCatalogue();
  const suppliers = supplierCards();

  return (
    <SiteShell
      headerTone="dark"
      thirdMobileAction={{ href: "#tra-cuu-catalogue", label: "Mã màu" }}
    >
      <section
        id="tra-cuu-catalogue"
        className="catalogue-page scroll-mt-28 overflow-clip border-b border-forest-900/10 bg-[#f5f4ef] pb-6 sm:pb-8 lg:pb-10"
      >
        <PageContainer className="relative">
          <SupplierCatalogSearch entries={entries} />
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
