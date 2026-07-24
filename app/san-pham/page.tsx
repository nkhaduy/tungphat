import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BrandPlaceholder } from "@/components/BrandPlaceholder";
import { JsonLd } from "@/components/JsonLd";
import { brands } from "@/lib/brands";
import { getProducts } from "@/lib/content";
import { mediaUrl } from "@/lib/media";
import { absolutePageUrl, breadcrumbSchema, createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Vật liệu gỗ công nghiệp MDF, MFC, plywood",
  description: "Xem nhóm ván MDF, MFC, plywood, laminate, bề mặt trang trí và các thương hiệu vật liệu đang được giới thiệu tại Tùng Phát.",
  path: "/san-pham"
});

const productListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Thương hiệu vật liệu tại Tùng Phát",
  itemListElement: brands.map((brand, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: brand.name,
    url: absolutePageUrl(`/san-pham/${brand.slug}`)
  }))
};

export default function ProductsPage() {
  const products = getProducts();
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Vật liệu gỗ công nghiệp", path: "/san-pham" }]),
          productListSchema
        ]}
      />
      <Header appearance="dark" />
      <main className="bg-[#f6f7f5] pt-[72px]">
        <section className="bg-forest-950 py-16 text-white lg:py-20">
          <div className="container-shell">
            <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-white/70">
              <Link href="/" className="min-h-11 content-center hover:text-white">Trang chủ</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page" className="text-white">Sản phẩm</span>
            </nav>
            <h1 className="text-balance text-3xl font-extrabold sm:text-4xl lg:text-5xl">Danh mục vật liệu gỗ</h1>
            <p className="mt-5 max-w-3xl text-pretty leading-7 text-white/80">Tìm hiểu các nhóm vật liệu gỗ công nghiệp, bề mặt trang trí và thương hiệu đang được Tùng Phát giới thiệu để chuẩn bị thông tin trước khi yêu cầu báo giá.</p>
          </div>
        </section>
        <section className="py-16 lg:py-24">
          <div className="container-shell">
            <h2 className="text-3xl font-extrabold text-forest-950 sm:text-4xl">Nhóm vật liệu đang giới thiệu</h2>
            <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <article key={product.slug} className="overflow-hidden bg-white shadow-sm">
                  <Link href={`/${product.slug}`} className="relative block aspect-[16/10]"><Image src={mediaUrl(product.featuredImage)} alt={product.featuredImageAlt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /></Link>
                  <div className="p-6"><p className="text-xs font-extrabold uppercase tracking-wider text-wood-700">{product.category}</p><h2 className="mt-3 text-xl font-extrabold text-forest-950"><Link href={`/${product.slug}`}>{product.title}</Link></h2><p className="mt-3 text-sm leading-6 text-slate-600">{product.excerpt}</p><Link href={`/${product.slug}`} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-forest-950">Xem chi tiết <ArrowRight size={16} /></Link></div>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section id="catalogue" className="scroll-mt-24 border-t border-forest-900/10 py-16 lg:py-24">
          <div className="container-shell mb-9"><h2 className="text-3xl font-extrabold text-forest-950">Thương hiệu và catalogue tham khảo</h2><p className="mt-3 max-w-3xl text-slate-600">Việc hiển thị thương hiệu không phải tuyên bố đại lý chính thức. Hãy kiểm tra nguồn hàng và mã sản phẩm trên báo giá thực tế.</p></div>
          <div className="container-shell grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {brands.map((brand) => (
              <article key={brand.slug} className="flex flex-col overflow-hidden bg-white transition-transform duration-300 hover:-translate-y-1">
                <BrandPlaceholder label={brand.name} className="aspect-[4/3]" />
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="text-xl font-extrabold text-forest-950">{brand.name}</h2>
                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{brand.description || "Thông tin sản phẩm đang được cập nhật."}</p>
                  <div className="mt-6 grid gap-2">
                    <Link href={`/san-pham/${brand.slug}`} className="inline-flex min-h-11 items-center justify-between bg-forest-900 px-4 text-sm font-bold text-white">Xem sản phẩm <ArrowRight size={16} /></Link>
                    <Link href={`/san-pham/${brand.slug}#catalogue`} className="inline-flex min-h-11 items-center justify-between border border-forest-900/25 px-4 text-sm font-bold text-forest-950">Xem catalogue <BookOpen size={16} /></Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
