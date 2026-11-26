import Link from "next/link";
import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import { ContentEngagementTracker } from "@/components/analytics/ContentEngagementTracker";
import { MarkdownContent } from "@/components/content/MarkdownContent";
import { JsonLd } from "@/components/JsonLd";
import { MaterialCard } from "@/components/products/MaterialCard";
import { MaterialPhotoCredit } from "@/components/products/MaterialPhotoCredit";
import { MaterialGallery } from "@/components/products/MaterialGallery";
import { SiteShell } from "@/components/site/SiteShell";
import { TrackedLink } from "@/components/TrackedLink";
import { ContentHero } from "@/components/content/ContentHero";
import type { ContentEntry } from "@/lib/content";
import type { ProductFrontmatter } from "@/lib/content-schema";
import type { MaterialEditorial } from "@/lib/product-editorial";
import { buildProductLandingSchema } from "@/lib/content-jsonld";
import { allMaterialCards, homeProductCards } from "@/lib/product-taxonomy";
import { absoluteMediaUrl } from "@/lib/media";
import { splitEditorialImage } from "@/lib/cnc-article-diagram";
import { PHONE_DISPLAY, PHONE_HREF, ZALO_URL, SITE_URL, breadcrumbSchema, schemaPageId, webPageSchema } from "@/lib/seo";

const furtherReading: Record<string, readonly [string, string][]> = {
  "van-mdf": [["/van-hdf/", "Tìm hiểu riêng về ván HDF"]],
  "van-okal": [["/van-mfc/", "Tìm hiểu thêm về ván MFC"]],
  "van-plywood": [["/plywood-phu-melamine/", "Plywood phủ Melamine"]],
  "go-ghep-cao-su": [["/go-ghep-tram/", "Tìm hiểu gỗ ghép tràm"]],
  "melamine": [["/acrylic/", "Bề mặt Acrylic"], ["/pvc-film-pet/", "Màng PVC Film và PET"]],
};

