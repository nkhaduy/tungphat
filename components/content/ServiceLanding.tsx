import { Check, MessageCircle, Phone } from "lucide-react";
import { FaqList } from "@/components/content/FaqList";
import { MarkdownContent } from "@/components/content/MarkdownContent";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/site/SiteShell";
import { TrackedLink } from "@/components/TrackedLink";
import { ContactCTA } from "@/components/ui/ContactCTA";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ViewTracker } from "@/components/ViewTracker";
import type { ContentEntry } from "@/lib/content";
import type { ServicePageFrontmatter } from "@/lib/content-schema";
import { mediaUrl } from "@/lib/media";
import { PHONE_DISPLAY, PHONE_HREF, SITE_URL, ZALO_URL, breadcrumbSchema } from "@/lib/seo";

export function ServiceLanding({ page }: { page: ContentEntry<ServicePageFrontmatter> }) {
  const serviceSchema = { "@context": "https://schema.org", "@type": "Service", "@id": `${SITE_URL}/${page.slug}#service`, name: page.title, description: page.excerpt, serviceType: "Gia công CNC ván gỗ", url: `${SITE_URL}/${page.slug}`, areaServed: { "@type": "City", name: "TP. Hồ Chí Minh" }, provider: { "@id": `${SITE_URL}/#organization` } };

  return (
    <>
      <JsonLd data={[breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Gia công CNC", path: "/gia-cong-cnc" }, { name: page.title, path: `/${page.slug}` }]), serviceSchema]} />
      <SiteShell>
        <ViewTracker event="view_cnc_service" contentType={page.slug} />
        <PageHero breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Gia công CNC", href: "/gia-cong-cnc" }, { label: page.title }]} eyebrow={page.eyebrow} title={page.title} description={page.excerpt} image={{ src: mediaUrl(page.featuredImage), alt: page.featuredImageAlt, priority: true }} actions={<><TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: `${page.slug}_hero` }} className="pressable inline-flex min-h-14 items-center justify-center gap-2 bg-wood-500 px-6 text-sm font-extrabold text-white hover:bg-wood-600"><MessageCircle size={18} aria-hidden="true" />{page.quoteCta}</TrackedLink><TrackedLink href={PHONE_HREF} eventName="click_phone" eventProperties={{ location: `${page.slug}_hero` }} className="pressable inline-flex min-h-14 items-center justify-center gap-2 border border-forest-900/20 bg-white px-6 text-sm font-extrabold text-forest-950"><Phone size={18} aria-hidden="true" />Gọi {PHONE_DISPLAY}</TrackedLink></>} />

        <section className="section-space bg-white">
          <div className="container-shell grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <SectionHeader eyebrow="Khả năng tiếp nhận" title="Vật liệu và hạng mục cần kiểm tra" description="Mỗi vật liệu và file có yêu cầu khác nhau. Danh sách dưới đây là phạm vi trao đổi ban đầu, không thay thế bước xác nhận kỹ thuật." />
            <ul className="grid gap-3 sm:grid-cols-2">
              {[...page.materialTypes, ...page.workItems].map((item) => <li key={item} className="flex min-h-24 items-start gap-3 border border-forest-900/10 bg-[#f7f8f5] p-6 text-sm font-bold leading-6 text-forest-950"><Check size={17} className="mt-1 shrink-0 text-wood-600" aria-hidden="true" />{item}</li>)}
            </ul>
          </div>
        </section>

        <section className="section-space bg-[#f7f8f5]">
          <div className="container-shell"><SectionHeader eyebrow="Quy trình" title="Từ file kỹ thuật đến gia công" description="Khách gửi thông tin, Tùng Phát kiểm tra và chỉ tiến hành trên nội dung đã được hai bên xác nhận." /><div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{page.process.map((item, index) => <article key={item} className="border border-forest-900/10 bg-white p-6"><span className="text-sm font-extrabold text-wood-600">{String(index + 1).padStart(2, "0")}</span><p className="mt-4 text-sm leading-7 text-slate-700">{item}</p></article>)}</div></div>
        </section>

        <section className="section-space bg-white">
          <div className="container-shell grid gap-10 lg:grid-cols-[1fr_.48fr]">
            <MarkdownContent className="prose-lg">{page.body}</MarkdownContent>
            <aside className="h-fit border border-forest-900/10 bg-[#edf4ef] p-7 lg:sticky lg:top-32"><h2 className="text-xl font-extrabold text-forest-950">Checklist file</h2><ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">{page.fileGuidance.map((item) => <li key={item} className="flex gap-3"><Check size={17} className="mt-1 shrink-0 text-wood-600" aria-hidden="true" />{item}</li>)}</ul><TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: `${page.slug}_checklist` }} className="pressable mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-wood-500 px-5 text-sm font-extrabold text-white hover:bg-wood-600"><MessageCircle size={17} aria-hidden="true" />Trao đổi file qua Zalo</TrackedLink></aside>
          </div>
        </section>
        <FaqList items={page.faq} />
        <ContactCTA eyebrow="Gửi file - kiểm tra quy cách" title="Chuẩn bị file và thông tin để nhận báo giá CNC" description="Gửi file qua Zalo cùng vật liệu, độ dày, số lượng, đơn vị đo và các yêu cầu khoan, soi rãnh hoặc xử lý cạnh. Website không tải file trực tiếp." zaloLabel="Gửi file qua Zalo" />
      </SiteShell>
    </>
  );
}
