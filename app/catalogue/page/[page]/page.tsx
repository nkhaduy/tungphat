import Link from "next/link";
import { CatalogueMaterialCard } from "@/components/catalog/CatalogueMaterialCard";
import { PageContainer } from "@/components/ui/PageContainer";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SiteShell } from "@/components/site/SiteShell";
import { CATALOGUE_PAGE_SIZE, getCatalogueListingEntries } from "@/lib/catalog/listing";
import { formatCatalogCardTaxonomy, formatCatalogCardTitle } from "@/lib/catalog/ui";
import { createPageMetadata, ZALO_URL } from "@/lib/seo";
import { buildSupplierZaloInquiryUrl } from "@/lib/catalog/inquiry";

const pageSize = CATALOGUE_PAGE_SIZE;
const records = getCatalogueListingEntries();
const pageCount = Math.ceil(records.length / pageSize);
export const dynamicParams = false;
export function generateStaticParams() {
  return Array.from({ length: pageCount - 1 }, (_, index) => ({ page: String(index + 2) }));
}
export async function generateMetadata({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  return createPageMetadata({ title: `Mã màu vật liệu – trang ${page}`, description: `Tra cứu các mã màu vật liệu ${page} trong danh mục Tùng Phát.`, path: `/catalogue/page/${page}/` });
}

export default async function CataloguePage({ params }: { params: Promise<{ page: string }> }) {
  const page = Number((await params).page);
  const items = records.slice((page - 1) * pageSize, page * pageSize);
  return <SiteShell headerTone="dark"><main className="bg-white py-8 sm:py-10"><PageContainer>
    <Breadcrumbs compact items={[{ label: "Trang chủ", href: "/" }, { label: "Mã màu", href: "/catalogue/" }, { label: `Trang ${page}` }]} />
    <h1 className="mt-4 text-3xl font-extrabold text-forest-950">Mã màu vật liệu · trang {page}</h1>
    <p className="mt-2 text-sm text-slate-700">Các mã {((page - 1) * pageSize + 1).toLocaleString("vi-VN")}–{Math.min(page * pageSize, records.length).toLocaleString("vi-VN")} trong {records.length.toLocaleString("vi-VN")} mã màu.</p>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map((entry) => <CatalogueMaterialCard key={entry.id} deferImages href={entry.canonicalRoute} supplierId={entry.supplierId} supplierName={entry.supplierName} code={entry.code} title={formatCatalogCardTitle(entry)} taxonomy={formatCatalogCardTaxonomy(entry)} thumbnail={entry.thumbnail} showSupplierLogo={false} showSupplierName />)}</div>
    <div className="mt-8 flex flex-col gap-3 border-y border-slate-200 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-3xl text-slate-600">Danh sách lấy từ catalogue của các nhà cung cấp. Trang chi tiết từng mã hiển thị thông tin nguồn khi dữ liệu có sẵn.</p>
      <a href={buildSupplierZaloInquiryUrl(ZALO_URL, "Mã màu vật liệu")} target="_blank" rel="noopener noreferrer" className="min-h-11 shrink-0 font-semibold text-forest-900 underline underline-offset-4">Hỏi về mã màu qua Zalo</a>
    </div>
    <nav aria-label="Các trang mã màu" className="mt-8 flex justify-between border-t border-slate-200 pt-4 text-sm font-bold">
      {page > 2 ? <Link href={`/catalogue/page/${page - 1}/`}>Trang trước</Link> : <Link href="/catalogue/">Trang đầu</Link>}
      {page < pageCount ? <Link href={`/catalogue/page/${page + 1}/`}>Trang tiếp</Link> : <span>Đã hết mã màu</span>}
    </nav>
  </PageContainer></main></SiteShell>;
}
