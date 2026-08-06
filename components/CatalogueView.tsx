import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Download, MessageCircle } from "lucide-react";
import { BrandPlaceholder } from "@/components/BrandPlaceholder";
import { ContactCTA } from "@/components/ui/ContactCTA";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Brand } from "@/lib/brands";
import { ZALO_URL } from "@/lib/seo";

export function CatalogueView({ brand }: { brand: Brand }) {
  const catalogues = brand.catalogues.filter((catalogue) => catalogue.pdfUrl.trim().length > 0);

  return (
    <>
      <PageHero breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Catalogue", href: "/san-pham#catalogue" }, { label: brand.name }]} eyebrow="Bộ mẫu vật liệu" title={`Catalogue ${brand.name}`} description={`Trang catalogue ${brand.name} chỉ hiển thị file đã được đưa vào dữ liệu website. Khách hàng có thể gửi mã màu hoặc ảnh bề mặt để Tùng Phát kiểm tra catalogue và tình trạng cung cấp thực tế.`} image={brand.logo ? { src: brand.logo, alt: `Logo ${brand.name}`, fit: "contain" } : undefined} actions={<><a href={ZALO_URL} target="_blank" rel="noopener noreferrer" className="pressable inline-flex min-h-14 items-center justify-center gap-2 bg-wood-500 px-6 text-sm font-extrabold text-white"><MessageCircle size={18} aria-hidden="true" />Yêu cầu catalogue</a><Link href={`/san-pham/${brand.slug}`} className="pressable inline-flex min-h-14 items-center justify-center gap-2 border border-forest-900/20 bg-white px-6 text-sm font-extrabold text-forest-950">Xem trang thương hiệu <ArrowRight size={17} aria-hidden="true" /></Link></>} />
      <section className="section-space bg-white">
        <div className="container-shell"><SectionHeader eyebrow="File đang có" title={`Danh sách catalogue ${brand.name}`} description="Không nhúng PDF trực tiếp để tránh tải nặng. Nút xem và tải chỉ xuất hiện khi dữ liệu có URL file đang hoạt động." />{catalogues.length ? <div className="mt-9 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{catalogues.map((catalogue) => <article key={catalogue.name} className="overflow-hidden border border-forest-900/10 bg-white shadow-card">{catalogue.thumbnail ? <div className="relative aspect-[16/10]"><Image src={catalogue.thumbnail} alt={catalogue.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /></div> : <BrandPlaceholder label={catalogue.name} className="aspect-[16/10]" />}<div className="p-6"><h2 className="text-lg font-extrabold text-forest-950">{catalogue.name}</h2><p className="mt-3 text-sm leading-7 text-slate-700">{catalogue.description}</p><div className="mt-5 flex flex-wrap gap-3"><a href={catalogue.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 bg-forest-900 px-5 text-sm font-extrabold text-white">Xem file <ArrowRight size={16} aria-hidden="true" /></a><a href={catalogue.pdfUrl} download className="inline-flex min-h-12 items-center gap-2 border border-forest-900/20 px-5 text-sm font-extrabold text-forest-950"><Download size={16} aria-hidden="true" />Tải PDF</a></div></div></article>)}</div> : <EmptyState title="Chưa có file catalogue được publish" description="Không có URL PDF đã xác minh trong dữ liệu hiện tại. Tùng Phát không tạo liên kết tải giả; vui lòng gửi thương hiệu, mã màu hoặc loại bề mặt để kiểm tra file phù hợp." action={<a href={ZALO_URL} target="_blank" rel="noopener noreferrer" className="pressable inline-flex min-h-12 items-center gap-2 bg-wood-500 px-5 text-sm font-extrabold text-white"><MessageCircle size={17} aria-hidden="true" />Nhận catalogue qua Zalo</a>} />}</div>
      </section>
      <ContactCTA eyebrow="Đối chiếu mã màu" title="Gửi mã hoặc ảnh bề mặt cần tìm" description="Gửi tên thương hiệu, mã màu, nhóm vật liệu và số lượng dự kiến. Tùng Phát sẽ kiểm tra catalogue và nguồn hàng theo dữ liệu thực tế." zaloLabel="Gửi mã qua Zalo" />
    </>
  );
}
