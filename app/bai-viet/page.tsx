import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/site/SiteShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getArticles } from "@/lib/content";
import { resolveMediaUrl } from "@/lib/media";
import { breadcrumbSchema, createPageMetadata, webPageSchema } from "@/lib/seo";

export default async function ArticlesPage() {
  const articles = await getArticles();
  return (
    <>
      <JsonLd data={[webPageSchema({ path: "/bai-viet", name: "Kiến thức vật liệu và CNC", description: "Các bài viết ngắn về cách chọn vật liệu gỗ và chuẩn bị yêu cầu gia công CNC.", type: "CollectionPage" }), breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Bài viết", path: "/bai-viet" }])]} />
      <SiteShell>
        <PageHero compact breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Bài viết" }]} eyebrow="Kiến thức vật liệu & CNC" title="Kiến thức vật liệu và CNC" description="Đọc nhanh cách nhận biết gỗ ghép, chọn MDF theo môi trường và chuẩn bị thông tin trước khi gửi file cho xưởng." />
        <section className="section-space min-h-[42vh] bg-[#f7f8f5]"><div className="container-shell"><SectionHeader eyebrow="Đọc trước khi hỏi hàng" title="Chọn vật liệu, chuẩn bị việc" description="Mỗi bài tập trung vào một câu hỏi thường gặp: chọn cốt nào, nhìn tấm gỗ ghép ra sao hoặc cần gửi gì khi làm CNC." />{articles.length ? <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{articles.map((article) => <article key={article.slug} className="overflow-hidden border border-forest-900/10 bg-white shadow-sm"><Link href={`/bai-viet/${article.slug}`} className="relative block aspect-[16/10]"><Image src={resolveMediaUrl(article.featuredImage)} alt={article.featuredImageAlt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /></Link><div className="p-6"><p className="text-xs font-extrabold uppercase tracking-wider text-wood-600">{article.category}</p><h2 className="mt-3 text-xl font-extrabold text-forest-950"><Link href={`/bai-viet/${article.slug}`}>{article.title}</Link></h2><p className="mt-3 text-sm leading-7 text-slate-700">{article.excerpt}</p><Link href={`/bai-viet/${article.slug}`} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-wood-600">Đọc hướng dẫn <ArrowRight size={16} aria-hidden="true" /></Link></div></article>)}</div> : <div className="mt-9"><EmptyState title="Chưa có bài viết để xem" description="Bạn có thể xem danh mục vật liệu hoặc gửi câu hỏi về mã, quy cách và file cần làm để được trao đổi trực tiếp." action={<Link href="/san-pham" className="pressable inline-flex min-h-12 items-center gap-2 bg-forest-900 px-5 text-sm font-extrabold text-white">Xem danh mục vật liệu <ArrowRight size={17} aria-hidden="true" /></Link>} /></div>}</div></section>
      </SiteShell>
    </>
  );
}

export async function generateMetadata() {
  const articles = await getArticles();
  return createPageMetadata({ title: "Kiến thức vật liệu gỗ và gia công CNC", description: "Gợi ý chọn gỗ ghép, MDF thường hay chống ẩm và chuẩn bị thông tin khi gửi yêu cầu cắt CNC.", path: "/bai-viet", noIndex: articles.length === 0, followWhenNoIndex: true });
}
