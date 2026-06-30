"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Download, FileText, ImageIcon } from "lucide-react";
import type { Brand } from "@/lib/brands";
import { useLang } from "@/lib/i18n-context";
import { translations } from "@/lib/i18n";
import { BrandPlaceholder } from "@/components/BrandPlaceholder";

const catalogueThumbnails: Record<string, Array<{name: string; description: string}>> = {
  "an-cuong": [
    { name: "Melamine An Cường", description: "Bề mặt Melamine đa dạng màu sắc và vân gỗ, phù hợp nội thất gia đình và văn phòng." },
    { name: "Laminate An Cường", description: "Bề mặt Laminate chống trầy xước, chịu lực tốt cho khu vực sử dụng thường xuyên." },
    { name: "Acrylic An Cường", description: "Bề mặt bóng gương cao cấp, màu sắc hiện đại cho tủ bếp và hệ kệ." },
    { name: "Veneer An Cường", description: "Vân gỗ tự nhiên cho các hạng mục nội thất cao cấp." }
  ],
  "thanh-thuy": [
    { name: "Plywood Thanh Thùy", description: "Ván ép nhiều lớp, chịu lực tốt, ổn định kích thước khi gia công." },
    { name: "Melamine Thanh Thùy", description: "Bề mặt hoàn thiện đa dạng, giá thành hợp lý cho sản xuất hàng loạt." },
    { name: "MDF Thanh Thùy", description: "Ván sợi mật độ trung bình, bề mặt mịn cho sơn phủ và dán cạnh." }
  ],
  "ba-thanh": [
    { name: "Veneer Ba Thanh", description: "Vân gỗ tự nhiên đa dạng chủng loại, phù hợp đồ gỗ nội thất cao cấp." },
    { name: "Plywood Ba Thanh", description: "Ván ép chất lượng cao cho các hạng mục chịu lực và gia công kết cấu." },
    { name: "Tấm trang trí Ba Thanh", description: "Giải pháp bề mặt cho tường, quầy và không gian trưng bày." }
  ]
};

export function CatalogueView({ brand }: { brand: Brand }) {
  const { lang } = useLang();
  const t = translations[lang];
  const items = catalogueThumbnails[brand.slug] || [];

  return (
    <main className="bg-white pt-[72px]">
      <section className="bg-forest-950 py-12 text-white lg:py-16">
        <div className="container-shell">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-white/72">
            <Link href="/" className="min-h-11 content-center hover:text-white">{t.breadcrumbHome}</Link>
            <span aria-hidden="true">/</span>
            <span className="text-white" aria-current="page">{t.catalogueTitle} {brand.name}</span>
          </nav>
          <div className="mt-7">
            <h1 className="text-balance text-3xl font-extrabold sm:text-4xl lg:text-5xl">{t.catalogueTitle} {brand.name}</h1>
            <p className="mt-4 max-w-2xl text-pretty leading-7 text-white/80">
              {brand.description || `${t.catalogueDescription} ${brand.name}.`}
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container-shell">
          {items.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <article key={item.name} className="group overflow-hidden bg-white shadow-card transition duration-300 hover:-translate-y-1">
                  <div className="relative aspect-[16/10] bg-[#eef1ed]">
                    <BrandPlaceholder label={item.name} className="absolute inset-0" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-extrabold text-forest-950">{item.name}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button type="button" disabled className="inline-flex min-h-11 cursor-not-allowed items-center gap-2 bg-slate-200 px-4 text-sm font-bold text-slate-600">
                        <FileText size={16} /> {t.cataloguePlaceholder.substring(0, 30)}...
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid min-h-48 place-items-center border border-dashed border-forest-900/25 bg-[#f6f7f5] px-6 text-center text-sm text-slate-600">
              {t.cataloguePlaceholder}
            </div>
          )}

          <div className="mt-12 rounded-lg border border-forest-900/15 bg-[#f6f7f5] p-8 text-center">
            <h2 className="text-xl font-extrabold text-forest-950">{t.catalogueRequestCta}</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">{t.cataloguePlaceholder}</p>
            <Link href="/#bao-gia" className="mt-6 inline-flex min-h-12 items-center gap-2 bg-wood-500 px-6 text-sm font-bold text-white transition hover:bg-wood-600">
              {t.ctaGetQuote} <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}