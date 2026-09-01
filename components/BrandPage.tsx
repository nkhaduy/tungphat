import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, MessageCircle } from "lucide-react";
import { BrandPlaceholder } from "@/components/BrandPlaceholder";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Brand } from "@/lib/brands";
import { ZALO_URL } from "@/lib/seo";

const materialLinks = [["Ván MDF", "/van-mdf", "Cốt ván, độ dày và bề mặt cần được xác nhận theo mã hàng."], ["MDF chống ẩm", "/mdf-chong-am", "Tham khảo cách chọn cốt ván cho điều kiện có độ ẩm cao hơn môi trường khô."], ["Ván gỗ công nghiệp", "/van-go-cong-nghiep", "So sánh nhóm MDF, MFC, plywood và các bề mặt liên quan."], ["Gia công CNC", "/gia-cong-cnc", "Gửi file, vật liệu và quy cách để kiểm tra khả năng gia công."]] as const;

export function BrandPage({ brand }: { brand: Brand }) {
  return (
    <>
      <PageHero breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Thương hiệu", href: "/san-pham#thuong-hieu" }, { label: brand.name }]} eyebrow="Vật liệu theo thương hiệu" title={brand.name} description={`${brand.description} Nếu cần hỏi mã, bề mặt hoặc nguồn hàng, gửi thông tin qua Zalo để Tùng Phát tư vấn theo từng dòng.`} image={brand.logo ? { src: brand.logo, alt: `Logo ${brand.name}`, fit: "contain" } : undefined} actions={<><a href={ZALO_URL} target="_blank" rel="noopener noreferrer" className="pressable inline-flex min-h-14 items-center justify-center gap-2 bg-wood-600 px-6 text-sm font-extrabold text-white hover:bg-wood-700"><MessageCircle size={18} aria-hidden="true" />Gửi mã màu qua Zalo</a>{brand.slug !== "kes" ? <Link href={`/catalogue/${brand.slug}`} className="pressable inline-flex min-h-14 items-center justify-center gap-2 border border-forest-900/20 bg-white px-6 text-sm font-extrabold text-forest-950"><BookOpen size={18} aria-hidden="true" />Xem catalogue</Link> : null}</>} />

      <section className="section-space bg-white">
        <div className="container-shell"><SectionHeader eyebrow="Hướng tham khảo" title="Các nhóm vật liệu Tùng Phát đang giới thiệu" description="Các trang dưới đây cung cấp thông tin nền về vật liệu. Để kiểm tra đúng mã của thương hiệu, hãy gửi ảnh catalogue, mã màu hoặc yêu cầu bề mặt qua Zalo." /><div className="mt-9 grid gap-5 md:grid-cols-2">{materialLinks.map(([title, href, description]) => <Link key={title} href={href} className="pressable group border border-forest-900/10 bg-[#f7f8f5] p-6 hover:border-wood-500/40 hover:bg-white hover:shadow-card"><h2 className="text-xl font-extrabold text-forest-950">{title}</h2><p className="mt-3 text-sm leading-7 text-slate-700">{description}</p><span className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-wood-600">Xem thông tin vật liệu <ArrowRight size={17} aria-hidden="true" /></span></Link>)}</div></div>
      </section>

      <section id="catalogue" className="section-space scroll-mt-32 bg-[#f7f8f5]">
        <div className="container-shell"><SectionHeader eyebrow="Catalogue liên quan" title={`Catalogue ${brand.name}`} description="Xem các file catalogue đang có và mở trực tiếp từ trang này." />{brand.catalogues.length ? <div className="mt-9 grid gap-5 md:grid-cols-2">{brand.catalogues.map((catalogue) => <article key={catalogue.name} className="overflow-hidden border border-forest-900/10 bg-white shadow-sm">{catalogue.thumbnail ? <div className="relative aspect-[16/9]"><Image src={catalogue.thumbnail} alt={catalogue.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" /></div> : <BrandPlaceholder label={catalogue.name} className="aspect-[16/9]" />}<div className="p-6"><h3 className="text-xl font-extrabold text-forest-950">{catalogue.name}</h3><p className="mt-3 text-sm leading-7 text-slate-700">{catalogue.description}</p>{catalogue.pdfUrl ? <a href={catalogue.pdfUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-12 items-center gap-2 bg-forest-900 px-5 text-sm font-extrabold text-white">Xem catalogue <ArrowRight size={17} aria-hidden="true" /></a> : null}</div></article>)}</div> : <EmptyState title="Chưa có catalogue phù hợp trên trang" description="Gửi tên thương hiệu, mã màu hoặc nhóm bề mặt qua Zalo để hỏi file phù hợp." action={<a href={ZALO_URL} target="_blank" rel="noopener noreferrer" className="pressable inline-flex min-h-12 items-center gap-2 bg-wood-600 px-5 text-sm font-extrabold text-white hover:bg-wood-700"><MessageCircle size={17} aria-hidden="true" />Yêu cầu catalogue</a>} />}</div>
      </section>

      <section className="section-space bg-white">
        <div className="container-shell"><SectionHeader eyebrow="Mã sản phẩm" title={`Sản phẩm ${brand.name}`} description="Nếu đã có mã hàng, gửi tên thương hiệu, mã màu, loại vật liệu, độ dày và số lượng để Tùng Phát tìm đúng nhóm." />{brand.products.length ? <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{brand.products.map((product) => <article key={`${product.code}-${product.name}`} className="border border-forest-900/10 bg-white p-5 shadow-sm">{product.image ? <div className="relative aspect-square"><Image src={product.image} alt={product.name} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover" /></div> : <BrandPlaceholder label={product.name} className="aspect-square" />}<h3 className="mt-5 font-extrabold text-forest-950">{product.name}</h3><p className="mt-2 text-sm leading-6 text-slate-700">{product.description}</p></article>)}</div> : <EmptyState title="Chưa có mã sản phẩm trên trang" description="Gửi ảnh catalogue, mã màu, loại vật liệu, độ dày và số lượng để Tùng Phát tìm đúng nhóm hàng bạn cần." action={<a href={ZALO_URL} target="_blank" rel="noopener noreferrer" className="pressable inline-flex min-h-12 items-center gap-2 bg-wood-600 px-5 text-sm font-extrabold text-white hover:bg-wood-700"><MessageCircle size={17} aria-hidden="true" />Gửi mã qua Zalo</a>} />}</div>
      </section>
    </>
  );
}
