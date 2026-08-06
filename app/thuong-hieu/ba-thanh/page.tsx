import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { JsonLd } from "@/components/JsonLd";
import { MaterialDisclaimer } from "@/components/catalog/MaterialDisclaimer";
import { ProductInquiryCTA } from "@/components/catalog/ProductInquiryCTA";
import { baThanhCategories } from "@/lib/catalog/ba-thanh";
import { absoluteUrl, createPageMetadata } from "@/lib/seo";
import { locations } from "@/lib/locations";

export const metadata: Metadata = createPageMetadata({
  title: "Ba Thanh tại Tùng Phát – Catalogue Melamine và dịch vụ gia công",
  description:
    "Tra cứu mã Melamine Ba Thanh tại Tùng Phát, gửi mã để kiểm tra quy cách và kết nối dịch vụ cắt ván, dán cạnh, CNC tại TP.HCM.",
  path: "/thuong-hieu/ba-thanh/",
});

const brandSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Ba Thanh tại Tùng Phát",
  url: absoluteUrl("/thuong-hieu/ba-thanh/"),
  about: { "@type": "Brand", name: "Ba Thanh" },
  breadcrumb: {
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
        name: "Thương hiệu",
        item: absoluteUrl("/thuong-hieu/ba-thanh/"),
      },
      { "@type": "ListItem", position: 3, name: "Ba Thanh" },
    ],
  },
};

