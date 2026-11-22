import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { EditorialArticleCard } from "@/components/editorial/EditorialArticleCard";
import { SiteShell } from "@/components/site/SiteShell";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState";
import { getArticles } from "@/lib/content";
import { slugifyEditorialText } from "@/lib/editorial/headings";
import { breadcrumbSchema, createPageMetadata, webPageSchema } from "@/lib/seo";

export default async function ArticlesPage() {
  const articles = await getArticles();
  const categories: Array<{ label: string; id: string; articles: typeof articles }> = [];
  const byCategory = new Map<string, (typeof categories)[number]>();
  const usedIds = new Set<string>();
  for (const article of articles) {
    let group = byCategory.get(article.category);
    if (!group) {
      const baseId = `chu-de-${slugifyEditorialText(article.category)}`;
      let id = baseId;
      let suffix = 2;
      while (usedIds.has(id)) id = `${baseId}-${suffix++}`;
      usedIds.add(id);
      group = { label: article.category, id, articles: [] };
      byCategory.set(article.category, group);
      categories.push(group);
    }
    group.articles.push(article);
  }

  return (
    <>
      <JsonLd data={[webPageSchema({ path: "/bai-viet", name: "Kiến thức vật liệu và CNC", description: "Các bài viết ngắn về cách chọn vật liệu gỗ và chuẩn bị yêu cầu gia công CNC.", type: "CollectionPage" }), breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Bài viết", path: "/bai-viet" }])]} />
      <SiteShell>
        <header className="editorial-listing-header border-b border-forest-900/10 bg-white">
          <div className="container-shell">
            <Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "Bài viết" }]} compact ariaLabel="Đường dẫn" />
            <h1 className="editorial-listing-header__title">Kiến thức vật liệu và CNC</h1>
            <p className="editorial-listing-header__intro">Đọc nhanh cách nhận biết gỗ ghép, chọn MDF theo môi trường và chuẩn bị thông tin trước khi gửi file cho xưởng.</p>
          </div>
        </header>
        <section className="editorial-listing-main" aria-label="Bài viết theo chủ đề">
          <div className="container-shell">
            {articles.length ? <>
              <nav className="editorial-category-nav" aria-label="Chủ đề bài viết">
                <h2>Chủ đề bài viết</h2>
                <ul>{categories.map((category) => <li key={category.label}><a href={`#${category.id}`}>{category.label}</a></li>)}</ul>
              </nav>
              {categories.map((category) => <section key={category.label} id={category.id} className="editorial-category-section" aria-labelledby={`heading-${category.id}`}>
                <h2 id={`heading-${category.id}`}>{category.label}</h2>
                <div className="editorial-card-list">{category.articles.map((article) => <EditorialArticleCard key={article.slug} article={article} />)}</div>
              </section>)}
            </> : <div className="py-12"><EmptyState title="Chưa có bài viết để xem" description="Bạn có thể xem danh mục vật liệu hoặc gửi câu hỏi về mã, quy cách và file cần làm để được trao đổi trực tiếp." action={<Link href="/san-pham" className="pressable inline-flex min-h-12 items-center gap-2 bg-forest-900 px-5 text-sm font-extrabold text-white">Xem danh mục vật liệu <ArrowRight size={17} aria-hidden="true" /></Link>} /></div>}
          </div>
        </section>
      </SiteShell>
    </>
  );
}

export async function generateMetadata() {
  const articles = await getArticles();
  return createPageMetadata({ title: "Kiến thức vật liệu gỗ và gia công CNC", description: "Gợi ý chọn gỗ ghép, MDF thường hay chống ẩm và chuẩn bị thông tin khi gửi yêu cầu cắt CNC.", path: "/bai-viet", noIndex: articles.length === 0, followWhenNoIndex: true });
}
