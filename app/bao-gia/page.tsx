import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { TrackedLink } from "@/components/TrackedLink";
import staticPages from "@/content/settings/static-pages.json";
import { PHONE_DISPLAY, PHONE_HREF, ZALO_URL, breadcrumbSchema, createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Trao đổi vật liệu gỗ và gia công CNC",
  description: "Gọi điện hoặc nhắn Zalo để trao đổi trực tiếp về vật liệu gỗ, quy cách và yêu cầu gia công CNC.",
  path: "/bao-gia",
  noIndex: true
});

export default function QuotePage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Liên hệ trực tiếp", path: "/bao-gia" }])} />
      <Header appearance="light" />
      <main className="bg-[#f6f7f5] pt-[72px]">
        <section className="bg-forest-950 py-14 text-white lg:py-20">
          <div className="container-shell">
            <nav aria-label="Breadcrumb" className="text-sm text-white/70">
              <Link href="/">Trang chủ</Link> / <span aria-current="page">Liên hệ trực tiếp</span>
            </nav>
            <h1 className="mt-6 text-balance text-4xl font-extrabold sm:text-5xl">Trao đổi vật liệu và gia công CNC</h1>
            <p className="mt-5 max-w-3xl leading-8 text-white/80">{staticPages.quoteIntro}</p>
          </div>
        </section>
        <section className="py-16 lg:py-24">
          <div className="container-shell grid gap-10 lg:grid-cols-[.75fr_1fr] lg:items-center">
            <div>
              <p className="eyebrow">Thông tin nên chuẩn bị</p>
              <h2 className="mt-4 text-3xl font-extrabold text-forest-950">Trao đổi trực tiếp để kiểm tra nhanh hơn</h2>
              <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-600">
                <li>Loại vật liệu hoặc mã đang quan tâm.</li>
                <li>Kích thước, độ dày và số lượng.</li>
                <li>Yêu cầu bề mặt, cạnh hoặc CNC.</li>
                <li>Khu vực nhận hàng hoặc hình thức bàn giao cần trao đổi.</li>
              </ul>
            </div>
            <div className="bg-white p-7 shadow-card sm:p-10">
              <h2 className="text-2xl font-extrabold text-forest-950">Liên hệ Tùng Phát</h2>
              <p className="mt-4 leading-7 text-slate-600">Website không còn nhận form báo giá. Vui lòng gọi điện hoặc nhắn Zalo để trao đổi trực tiếp.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <TrackedLink href={PHONE_HREF} eventName="click_phone" eventProperties={{ location: "legacy_quote_page" }} className="inline-flex min-h-14 items-center justify-center gap-2 bg-wood-500 px-7 text-sm font-bold text-white hover:bg-wood-600">
                  <Phone size={18} /> Gọi {PHONE_DISPLAY}
                </TrackedLink>
                <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: "legacy_quote_page" }} className="inline-flex min-h-14 items-center justify-center gap-2 border border-forest-900/25 px-7 text-sm font-bold text-forest-950">
                  <MessageCircle size={18} /> Nhắn Zalo
                </TrackedLink>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
