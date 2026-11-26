import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { MarkdownContent } from "@/components/content/MarkdownContent";
import type { ContentEntry } from "@/lib/content";
import type { ServicePageFrontmatter } from "@/lib/content-schema";
import { resolveCncEditorial } from "@/lib/cnc-service-editorial";
import { resolveMediaUrl } from "@/lib/media";
import { FaqList } from "@/components/content/FaqList";
import { SiteShell } from "@/components/site/SiteShell";
import { TrackedLink } from "@/components/TrackedLink";
import { ContactCTA } from "@/components/ui/ContactCTA";
import { PageHero } from "@/components/ui/PageHero";
import { SITE_URL, ZALO_URL, absolutePageUrl, breadcrumbSchema, schemaPageId, webPageSchema } from "@/lib/seo";

export const cncServiceCopy = {
  "gia-cong-cnc": {
    title: "Gia công CNC ván gỗ tại Thủ Đức",
    description: "Dịch vụ cắt, khoan và soi rãnh ván gỗ cho các chi tiết nội thất. Tùng Phát trao đổi phạm vi gia công theo từng yêu cầu.",
    heading: "Gia công ván cho từng hạng mục nội thất",
    paragraphs: ["Tùng Phát tiếp nhận nhu cầu cắt ván và gia công CNC cho các chi tiết nội thất. Tùy hạng mục, phần việc có thể gồm cắt theo kích thước, cắt biên dạng, khoan hoặc soi rãnh.", "Khả năng thực hiện được kiểm tra theo loại vật liệu và chi tiết cụ thể. Khách hàng có thể trao đổi thêm về cắt ván và hoàn thiện cạnh khi liên hệ."],
    faq: [{ question: "Gia công CNC có những phần việc nào?", answer: "Tùy yêu cầu, phần việc có thể gồm cắt, khoan và soi rãnh. Tùng Phát kiểm tra từng hạng mục trước khi xác nhận." }, { question: "Chi phí gia công được xác định thế nào?", answer: "Chi phí phụ thuộc vào vật liệu, số lượng và phạm vi công việc. Liên hệ Tùng Phát để trao đổi báo giá." }],
  },
  "cat-cnc-go": {
    title: "Cắt CNC gỗ tại Thủ Đức",
    description: "Cắt chi tiết và biên dạng gỗ cho hạng mục nội thất; trao đổi với Tùng Phát để kiểm tra khả năng gia công từng vật liệu.",
    heading: "Cắt chi tiết và biên dạng gỗ",
    paragraphs: ["Cắt CNC phù hợp với nhu cầu tạo các chi tiết có hình dạng hoặc phần gia công cần được xác định theo từng hạng mục. Phần việc có thể kết hợp khoan hoặc soi rãnh khi phù hợp.", "Với gỗ ghép, loại gỗ, quy cách và mặt sử dụng ảnh hưởng đến cách kiểm tra phương án gia công. Tùng Phát xác nhận khả năng thực hiện theo từng yêu cầu."],
    faq: [{ question: "Gỗ ghép có thể cắt CNC không?", answer: "Có thể xem xét gia công gỗ ghép sau khi kiểm tra loại gỗ, quy cách và chi tiết cần làm." }, { question: "Cắt CNC có thể kết hợp khoan hoặc soi rãnh không?", answer: "Các phần việc này có thể được xem xét cùng yêu cầu cắt; phạm vi thực hiện cần được xác nhận cụ thể." }],
  },
  "gia-cong-cnc-mdf": {
    title: "Gia công CNC MDF tại Thủ Đức",
    description: "Gia công chi tiết MDF thường và MDF chống ẩm, gồm cắt, khoan hoặc soi rãnh theo khả năng thực hiện của từng yêu cầu.",
    heading: "Gia công chi tiết trên ván MDF",
    paragraphs: ["MDF được dùng cho nhiều chi tiết nội thất như cánh, vách và kệ. Gia công CNC có thể gồm cắt chi tiết, khoan hoặc soi rãnh tùy hạng mục.", "MDF thường và MDF chống ẩm cần được xem xét theo cốt, độ dày và bề mặt của tấm. Với cạnh để lộ, phần hoàn thiện cũng cần được trao đổi theo yêu cầu thực tế."],
    faq: [{ question: "MDF chống ẩm có thể gia công CNC không?", answer: "Có thể xem xét gia công sau khi kiểm tra cốt ván, bề mặt và chi tiết. MDF chống ẩm không đồng nghĩa với chống nước." }, { question: "MDF đã phủ bề mặt có gia công được không?", answer: "Khả năng gia công cần được kiểm tra theo loại bề mặt, tấm ván và phần việc cụ thể." }],
  },
} as const;

