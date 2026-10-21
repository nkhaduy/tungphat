"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { filterProductCards, type ProductFilter } from "@/lib/product-finder";
import { coreMaterialCards, surfaceCatalogueCards } from "@/lib/product-taxonomy";

const cards = [...coreMaterialCards, ...surfaceCatalogueCards];
const groups: Array<{ value: ProductFilter["group"]; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "core", label: "Cốt ván / vật liệu" },
  { value: "surface", label: "Bề mặt trang trí" },
];

export function ProductFinder() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<ProductFilter["group"]>("all");
  const results = useMemo(() => filterProductCards(cards, { query, group }), [query, group]);

  return (
    <section aria-labelledby="product-finder-title" className="border-b border-slate-200 bg-white py-12 lg:py-20">
      <div className="container-shell">
        <h2 id="product-finder-title" className="font-display text-3xl font-extrabold tracking-[-.04em] text-slate-950">Tìm nhóm vật liệu</h2>
        <div className="mt-6 flex flex-col gap-4 border border-slate-200 p-4 sm:p-5">
          <label className="relative block"><span className="sr-only">Tìm theo tên vật liệu</span><Search size={18} aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm MDF, Laminate, Plywood..." className="min-h-12 w-full border border-slate-300 bg-white pl-11 pr-4 text-base text-slate-950" /></label>
          <div role="group" aria-label="Lọc theo bản chất vật liệu" className="flex flex-wrap gap-2">{groups.map((option) => <button key={option.value} type="button" aria-pressed={group === option.value} onClick={() => setGroup(option.value)} className={`min-h-11 border px-4 text-sm font-bold ${group === option.value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-slate-950"}`}>{option.label}</button>)}</div>
        </div>
        <p aria-live="polite" className="mt-5 text-sm text-slate-600">{results.length} nhóm phù hợp</p>
        {results.length ? <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">{results.map((card) => <article key={card.id} className="min-w-0 overflow-hidden border border-slate-200 bg-white"><Link href={card.href} className="group block h-full"><span className="relative block aspect-[4/3] bg-slate-50"><Image src={card.image} alt={card.alt} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-contain" /></span><span className="block p-4"><strong className="block text-base text-slate-950">{card.title}</strong><span className="mt-2 line-clamp-2 block text-xs leading-5 text-slate-600">{card.description}</span><span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-slate-900">Xem chi tiết <ArrowRight size={15} aria-hidden="true" /></span></span></Link></article>)}</div> : <p className="mt-4 border border-slate-200 p-6 text-sm text-slate-700">Chưa có nhóm khớp từ khóa. Thử tên cốt ván hoặc bề mặt ngắn hơn, hoặc tìm mã trong catalogue.</p>}
        <div className="mt-8 flex flex-wrap gap-4 border-t border-slate-200 pt-6 text-sm font-bold"><Link href="/catalogue/" prefetch={false} className="min-h-11 content-center text-slate-950 underline underline-offset-4">Tìm theo mã màu, thương hiệu và kiểu vân</Link><Link href="/thuong-hieu/thanh-thuy/" className="min-h-11 content-center text-slate-950 underline underline-offset-4">Dòng Thanh Thùy</Link><Link href="/thuong-hieu/ba-thanh/" className="min-h-11 content-center text-slate-950 underline underline-offset-4">Dòng Ba Thanh</Link></div>
      </div>
    </section>
  );
}
