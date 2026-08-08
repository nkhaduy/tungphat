import { MessageCircle } from "lucide-react";
import { SupplierColorCodeSearch } from "@/components/catalog/AnCuongCatalogueSearch";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ContactCTA } from "@/components/ui/ContactCTA";
import { PageContainer } from "@/components/ui/PageContainer";
import { buildSupplierZaloInquiryUrl } from "@/lib/catalog/inquiry";
import type { SupplierId } from "@/lib/catalog/core/types";
import { getSupplierSearchIndex } from "@/lib/catalog/suppliers/search-index";
import type { Brand } from "@/lib/brands";
import { ZALO_URL } from "@/lib/seo";

export function CatalogueView({ brand }: { brand: Brand }) {
  const entries = getSupplierSearchIndex().records.filter((record) => record.supplierId === brand.slug);
  const supplierId = brand.slug as SupplierId;
  const inquiryUrl = buildSupplierZaloInquiryUrl(ZALO_URL, brand.name);

  return (
    <>
      <section className="relative overflow-hidden border-b border-forest-900/10 bg-[#f7f8f5] py-7 sm:py-9 lg:py-12">
        <PageContainer>
          <Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "Mã màu", href: "/catalogue/" }, { label: brand.name }]} />
          <div className="mt-4 max-w-4xl">
            <p className="eyebrow">Tra cứu theo mã thực tế</p>
            <h1 className="mt-3 text-balance text-3xl font-extrabold leading-tight tracking-[-.035em] text-forest-950 sm:text-4xl lg:text-5xl">Mã màu {brand.name}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700 sm:text-base">Chỉ hiển thị mã màu và mã bề mặt đã xác minh từ nguồn công khai của {brand.name}. Ảnh swatch/fullsheet được giữ nguyên nguồn để đối chiếu thực tế.</p>
            <a href={inquiryUrl} target="_blank" rel="noopener noreferrer" className="pressable mt-5 inline-flex min-h-12 items-center justify-center gap-2 bg-wood-500 px-5 text-sm font-extrabold text-white hover:bg-wood-600"><MessageCircle size={17} aria-hidden="true" />Gửi mã qua Zalo</a>
          </div>
          <SupplierColorCodeSearch entries={entries} supplierId={supplierId} supplierLabel={brand.name} />
        </PageContainer>
      </section>
      <ContactCTA eyebrow="Đối chiếu mã màu" title="Gửi mã hoặc ảnh bề mặt cần tìm" description="Gửi tên thương hiệu, mã màu, nhóm vật liệu và số lượng dự kiến. Tùng Phát sẽ kiểm tra cốt ván, quy cách và nguồn hàng theo dữ liệu thực tế." zaloLabel="Gửi mã qua Zalo" />
    </>
  );
}
