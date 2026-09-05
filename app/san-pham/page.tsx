import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, MessageCircle } from "lucide-react";
import { BrandPlaceholder } from "@/components/BrandPlaceholder";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/site/SiteShell";
import { ContactCTA } from "@/components/ui/ContactCTA";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { brands } from "@/lib/brands";
import { getProducts } from "@/lib/content";
import { coreMaterialCards, surfaceCatalogueCards } from "@/lib/product-taxonomy";
import { ZALO_URL, absolutePageUrl, breadcrumbSchema, createPageMetadata, schemaPageId, webPageSchema } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Vật liệu gỗ công nghiệp và bề mặt nội thất", description: "Chọn MDF, MFC, plywood, gỗ ghép hoặc bề mặt theo hạng mục. Gửi mã, quy cách và file nếu cần cắt ván hay gia công CNC tại TP.HCM.", path: "/san-pham" });

function brandPageHref(slug: string) {
  if (slug === "thanh-thuy" || slug === "ba-thanh") {
    return `/thuong-hieu/${slug}/`;
  }
  return `/san-pham/${slug}/`;
}

const brandDescriptions: Record<string, string> = {
  "an-cuong": "Tra cứu các nhóm vật liệu và bề mặt An Cường theo hạng mục, mã màu và quy cách cần tìm.",
  "thanh-thuy": "Mở các nhóm vật liệu và mã màu Thanh Thùy để xem catalogue trước khi hỏi quy cách.",
  "ba-thanh": "Tra cứu mã Melamine Ba Thanh theo nhóm vân gỗ, đơn sắc, vân đá và vân vải.",
  kes: "Tham khảo các dòng vật liệu KES theo nhu cầu cốt ván và bề mặt nội thất.",
};

