import Link from "next/link";
import { ArrowRight, Check, MessageCircle, Phone } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/site/SiteShell";
import { TrackedLink } from "@/components/TrackedLink";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PHONE_DISPLAY, PHONE_HREF, ZALO_URL, breadcrumbSchema, createPageMetadata, webPageSchema } from "@/lib/seo";

const QUOTE_APP_URL = "https://baogia.mdftungphat.com";

export const metadata = createPageMetadata({
  title: "Báo giá ván MDF, MFC và gia công CNC TP.HCM",
  description: "Xem cách nhận báo giá ván MDF, MFC, ván gỗ công nghiệp và gia công CNC tại Tùng Phát. Chuẩn bị thương hiệu, độ dày, bề mặt, kích thước và số lượng để kiểm tra chính xác.",
  path: "/bao-gia",
});

const quoteFactors = [
  ["Loại vật liệu", "MDF thường, MDF chống ẩm, MFC, plywood, gỗ ghép hoặc nhóm vật liệu khác."],
  ["Quy cách", "Độ dày, kích thước tấm hoặc danh sách chi tiết cần cắt."],
  ["Bề mặt và mã màu", "Melamine, Laminate, Acrylic, Veneer hoặc mã catalogue đang quan tâm."],
  ["Số lượng và gia công", "Số tấm hoặc chi tiết, kèm yêu cầu cắt, khoan, soi rãnh hay CNC nếu có."],
] as const;

const checklist = [
  "Tên vật liệu, thương hiệu hoặc mã màu nếu đã chọn.",
  "Độ dày, kích thước và số lượng cần kiểm tra.",
  "Yêu cầu bề mặt, cạnh, cắt hoặc gia công CNC.",
  "File kỹ thuật hoặc bản phác thảo nếu đơn hàng có gia công.",
] as const;

export default function QuotePage() {
  const pageName = "Báo giá ván MDF, MFC và gia công CNC";
  const description = "Giá vật liệu phụ thuộc thương hiệu, độ dày, bề mặt, quy cách và số lượng. Tùng Phát kiểm tra thông tin cụ thể trước khi xác nhận báo giá.";

  return (
    <>
      <JsonLd data={[
        webPageSchema({ path: "/bao-gia", name: pageName, description }),
        breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Báo giá MDF, MFC", path: "/bao-gia" }]),
      ]} />
      <SiteShell>
        <PageHero compact breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Báo giá MDF, MFC" }]} eyebrow="Báo giá theo quy cách thực tế" title="Báo giá ván MDF, MFC & gia công CNC" description={description} actions={<><a href={QUOTE_APP_URL} target="_blank" rel="noopener noreferrer" className="pressable inline-flex min-h-14 items-center justify-center gap-2 bg-wood-600 px-6 text-sm font-extrabold text-white hover:bg-wood-700">Mở công cụ báo giá <ArrowRight size={17} aria-hidden="true" /></a><TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="request_quote" eventProperties={{ location: "quote_hero", channel: "zalo" }} className="pressable inline-flex min-h-14 items-center justify-center gap-2 border border-forest-900/20 bg-white px-6 text-sm font-extrabold text-forest-950"><MessageCircle size={18} aria-hidden="true" />Gửi quy cách qua Zalo</TrackedLink></>} />

        <section className="section-space bg-[#f7f8f5]">
          <div className="container-shell">
            <SectionHeader eyebrow="Yếu tố ảnh hưởng giá" title="Vì sao báo giá MDF và MFC cần đúng quy cách?" description="Cùng một nhóm vật liệu có thể khác giá theo cốt ván, nhà cung cấp, bề mặt và khối lượng. Gửi đủ thông tin giúp Tùng Phát kiểm tra đúng sản phẩm thay vì đưa một mức giá chung thiếu chính xác." />
            <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {quoteFactors.map(([title, text]) => <article key={title} className="border border-forest-900/10 bg-white p-6 shadow-sm"><h2 className="text-lg font-extrabold text-forest-950">{title}</h2><p className="mt-3 text-sm leading-7 text-slate-700">{text}</p></article>)}
            </div>
          </div>
        </section>

        <section className="section-space bg-white">
          <div className="container-shell grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
            <div>
              <SectionHeader eyebrow="Chuẩn bị trước khi hỏi giá" title="Thông tin nên gửi" description="Nếu chưa biết chính xác một mục, hãy mô tả hạng mục sử dụng để Tùng Phát hỗ trợ khoanh vùng vật liệu." />
              <ul className="mt-7 space-y-4">{checklist.map((item) => <li key={item} className="flex gap-3 text-sm leading-7 text-slate-700"><Check size={18} className="mt-1 shrink-0 text-wood-600" aria-hidden="true" />{item}</li>)}</ul>
            </div>
            <div className="border border-forest-900/10 bg-[#edf4ef] p-7 sm:p-9">
              <h2 className="text-2xl font-extrabold text-forest-950">Chọn cách nhận báo giá</h2>
              <p className="mt-4 leading-7 text-slate-700">Dùng công cụ báo giá để chuẩn bị danh sách vật liệu, hoặc liên hệ trực tiếp khi cần đối chiếu mã màu và yêu cầu CNC.</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <a href={QUOTE_APP_URL} target="_blank" rel="noopener noreferrer" className="pressable inline-flex min-h-14 items-center justify-center gap-2 bg-wood-500 px-6 text-sm font-extrabold text-white hover:bg-wood-600">Xem bảng giá đang áp dụng <ArrowRight size={17} aria-hidden="true" /></a>
                <TrackedLink href={PHONE_HREF} eventName="click_phone" eventProperties={{ location: "quote_page" }} className="pressable inline-flex min-h-14 items-center justify-center gap-2 border border-forest-900/20 bg-white px-6 text-sm font-extrabold text-forest-950"><Phone size={18} aria-hidden="true" />Gọi {PHONE_DISPLAY}</TrackedLink>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-extrabold text-forest-950">
                <Link href="/van-mdf" className="inline-flex min-h-11 items-center hover:text-wood-600">Xem ván MDF</Link>
                <Link href="/catalogue" className="inline-flex min-h-11 items-center hover:text-wood-600">Xem mã màu Melamine</Link>
                <Link href="/gia-cong-cnc" className="inline-flex min-h-11 items-center hover:text-wood-600">Xem dịch vụ gia công CNC</Link>
              </div>
            </div>
          </div>
        </section>
      </SiteShell>
    </>
  );
}
