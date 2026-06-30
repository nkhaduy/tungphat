import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Download, FileText } from "lucide-react";
import type { Brand } from "@/lib/brands";
import { BrandPlaceholder } from "@/components/BrandPlaceholder";

const filters = ["Loại vật liệu", "Bề mặt", "Màu sắc", "Độ dày", "Kích thước"];

export function BrandPage({ brand }: { brand: Brand }) {
  return (
    <main className="bg-white pt-[72px]">
      <section className="bg-forest-950 py-12 text-white lg:py-16">
        <div className="container-shell">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-white/72">
            <Link href="/" className="min-h-11 content-center hover:text-white">Trang chủ</Link>
            <span aria-hidden="true">/</span>
            <Link href="/san-pham" className="min-h-11 content-center hover:text-white">Sản phẩm</Link>
            <span aria-hidden="true">/</span>
            <span className="text-white" aria-current="page">{brand.name}</span>
          </nav>
          <div className="mt-7 grid items-center gap-8 lg:grid-cols-[240px_1fr]">
            {brand.logo ? (
              <div className="relative aspect-[4/3] bg-white p-6">
                <Image src={brand.logo} alt={`Logo ${brand.name}`} fill sizes="240px" quality={95} className="object-contain p-6" />
              </div>
            ) : (
              <BrandPlaceholder label={`logo ${brand.name}`} className="aspect-[4/3] bg-white/10 text-white" />
            )}
            <div>
              <h1 className="text-balance text-3xl font-extrabold sm:text-4xl lg:text-5xl">{brand.name}</h1>
              <p className="mt-4 max-w-2xl text-pretty leading-7 text-white/80">
                {brand.description || "Thông tin sản phẩm đang được cập nhật."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="catalogue" className="scroll-mt-24 bg-[#f6f7f5] py-16 lg:py-20">
        <div className="container-shell">
          <h2 className="text-2xl font-extrabold text-forest-950 sm:text-3xl">Catalogue {brand.name}</h2>
          {brand.catalogues.length > 0 ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {brand.catalogues.map((catalogue) => (
                <article key={catalogue.name} className="overflow-hidden bg-white transition-transform duration-300 hover:-translate-y-1">
                  {catalogue.thumbnail ? (
                    <div className="relative aspect-[16/9]">
                      <Image src={catalogue.thumbnail} alt={catalogue.name} fill sizes="(max-width: 768px) 100vw, 50vw" quality={95} className="object-cover" />
                    </div>
                  ) : (
                    <BrandPlaceholder label={catalogue.name} className="aspect-[16/9]" />
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-extrabold text-forest-950">{catalogue.name}</h3>
                    {catalogue.description && <p className="mt-3 text-sm leading-6 text-slate-600">{catalogue.description}</p>}
                    <div className="mt-6 flex flex-wrap gap-3">
                      {catalogue.pdfUrl ? (
                        <>
                          <a href={catalogue.pdfUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 bg-forest-900 px-4 text-sm font-bold text-white">Xem catalogue <ArrowRight size={16} /></a>
                          <a href={catalogue.pdfUrl} download className="inline-flex min-h-11 items-center gap-2 border border-forest-900/25 px-4 text-sm font-bold text-forest-950"><Download size={16} /> Tải PDF</a>
                        </>
                      ) : (
                        <button type="button" disabled className="inline-flex min-h-11 cursor-not-allowed items-center gap-2 bg-slate-200 px-4 text-sm font-bold text-slate-600"><FileText size={16} /> Đang cập nhật</button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-7 border border-forest-900/15 bg-white px-6 py-8 text-sm text-slate-600">Thông tin sản phẩm đang được cập nhật.</div>
          )}
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="container-shell">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-extrabold text-forest-950 sm:text-3xl">Sản phẩm {brand.name}</h2>
              <p className="mt-3 text-sm text-slate-600">Thông tin sản phẩm đang được cập nhật.</p>
            </div>
            <Link href="/#bao-gia" className="inline-flex min-h-12 w-fit items-center gap-2 bg-wood-500 px-5 text-sm font-bold text-white">Yêu cầu báo giá <ArrowRight size={17} /></Link>
          </div>

          <fieldset disabled className="mt-8">
            <legend className="sr-only">Bộ lọc sản phẩm đang cập nhật</legend>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {filters.map((filter) => (
                <label key={filter} className="text-sm font-bold text-slate-600">
                  <span className="mb-2 block">{filter}</span>
                  <select aria-label={filter} className="min-h-12 w-full cursor-not-allowed border border-slate-300 bg-slate-100 px-3 text-slate-600">
                    <option>Đang cập nhật</option>
                  </select>
                </label>
              ))}
            </div>
          </fieldset>

          {brand.products.length > 0 ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {brand.products.map((product) => (
                <article key={`${product.code}-${product.name}`} className="border border-forest-900/15 p-5">
                  {product.image ? <div className="relative aspect-square"><Image src={product.image} alt={product.name} fill sizes="(max-width: 640px) 100vw, 25vw" quality={95} className="object-cover" /></div> : <BrandPlaceholder label={product.name} className="aspect-square" />}
                  <h3 className="mt-5 font-extrabold text-forest-950">{product.name}</h3>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-10 grid min-h-48 place-items-center border border-dashed border-forest-900/25 bg-[#f6f7f5] px-6 text-center text-sm text-slate-600">Thông tin sản phẩm đang được cập nhật.</div>
          )}
        </div>
      </section>
    </main>
  );
}
