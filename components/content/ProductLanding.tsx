import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, MessageCircle, Phone } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { TrackedLink } from "@/components/TrackedLink";
import { ViewTracker } from "@/components/ViewTracker";
import { FaqList } from "@/components/content/FaqList";
import { MarkdownContent } from "@/components/content/MarkdownContent";
import type { ContentEntry } from "@/lib/content";
import type { ProductFrontmatter } from "@/lib/content-schema";
import { PHONE_DISPLAY, PHONE_HREF, SITE_URL, ZALO_URL, breadcrumbSchema } from "@/lib/seo";

export function ProductLanding({ product }: { product: ContentEntry<ProductFrontmatter> }) {
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${SITE_URL}/${product.slug}#product`,
    name: product.title,
    description: product.excerpt,
    image: [`${SITE_URL}${product.featuredImage}`],
    category: product.category,
    material: product.materialType,
    url: `${SITE_URL}/${product.slug}`,
    brand: product.supplier ? { "@type": "Brand", name: product.supplier } : undefined
  };

  const specGroups = [
    ["Kích thước", product.dimensions],
    ["Độ dày", product.thicknesses],
    ["Bề mặt", product.surfaces],
    ["Tiêu chuẩn", product.standards]
  ] as const;

  return (
    <>
      <JsonLd data={[breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Sản phẩm", path: "/san-pham" }, { name: product.title, path: `/${product.slug}` }]), productSchema]} />
      <Header />
      <main className="bg-white pt-[72px]">
        <ViewTracker event="view_product" contentType={product.slug} />
        <section className="technical-grid bg-forest-950 py-14 text-white lg:py-20">
          <div className="container-shell grid items-center gap-10 lg:grid-cols-[1fr_.82fr]">
            <div>
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-white/70">
                <Link href="/" className="min-h-11 content-center hover:text-white">Trang chủ</Link><span aria-hidden="true">/</span>
                <Link href="/san-pham" className="min-h-11 content-center hover:text-white">Sản phẩm</Link><span aria-hidden="true">/</span>
                <span aria-current="page" className="text-white">{product.title}</span>
              </nav>
              <p className="mt-8 text-xs font-extrabold uppercase tracking-[.18em] text-orange-300">{product.category}</p>
              <h1 className="mt-4 text-balance text-4xl font-extrabold leading-tight sm:text-5xl">{product.title}</h1>
              <p className="mt-6 max-w-3xl text-pretty leading-8 text-white/80">{product.excerpt}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <TrackedLink href="/bao-gia" eventName="request_quote" eventProperties={{ location: `${product.slug}_hero` }} className="inline-flex min-h-14 items-center justify-center gap-2 bg-wood-700 px-7 text-sm font-bold text-white">{product.quoteCta}<ArrowRight size={18} /></TrackedLink>
                <TrackedLink href={PHONE_HREF} eventName="click_phone" eventProperties={{ location: `${product.slug}_hero` }} className="inline-flex min-h-14 items-center justify-center gap-2 border border-white/35 px-7 text-sm font-bold text-white"><Phone size={18} />Gọi {PHONE_DISPLAY}</TrackedLink>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image src={product.featuredImage} alt={product.featuredImageAlt} fill sizes="(max-width: 1024px) 100vw, 45vw" priority className="object-cover" />
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="container-shell grid gap-12 lg:grid-cols-[.88fr_1.12fr]">
            <div>
              <p className="eyebrow">Thông tin vật liệu</p>
              <h2 className="mt-4 text-3xl font-extrabold text-forest-950">Quy cách cần xác nhận trước khi báo giá</h2>
              <p className="mt-5 leading-7 text-slate-600">Tùng Phát không niêm yết giá hoặc tồn kho khi chưa kiểm tra dữ liệu thực tế. Hãy gửi loại vật liệu, quy cách và số lượng để nhận thông tin phù hợp tại thời điểm yêu cầu.</p>
            </div>
            <div className="grid gap-px bg-forest-900/15 sm:grid-cols-2">
              {specGroups.map(([label, values]) => (
                <div key={label} className="bg-[#f6f7f5] p-6">
                  <h3 className="font-extrabold text-forest-950">{label}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{values.length ? values.join("; ") : "Liên hệ để kiểm tra quy cách hiện có."}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f6f7f5] py-16 lg:py-24">
          <div className="container-shell grid gap-5 lg:grid-cols-3">
            {[["Ứng dụng", product.applications], ["Điểm phù hợp", product.advantages], ["Lưu ý khi chọn", product.limitations]].map(([title, items]) => (
              <article key={title as string} className="bg-white p-7">
                <h2 className="text-xl font-extrabold text-forest-950">{title as string}</h2>
                <ul className="mt-5 space-y-3">
                  {(items as string[]).map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600"><Check size={17} className="mt-1 shrink-0 text-wood-600" />{item}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="container-shell grid gap-12 lg:grid-cols-[1fr_.42fr]">
            <MarkdownContent>{product.body}</MarkdownContent>
            <aside className="h-fit bg-forest-950 p-7 text-white lg:sticky lg:top-28">
              <h2 className="text-xl font-extrabold">Quy trình đặt hàng</h2>
              <ol className="mt-5 space-y-4 text-sm leading-6 text-white/78">
                {product.orderingSteps.map((step, index) => <li key={step}><strong className="mr-2 text-orange-300">{String(index + 1).padStart(2, "0")}</strong>{step}</li>)}
              </ol>
              <TrackedLink href="/bao-gia" eventName="request_quote" eventProperties={{ location: `${product.slug}_specs` }} className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-wood-700 px-5 text-sm font-bold"><MessageCircle size={17} />Yêu cầu báo giá</TrackedLink>
              <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: `${product.slug}_specs` }} className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 border border-white/30 px-5 text-sm font-bold">Nhắn Zalo</TrackedLink>
            </aside>
          </div>
        </section>
        <FaqList items={product.faq} />
      </main>
      <Footer />
    </>
  );
}
