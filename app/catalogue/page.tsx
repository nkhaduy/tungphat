import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SupplierCatalogSearch } from "@/components/catalog/shared/SupplierCatalogSearch";
import { getSupplierSearchEntries } from "@/lib/catalog/suppliers/search";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Tra cứu catalogue nhà cung cấp",
  description:
    "Tra cứu sản phẩm Thanh Thuỳ, mã Melamine Ba Thanh và dữ liệu catalogue An Cường theo mã, tên, nhà cung cấp, danh mục và series.",
  path: "/catalogue/",
});

export default function SupplierCataloguePage() {
  const entries = getSupplierSearchEntries();

  return (
    <>
      <Header appearance="dark" />
      <main>
        <section className="relative overflow-hidden bg-[#071f18] pb-20 pt-32 text-white lg:pb-24 lg:pt-40">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_12%_18%,rgba(222,140,74,.45),transparent_28%),linear-gradient(120deg,transparent_0%,rgba(255,255,255,.06)_45%,transparent_70%)]"
          />
          <div className="container-shell relative">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-[#f0a66f]">
              Catalogue nhà cung cấp
            </p>
            <h1 className="mt-5 max-w-4xl text-balance font-display text-4xl font-extrabold leading-[1.05] tracking-[-.04em] sm:text-5xl lg:text-7xl">
              Một điểm tra cứu, ba cấu trúc dữ liệu riêng biệt.
            </h1>
            <p className="mt-6 max-w-3xl text-pretty text-base leading-8 text-white/72 sm:text-lg">
              Tìm sản phẩm và series Thanh Thuỳ, mã màu Melamine Ba Thanh hoặc
              mục catalogue An Cường mà không trộn schema, thương hiệu hay URL
              giữa các nhà cung cấp.
            </p>
          </div>
        </section>
        <section className="bg-[#f4f2ec] py-14 lg:py-20">
          <div className="container-shell">
            <SupplierCatalogSearch entries={entries} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
