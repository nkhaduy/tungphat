import Link from "next/link";
import { ArrowRight, Check, MessageCircle } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/site/SiteShell";
import { TrackedLink } from "@/components/TrackedLink";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ZALO_URL, breadcrumbSchema, createPageMetadata, webPageSchema } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Báo giá ván MDF, MFC và gia công CNC TP.HCM",
  description: "Tìm hiểu yếu tố ảnh hưởng đến báo giá ván MDF, MFC, gỗ ghép và CNC tại Tùng Phát. Tra mã vật liệu trên catalogue và yêu cầu báo giá trực tiếp qua Zalo.",
  path: "/bao-gia",
});

const quoteFactors = [
  ["Loại vật liệu", "MDF thường, MDF chống ẩm, MFC, plywood, gỗ ghép hoặc vật liệu khác."],
  ["Quy cách", "Độ dày, kích thước tấm và số lượng thực tế."],
  ["Bề mặt, mã màu", "Melamine, Laminate, Acrylic hoặc mã catalogue cụ thể."],
  ["Gia công", "Cắt, khoan, soi rãnh, dán cạnh hoặc CNC theo hạng mục."],
] as const;

const checklist = [
  "Tên vật liệu, nhà cung cấp hoặc mã màu nếu đã chọn.",
  "Độ dày, kích thước và số lượng dự kiến.",
  "Hạng mục sử dụng và yêu cầu hoàn thiện.",
] as const;

export default function QuotePage() {
  const pageName = "Báo giá ván MDF, MFC và gia công CNC";
  const description = "Giá vật liệu và gia công phụ thuộc loại cốt, thương hiệu, bề mặt, quy cách, số lượng và điều kiện thực tế. Tùng Phát trao đổi và báo giá trực tiếp qua Zalo.";
  return (
    <>
      <JsonLd data={[
        webPageSchema({ path: "/bao-gia", name: pageName, description }),
        breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Báo giá MDF, MFC", path: "/bao-gia" }]),
      ]} />
      <SiteShell>
        <PageHero
          compact
          breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Báo giá MDF, MFC" }]}
          eyebrow="Báo giá theo quy cách thực tế"
          title="Báo giá ván MDF, MFC & gia công CNC"
          description={description}
          actions={
            <TrackedLink
              href={ZALO_URL}
              target="_blank"
              rel="noopener noreferrer"
              eventName="request_quote"
              eventProperties={{ location: "quote_hero", channel: "zalo" }}
              className="pressable inline-flex min-h-14 items-center justify-center gap-2 bg-wood-600 px-6 text-sm font-extrabold text-white hover:bg-wood-700"
            >
              <MessageCircle size={18} aria-hidden="true" /> Yêu cầu báo giá qua Zalo
            </TrackedLink>
          }
        />

        <section data-answer-block className="border-b border-forest-900/10 bg-[#edf4ef] py-8">
          <div className="container-shell max-w-4xl">
            <h2 className="text-2xl font-extrabold text-forest-950">Nhận báo giá ván và CNC tại Tùng Phát như thế nào?</h2>
            <p className="mt-3 leading-8 text-slate-700">
              Tra cứu cốt ván, mã bề mặt và thông tin vật liệu trên website; khi cần kiểm tra giá, liên hệ trực tiếp với Tùng Phát qua Zalo. Website không yêu cầu điền biểu mẫu báo giá.
            </p>
          </div>
        </section>

        <section className="section-space bg-[#f7f8f5]">
          <div className="container-shell">
            <SectionHeader
              eyebrow="Yếu tố ảnh hưởng giá"
              title="Vì sao cùng là MDF hoặc MFC nhưng giá có thể khác nhau?"
              description="Các yếu tố dưới đây giúp phân biệt báo giá giữa các loại cốt ván, bề mặt và phương án gia công. Không nên dùng một mức giá chung cho mọi mã."
            />
            <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {quoteFactors.map(([title, detail]) => (
                <article key={title} className="border border-forest-900/10 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-extrabold text-forest-950">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-space bg-white">
          <div className="container-shell grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
            <div>
              <SectionHeader
                eyebrow="Đối chiếu sản phẩm"
                title="Các thông tin giúp xác định đúng vật liệu"
                description="Có thể tìm hiểu trên trang sản phẩm và catalogue trước khi trao đổi báo giá trực tiếp."
              />
              <ul className="mt-7 space-y-4">
                {checklist.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-7 text-slate-700">
                    <Check size={18} className="mt-1 shrink-0 text-wood-600" aria-hidden="true" />{item}
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm font-extrabold text-forest-950">
                <Link href="/van-mdf/" className="inline-flex min-h-11 items-center gap-2 hover:text-wood-600">Ván MDF <ArrowRight size={15} aria-hidden="true" /></Link>
                <Link href="/van-mfc/" className="inline-flex min-h-11 items-center gap-2 hover:text-wood-600">Ván MFC <ArrowRight size={15} aria-hidden="true" /></Link>
                <Link href="/go-ghep/" className="inline-flex min-h-11 items-center gap-2 hover:text-wood-600">Gỗ ghép <ArrowRight size={15} aria-hidden="true" /></Link>
                <Link href="/catalogue/" className="inline-flex min-h-11 items-center gap-2 hover:text-wood-600">Tra mã màu <ArrowRight size={15} aria-hidden="true" /></Link>
              </div>
            </div>
            <div className="border border-forest-900/10 bg-[#edf4ef] p-7 sm:p-9">
              <h2 className="text-2xl font-extrabold text-forest-950">Yêu cầu báo giá trực tiếp qua Zalo</h2>
              <p className="mt-4 leading-7 text-slate-700">
                Tùng Phát đối chiếu loại vật liệu, mã màu và quy cách với nhu cầu thực tế rồi trao đổi giá trên Zalo. Không sử dụng form gửi yêu cầu hay biểu mẫu tải lên trên website.
              </p>
              <TrackedLink
                href={ZALO_URL}
                target="_blank"
                rel="noopener noreferrer"
                eventName="request_quote"
                eventProperties={{ location: "quote_page", channel: "zalo" }}
                className="pressable mt-7 inline-flex min-h-14 items-center justify-center gap-2 bg-wood-600 px-6 text-sm font-extrabold text-white hover:bg-wood-700"
              >
                <MessageCircle size={18} aria-hidden="true" /> Yêu cầu báo giá qua Zalo
              </TrackedLink>
            </div>
          </div>
        </section>
      </SiteShell>
    </>
  );
}
