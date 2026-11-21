"use client";

import { MaterialCard } from "@/components/products/MaterialCard";
import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { filterProductCards, type ProductFilter } from "@/lib/product-finder";
import { homeProductCards } from "@/lib/product-taxonomy";

const cards = [...homeProductCards];
const groups: Array<{ value: ProductFilter["group"]; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "core", label: "Ván và vật liệu" },
  { value: "surface", label: "Bề mặt trang trí" },
  { value: "accessory", label: "Vật tư hoàn thiện" },
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
        {results.length ? <div className="mt-4 material-grid grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">{results.map((card) => <MaterialCard key={card.id} card={card} />)}</div> : <p className="mt-4 border border-slate-200 p-6 text-sm text-slate-700">Chưa có nhóm khớp từ khóa. Thử tên ván hoặc bề mặt ngắn hơn, hoặc tìm mã trong catalogue.</p>}
        <div className="mt-8 flex flex-wrap gap-4 border-t border-slate-200 pt-6 text-sm font-bold"><Link href="/catalogue/?supplier=thanh-thuy" prefetch={false} className="min-h-11 content-center text-slate-950 underline underline-offset-4">Tìm theo mã màu, thương hiệu và kiểu vân</Link><Link href="/thuong-hieu/thanh-thuy/" className="min-h-11 content-center text-slate-950 underline underline-offset-4">Dòng Thanh Thùy</Link><Link href="/thuong-hieu/ba-thanh/" className="min-h-11 content-center text-slate-950 underline underline-offset-4">Dòng Ba Thanh</Link></div>
      </div>
    </section>
  );
}