export default function BaThanhBrandPage() {
  return (
    <SiteShell>
      <JsonLd data={brandSchema} />
      <div className="bg-[#fbfcf9]">
        <section className="relative overflow-hidden bg-forest-950 py-16 text-white lg:py-24">
          <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full border border-wood-500/30 bg-wood-500/10" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-[42%] bg-[linear-gradient(90deg,rgba(184,77,0,.24),transparent)]" />
          <div className="container-shell relative">
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
              <span className="text-white" aria-current="page">
                Thương hiệu Ba Thanh
              </span>
            </nav>
            <div className="mt-12 max-w-4xl">
              <p className="eyebrow eyebrow-on-dark">
                NHÓM VẬT LIỆU TẠI TÙNG PHÁT
              </p>
              <h1 className="mt-5 max-w-3xl text-balance font-display text-4xl font-extrabold leading-[1.1] tracking-[-.04em] sm:text-5xl lg:text-7xl">
                Ba Thanh, tra đúng mã để làm đúng hạng mục.
              </h1>
              <p className="mt-6 max-w-2xl text-pretty text-base leading-8 text-white/72 sm:text-lg">
                Tùng Phát cung cấp và nhận kiểm tra các dòng ván, bề mặt và mã
                Melamine Ba Thanh theo nhu cầu thực tế. Gửi mã, quy cách và file
                gia công để đội ngũ tư vấn sát với đơn hàng.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/ma-mau-melamine/ba-thanh/"
                  className="inline-flex min-h-13 items-center justify-center gap-2 bg-wood-700 px-6 text-sm font-extrabold text-white transition-[transform,background-color] duration-[180ms] ease-out hover:-translate-y-0.5 hover:bg-wood-800 active:scale-[.97]"
                >
                  Mở bảng mã Melamine{" "}
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <Link
                  href="/lien-he/"
                  className="inline-flex min-h-13 items-center justify-center border border-white/25 px-6 text-sm font-extrabold text-white transition-colors hover:border-white"
                >
                  Trao đổi nhu cầu
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-forest-900/10 bg-[#f4f6f1] py-7">
          <div className="container-shell grid gap-5 sm:grid-cols-3">
            <div>
              <p className="text-3xl font-extrabold text-forest-950">233</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[.14em] text-slate-500">
                mã đã xác minh từ index
              </p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-forest-950">4</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[.14em] text-slate-500">
                nhóm bề mặt phát hiện
              </p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-forest-950">1</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[.14em] text-slate-500">
                quy trình gửi mã rõ ràng
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="container-shell">
            <div className="max-w-3xl">
              <p className="eyebrow">ĐI THẲNG VÀO NHU CẦU</p>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-[-.035em] text-forest-950 sm:text-5xl">
                Chọn nhóm màu, sau đó gửi mã.
              </h2>
              <p className="mt-5 leading-7 text-slate-600">
                Bảng mã giúp bạn tra theo nhóm vân thay vì phải lục lại từng
                catalogue. Mã hiển thị bằng chữ, ảnh chỉ dùng để đối chiếu cảm
                quan.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {baThanhCategories.map((category, index) => (
                <Link
                  key={category.slug}
                  href={`/ma-mau-melamine/ba-thanh/${category.slug}/`}
                  className="group relative overflow-hidden border border-forest-900/12 bg-white p-6 transition-[transform,border-color,box-shadow] duration-[180ms] ease-out hover:-translate-y-1 hover:border-wood-500/60 hover:shadow-[0_16px_34px_rgba(7,59,40,.09)]"
                >
                  <span className="text-xs font-extrabold text-wood-600">
                    0{index + 1}
                  </span>
                  <h3 className="mt-8 text-xl font-extrabold text-forest-950">
                    {category.label}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {category.count} mã để tra cứu theo nhóm.
                  </p>
                  <ArrowRight
                    size={18}
                    className="mt-8 text-wood-600 transition-transform duration-[180ms] ease-out group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-forest-950 py-16 text-white lg:py-24">
          <div className="container-shell grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
            <div>
              <p className="eyebrow eyebrow-on-dark">CÁCH ĐẶT HÀNG THEO MÃ</p>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-[-.035em] sm:text-5xl">
                Một tin nhắn đủ dữ liệu sẽ tiết kiệm nhiều vòng hỏi lại.
              </h2>
              <p className="mt-5 leading-7 text-white/70">
                Gửi mã hiển thị, loại cốt ván mong muốn, kích thước cắt, độ dày,
                số lượng và file CNC nếu có. Tùng Phát sẽ kiểm tra lại mã và quy
                cách trước khi báo giá.
              </p>
            </div>
            <ol className="grid gap-3 sm:grid-cols-2">
              {[
                "Chọn mã trong bảng màu",
                "Nêu MDF, MDF chống ẩm hoặc MFC",
                "Gửi kích thước và số lượng",
                "Xác nhận cắt, dán cạnh hoặc CNC",
              ].map((step, index) => (
                <li
                  key={step}
                  className="flex gap-4 border border-white/12 bg-white/[.04] p-5"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-wood-500 text-sm font-extrabold">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-sm font-bold leading-6 text-white/85">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="container-shell">
            <div className="max-w-3xl">
              <p className="eyebrow">TỪ MÃ ĐẾN TẤM VÁN</p>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-[-.035em] text-forest-950 sm:text-5xl">
                Kết nối catalogue với xưởng và quy cách thực tế.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                [
                  "Ván MDF/MFC",
                  "/van-mdf/",
                  "Chọn cốt ván và bề mặt theo hạng mục.",
                ],
                [
                  "MDF chống ẩm",
                  "/mdf-chong-am/",
                  "Kiểm tra lựa chọn cốt khi công trình cần cân nhắc môi trường sử dụng.",
                ],
                [
                  "Cắt và dán cạnh",
                  "/bao-gia/",
                  "Gửi khổ cắt, độ dày và yêu cầu dán cạnh đồng màu.",
                ],
                [
                  "Gia công CNC",
                  "/gia-cong-cnc/",
                  "Đính kèm file kỹ thuật để xác nhận đường cắt và lỗ khoan.",
                ],
              ].map(([title, href, text]) => (
                <Link
                  key={href}
                  href={href}
                  className="group border border-forest-900/12 bg-white p-6 transition-[transform,box-shadow,border-color] duration-[180ms] ease-out hover:-translate-y-1 hover:border-wood-500/60 hover:shadow-[0_16px_34px_rgba(7,59,40,.09)]"
                >
                  <h3 className="text-lg font-extrabold text-forest-950">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {text}
                  </p>
                  <ArrowRight
                    size={17}
                    className="mt-7 text-wood-600 transition-transform duration-[180ms] ease-out group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f4f6f1] py-16 lg:py-20">
          <div className="container-shell grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
            <div>
              <p className="eyebrow">KHU VỰC PHỤC VỤ</p>
              <h2 className="mt-4 font-display text-3xl font-extrabold text-forest-950 sm:text-4xl">
                Kiểm tra mã tại hai chi nhánh Tùng Phát.
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {locations.map((location) => (
                <article
                  key={location.id}
                  className="border border-forest-900/12 bg-white p-5"
                >
                  <MapPin
                    size={18}
                    className="text-wood-600"
                    aria-hidden="true"
                  />
                  <h3 className="mt-4 font-extrabold text-forest-950">
                    {location.name}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {location.address}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="container-shell max-w-4xl">
            <MaterialDisclaimer />
            <div className="mt-10 grid gap-4">
              <details className="group border-b border-forest-900/15 py-4">
                <summary className="cursor-pointer list-none pr-8 text-base font-extrabold text-forest-950 marker:hidden">
                  Tùng Phát có phải đại lý độc quyền Ba Thanh không?
                </summary>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  Trang này không tuyên bố đại lý chính thức hay độc quyền. Tùng
                  Phát nhận kiểm tra mã, quy cách và tình trạng thực tế theo
                  từng nhu cầu.
                </p>
              </details>
              <details className="group border-b border-forest-900/15 py-4">
                <summary className="cursor-pointer list-none pr-8 text-base font-extrabold text-forest-950 marker:hidden">
                  Cần gửi gì để nhận báo giá?
                </summary>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  Bạn nên gửi mã, loại cốt ván, độ dày, khổ cắt, số lượng, yêu
                  cầu dán cạnh và file CNC nếu có.
                </p>
              </details>
              <details className="group border-b border-forest-900/15 py-4">
                <summary className="cursor-pointer list-none pr-8 text-base font-extrabold text-forest-950 marker:hidden">
                  Ảnh trên bảng màu có phải màu tuyệt đối không?
                </summary>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  Không. Ảnh phụ thuộc màn hình và ánh sáng; hãy kiểm tra mẫu
                  hoặc catalogue thực tế trước khi đặt hàng.
                </p>
              </details>
            </div>
            <div className="mt-10">
              <ProductInquiryCTA />
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
