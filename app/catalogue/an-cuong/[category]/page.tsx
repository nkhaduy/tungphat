import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { AnCuongCatalogueSearch } from "@/components/catalog/AnCuongCatalogueSearch";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/site/SiteShell";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageContainer } from "@/components/ui/PageContainer";
import { buildSupplierZaloInquiryUrl } from "@/lib/catalog/inquiry";
import {
  anCuongCategoryContent,
  anCuongCuratedCategories,
  isAnCuongCuratedCategory,
} from "@/lib/catalog/an-cuong-categories";
import { getSupplierSearchIndex } from "@/lib/catalog/suppliers/search-index";
import { materialTaxonomy } from "@/lib/catalog/material-taxonomy";
import { absoluteUrl, breadcrumbSchema, createPageMetadata, ZALO_URL } from "@/lib/seo";

type RouteProps = { params: Promise<{ category: string }> };

const categoryMap = new Map<string, string>(materialTaxonomy.map((item) => [item.slug, item.label]));

export function generateStaticParams() {
  return anCuongCuratedCategories.map((category) => ({ category }));
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { category } = await params;
  const path = `/catalogue/an-cuong/${category}/`;
  if (!isAnCuongCuratedCategory(category)) {
    const label = categoryMap.get(category) ?? category;
    return createPageMetadata({
      title: `Catalogue An Cường ${label}`,
      description: "Trang nhóm này chưa có đủ nội dung riêng để lập chỉ mục.",
      path,
      noIndex: true,
      followWhenNoIndex: true,
    });
  }
  const content = anCuongCategoryContent[category];
  return createPageMetadata({
    title: content.title,
    description: content.description,
    path,
  });
}

export default async function AnCuongCategoryRoute({ params }: RouteProps) {
  const { category } = await params;
  if (!isAnCuongCuratedCategory(category)) notFound();
  const content = anCuongCategoryContent[category];
  const label = content.label;
  const entries = getSupplierSearchIndex().records.filter((record) => record.supplierId === "an-cuong" && record.material === category);
  const path = `/catalogue/an-cuong/${category}/`;
  const itemList = entries.slice(0, 24).map((entry, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Thing",
      name: entry.name,
      ...(entry.code ? { identifier: entry.code } : {}),
    },
  }));
  return (
    <SiteShell>
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "CollectionPage", name: content.title, description: content.description, url: absoluteUrl(path), mainEntity: { "@type": "ItemList", numberOfItems: entries.length, itemListElement: itemList } },
        breadcrumbSchema([
          { name: "Trang chủ", path: "/" },
          { name: "Catalogue", path: "/catalogue/" },
          { name: "An Cường", path: "/catalogue/an-cuong/" },
          { name: label, path },
        ]),
      ]} />
      <section className="border-b border-forest-900/10 bg-[#f7f8f5] py-8 sm:py-10 lg:py-12">
        <PageContainer>
          <Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "Catalogue", href: "/catalogue/" }, { label: "An Cường", href: "/catalogue/an-cuong/" }, { label }]} />
          <div className="mt-5 max-w-4xl">
            <p className="eyebrow">Nhóm vật liệu An Cường</p>
            <h1 className="mt-3 text-balance text-3xl font-extrabold tracking-[-.035em] text-forest-950 sm:text-4xl">Catalogue An Cường · {label}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700 sm:text-base">{content.intro}</p>
            <a
              href={buildSupplierZaloInquiryUrl(ZALO_URL, `An Cường - nhóm ${label}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="pressable mt-5 inline-flex min-h-12 items-center justify-center gap-2 bg-wood-500 px-5 text-sm font-extrabold text-white hover:bg-wood-600"
            >
              <MessageCircle size={17} aria-hidden="true" />
              Nhắn Zalo kiểm tra {label}
            </a>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <section className="border border-forest-900/10 bg-white p-5 sm:p-6">
              <h2 className="text-xl font-extrabold text-forest-950">Ứng dụng phù hợp</h2>
              <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-700">
                {content.applications.map((application) => <li key={application}>{application}</li>)}
              </ul>
            </section>
            <section className="border border-forest-900/10 bg-[#fff8ee] p-5 sm:p-6">
              <h2 className="text-xl font-extrabold text-forest-950">Cách chọn trước khi hỏi giá</h2>
              <p className="mt-4 text-sm leading-7 text-slate-700">{content.guidance}</p>
            </section>
          </div>
          <AnCuongCatalogueSearch entries={entries} />
        </PageContainer>
      </section>
    </SiteShell>
  );
}
