import Link from "next/link";
import { ArrowRight, Check, MessageCircle, Phone } from "lucide-react";
import { ContentEngagementTracker } from "@/components/analytics/ContentEngagementTracker";
import { FaqList } from "@/components/content/FaqList";
import { MarkdownContent } from "@/components/content/MarkdownContent";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/site/SiteShell";
import { TrackedLink } from "@/components/TrackedLink";
import { ContactCTA } from "@/components/ui/ContactCTA";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { ContentEntry } from "@/lib/content";
import type { ProductFrontmatter } from "@/lib/content-schema";
import { absoluteMediaUrl, mediaUrl } from "@/lib/media";
import { PHONE_DISPLAY, PHONE_HREF, SITE_URL, ZALO_URL, absolutePageUrl, breadcrumbSchema, schemaPageId, webPageSchema } from "@/lib/seo";

export function ProductLanding({ product }: { product: ContentEntry<ProductFrontmatter> }) {
  const productPath = `/${product.slug}`;
  const productUrl = absolutePageUrl(productPath);
  const isGuide = product.status === "guide";
  const entityId = isGuide ? undefined : schemaPageId(productPath, "product");
  const productSchema = isGuide
    ? null
    : {
        "@context": "https://schema.org",
        "@type": "Product",
        "@id": entityId,
        name: product.title,
        description: product.excerpt,
        image: [absoluteMediaUrl(product.featuredImage, SITE_URL)],
        category: product.category,
        material: product.materialType,
        url: productUrl,
        brand: product.supplier ? { "@type": "Brand", name: product.supplier } : undefined,
        additionalProperty: [
          ...product.dimensions.map((value) => ({ "@type": "PropertyValue", name: "Kích thước", value })),
          ...product.thicknesses.map((value) => ({ "@type": "PropertyValue", name: "Độ dày", value })),
          ...product.surfaces.map((value) => ({ "@type": "PropertyValue", name: "Bề mặt", value })),
        ],
      };
  const pageSchema = webPageSchema({ path: productPath, name: product.title, description: product.excerpt, type: isGuide ? "CollectionPage" : "WebPage", primaryEntityId: entityId, datePublished: product.publishedAt, dateModified: product.updatedAt });

  const specGroups = [["Kích thước", product.dimensions], ["Độ dày", product.thicknesses], ["Bề mặt", product.surfaces], ["Tiêu chuẩn", product.standards]] as const;
  const detailGroups = [["Ứng dụng", product.applications], ["Điểm phù hợp", product.advantages], ["Lưu ý khi chọn", product.limitations]] as const;

  return (
    <>
      <JsonLd data={[pageSchema, breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Sản phẩm", path: "/san-pham" }, { name: product.title, path: productPath }]), ...(productSchema ? [productSchema] : [])]} />
      <SiteShell>
        <ContentEngagementTracker contentType="product" contentId={product.slug} contentTitle={product.title} contentCategory={product.category} />
        <PageHero
          breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Vật liệu", href: "/san-pham" }, { label: product.title }]}
          eyebrow={product.category}
          title={product.title}
          description={product.excerpt}
          image={{ src: mediaUrl(product.featuredImage), alt: product.featuredImageAlt, priority: true }}
          actions={
            <>
              <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: `${product.slug}_hero` }} className="pressable inline-flex min-h-14 items-center justify-center gap-2 bg-wood-500 px-6 text-sm font-extrabold text-white hover:bg-wood-600"><MessageCircle size={18} aria-hidden="true" />{product.quoteCta}</TrackedLink>
              <TrackedLink href={PHONE_HREF} eventName="click_phone" eventProperties={{ location: `${product.slug}_hero` }} className="pressable inline-flex min-h-14 items-center justify-center gap-2 border border-forest-900/20 bg-white px-6 text-sm font-extrabold text-forest-950 hover:border-forest-900"><Phone size={18} aria-hidden="true" />Gọi {PHONE_DISPLAY}</TrackedLink>
            </>
          }
        />

        <div className="border-b border-forest-900/10 bg-white">
          <p className="container-shell py-3 text-xs font-semibold text-slate-500">Cập nhật dữ liệu: <time dateTime={product.updatedAt}>{product.updatedAt}</time> · <Link href="/tham-chieu-vat-lieu/" className="text-wood-600 underline underline-offset-4">xem nguồn tham chiếu</Link></p>
        </div>

        <section data-answer-block className="border-b border-forest-900/10 bg-[#edf4ef] py-8" aria-labelledby="direct-answer-title">
          <div className="container-shell max-w-4xl">
            <p className="text-xs font-extrabold uppercase tracking-[.15em] text-wood-600">Trả lời nhanh</p>
            <h2 id="direct-answer-title" className="mt-2 text-2xl font-extrabold text-forest-950">{product.title} là gì và phù hợp với ai?</h2>
            <p className="mt-3 text-base leading-8 text-slate-700">{product.excerpt} Phù hợp cụ thể còn phụ thuộc vào ứng dụng, quy cách, bề mặt và điều kiện sử dụng; hãy xác nhận mã hàng thực tế trước khi chốt.</p>
          </div>
        </section>

        <section data-analytics-content className="section-space bg-white">
          <div className="container-shell grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <SectionHeader eyebrow="Thông tin vật liệu" title="Quy cách cần xác nhận trước khi báo giá" description="Tùng Phát không niêm yết giá hoặc tồn kho khi chưa kiểm tra dữ liệu thực tế. Hãy gửi loại vật liệu, quy cách và số lượng để nhận thông tin phù hợp tại thời điểm yêu cầu." />
            <dl className="grid gap-3 sm:grid-cols-2">
              {specGroups.map(([label, values]) => (
                <div key={label} className="border border-forest-900/10 bg-[#f7f8f5] p-6">
                  <dt className="font-extrabold text-forest-950">{label}</dt>
                  <dd className="mt-3 text-sm leading-6 text-slate-700">{values.length ? values.join("; ") : "Liên hệ để kiểm tra quy cách hiện có."}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="section-space bg-[#f7f8f5]">
          <div className="container-shell grid gap-5 lg:grid-cols-3">
            {detailGroups.map(([title, items]) => (
              <article key={title} className="border border-forest-900/10 bg-white p-7 shadow-[0_8px_24px_rgba(7,59,40,.045)]">
                <h2 className="text-xl font-extrabold text-forest-950">{title}</h2>
                <ul className="mt-5 space-y-3">
                  {items.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700"><Check size={17} className="mt-1 shrink-0 text-wood-600" aria-hidden="true" />{item}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="section-space bg-white">
          <div className="container-shell grid gap-10 lg:grid-cols-[1fr_.42fr]">
            <MarkdownContent className="prose-lg">{product.body}</MarkdownContent>
            <aside className="h-fit border border-forest-900/10 bg-[#edf4ef] p-7 lg:sticky lg:top-32">
              <h2 className="text-xl font-extrabold text-forest-950">Quy trình đặt hàng</h2>
              <ol className="mt-5 space-y-4 text-sm leading-6 text-slate-700">
                {product.orderingSteps.map((step, index) => <li key={step} className="flex gap-3"><strong className="shrink-0 text-wood-600">{String(index + 1).padStart(2, "0")}</strong><span>{step}</span></li>)}
              </ol>
              <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: `${product.slug}_specs` }} className="pressable mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-wood-500 px-5 text-sm font-extrabold text-white hover:bg-wood-600"><MessageCircle size={17} aria-hidden="true" />Kiểm tra hàng qua Zalo</TrackedLink>
            </aside>
          </div>
        </section>

        <section className="border-y border-forest-900/10 bg-[#fbfaf6] py-10">
          <div className="container-shell flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-xs font-extrabold uppercase tracking-[.15em] text-wood-600">Liên quan</p><h2 className="mt-2 text-2xl font-extrabold text-forest-950">Cần cắt hoặc gia công theo quy cách?</h2></div>
            <div className="flex flex-wrap gap-3"><Link href="/gia-cong-cnc" className="pressable inline-flex min-h-12 items-center gap-2 border border-forest-900/20 bg-white px-5 text-sm font-extrabold text-forest-950 hover:border-forest-900">Xem dịch vụ CNC <ArrowRight size={17} aria-hidden="true" /></Link><Link href="/san-pham" className="pressable inline-flex min-h-12 items-center gap-2 text-sm font-extrabold text-wood-600">Xem vật liệu khác <ArrowRight size={17} aria-hidden="true" /></Link></div>
          </div>
        </section>
        <FaqList items={product.faq} />
        <ContactCTA title="Gửi quy cách để Tùng Phát kiểm tra vật liệu" description="Chuẩn bị loại vật liệu, độ dày, kích thước, số lượng và yêu cầu bề mặt hoặc CNC nếu có. Tùng Phát sẽ xác nhận theo dữ liệu thực tế trước khi báo giá." />
      </SiteShell>
    </>
  );
}
