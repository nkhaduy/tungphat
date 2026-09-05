import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, MessageCircle } from "lucide-react";
import { BrandPlaceholder } from "@/components/BrandPlaceholder";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Brand } from "@/lib/brands";
import { getSupplierSearchIndex } from "@/lib/catalog/suppliers/search-index";
import { humanizeCatalogLabel } from "@/lib/catalog/ui";
import { ZALO_URL } from "@/lib/seo";

const materialLinks = [
  ["Ván MDF", "/van-mdf", "Cốt ván, độ dày và bề mặt cần được xác nhận theo mã hàng."],
  ["MDF chống ẩm", "/mdf-chong-am", "Tham khảo cách chọn cốt ván cho điều kiện có độ ẩm cao hơn môi trường khô."],
  ["Ván gỗ công nghiệp", "/van-go-cong-nghiep", "So sánh nhóm MDF, MFC, Plywood và các bề mặt liên quan."],
  ["Gia công CNC", "/gia-cong-cnc", "Gửi file, vật liệu và quy cách để kiểm tra khả năng gia công."],
] as const;

export function BrandPage({ brand }: { brand: Brand }) {
  const supplierEntries = getSupplierSearchIndex().records.filter(
    (entry) => entry.supplierId === brand.slug,
  );
  const indexableEntries = supplierEntries.filter((entry) => entry.indexable);
  const materialCategories = [...new Set(indexableEntries.map((entry) => entry.category).filter((value): value is string => Boolean(value)))].map((slug) => ({
    slug,
    label: humanizeCatalogLabel(slug),
  }));
  const hasCatalogueData = supplierEntries.length > 0;
  const catalogueHref = `/catalogue/${brand.slug}`;

  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Thương hiệu", href: "/san-pham#thuong-hieu" }, { label: brand.name }]}
        eyebrow="Vật liệu theo thương hiệu"
        title={brand.name}
        description={`${brand.description} Nếu cần hỏi mã, bề mặt hoặc nguồn hàng, gửi thông tin qua Zalo để Tùng Phát tư vấn theo từng dòng.`}
        image={brand.logo ? { src: brand.logo, alt: `Logo ${brand.name}`, fit: "contain" } : undefined}
        actions={
          <>
            <a href={ZALO_URL} target="_blank" rel="noopener noreferrer" className="pressable inline-flex min-h-14 items-center justify-center gap-2 bg-wood-600 px-6 text-sm font-extrabold text-white hover:bg-wood-700"><MessageCircle size={18} aria-hidden="true" />Gửi mã màu qua Zalo</a>
            {hasCatalogueData ? <Link href={catalogueHref} className="pressable inline-flex min-h-14 items-center justify-center gap-2 border border-forest-900/20 bg-white px-6 text-sm font-extrabold text-forest-950"><BookOpen size={18} aria-hidden="true" />Mở bảng mã</Link> : null}
          </>
        }
      />

      <section className="section-space bg-white">
        <div className="container-shell">
          <SectionHeader eyebrow="Hướng tham khảo" title="Các nhóm vật liệu Tùng Phát đang giới thiệu" description="Các trang dưới đây cung cấp thông tin nền về vật liệu. Để kiểm tra đúng mã của thương hiệu, hãy gửi ảnh catalogue, mã màu hoặc yêu cầu bề mặt qua Zalo." />
          <div className="mt-9 grid gap-5 md:grid-cols-2">
            {materialLinks.map(([title, href, description]) => <Link key={title} href={href} className="pressable group border border-forest-900/10 bg-[#f7f8f5] p-6 hover:border-wood-500/40 hover:bg-white hover:shadow-card"><h2 className="text-xl font-extrabold text-forest-950">{title}</h2><p className="mt-3 text-sm leading-7 text-slate-700">{description}</p><span className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-wood-600">Xem thông tin vật liệu <ArrowRight size={17} aria-hidden="true" /></span></Link>)}
          </div>
        </div>
      </section>

      <section id="catalogue" className="section-space scroll-mt-32 bg-[#f7f8f5]">
        <div className="container-shell">
          <SectionHeader eyebrow="Catalogue liên quan" title={`Bảng mã ${brand.name}`} description="Số liệu dưới đây lấy từ catalogue đã được nhập vào chỉ mục tra cứu của Tùng Phát; không phải cam kết tồn kho hay quan hệ phân phối." />
          {hasCatalogueData ? (
            <div className="mt-9 grid gap-6 lg:grid-cols-[.72fr_1.28fr]">
              <div className="border border-forest-900/10 bg-white p-7 shadow-sm">
                <p className="text-xs font-extrabold uppercase tracking-[.15em] text-wood-600">Dữ liệu catalogue</p>
                <p className="mt-4 text-4xl font-extrabold tabular-nums text-forest-950">{indexableEntries.length}</p>
                <p className="mt-1 text-sm text-slate-600">mã có trang tra cứu công khai</p>
                <Link href={catalogueHref} prefetch={false} className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 bg-forest-900 px-5 text-sm font-extrabold text-white hover:bg-forest-800">Mở bảng mã {brand.name} <ArrowRight size={17} aria-hidden="true" /></Link>
              </div>
              <div className="border border-forest-900/10 bg-white p-7 shadow-sm">
                <h3 className="text-xl font-extrabold text-forest-950">Nhóm mã đang có</h3>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {materialCategories.map((category) => <Link key={category.slug} href={`${catalogueHref}/${category.slug}`} prefetch={false} className="flex min-h-14 items-center justify-between gap-3 border border-forest-900/10 px-4 text-sm font-extrabold text-forest-950 hover:border-wood-500/50 hover:text-wood-600">{category.label}<ArrowRight size={16} aria-hidden="true" /></Link>)}
                </div>
                <p className="mt-6 text-sm leading-6 text-slate-600">Mã, hình ảnh, quy cách và tồn kho có thể cần kiểm tra lại theo từng dòng hàng. Gửi mã hoặc ảnh mẫu nếu bạn đã có yêu cầu cụ thể.</p>
              </div>
            </div>
          ) : brand.catalogues.length ? (
            <div className="mt-9 grid gap-5 md:grid-cols-2">
              {brand.catalogues.map((catalogue) => <article key={catalogue.name} className="overflow-hidden border border-forest-900/10 bg-white shadow-sm">{catalogue.thumbnail ? <div className="relative aspect-[16/9]"><Image src={catalogue.thumbnail} alt={catalogue.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" /></div> : <BrandPlaceholder label={catalogue.name} className="aspect-[16/9]" />}<div className="p-6"><h3 className="text-xl font-extrabold text-forest-950">{catalogue.name}</h3><p className="mt-3 text-sm leading-7 text-slate-700">{catalogue.description}</p>{catalogue.pdfUrl ? <a href={catalogue.pdfUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-12 items-center gap-2 bg-forest-900 px-5 text-sm font-extrabold text-white">Xem catalogue <ArrowRight size={17} aria-hidden="true" /></a> : null}</div></article>)}
            </div>
          ) : (
            <EmptyState title="Catalogue đang được bổ sung" description="Gửi tên thương hiệu, mã màu hoặc nhóm bề mặt qua Zalo để hỏi thông tin phù hợp." action={<a href={ZALO_URL} target="_blank" rel="noopener noreferrer" className="pressable inline-flex min-h-12 items-center gap-2 bg-wood-600 px-5 text-sm font-extrabold text-white hover:bg-wood-700"><MessageCircle size={17} aria-hidden="true" />Gửi mã qua Zalo</a>} />
          )}
        </div>
      </section>
    </>
  );
}
