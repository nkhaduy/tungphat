import { Check, MessageCircle, Phone } from "lucide-react";
import { FaqList } from "@/components/content/FaqList";
import { LocalIntentLinks } from "@/components/content/LocalIntentLinks";
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
import { getLocalSeoCopy } from "@/lib/local-seo";
import { resolveMediaUrl } from "@/lib/media";
import { PHONE_DISPLAY, PHONE_HREF, SITE_URL, ZALO_URL, absolutePageUrl, breadcrumbSchema, schemaPageId, webPageSchema } from "@/lib/seo";

const waveOneServiceSlugs = new Set(["cat-cnc-go", "gia-cong-cnc-mdf"]);

export function ServiceLanding({ page }: { page: ContentEntry<ServicePageFrontmatter> }) {
  const servicePath = `/${page.slug}`;
  const serviceUrl = absolutePageUrl(servicePath);
  const localCopy = getLocalSeoCopy(page.slug);
  const displayTitle = localCopy?.h1 ?? page.title;
  const pageDescription = localCopy?.heroDescription ?? page.excerpt;
  const serviceId = schemaPageId(servicePath, "service");
  const serviceSchema = { "@context": "https://schema.org", "@type": "Service", "@id": serviceId, name: displayTitle, description: pageDescription, serviceType: "Gia công CNC ván gỗ", url: serviceUrl, areaServed: { "@type": "City", name: "TP. Hồ Chí Minh" }, provider: { "@id": `${SITE_URL}/#organization` } };
  const pageSchema = webPageSchema({ path: servicePath, name: displayTitle, description: pageDescription, primaryEntityId: serviceId, datePublished: page.publishedAt, dateModified: page.updatedAt });
  const isWaveOneService = waveOneServiceSlugs.has(page.slug);
  const jobInputs = [...new Set([...page.materialTypes, ...page.workItems])];
  const process = isWaveOneService ? page.process.slice(0, 4) : page.process;
  const fileGuidance = isWaveOneService ? page.fileGuidance.slice(0, 4) : page.fileGuidance;

  return (
    <>
      <JsonLd data={[pageSchema, breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Gia công CNC", path: "/gia-cong-cnc" }, { name: displayTitle, path: servicePath }]), serviceSchema]} />
      <SiteShell>
        <ViewTracker event="view_cnc_service" contentType={page.slug} />
        <PageHero breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Gia công CNC", href: "/gia-cong-cnc" }, { label: displayTitle }]} eyebrow={page.eyebrow} title={displayTitle} description={pageDescription} image={{ src: resolveMediaUrl(page.featuredImage), alt: page.featuredImageAlt, priority: true }} actions={<><TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: `${page.slug}_hero` }} className="pressable inline-flex min-h-14 items-center justify-center gap-2 bg-wood-500 px-6 text-sm font-extrabold text-white hover:bg-wood-600"><MessageCircle size={18} aria-hidden="true" />{page.quoteCta}</TrackedLink><TrackedLink href={PHONE_HREF} eventName="click_phone" eventProperties={{ location: `${page.slug}_hero` }} className="pressable inline-flex min-h-14 items-center justify-center gap-2 border border-forest-900/20 bg-white px-6 text-sm font-extrabold text-forest-950"><Phone size={18} aria-hidden="true" />Gọi {PHONE_DISPLAY}</TrackedLink></>} />

        <div className="border-b border-forest-900/10 bg-white"><p className="container-shell py-3 text-xs font-semibold text-slate-500">Cập nhật nội dung: <time dateTime={page.updatedAt}>{page.updatedAt}</time></p></div>

        <section data-answer-block className="border-b border-forest-900/10 bg-[#edf4ef] py-8" aria-labelledby="direct-answer-title">
          <div className="container-shell max-w-4xl">
            <p className="text-xs font-extrabold uppercase tracking-[.15em] text-wood-600">Trả lời nhanh</p>
            <h2 id="direct-answer-title" className="mt-2 text-2xl font-extrabold text-forest-950">{localCopy?.answerTitle ?? `${displayTitle} dùng khi nào?`}</h2>
            <p className="mt-3 text-base leading-8 text-slate-700">{localCopy?.answerDescription ?? `${page.excerpt} Gửi vật liệu, file, kích thước, số lượng và hạng mục gia công cùng một lần để trao đổi nhanh.`}</p>
          </div>
        </section>

        <section className="section-space bg-white">
          <div className="container-shell grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <SectionHeader eyebrow="Nhu cầu có thể gửi" title="Vật liệu và hạng mục gia công" description="Mỗi vật liệu và file có yêu cầu khác nhau. Ghi rõ phần cần cắt, khoan, soi rãnh hoặc gia công để xưởng đọc đúng job." />
            <ul className="grid gap-3 sm:grid-cols-2">
              {jobInputs.map((item) => <li key={item} className="flex min-h-24 items-start gap-3 border border-forest-900/10 bg-[#f7f8f5] p-6 text-sm font-bold leading-6 text-forest-950"><Check size={17} className="mt-1 shrink-0 text-wood-600" aria-hidden="true" />{item}</li>)}
            </ul>
          </div>
        </section>

        <section className="section-space bg-[#f7f8f5]">
          <div className="container-shell"><SectionHeader eyebrow="Quy trình" title="Từ file kỹ thuật đến gia công" description="Gửi thông tin, làm rõ phần việc rồi chốt đúng file trước khi chạy máy." /><div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{process.map((item, index) => <article key={`${index}-${item}`} className="border border-forest-900/10 bg-white p-6"><span className="text-sm font-extrabold text-wood-600">{String(index + 1).padStart(2, "0")}</span><p className="mt-4 text-sm leading-7 text-slate-700">{item}</p></article>)}</div></div>
        </section>

        <section className="section-space bg-white">
          <div className="container-shell grid gap-10 lg:grid-cols-[1fr_.48fr]">
            <MarkdownContent className="prose-lg">{page.body}</MarkdownContent>
            <aside className="h-fit border border-forest-900/10 bg-[#edf4ef] p-7 lg:sticky lg:top-32"><h2 className="text-xl font-extrabold text-forest-950">Checklist file</h2><ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">{fileGuidance.map((item, index) => <li key={`${index}-${item}`} className="flex gap-3"><Check size={17} className="mt-1 shrink-0 text-wood-600" aria-hidden="true" />{item}</li>)}</ul><TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: `${page.slug}_checklist` }} className="pressable mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-wood-500 px-5 text-sm font-extrabold text-white hover:bg-wood-600"><MessageCircle size={17} aria-hidden="true" />Trao đổi file qua Zalo</TrackedLink></aside>
          </div>
        </section>
        <LocalIntentLinks currentSlug={page.slug} />
        <FaqList items={page.faq} />
        <ContactCTA eyebrow="Gửi file qua Zalo" title="Chuẩn bị file và thông tin để nhận báo giá CNC" description="Gửi file qua Zalo cùng vật liệu, độ dày, số lượng, đơn vị đo và các yêu cầu khoan, soi rãnh hoặc xử lý cạnh." zaloLabel="Gửi file qua Zalo" />
      </SiteShell>
    </>
  );
}
