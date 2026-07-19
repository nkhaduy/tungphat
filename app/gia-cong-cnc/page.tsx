import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, MessageCircle, Phone } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { TrackedLink } from "@/components/TrackedLink";
import {
  PHONE_DISPLAY,
  PHONE_HREF,
  SITE_URL,
  ZALO_URL,
  breadcrumbSchema,
  createPageMetadata
} from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Gia công CNC gỗ theo kích thước, bản vẽ",
  description: "Tùng Phát nhận cắt, khoan, soi rãnh và gia công CNC ván gỗ theo kích thước hoặc file kỹ thuật, có bước xác nhận quy cách trước khi chạy máy.",
  path: "/gia-cong-cnc"
});

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${SITE_URL}/gia-cong-cnc#service`,
  name: "Gia công CNC gỗ theo yêu cầu",
  serviceType: "Gia công CNC ván gỗ",
  description: "Cắt, khoan, soi rãnh và gia công chi tiết ván gỗ theo kích thước hoặc file kỹ thuật.",
  url: `${SITE_URL}/gia-cong-cnc`,
  provider: { "@id": `${SITE_URL}/#organization` }
};

const capabilities = [
  "Cắt ván theo kích thước đã xác nhận",
  "Khoan liên kết theo thông tin kỹ thuật",
  "Soi rãnh và cắt hoa văn",
  "Gia công chi tiết theo file hoặc bản phác thảo"
];

const process = [
  ["01", "Gửi thông tin", "Cung cấp loại vật liệu, độ dày, kích thước, số lượng và file hoặc bản phác thảo nếu có."],
  ["02", "Xác nhận quy cách", "Hai bên kiểm tra lại kích thước, chi tiết gia công và các yêu cầu cần làm rõ trước khi chạy máy."],
  ["03", "Tiến hành gia công", "Tùng Phát thực hiện các hạng mục CNC đã thống nhất trên vật liệu được xác nhận."],
  ["04", "Kiểm tra chi tiết", "Thành phẩm được đối chiếu theo thông tin đã chốt trước khi bàn giao theo thỏa thuận."]
];

export default function CncServicePage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Gia công CNC", path: "/gia-cong-cnc" }]),
          serviceSchema
        ]}
      />
      <Header appearance="light" />
      <main className="bg-white pt-[72px]">
        <section className="technical-grid bg-forest-950 py-14 text-white lg:py-20">
          <div className="container-shell grid items-center gap-10 lg:grid-cols-[1fr_.82fr]">
            <div>
              <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-white/70">
                <Link href="/" className="min-h-11 content-center hover:text-white">Trang chủ</Link>
                <span aria-hidden="true">/</span>
                <span aria-current="page" className="text-white">Gia công CNC</span>
              </nav>
              <p className="mt-8 text-xs font-extrabold uppercase tracking-[.18em] text-orange-300">Dịch vụ tại xưởng</p>
              <h1 className="mt-4 text-balance text-4xl font-extrabold leading-tight sm:text-5xl">Gia công CNC gỗ theo yêu cầu</h1>
              <p className="mt-6 max-w-3xl text-pretty leading-8 text-white/80">
                Tùng Phát nhận gia công chi tiết ván gỗ từ kích thước, file kỹ thuật hoặc bản phác thảo. Nội dung cần làm được kiểm tra và xác nhận trước khi chạy máy để hạn chế sai khác về quy cách. Dịch vụ phù hợp với xưởng nội thất, thợ mộc, đơn vị thiết kế và doanh nghiệp cần cắt, khoan, soi rãnh hoặc tạo chi tiết theo yêu cầu. Báo giá phụ thuộc vào vật liệu, độ dày, số lượng và mức độ phức tạp của từng file; vì vậy khách hàng nên gửi đủ thông tin để được kiểm tra đúng nhu cầu.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="request_quote" eventProperties={{ location: "cnc_hero", channel: "zalo" }} className="inline-flex min-h-14 items-center justify-center gap-2 bg-wood-700 px-7 text-sm font-bold text-white">
                  <MessageCircle size={18} /> Gửi yêu cầu báo giá CNC
                </TrackedLink>
                <TrackedLink href={PHONE_HREF} eventName="click_phone" eventProperties={{ location: "cnc_hero" }} className="inline-flex min-h-14 items-center justify-center gap-2 border border-white/35 px-7 text-sm font-bold text-white">
                  <Phone size={18} /> Gọi {PHONE_DISPLAY}
                </TrackedLink>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image src="/images/cnc-service.webp" alt="Máy CNC đang gia công một tấm ván" fill sizes="(max-width: 1024px) 100vw, 45vw" priority className="object-cover" />
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="container-shell grid gap-12 lg:grid-cols-[.9fr_1.1fr]">
            <div>
              <p className="eyebrow">Hạng mục gia công</p>
              <h2 className="mt-4 text-balance text-3xl font-extrabold text-forest-950 sm:text-4xl">Thông tin cần rõ trước khi chạy máy</h2>
              <p className="mt-5 leading-7 text-slate-600">Mỗi yêu cầu có quy cách khác nhau. Việc xác nhận vật liệu, kích thước và chi tiết file là bước cần thiết trước khi báo giá và gia công.</p>
            </div>
            <ul className="grid gap-px bg-forest-900/15 sm:grid-cols-2">
              {capabilities.map((item) => (
                <li key={item} className="flex min-h-28 items-start gap-3 bg-[#f6f7f5] p-6 text-sm font-bold leading-6 text-forest-950"><Check className="mt-0.5 shrink-0 text-wood-600" size={18} />{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-[#f6f7f5] py-16 lg:py-24">
          <div className="container-shell">
            <p className="eyebrow">Quy trình trao đổi</p>
            <h2 className="mt-4 text-3xl font-extrabold text-forest-950 sm:text-4xl">Từ yêu cầu đến chi tiết gia công</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {process.map(([number, title, description]) => (
                <article key={number} className="bg-white p-6">
                  <span className="text-sm font-extrabold text-wood-700">{number}</span>
                  <h3 className="mt-5 text-lg font-extrabold text-forest-950">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
                </article>
              ))}
            </div>
            <div className="mt-10 flex flex-col justify-between gap-5 bg-forest-950 p-7 text-white sm:flex-row sm:items-center lg:p-9">
              <div>
                <h2 className="text-2xl font-extrabold">Chuẩn bị file và quy cách cần gia công?</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72">Gửi thông tin qua Zalo để Tùng Phát kiểm tra nội dung cần làm. Website hiện không có form tải file trực tiếp.</p>
              </div>
              <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: "cnc_final_cta" }} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 bg-wood-700 px-6 text-sm font-bold text-white">Nhắn Zalo <ArrowRight size={17} /></TrackedLink>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
