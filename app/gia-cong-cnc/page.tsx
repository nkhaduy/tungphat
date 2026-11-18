import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { LocalIntentLinks } from "@/components/content/LocalIntentLinks";
import { SiteShell } from "@/components/site/SiteShell";
import { TrackedLink } from "@/components/TrackedLink";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getLocalSeoCopy } from "@/lib/local-seo";
import { SITE_URL, ZALO_URL, absolutePageUrl, breadcrumbSchema, createPageMetadata, schemaPageId, webPageSchema } from "@/lib/seo";

const localCopy = getLocalSeoCopy("gia-cong-cnc");
const serviceName = localCopy?.h1 ?? "Gia công CNC gỗ tại Thủ Đức";
const serviceDescription = localCopy?.heroDescription ?? "Cắt biên dạng, khoan, soi rãnh và gia công ván gỗ phục vụ nội thất.";
export const metadata = createPageMetadata({
  title: localCopy?.title ?? "Gia công CNC gỗ tại Thủ Đức",
  description: localCopy?.description ?? serviceDescription,
  path: "/gia-cong-cnc",
});
const serviceId = schemaPageId("/gia-cong-cnc", "service");
const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": serviceId,
  name: serviceName,
  serviceType: "Gia công CNC ván gỗ",
  description: serviceDescription,
  url: absolutePageUrl("/gia-cong-cnc"),
  areaServed: { "@type": "City", name: "TP. Hồ Chí Minh" },
  provider: { "@id": `${SITE_URL}/#organization` },
};
const pageSchema = webPageSchema({
  path: "/gia-cong-cnc",
  name: serviceName,
  description: serviceDescription,
  primaryEntityId: serviceId,
});

const techniques = [
  ["Cắt biên dạng", "Tạo đường cắt thẳng hoặc cong theo thiết kế, tùy điều kiện gia công và vật liệu."],
  ["Khoan, soi rãnh", "Gia công các vị trí lỗ, rãnh, hốc phục vụ lắp ráp và hoàn thiện sản phẩm nội thất."],
  ["Gia công chi tiết", "Xử lý các chi tiết có hình dáng hoặc yêu cầu lặp lại cần kiểm soát độ đồng đều."],
] as const;
const materialNotes = [
  ["MDF", "Cốt sợi mịn, phù hợp nhiều chi tiết nội thất; cần xem độ dày và bề mặt hoàn thiện."],
  ["MFC / ván dăm phủ Melamine", "Bề mặt có sẵn lớp phủ; cần chú ý mép cắt và giải pháp dán cạnh theo hạng mục."],
  ["Gỗ ghép thanh", "Có thớ và biến thiên tự nhiên; cần đánh giá chiều vân, chất lượng mối ghép và hoàn thiện bề mặt."],
] as const;
const qualityFactors = [
  "Vật liệu và độ dày ảnh hưởng đến phương án gia công.",
  "Kiểu cắt, lỗ, rãnh và yêu cầu hoàn thiện ảnh hưởng đến chi phí.",
  "Số lượng, độ phức tạp và điều kiện thực tế quyết định khả năng thực hiện.",
] as const;

