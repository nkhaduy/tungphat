import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductFinder } from "@/components/materials/ProductFinder";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/site/SiteShell";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ContactCTA } from "@/components/ui/ContactCTA";
import { coreMaterialCards, surfaceCatalogueCards } from "@/lib/product-taxonomy";
import { absolutePageUrl, breadcrumbSchema, createPageMetadata, schemaPageId, webPageSchema } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Ván gỗ công nghiệp, bề mặt trang trí & vật tư",
  description: "Tìm MDF, MFC, Plywood, gỗ ghép và bề mặt Thanh Thùy, Ba Thanh. Tra mã màu, xem vật liệu rồi gửi quy cách để hỏi hàng và gia công tại Thủ Đức.",
  path: "/san-pham/",
});

const cards = [...coreMaterialCards, ...surfaceCatalogueCards];
const productListId = schemaPageId("/san-pham", "products");

export default function ProductsPage() {
  const productListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": productListId,
    name: "Nhóm vật liệu tại Tùng Phát",
    numberOfItems: cards.length,
    itemListElement: cards.map((card, index) => ({ "@type": "ListItem", position: index + 1, url: absolutePageUrl(card.href), name: card.title })),
  };
  const pageSchema = webPageSchema({ path: "/san-pham", name: "Vật liệu gỗ công nghiệp tại Tùng Phát", description: "Chọn cốt ván, bề mặt và vật tư trước khi gửi quy cách báo giá.", type: "CollectionPage", primaryEntityId: productListId });

  return (
    <>
      <JsonLd data={[pageSchema, breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Sản phẩm", path: "/san-pham/" }]), productListSchema]} />
      <SiteShell>
        <section className="border-b border-slate-200 bg-white pb-12 pt-[calc(var(--site-header-height)+2.5rem)] lg:pb-16 lg:pt-[calc(var(--site-header-height)+4rem)]">
          <div className="container-shell">
            <Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "Sản phẩm" }]} />
            <p className="mt-9 text-xs font-bold uppercase tracking-[.18em] text-slate-500">Danh mục vật liệu</p>
            <h1 className="mt-4 max-w-[17ch] font-display text-[clamp(2.25rem,4.8vw,4.3rem)] font-extrabold leading-[1.12] tracking-[-.05em] text-slate-950">Chọn đúng cốt ván, bề mặt và vật tư</h1>
            <p className="mt-5 max-w-[70ch] text-base leading-8 text-slate-700">MDF, MFC, Plywood và gỗ ghép là nhóm vật liệu; Melamine, Laminate, Acrylic, PVC Film và Veneer là bề mặt trang trí. Chọn theo hạng mục trước, sau đó tra mã màu và hỏi đúng quy cách.</p>
          </div>
        </section>
        <section data-answer-block className="border-b border-slate-200 bg-white py-8" aria-labelledby="material-order-title"><div className="container-shell"><h2 id="material-order-title" className="text-xl font-bold text-slate-950">Nên chọn cốt ván hay bề mặt trước?</h2><p className="mt-3 max-w-[75ch] text-sm leading-7 text-slate-700">Hãy bắt đầu từ hạng mục và nơi sử dụng để chọn cốt ván. Sau đó chọn bề mặt, độ dày, khổ tấm và phần cạnh; mã màu một mình chưa đủ để báo đúng vật liệu.</p></div></section>
        <ProductFinder />
        <section className="border-b border-slate-200 bg-white py-14 lg:py-20">
          <div className="container-shell grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:gap-16">
            <div><p className="text-xs font-bold uppercase tracking-[.18em] text-slate-500">Theo thương hiệu</p><h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-.04em] text-slate-950">Tra đúng nguồn mã màu</h2><p className="mt-4 text-sm leading-7 text-slate-600">Catalogue lưu mã riêng cho từng nhà cung cấp. Một mã bề mặt chưa tự xác định cốt ván, độ dày hoặc tình trạng hàng.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/catalogue/thanh-thuy/" className="flex min-h-40 flex-col justify-between border border-slate-200 p-6 hover:border-slate-500"><strong className="text-xl text-slate-950">Thanh Thùy</strong><span className="text-sm leading-6 text-slate-600">Melamine, Laminate, Acrylic, PVC Film và Veneer</span><span className="inline-flex items-center gap-2 text-sm font-bold text-slate-950">Xem mã màu <ArrowRight size={16} aria-hidden="true" /></span></Link>
              <Link href="/catalogue/ba-thanh/" className="flex min-h-40 flex-col justify-between border border-slate-200 p-6 hover:border-slate-500"><strong className="text-xl text-slate-950">Ba Thanh</strong><span className="text-sm leading-6 text-slate-600">Melamine, Laminate Way và các dòng ván</span><span className="inline-flex items-center gap-2 text-sm font-bold text-slate-950">Xem mã màu <ArrowRight size={16} aria-hidden="true" /></span></Link>
            </div>
          </div>
        </section>
        <section className="border-b border-slate-200 bg-white py-14 lg:py-20"><div className="container-shell"><h2 className="font-display text-3xl font-extrabold tracking-[-.04em] text-slate-950">Gửi gì để kiểm tra hàng và báo giá?</h2><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["01", "Vật liệu", "Loại cốt ván, thương hiệu và mã bề mặt nếu có."], ["02", "Quy cách", "Độ dày, khổ tấm hoặc kích thước từng chi tiết."], ["03", "Số lượng", "Số tấm hoặc số chi tiết cần làm."], ["04", "Gia công", "Nêu phần cắt, dán cạnh, CNC và gửi file nếu có."]].map(([number, title, description]) => <div key={number} className="border-t border-slate-300 pt-4"><span className="text-xs font-bold text-slate-500">{number}</span><h3 className="mt-3 font-bold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></div>)}</div><p className="mt-7 text-sm leading-7 text-slate-600">Quy cách, mã và tồn kho có thể khác theo từng dòng hàng. Tùng Phát kiểm tra lại trước khi báo giá.</p></div></section>
        <ContactCTA title="Đã có mã, ảnh mẫu hoặc bản vẽ?" description="Gửi mã màu, cốt ván, độ dày, kích thước và số lượng qua Zalo. Nếu cần CNC, đính kèm file để xưởng kiểm tra phần gia công." />
      </SiteShell>
    </>
  );
}
