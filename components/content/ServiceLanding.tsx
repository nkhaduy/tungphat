import Image from "next/image";
import Link from "next/link";
import { Check, MessageCircle, Phone } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { TrackedLink } from "@/components/TrackedLink";
import { ViewTracker } from "@/components/ViewTracker";
import { FaqList } from "@/components/content/FaqList";
import { MarkdownContent } from "@/components/content/MarkdownContent";
import type { ContentEntry } from "@/lib/content";
import type { ServicePageFrontmatter } from "@/lib/content-schema";
import { mediaUrl } from "@/lib/media";
import { PHONE_DISPLAY, PHONE_HREF, SITE_URL, ZALO_URL, breadcrumbSchema } from "@/lib/seo";

export function ServiceLanding({ page }: { page: ContentEntry<ServicePageFrontmatter> }) {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${SITE_URL}/${page.slug}#service`,
    name: page.title,
    description: page.excerpt,
    serviceType: "Gia công CNC ván gỗ",
    url: `${SITE_URL}/${page.slug}`,
    areaServed: { "@type": "City", name: "TP. Hồ Chí Minh" },
    provider: { "@id": `${SITE_URL}/#organization` }
  };

  return (
    <>
      <JsonLd data={[breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Gia công CNC", path: "/gia-cong-cnc" }, { name: page.title, path: `/${page.slug}` }]), serviceSchema]} />
      <Header appearance="light" />
      <main className="bg-white pt-[72px]">
        <ViewTracker event="view_cnc_service" contentType={page.slug} />
        <section className="technical-grid bg-forest-950 py-14 text-white lg:py-20">
          <div className="container-shell grid items-center gap-10 lg:grid-cols-[1fr_.82fr]">
            <div>
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-white/70">
                <Link href="/" className="min-h-11 content-center hover:text-white">Trang chủ</Link><span aria-hidden="true">/</span>
                <Link href="/gia-cong-cnc" className="min-h-11 content-center hover:text-white">Gia công CNC</Link><span aria-hidden="true">/</span>
                <span aria-current="page" className="text-white">{page.title}</span>
              </nav>
              <p className="mt-8 text-xs font-extrabold uppercase tracking-[.18em] text-orange-300">{page.eyebrow}</p>
              <h1 className="mt-4 text-balance text-4xl font-extrabold leading-tight sm:text-5xl">{page.title}</h1>
              <p className="mt-6 max-w-3xl text-pretty leading-8 text-white/80">{page.excerpt}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: `${page.slug}_hero` }} className="inline-flex min-h-14 items-center justify-center gap-2 bg-wood-500 px-7 text-sm font-bold text-white"><MessageCircle size={18} />{page.quoteCta}</TrackedLink>
                <TrackedLink href={PHONE_HREF} eventName="click_phone" eventProperties={{ location: `${page.slug}_hero` }} className="inline-flex min-h-14 items-center justify-center gap-2 border border-white/35 px-7 text-sm font-bold text-white"><Phone size={18} />Gọi {PHONE_DISPLAY}</TrackedLink>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image src={mediaUrl(page.featuredImage)} alt={page.featuredImageAlt} fill sizes="(max-width: 1024px) 100vw, 45vw" priority className="object-cover" />
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="container-shell grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="eyebrow">Khả năng tiếp nhận</p>
              <h2 className="mt-4 text-3xl font-extrabold text-forest-950">Vật liệu và hạng mục cần kiểm tra</h2>
              <p className="mt-5 leading-7 text-slate-600">Mỗi vật liệu và file có yêu cầu khác nhau. Danh sách dưới đây là phạm vi trao đổi ban đầu, không thay thế bước xác nhận kỹ thuật.</p>
            </div>
            <div className="grid gap-px bg-forest-900/15 sm:grid-cols-2">
              {[...page.materialTypes, ...page.workItems].map((item) => <div key={item} className="flex min-h-24 items-start gap-3 bg-[#f6f7f5] p-6 text-sm font-bold leading-6 text-forest-950"><Check size={17} className="mt-1 shrink-0 text-wood-600" />{item}</div>)}
            </div>
          </div>
        </section>

        <section className="bg-[#f6f7f5] py-16 lg:py-24">
          <div className="container-shell">
            <p className="eyebrow">Quy trình</p>
            <h2 className="mt-4 text-3xl font-extrabold text-forest-950">Từ file kỹ thuật đến gia công</h2>
            <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {page.process.map((item, index) => <article key={item} className="bg-white p-6"><span className="text-sm font-extrabold text-wood-700">{String(index + 1).padStart(2, "0")}</span><p className="mt-4 text-sm leading-7 text-slate-600">{item}</p></article>)}
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="container-shell grid gap-12 lg:grid-cols-[1fr_.48fr]">
            <MarkdownContent>{page.body}</MarkdownContent>
            <aside className="h-fit bg-forest-950 p-7 text-white">
              <h2 className="text-xl font-extrabold">Checklist file</h2>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-white/78">{page.fileGuidance.map((item) => <li key={item} className="flex gap-3"><Check size={17} className="mt-1 shrink-0 text-orange-300" />{item}</li>)}</ul>
              <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: `${page.slug}_checklist` }} className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-wood-500 px-5 text-sm font-bold"><MessageCircle size={17} />Trao đổi qua Zalo</TrackedLink>
              <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: `${page.slug}_checklist` }} className="mt-3 inline-flex min-h-12 w-full items-center justify-center border border-white/30 px-5 text-sm font-bold">Trao đổi file qua Zalo</TrackedLink>
            </aside>
          </div>
        </section>
        <FaqList items={page.faq} />
      </main>
      <Footer />
    </>
  );
}
