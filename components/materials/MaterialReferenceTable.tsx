"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { filterMaterials } from "@/lib/material-reference";
import type { Material } from "@/lib/materials";

function displayValue(value: string | string[] | null) {
  return value && value.length ? (Array.isArray(value) ? value.join("; ") : value) : "Chưa xác minh trong dữ liệu hiện tại";
}

export function MaterialReferenceTable({ materials, categories, lastVerified }: { materials: Material[]; categories: string[]; lastVerified: string }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const deferredSearch = useDeferredValue(search);
  const filteredMaterials = useMemo(() => filterMaterials(materials, { search: deferredSearch, category }), [category, deferredSearch, materials]);

  return (
    <div>
      <div className="mb-6 grid gap-4 rounded-2xl border border-forest-900/10 bg-[#f7f8f5] p-4 sm:grid-cols-[minmax(0,1fr)_240px]">
        <label className="grid gap-2 text-sm font-bold text-forest-950">
          <span>Tìm trong bảng tham chiếu</span>
          <span className="relative">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ví dụ: chống ẩm, cao su, CNC" className="min-h-12 w-full rounded-xl border border-forest-900/15 bg-white pl-10 pr-3 text-sm font-normal outline-none ring-wood-500 focus:ring-2" />
          </span>
        </label>
        <label className="grid gap-2 text-sm font-bold text-forest-950">
          <span>Nhóm vật liệu</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-12 rounded-xl border border-forest-900/15 bg-white px-3 text-sm font-normal outline-none ring-wood-500 focus:ring-2">
            <option value="all">Tất cả nhóm</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <p className="mb-3 text-sm text-slate-600" aria-live="polite">Hiển thị {filteredMaterials.length}/{materials.length} dòng · Cập nhật {lastVerified}</p>
      <div className="overflow-x-auto">
        <table className="min-w-[920px] w-full border-collapse text-left text-sm">
          <caption className="sr-only">Bảng tham chiếu vật liệu đã lọc</caption>
          <thead><tr className="border-b border-forest-900/15 text-xs uppercase tracking-wide text-slate-500"><th className="p-3">Vật liệu</th><th className="p-3">Nhóm</th><th className="p-3">Ứng dụng đã công bố</th><th className="p-3">Kích thước</th><th className="p-3">Độ dày</th><th className="p-3">Bề mặt</th><th className="p-3">CNC</th></tr></thead>
          <tbody>{filteredMaterials.map((material) => <tr key={material.slug} className="border-b border-forest-900/10 align-top"><th scope="row" className="p-3 font-extrabold text-forest-950"><Link href={`/${material.slug}/`} className="underline decoration-wood-400 underline-offset-4">{material.name}</Link><span className="mt-1 block text-[11px] font-normal uppercase tracking-wide text-slate-500">Nguồn: {material.sourceIds.join(", ")}</span></th><td className="p-3 text-slate-700">{material.category}</td><td className="p-3 text-slate-700">{material.applications.join(", ")}</td><td className="p-3 text-slate-500">{displayValue(material.dimensions)}</td><td className="p-3 text-slate-500">{displayValue(material.thicknesses)}</td><td className="p-3 text-slate-500">{displayValue(material.surface)}</td><td className="p-3 text-slate-700">Kiểm tra theo file, vật liệu và số lượng</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
