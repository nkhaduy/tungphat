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
      <JsonLd data={[webPageSchema({ path: "/bai-viet", name: "Kiến thức vật liệu và CNC", description: "Thư viện nội dung đã được publish về vật liệu gỗ và gia công CNC.", type: "CollectionPage" }), breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Bài viết", path: "/bai-viet" }])]} />
      <SiteShell>
        <PageHero compact breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Bài viết" }]} eyebrow="Kiến thức đã kiểm tra" title="Kiến thức vật liệu và CNC" description="Chỉ nội dung đã được người phụ trách kiểm tra và publish mới xuất hiện. Bản nháp trong CMS không được đưa lên website hoặc sitemap." />
        <section className="section-space min-h-[42vh] bg-[#f7f8f5]"><div className="container-shell"><SectionHeader eyebrow="Thư viện nội dung" title="Bài viết từ Tùng Phát" description="Nội dung tập trung vào cách nhận biết, lựa chọn vật liệu và chuẩn bị thông tin gia công; không thay thế bước xác nhận mã hàng thực tế." />{articles.length ? <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{articles.map((article) => <article key={article.slug} className="overflow-hidden border border-forest-900/10 bg-white shadow-sm"><Link href={`/bai-viet/${article.slug}`} className="relative block aspect-[16/10]"><Image src={resolveMediaUrl(article.featuredImage)} alt={article.featuredImageAlt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /></Link><div className="p-6"><p className="text-xs font-extrabold uppercase tracking-wider text-wood-600">{article.category}</p><h2 className="mt-3 text-xl font-extrabold text-forest-950"><Link href={`/bai-viet/${article.slug}`}>{article.title}</Link></h2><p className="mt-3 text-sm leading-7 text-slate-700">{article.excerpt}</p><Link href={`/bai-viet/${article.slug}`} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-wood-600">Đọc bài viết <ArrowRight size={16} aria-hidden="true" /></Link></div></article>)}</div> : <div className="mt-9"><EmptyState title="Nội dung đang được kiểm tra" description="Các bản nháp hiện chưa được publish. Trong lúc chờ nội dung mới, bạn có thể xem trang vật liệu hoặc gửi câu hỏi trực tiếp để Tùng Phát kiểm tra theo nhu cầu thực tế." action={<Link href="/san-pham" className="pressable inline-flex min-h-12 items-center gap-2 bg-forest-900 px-5 text-sm font-extrabold text-white">Xem danh mục vật liệu <ArrowRight size={17} aria-hidden="true" /></Link>} /></div>}</div></section>
      </SiteShell>
    </>
  );
}

export async function generateMetadata() {
  const articles = await getArticles();
  return createPageMetadata({ title: "Kiến thức vật liệu gỗ và gia công CNC", description: "Bài viết đã được Tùng Phát kiểm tra về gỗ ghép, ván MDF, cách chọn vật liệu và chuẩn bị yêu cầu gia công CNC.", path: "/bai-viet", noIndex: articles.length === 0, followWhenNoIndex: true });
}