export type CncServiceSlug = keyof typeof cncServiceCopy;
export function isCncServiceSlug(slug: string): slug is CncServiceSlug { return Object.prototype.hasOwnProperty.call(cncServiceCopy, slug); }

export function CncServiceContent({ slug, page }: { slug: CncServiceSlug; page?: ContentEntry<ServicePageFrontmatter> }) {
  const copy = cncServiceCopy[slug];
  const editorial = resolveCncEditorial(page);
  const title = editorial?.title || copy.title;
  const description = editorial?.excerpt || copy.description;
  const path = `/${slug}`;
  const serviceId = schemaPageId(path, "service");
  const schema = { "@context": "https://schema.org", "@type": "Service", "@id": serviceId, name: title, description, serviceType: "Gia công CNC ván gỗ", url: absolutePageUrl(path), areaServed: { "@type": "City", name: "TP. Hồ Chí Minh" }, provider: { "@id": `${SITE_URL}/#organization` } };
  const crumbs = slug === "gia-cong-cnc" ? [{ name: "Trang chủ", path: "/" }, { name: title, path }] : [{ name: "Trang chủ", path: "/" }, { name: "Gia công CNC", path: "/gia-cong-cnc" }, { name: title, path }];
  return <><JsonLd data={[webPageSchema({ path, name: title, description, primaryEntityId: serviceId }), breadcrumbSchema(crumbs), schema]} /><SiteShell>
    <PageHero breadcrumbs={crumbs.map((item, index) => ({ label: item.name, ...(index < crumbs.length - 1 ? { href: item.path } : {}) }))} eyebrow="Dịch vụ gia công" title={title} description={description} image={{ src: editorial && page ? resolveMediaUrl(page.featuredImage) : "/images/cnc-service.webp", alt: editorial && page ? page.featuredImageAlt : "Ảnh tham khảo máy CNC gia công ván gỗ", priority: true }} actions={<TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="request_quote" eventProperties={{ location: slug === "gia-cong-cnc" ? "cnc_hero" : `${slug}_hero`, channel: "zalo" }} className="pressable inline-flex min-h-14 items-center justify-center gap-2 bg-wood-600 px-6 text-sm font-extrabold text-white hover:bg-wood-700"><MessageCircle size={18} aria-hidden="true" />Liên hệ báo giá</TrackedLink>} />
    <section data-answer-block className="section-space bg-white"><div className="container-shell max-w-4xl"><h2 className="text-3xl font-extrabold text-forest-950">{copy.heading}</h2>{editorial ? <MarkdownContent className="mt-5">{editorial.body}</MarkdownContent> : copy.paragraphs.map((paragraph) => <p key={paragraph} className="mt-5 text-base leading-8 text-slate-700">{paragraph}</p>)}<nav aria-label="Nội dung liên quan" className="mt-8 flex flex-wrap gap-x-6 gap-y-4 text-sm font-bold text-forest-900">{Object.entries(cncServiceCopy).filter(([key]) => key !== slug).map(([key, value]) => <Link key={key} href={`/${key}/`} className="underline underline-offset-4">{value.title}</Link>)}<Link href="/bai-viet/" className="underline underline-offset-4">Kiến thức vật liệu và CNC</Link><Link href="/bai-viet/chuan-bi-file-cnc/" className="underline underline-offset-4">Kiến thức chuẩn bị gia công CNC</Link><Link href="/san-pham/" className="underline underline-offset-4">Xem vật liệu</Link>{slug === "gia-cong-cnc" && <Link href="/du-an/" className="underline underline-offset-4">Xem ảnh xưởng và chi nhánh</Link>}</nav></div></section>
    <FaqList items={editorial?.faq.length ? editorial.faq : [...copy.faq]} />
    <ContactCTA title="Cần trao đổi về gia công?" description="Liên hệ Tùng Phát để tìm hiểu phạm vi dịch vụ và nhận báo giá theo nhu cầu." zaloLabel="Liên hệ báo giá" />
  </SiteShell></>;
}