export default async function ProductsPage() {
  const products = await getProducts();
  const displayBrands = brands.map((brand) => ({
    ...brand,
    description: brandDescriptions[brand.slug] ?? brand.description,
  }));
  const productListId = schemaPageId("/san-pham", "products");
  const productListSchema = { "@context": "https://schema.org", "@type": "ItemList", "@id": productListId, name: "Vật liệu gỗ tại Tùng Phát", numberOfItems: products.length, itemListElement: products.map((product, index) => ({ "@type": "ListItem", position: index + 1, item: { "@id": schemaPageId(`/${product.slug}`, product.status === "guide" ? "webpage" : "product"), url: absolutePageUrl(`/${product.slug}`), name: product.title } })) };
  const pageSchema = webPageSchema({ path: "/san-pham", name: "Vật liệu gỗ cho nội thất và gia công CNC", description: "Các nhóm cốt ván, bề mặt và gỗ ghép để chọn vật liệu trước khi cắt hoặc gia công CNC.", type: "CollectionPage", primaryEntityId: productListId });
  return (
    <>
      <JsonLd data={[pageSchema, breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Vật liệu gỗ công nghiệp", path: "/san-pham" }]), productListSchema]} />
      <SiteShell>
        <PageHero compact breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Vật liệu" }]} eyebrow="Danh mục vật liệu" title="Vật liệu gỗ cho nội thất và gia công CNC" description="Chọn nhóm cốt ván, bề mặt hoặc gỗ ghép theo hạng mục. Nếu đã có mã, độ dày, khổ tấm hay danh sách chi tiết, gửi qua Zalo để hỏi đúng vật liệu và phần gia công." actions={<a href={ZALO_URL} target="_blank" rel="noopener noreferrer" className="pressable inline-flex min-h-14 items-center justify-center gap-2 bg-wood-500 px-6 text-sm font-extrabold text-white"><MessageCircle size={18} aria-hidden="true" />Gửi quy cách cần tìm</a>} />
        <section data-answer-block className="border-b border-forest-900/10 bg-[#edf4ef] py-8" aria-labelledby="materials-answer-title"><div className="container-shell max-w-4xl"><p className="text-xs font-extrabold uppercase tracking-[.15em] text-wood-600">Trả lời nhanh</p><h2 id="materials-answer-title" className="mt-2 text-2xl font-extrabold text-forest-950">Nên bắt đầu chọn cốt ván hay bề mặt?</h2><p className="mt-3 text-base leading-8 text-slate-700">Hãy nói trước hạng mục và môi trường sử dụng, sau đó chọn cốt ván, bề mặt, độ dày và khổ cần dùng. MDF chống ẩm dành cho nơi ẩm hơn phòng khô chứ không phải ván chống nước; với gỗ ghép, nên xem loại gỗ, mặt sử dụng và mẫu tấm.</p></div></section>
        <section className="border-b border-forest-900/10 bg-white py-6"><div className="container-shell flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm leading-7 text-slate-700">Chưa biết gọi đúng tên cốt ván hoặc bề mặt?</p><Link href="/tham-chieu-vat-lieu/" className="inline-flex min-h-11 items-center gap-2 font-extrabold text-wood-600">Xem bảng tham chiếu <ArrowRight size={16} aria-hidden="true" /></Link></div></section>
        <section className="section-space bg-[#f7f8f5]">
          <div className="container-shell"><SectionHeader eyebrow="Chuẩn bị báo giá" title="Mua tấm nguyên hay gửi danh sách chi tiết?" description="Tấm nguyên phù hợp khi bạn đã biết loại ván và số lượng. Danh sách chi tiết phù hợp khi cần cắt theo bản vẽ hoặc làm tiếp phần CNC." /><div className="mt-8 overflow-x-auto"><table className="w-full min-w-[720px] border-collapse bg-white text-left text-sm"><caption className="sr-only">So sánh mua ván nguyên tấm và gửi danh sách chi tiết</caption><thead><tr className="border-b border-forest-900/15 text-xs uppercase tracking-wide text-slate-500"><th className="p-4">Nội dung</th><th className="p-4">Mua ván nguyên tấm</th><th className="p-4">Danh sách chi tiết</th></tr></thead><tbody>{[["Nên gửi", "Loại cốt, bề mặt, độ dày, khổ tấm và số tấm", "Mã chi tiết, dài × rộng, số lượng, vật liệu và độ dày"], ["Có thể hỏi", "Mã hàng, bề mặt và phương án nhận tấm", "Vật liệu, phần cắt và bước gia công đi kèm"], ["Nên chốt trước", "Quy cách tấm, mã màu và số lượng", "Đơn vị đo, mặt sử dụng, cạnh, lỗ/rãnh và phiên bản file"], ["Hợp với", "Khách tự bố trí cắt hoặc cần nhận tấm", "Khách có bản vẽ, file hoặc nhiều chi tiết cần làm cùng nhau"]].map(([criterion, sheet, parts]) => <tr key={criterion} className="border-b border-forest-900/10 align-top"><th scope="row" className="p-4 font-bold text-forest-950">{criterion}</th><td className="p-4 leading-7 text-slate-700">{sheet}</td><td className="p-4 leading-7 text-slate-700">{parts}</td></tr>)}</tbody></table></div><p className="mt-5 text-sm leading-7 text-slate-600">Giá và tồn kho thay đổi theo mã hàng. Gửi thông tin bạn đã có để được trả lời phần còn thiếu.</p></div>
        </section>
        <section className="section-space bg-white">
          <div className="container-shell">
            <SectionHeader eyebrow="Các nhóm vật liệu" title="Chọn theo cốt ván trước" description="Nhóm vật liệu chính giúp khoanh đúng loại tấm. MFC và Plywood đang được giới thiệu trong trang hướng dẫn ván gỗ công nghiệp; gỗ ghép có thêm trang riêng theo từng loại gỗ." />
            <div data-product-groups className="mt-9">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xs font-extrabold uppercase tracking-[.16em] text-forest-900">Cốt ván / vật liệu chính</h2>
                <span className="text-xs text-slate-500">{coreMaterialCards.length} nhóm</span>
              </div>
              <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {coreMaterialCards.map((material) => (
                  <article key={material.id} data-product-card={material.id} className="group flex flex-col overflow-hidden border border-forest-900/10 bg-white shadow-[0_8px_24px_rgba(7,59,40,.045)]">
                    <Link href={material.href} aria-label={`Mở trang ${material.title}`} className="relative block aspect-[4/3] overflow-hidden bg-[#18281f]">
                      <Image src={material.image} alt={material.alt} fill sizes="(max-width: 768px) 100vw, 25vw" className="object-contain transition-transform duration-300 group-hover:scale-[1.025]" />
                    </Link>
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="text-xl font-extrabold text-forest-950"><Link href={material.href}>{material.title}</Link></h3>
                      <p className="mt-3 text-sm leading-7 text-slate-700">{material.description}</p>
                      <Link href={material.href} className="mt-auto inline-flex min-h-11 items-center gap-2 pt-5 text-sm font-extrabold text-wood-600">Mở trang vật liệu <ArrowRight size={16} aria-hidden="true" /></Link>
                      {material.children ? <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-forest-900/10 pt-3 text-xs font-extrabold text-forest-900">{material.children.map(([label, href]) => <Link key={href} href={href} className="inline-flex min-h-9 items-center hover:text-wood-600">{label}</Link>)}</div> : null}
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="mt-12 border-t border-forest-900/10 pt-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xs font-extrabold uppercase tracking-[.16em] text-forest-900">Bề mặt / catalogue</h2>
                  <p className="mt-2 text-sm text-slate-600">Màu và vân được tra cứu riêng; mã bề mặt không tự xác định cốt ván bên dưới.</p>
                </div>
                <Link href="/catalogue/" prefetch={false} className="inline-flex min-h-10 shrink-0 items-center gap-2 text-xs font-extrabold text-wood-600">Mở catalogue <ArrowRight size={15} aria-hidden="true" /></Link>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {surfaceCatalogueCards.map((surface) => (
                  <Link key={surface.id} href={surface.href} prefetch={false} data-product-card={surface.id} className="group flex min-w-0 flex-col overflow-hidden border border-forest-900/10 bg-white shadow-[0_8px_24px_rgba(7,59,40,.045)]">
                    <span className="relative block aspect-[4/3] overflow-hidden bg-[#18281f]"><Image src={surface.image} alt={surface.alt} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-contain transition-transform duration-300 group-hover:scale-[1.025]" /></span>
                    <span className="flex min-h-20 items-center justify-between gap-3 p-4"><span><strong className="block text-base font-extrabold text-forest-950">{surface.title}</strong><span className="mt-1 block text-xs leading-5 text-slate-600">{surface.description}</span></span><ArrowRight size={17} className="shrink-0 text-wood-600" aria-hidden="true" /></span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="section-space bg-[#f7f8f5]"><div className="container-shell grid gap-8 lg:grid-cols-[.75fr_1.25fr]"><SectionHeader eyebrow="Thông tin nên gửi" title="Bốn điều giúp hỏi đúng ván" description="Không cần nhớ tên sản phẩm ngay từ đầu. Hãy mô tả hạng mục, môi trường, quy cách và phần gia công bạn cần." /><ol className="grid gap-3 sm:grid-cols-2">{[["01", "Hạng mục", "Tủ, bàn, kệ, vách hay chi tiết dạng tấm."], ["02", "Môi trường", "Khô, có độ ẩm hoặc có nước trực tiếp."], ["03", "Quy cách", "Độ dày, kích thước và số lượng dự kiến."], ["04", "Gia công", "Cắt, khoan, soi rãnh, dán cạnh hoặc CNC."]].map(([number, title, text]) => <li key={number} className="border border-forest-900/10 bg-white p-5"><span className="text-xs font-extrabold text-wood-600">{number}</span><h3 className="mt-3 font-extrabold text-forest-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-700">{text}</p></li>)}</ol></div></section>
        <section id="thuong-hieu" className="section-space scroll-mt-32 bg-white"><div id="catalogue" className="container-shell scroll-mt-32"><SectionHeader eyebrow="Mã màu và catalogue" title="Tra cứu thêm theo thương hiệu" description="Nếu đã có thương hiệu hoặc mã bề mặt, mở catalogue tương ứng rồi gửi mã, ảnh mẫu hoặc quy cách cần làm." /><div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-4">{displayBrands.map((brand) => <article key={brand.slug} className="flex flex-col overflow-hidden border border-forest-900/10 bg-white shadow-sm">{brand.logo ? <div className="relative aspect-[4/3] bg-[#f7f8f5]"><Image src={brand.logo} alt={`Logo ${brand.name}`} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-contain p-8" /></div> : <BrandPlaceholder label={brand.name} className="aspect-[4/3]" />}<div className="flex flex-1 flex-col p-6"><h2 className="text-xl font-extrabold text-forest-950">{brand.name}</h2><p className="mt-3 flex-1 text-sm leading-7 text-slate-700">{brand.description}</p><div className="mt-6 grid gap-2"><Link href={brandPageHref(brand.slug)} className="pressable inline-flex min-h-12 items-center justify-between bg-forest-900 px-4 text-sm font-extrabold text-white">Xem trang thương hiệu <ArrowRight size={16} aria-hidden="true" /></Link>{brand.slug !== "kes" ? <Link href={`/catalogue/${brand.slug}`} className="pressable inline-flex min-h-12 items-center justify-between border border-forest-900/20 px-4 text-sm font-extrabold text-forest-950">Mở catalogue <BookOpen size={16} aria-hidden="true" /></Link> : null}</div></div></article>)}</div></div></section>
        <ContactCTA title="Đã có mã hoặc quy cách cần hỏi?" description="Gửi ảnh mẫu, mã màu, cốt ván, kích thước, độ dày, số lượng và hạng mục sử dụng. Tùng Phát sẽ trả lời theo thông tin của từng dòng hàng." />
      </SiteShell>
    </>
  );
}
