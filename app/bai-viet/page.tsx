import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { getArticles } from "@/lib/content";
import { mediaUrl } from "@/lib/media";
import { breadcrumbSchema, createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Kiến thức vật liệu gỗ và gia công CNC",
  description: "Bài viết đã được Tùng Phát kiểm tra về gỗ ghép, ván MDF, cách chọn vật liệu và chuẩn bị yêu cầu gia công CNC.",
  path: "/bai-viet"
});

export default function ArticlesPage() {
  const articles = getArticles();
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Bài viết", path: "/bai-viet" }])} />
      <Header appearance="light" />
      <main className="min-h-[70vh] bg-[#f6f7f5] pt-[72px]">
        <section className="bg-forest-950 py-16 text-white lg:py-20"><div className="container-shell"><h1 className="text-balance text-4xl font-extrabold sm:text-5xl">Kiến thức vật liệu và CNC</h1><p className="mt-5 max-w-3xl leading-8 text-white/80">Chỉ hiển thị nội dung đã được người phụ trách kiểm tra và publish. Bản nháp trong CMS không xuất hiện trên website hoặc sitemap.</p></div></section>
        <section className="py-16 lg:py-24"><div className="container-shell">
          {articles.length === 0 ? <div className="border border-forest-900/10 bg-white p-8"><h2 className="text-xl font-extrabold text-forest-950">Nội dung đang được kiểm tra</h2><p className="mt-3 text-slate-600">Các bản nháp đầu tiên đã có trong CMS nhưng chưa được tự động publish.</p></div> : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{articles.map((article) => <article key={article.slug} className="overflow-hidden bg-white shadow-sm"><Link href={`/bai-viet/${article.slug}`} className="relative block aspect-[16/10]"><Image src={mediaUrl(article.featuredImage)} alt={article.featuredImageAlt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /></Link><div className="p-6"><p className="text-xs font-extrabold uppercase tracking-wider text-wood-700">{article.category}</p><h2 className="mt-3 text-xl font-extrabold text-forest-950"><Link href={`/bai-viet/${article.slug}`}>{article.title}</Link></h2><p className="mt-3 text-sm leading-6 text-slate-600">{article.excerpt}</p><Link href={`/bai-viet/${article.slug}`} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-forest-950">Đọc bài viết<ArrowRight size={16} /></Link></div></article>)}</div>
          )}
        </div></section>
      </main>
      <Footer />
    </>
  );
}
