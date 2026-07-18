import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { LeadForm } from "@/components/LeadForm";
import staticPages from "@/content/settings/static-pages.json";
import { breadcrumbSchema, createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Yêu cầu báo giá vật liệu gỗ và CNC", description: "Gửi yêu cầu báo giá gỗ ghép, ván MDF, vật liệu gỗ hoặc gia công CNC. Tùng Phát kiểm tra quy cách và phản hồi theo thông tin thực tế.", path: "/bao-gia" });

export default function QuotePage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Báo giá", path: "/bao-gia" }])} />
      <Header />
      <main className="bg-[#f6f7f5] pt-[72px]">
        <section className="bg-forest-950 py-14 text-white lg:py-20"><div className="container-shell"><nav aria-label="Breadcrumb" className="text-sm text-white/70"><Link href="/">Trang chủ</Link> / <span aria-current="page">Báo giá</span></nav><h1 className="mt-6 text-balance text-4xl font-extrabold sm:text-5xl">Yêu cầu báo giá vật liệu và CNC</h1><p className="mt-5 max-w-3xl leading-8 text-white/80">{staticPages.quoteIntro}</p></div></section>
        <section className="py-14 lg:py-20"><div className="container-shell grid gap-10 lg:grid-cols-[.55fr_1fr]"><div><p className="eyebrow">Thông tin nên chuẩn bị</p><h2 className="mt-4 text-3xl font-extrabold text-forest-950">Giúp việc kiểm tra nhanh và ít sai khác hơn</h2><ul className="mt-6 space-y-3 text-sm leading-7 text-slate-600"><li>Loại vật liệu hoặc mã đang quan tâm.</li><li>Kích thước, độ dày và số lượng.</li><li>Yêu cầu bề mặt, cạnh hoặc CNC.</li><li>Khu vực nhận hàng hoặc hình thức bàn giao cần trao đổi.</li></ul></div><LeadForm type="quote" /></div></section>
      </main>
      <Footer />
    </>
  );
}
