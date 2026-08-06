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
import { getThanhThuyCatalog } from "@/lib/thanh-thuy";
import {
  createPageMetadata,
  PHONE_DISPLAY,
  PHONE_HREF,
  ZALO_URL,
} from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Tra cứu mã vật liệu và catalogue tại Tùng Phát",
  description:
    "Tìm nhanh mã Melamine, sản phẩm và catalogue Thanh Thuỳ, Ba Thanh, An Cường theo mã, loại bề mặt hoặc thương hiệu.",
  path: "/catalogue/",
});

function supplierCards() {
  const totals = getSupplierTotals();
  const thanhThuyPublicProducts = getThanhThuyCatalog().products.length;
  return [{
    name: "Thanh Thuỳ",
    count: `${totals["thanh-thuy"].total} mục tra cứu · ${totals["thanh-thuy"].sku} mã nhập · ${thanhThuyPublicProducts} sản phẩm công khai`,
    description:
      "Phân biệt mã sản phẩm có thể tra cứu với các dòng và tài liệu nguồn-only trong bộ nhập đầy đủ.",
    href: "/thuong-hieu/thanh-thuy/",
    action: "Catalogue Thanh Thuỳ",
  },
  {
    name: "Ba Thanh",
    count: `${totals["ba-thanh"].total} mục nhập · ${totals["ba-thanh"].retainedMelamineCodes ?? 0} mã Melamine đang có trang chi tiết`,
    description:
      `Tra ${totals["ba-thanh"].sku} mã sản phẩm cùng các dòng và tài liệu; mã chưa có trang chi tiết mở về nhóm phù hợp.`,
    href: "/ma-mau-melamine/ba-thanh/",
    action: "Catalogue Ba Thanh",
  },
  {
    name: "An Cường",
    count: `${totals["an-cuong"].total} mục tra cứu · ${totals["an-cuong"].sku} mã vật liệu`,
    description:
      "Tra mã, dòng sản phẩm và tài liệu từ bộ nhập đầy đủ; mục nguồn-only không tạo trang sản phẩm mỏng.",
    href: "/catalogue/an-cuong/",
    action: "Catalogue An Cường",
  }] as const;
}

export default function SupplierCataloguePage() {
  const entries = getSupplierSearchEntries();
  const suppliers = supplierCards();

  return (
    <SiteShell
      thirdMobileAction={{ href: "#tra-cuu-catalogue", label: "Tra mã" }}
    >
      <section
        id="tra-cuu-catalogue"
        className="scroll-mt-28 border-b border-forest-900/10 bg-[#f7f8f5] py-8 sm:py-10 lg:py-12"
      >
        <PageContainer>
          <Breadcrumbs
            items={[{ label: "Trang chủ", href: "/" }, { label: "Catalogue" }]}
          />
          <div className="mt-4 max-w-4xl">
            <p className="eyebrow">Tra cứu theo nhu cầu thực tế</p>
            <h1 className="mt-4 text-balance text-3xl font-extrabold leading-tight tracking-[-.035em] text-forest-950 sm:text-4xl lg:text-5xl">
              Tra cứu mã vật liệu và catalogue
            </h1>
            <p className="mt-4 max-w-3xl text-pretty text-sm leading-7 text-slate-700 sm:text-base">
              Tìm nhanh theo mã, loại bề mặt hoặc thương hiệu. Liên hệ Tùng Phát
              để kiểm tra cốt ván, quy cách và tình trạng hàng thực tế.
            </p>
          </div>
          <div className="mt-6">
            <SupplierCatalogSearch entries={entries} />
          </div>
        </PageContainer>
      </section>

      <section className="section-space bg-white">
        <PageContainer>
          <SectionHeader
            eyebrow="Theo nhà cung cấp"
            title="Mở catalogue riêng khi cần xem sâu hơn"
            description="Tìm mã ở đầu trang trước. Các trang nhà cung cấp giữ nguyên nguồn dữ liệu, chính sách index và phạm vi thông tin đã xác minh."
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
              Chưa chắc nên chọn catalogue nào?
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Gửi nhu cầu, mã đang có hoặc ảnh tham khảo để Tùng Phát hỗ trợ đối
              chiếu trước khi báo giá.
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