export function MaterialLanding({ product, editorial }: { product: ContentEntry<ProductFrontmatter>; editorial: MaterialEditorial }) {
  const path = `/${product.slug}/`;
  const publishedReading = (furtherReading[product.slug] ?? []).filter(([href]) => allMaterialCards.some((card) => card.href === href));
  const related = editorial.related.flatMap((slug) => homeProductCards.filter((card) => card.href === `/${slug}/`));
  const acrylicBody = product.slug === "acrylic" ? splitEditorialImage(product.body, "## Lưu ý khi lựa chọn") : [];
  const productSchema = product.status === "guide" ? null : buildProductLandingSchema(product);
  const pageSchema = {
    ...webPageSchema({ path, name: product.title, description: product.excerpt, type: productSchema ? "WebPage" : "CollectionPage", primaryEntityId: productSchema ? schemaPageId(path, "product") : undefined }),
    ...(product.featuredImage ? { image: absoluteMediaUrl(product.featuredImage, SITE_URL) } : {}),
    about: { "@type": "Thing", name: product.materialType },
  };
  return <>
    <JsonLd data={[pageSchema, breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Sản phẩm", path: "/san-pham/" }, { name: product.title, path }]), ...(productSchema ? [productSchema] : [])]} />
    <SiteShell>
      <ContentEngagementTracker contentType="product" contentId={product.slug} contentTitle={product.title} contentCategory={product.category} />
      <ContentHero
        breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Sản phẩm", href: "/san-pham/" }, { label: product.title }]}
        title={product.title}
        image={product.featuredImage ? { src: product.featuredImage, alt: product.featuredImageAlt } : undefined}
        publishedAt={product.sourcePath.startsWith("payload://") ? product.publishedAt : undefined}
      />
      <section data-analytics-content className="section-space bg-white"><div className="container-shell grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-16">
        <div><p data-answer-block className="mb-8 max-w-[72ch] text-lg leading-8 text-slate-700">{editorial.intro}</p>{product.featuredImage ? <div className="mb-10 max-w-[42rem]"><MaterialGallery key={product.slug} slug={product.slug} /><MaterialPhotoCredit slug={product.slug} /></div> : null}{acrylicBody.length === 2 ? <>
          <MarkdownContent className="max-w-[72ch]">{acrylicBody[0]}</MarkdownContent>
          <figure className="my-10 max-w-[42rem]">
            {/* eslint-disable-next-line @next/next/no-img-element -- locally generated responsive WebP for static export */}
            <img src="/images/editorial/acrylic-kitchen-ai-1200.webp" srcSet="/images/editorial/acrylic-kitchen-ai-640.webp 640w, /images/editorial/acrylic-kitchen-ai-1200.webp 1200w" sizes="(max-width: 1023px) 100vw, 42rem" width={1200} height={800} loading="lazy" decoding="async" alt="Minh họa AI cánh tủ bếp bóng phản chiếu ánh sáng và dấu tay" className="h-auto w-full rounded-lg" />
            <figcaption className="mt-3 text-sm leading-6 text-slate-600">Hình minh họa do AI tạo để hình dung độ phản chiếu và dấu tay trên cánh tủ bóng; không phải ảnh sản phẩm hay công trình của Tùng Phát.</figcaption>
          </figure>
          <MarkdownContent className="max-w-[72ch]">{acrylicBody[1]}</MarkdownContent>
        </> : <MarkdownContent className="max-w-[72ch]">{product.body}</MarkdownContent>}{publishedReading.length ? <nav aria-label="Tìm hiểu thêm" className="mt-8 flex flex-wrap gap-x-6 gap-y-3">{publishedReading.map(([href, title]) => <Link key={href} href={href} className="text-sm font-bold text-forest-950 underline underline-offset-4">{title}</Link>)}</nav> : null}</div>
        <aside className="rounded-xl border border-forest-900/15 bg-[#f7f8f5] p-6 lg:sticky lg:top-28" aria-labelledby="material-consult-title"><h2 id="material-consult-title" className="text-xl font-bold text-forest-950">Tư vấn {product.title}</h2><p className="mt-4 text-sm leading-7 text-slate-700">Gửi hạng mục, quy cách và số lượng cần dùng. Nếu có mã màu, ảnh mẫu hoặc bản vẽ, gửi kèm để trao đổi đúng vật liệu.</p>
          <div className="mt-5 grid gap-2"><Link href="/bao-gia/" className="inline-flex min-h-12 items-center justify-center gap-2 bg-forest-900 px-5 text-sm font-bold text-white hover:bg-forest-800">Gửi yêu cầu báo giá <ArrowRight size={17} aria-hidden="true" /></Link><TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: `${product.slug}_detail` }} className="inline-flex min-h-12 items-center justify-center gap-2 border border-forest-900/25 px-5 text-sm font-bold text-forest-950 hover:bg-white"><MessageCircle size={17} aria-hidden="true" />Liên hệ tư vấn</TrackedLink></div>
          <TrackedLink href={PHONE_HREF} eventName="click_phone" eventProperties={{ location: `${product.slug}_aside` }} className="mt-5 flex min-h-12 items-center gap-2 text-sm font-bold text-forest-950"><Phone size={17} aria-hidden="true" />{PHONE_DISPLAY}</TrackedLink>
          {editorial.catalogue ? <Link href={editorial.catalogue} className="mt-3 flex min-h-12 items-center justify-between gap-2 border-t border-forest-900/15 pt-3 text-sm font-bold text-forest-950">Xem mã màu <ArrowRight size={17} aria-hidden="true" /></Link> : null}
          <Link href="/gia-cong-cnc/" className="mt-3 flex min-h-12 items-center justify-between gap-2 border-t border-forest-900/15 pt-3 text-sm font-bold text-forest-950">Cắt ván và gia công CNC <ArrowRight size={17} aria-hidden="true" /></Link>
        </aside>
      </div></section>
      <section className="border-t border-forest-900/10 bg-[#f7f8f5] py-12 lg:py-16" aria-labelledby="related-materials-title"><div className="container-shell"><div className="flex flex-wrap items-center justify-between gap-4"><h2 id="related-materials-title" className="text-2xl font-extrabold text-forest-950 sm:text-3xl">Vật liệu liên quan</h2><Link href="/san-pham/" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-forest-950">Xem danh mục <ArrowRight size={17} aria-hidden="true" /></Link></div><div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-3">{related.map((card) => <MaterialCard key={card.id} card={card} />)}</div></div></section>
    </SiteShell>
  </>;
}
