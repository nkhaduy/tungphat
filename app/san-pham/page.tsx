import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BrandPlaceholder } from "@/components/BrandPlaceholder";
import { brands } from "@/lib/brands";

export const metadata: Metadata = {
  title: "Sản phẩm | Tùng Phát",
  description: "Danh mục vật liệu gỗ theo thương hiệu và catalogue sản phẩm tại Tùng Phát."
};

export default function ProductsPage() {
  return (
    <>
      <Header />
      <main className="bg-[#f6f7f5] pt-[72px]">
        <section className="bg-forest-950 py-16 text-white lg:py-20">
          <div className="container-shell">
            <h1 className="text-balance text-3xl font-extrabold sm:text-4xl lg:text-5xl">Danh mục vật liệu gỗ</h1>
            <p className="mt-5 max-w-2xl text-pretty leading-7 text-white/80">Khám phá các dòng vật liệu theo từng thương hiệu và catalogue sản phẩm.</p>
          </div>
        </section>
        <section id="catalogue" className="scroll-mt-24 py-16 lg:py-24">
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
