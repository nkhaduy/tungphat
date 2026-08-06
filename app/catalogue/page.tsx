import Link from "next/link";
import { ArrowRight, MessageCircle, Phone, Search } from "lucide-react";
import { SupplierCatalogSearch } from "@/components/catalog/shared/SupplierCatalogSearch";
import { SiteShell } from "@/components/site/SiteShell";
import { buildSupplierZaloInquiryUrl } from "@/lib/catalog/inquiry";
import { getSupplierSearchEntries } from "@/lib/catalog/suppliers/search";
import {
  createPageMetadata,
  PHONE_DISPLAY,
  PHONE_HREF,
  ZALO_URL,
} from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Tra cứu catalogue nhà cung cấp",
  description:
    "Tra cứu sản phẩm Thanh Thuỳ, mã Melamine Ba Thanh và dữ liệu catalogue An Cường theo mã, tên, nhà cung cấp, danh mục và series.",
  path: "/catalogue/",
});

export default function SupplierCataloguePage() {
  const entries = getSupplierSearchEntries();
  const suppliers = [
    {
      name: "Thanh Thuỳ",
      count: "348 sản phẩm và mã bề mặt",
      description:
        "Tra theo tên, mã và nhóm như Melamine, Laminate, Acrylic hoặc chỉ nẹp.",
      href: "/thuong-hieu/thanh-thuy/",
      action: "Mở catalogue Thanh Thuỳ",
    },
    {
      name: "Ba Thanh",
      count: "233 mã màu Melamine",
      description:
        "Tra nhanh mã như BT 111 hoặc SC 020M, lọc theo vân gỗ, đơn sắc và nhóm màu.",
      href: "/ma-mau-melamine/ba-thanh/",
      action: "Mở bảng mã Ba Thanh",
    },
    {
      name: "An Cường",
      count: "7 mẫu dữ liệu tham khảo",
      description:
        "Xem phạm vi dữ liệu hiện có và gửi yêu cầu để được tư vấn catalogue phù hợp.",
      href: "/catalogue/an-cuong/",
      action: "Xem dữ liệu An Cường",
    },
  ];

  return (
    <SiteShell>
        <section className="relative overflow-hidden bg-[#071f18] pb-12 pt-28 text-white sm:pb-16 sm:pt-32 lg:pb-20 lg:pt-36">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_12%_18%,rgba(222,140,74,.45),transparent_28%),linear-gradient(120deg,transparent_0%,rgba(255,255,255,.06)_45%,transparent_70%)]"
          />
          <div className="container-shell relative">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-[#f0a66f]">
              Catalogue nhà cung cấp
            </p>
            <h1 className="mt-4 max-w-4xl text-balance font-display text-4xl font-extrabold leading-[1.08] tracking-[-.04em] sm:text-5xl lg:text-6xl">
              Tìm đúng mã vật liệu từ ba nhà cung cấp.
            </h1>
            <p className="mt-5 max-w-3xl text-pretty text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
              Nhập mã đã có hoặc chọn Thanh Thuỳ, Ba Thanh, An Cường. Mỗi kết
              quả luôn ghi rõ nhà cung cấp để bạn gửi đúng mã cho Tùng Phát.
            </p>
            <a
              href="#tra-cuu-catalogue"
              className="mt-7 inline-flex min-h-12 items-center gap-2 bg-[#b84f05] px-5 text-sm font-extrabold text-white transition-colors hover:bg-[#963f04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Search size={17} aria-hidden="true" /> Tra mã ngay
            </a>
          </div>
        </section>
        <section
          id="tra-cuu-catalogue"
          className="scroll-mt-24 bg-[#f4f2ec] py-8 sm:py-10 lg:py-14"
        >
          <div className="container-shell">
            <SupplierCatalogSearch entries={entries} />
          </div>
        </section>
        <section className="border-b border-forest-900/10 bg-white py-10 lg:py-14">
          <div className="container-shell">
            <div className="grid gap-4 lg:grid-cols-3">
              {suppliers.map((supplier) => (
                <Link
                  key={supplier.name}
                  href={supplier.href}
                  className="group flex min-h-[220px] flex-col border border-forest-900/12 bg-[#fffdf8] p-6 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-wood-500/55 hover:shadow-[0_16px_36px_rgba(7,31,24,.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-600"
                >
                  <p className="text-xs font-extrabold uppercase tracking-[.16em] text-wood-700">
                    Nhà cung cấp
                  </p>
                  <h2 className="mt-3 font-display text-2xl font-extrabold text-forest-950">
                    {supplier.name}
                  </h2>
                  <p className="mt-2 text-sm font-bold text-forest-800">
                    {supplier.count}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {supplier.description}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-extrabold text-forest-950 underline decoration-wood-500 decoration-2 underline-offset-4">
                    {supplier.action}{" "}
                    <ArrowRight size={16} aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
        <section className="bg-white py-12 lg:py-16">
          <div className="container-shell grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-wood-700">
                Hiểu đúng trước khi đặt
              </p>
              <h2 className="mt-3 max-w-2xl font-display text-3xl font-extrabold tracking-[-.035em] text-forest-950">
                Mã bề mặt tạo màu và vân; cốt ván quyết định nền vật liệu.
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-slate-600">
                Một mã Melamine hoặc Laminate chưa tự xác định MDF thường, MDF
                chống ẩm hay MFC. Hãy gửi mã cùng nhu cầu sử dụng để Tùng Phát
                kiểm tra loại ván, quy cách, tồn kho và dịch vụ cắt, dán cạnh
                hoặc CNC phù hợp.
              </p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-extrabold text-forest-950">
                <Link
                  href="/van-mdf/"
                  className="underline decoration-wood-500 decoration-2 underline-offset-4"
                >
                  Tìm hiểu ván MDF
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
                  Dịch vụ CNC
                </Link>
              </div>
            </div>
            <div className="border border-forest-900/12 bg-[#f7f5ef] p-6 sm:p-8">
              <h2 className="text-xl font-extrabold text-forest-950">
                Chưa chắc nên chọn catalogue nào?
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Gửi nhu cầu, mã đang có hoặc ảnh tham khảo. Đội ngũ Tùng Phát sẽ
                giúp đối chiếu trước khi báo giá.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <a
                  href={buildSupplierZaloInquiryUrl(
                    ZALO_URL,
                    "Thanh Thuỳ, Ba Thanh hoặc An Cường",
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#b84f05] px-4 text-sm font-extrabold text-white transition-colors hover:bg-[#963f04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-600 focus-visible:ring-offset-2"
                >
                  <MessageCircle size={17} aria-hidden="true" /> Nhắn Zalo tư
                  vấn
                </a>
                <a
                  href={PHONE_HREF}
                  className="inline-flex min-h-12 items-center justify-center gap-2 border border-forest-900/20 bg-white px-4 text-sm font-extrabold text-forest-950 transition-colors hover:border-wood-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-600 focus-visible:ring-offset-2"
                >
                  <Phone size={17} aria-hidden="true" /> {PHONE_DISPLAY}
                </a>
              </div>
            </div>
          </div>
        </section>
    </SiteShell>
  );
}