export default function CncServicePage() {
  return (
    <>
      <JsonLd data={[
        pageSchema,
        breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Gia công CNC", path: "/gia-cong-cnc" }]),
        serviceSchema,
      ]} />
      <SiteShell>
        <PageHero
          breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Gia công CNC" }]}
          eyebrow="Dịch vụ gia công tại Thủ Đức"
          title={serviceName}
          description={serviceDescription}
          image={{ src: "/images/cnc-service.webp", alt: "Máy CNC gia công tấm ván gỗ", priority: true }}
          actions={
            <TrackedLink
              href={ZALO_URL}
              target="_blank"
              rel="noopener noreferrer"
              eventName="request_quote"
              eventProperties={{ location: "cnc_hero", channel: "zalo" }}
              className="pressable inline-flex min-h-14 items-center justify-center gap-2 bg-wood-600 px-6 text-sm font-extrabold text-white hover:bg-wood-700"
            >
              <MessageCircle size={18} aria-hidden="true" /> Yêu cầu báo giá qua Zalo
            </TrackedLink>
          }
        />

        <section data-answer-block className="border-b border-forest-900/10 bg-[#edf4ef] py-8">
          <div className="container-shell max-w-4xl">
            <p className="text-xs font-extrabold uppercase tracking-[.15em] text-wood-600">Gia công CNC gỗ là gì?</p>
            <h2 className="mt-2 text-2xl font-extrabold text-forest-950">Cắt, khoan và tạo hình chi tiết gỗ bằng máy CNC</h2>
            <p className="mt-3 text-base leading-8 text-slate-700">
              Gia công CNC sử dụng máy điều khiển theo chương trình để xử lý đường cắt, lỗ và rãnh trên vật liệu tấm.
              Với nội thất, lựa chọn cốt ván, bề mặt và phương án hoàn thiện cần được xem xét cùng nhau.
              Tùng Phát trao đổi yêu cầu và báo giá trực tiếp qua Zalo.
            </p>
          </div>
        </section>

        <section className="section-space bg-white">
          <div className="container-shell">
            <SectionHeader
              eyebrow="Phạm vi dịch vụ"
              title="Các dạng gia công CNC gỗ"
              description="Mỗi phương án có đặc điểm riêng về biên dạng, chất liệu và chất lượng bề mặt sau gia công."
            />
            <div className="mt-9 grid gap-5 md:grid-cols-3">
              {techniques.map(([title, description]) => (
                <article key={title} className="border border-forest-900/10 bg-[#f7f8f5] p-7">
                  <h3 className="text-xl font-extrabold text-forest-950">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-space bg-[#f7f8f5]">
          <div className="container-shell grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
            <div className="relative aspect-[4/3] overflow-hidden border border-forest-900/10">
              <Image
                src="/images/cnc-service.webp"
                alt="Đầu máy CNC đang gia công vật liệu dạng tấm"
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
            <div>
              <SectionHeader
                eyebrow="Chọn theo vật liệu"
                title="MDF, MFC và gỗ ghép khác nhau thế nào khi gia công?"
                description="Hiểu đặc điểm cốt ván giúp chọn hạng mục và phương án hoàn thiện phù hợp."
              />
              <div className="mt-7 grid gap-4">
                {materialNotes.map(([name, description]) => (
                  <article key={name} className="border-l-2 border-wood-600 pl-4">
                    <h3 className="font-extrabold text-forest-950">{name}</h3>
                    <p className="mt-1 text-sm leading-7 text-slate-700">{description}</p>
                  </article>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap gap-5">
                <Link href="/van-mdf/" className="inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-forest-900">Tìm hiểu MDF <ArrowRight size={16} aria-hidden="true" /></Link>
                <Link href="/van-mfc/" className="inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-forest-900">Tìm hiểu MFC <ArrowRight size={16} aria-hidden="true" /></Link>
                <Link href="/go-ghep/" className="inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-forest-900">Tìm hiểu gỗ ghép <ArrowRight size={16} aria-hidden="true" /></Link>
              </div>
            </div>
          </div>
        </section>

        <section className="section-space bg-white">
          <div className="container-shell max-w-5xl">
            <SectionHeader
              eyebrow="Thông tin cần biết"
              title="Yếu tố ảnh hưởng đến phương án và chi phí gia công"
              description="Chất lượng hoàn thiện không chỉ phụ thuộc vào máy CNC mà còn phụ thuộc cốt ván, bề mặt và điều kiện thi công."
            />
            <ul className="mt-7 grid gap-4 md:grid-cols-3">
              {qualityFactors.map((item) => (
                <li key={item} className="border border-forest-900/10 bg-[#f7f8f5] p-6 text-sm leading-7 text-slate-700">{item}</li>
              ))}
            </ul>
            <div className="mt-8 border border-forest-900/10 bg-[#edf4ef] p-7">
              <h2 className="text-xl font-extrabold text-forest-950">Đọc thêm kiến thức về vật liệu và CNC</h2>
              <p className="mt-3 leading-7 text-slate-700">
                Blog Tùng Phát tập trung giải thích khác biệt vật liệu, chọn bề mặt, ứng dụng và lưu ý gia công theo từng hạng mục.
              </p>
              <Link href="/bai-viet/" className="mt-4 inline-flex min-h-12 items-center gap-2 text-sm font-extrabold text-forest-900">
                Khám phá bài viết <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
        <LocalIntentLinks currentSlug="gia-cong-cnc" />
        <section className="border-y border-slate-200 bg-white py-12 sm:py-16">
          <div className="container-shell flex flex-col gap-6 border border-slate-200 bg-[#f7f8f5] p-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-extrabold text-forest-950">Cần báo giá gia công CNC?</h2>
              <p className="mt-3 leading-7 text-slate-700">Tùng Phát tiếp nhận yêu cầu và trao đổi báo giá trực tiếp trên Zalo, không có biểu mẫu trên website.</p>
            </div>
            <TrackedLink
              href={ZALO_URL}
              target="_blank"
              rel="noopener noreferrer"
              eventName="request_quote"
              eventProperties={{ location: "cnc_bottom", channel: "zalo" }}
              className="pressable inline-flex min-h-14 shrink-0 items-center justify-center gap-2 bg-wood-600 px-6 text-sm font-extrabold text-white hover:bg-wood-700"
            >
              <MessageCircle size={18} aria-hidden="true" /> Yêu cầu báo giá qua Zalo
            </TrackedLink>
          </div>
        </section>
      </SiteShell>
    </>
  );
}
