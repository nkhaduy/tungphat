"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { ColorCodeCard, type ColorCardRecord } from "@/components/catalog/ColorCodeCard";
import { normalizeBaThanhSearch } from "@/lib/catalog/ba-thanh";

const PAGE_SIZE = 36;

export type { ColorCardRecord } from "@/components/catalog/ColorCodeCard";

export function ColorCodeSearch({ records, categoryOptions, fixedCategory }: { records: ColorCardRecord[]; categoryOptions: Array<{ slug: string; label: string }>; fixedCategory?: string }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(fixedCategory || "all");
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState("");
  const needle = normalizeBaThanhSearch(query);
  const filtered = useMemo(() => records.filter((record) => {
    if (category !== "all" && record.category !== category) return false;
    if (!needle) return true;
    return normalizeBaThanhSearch(`${record.displayName} ${record.codeNormalized} ${record.patternGroup || ""} ${record.category}`).includes(needle);
  }), [category, needle, records]);
  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      window.setTimeout(() => setCopied(""), 1600);
    } catch {
      setCopied("Không thể copy");
    }
  }

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  return (
    <section aria-labelledby="catalogue-search-title">
      <h2 id="catalogue-search-title" className="sr-only">Tìm mã Melamine Ba Thanh</h2>
      <div className="grid gap-3 rounded-xl border border-forest-900/12 bg-[#f7f8f5] p-3 sm:grid-cols-[1fr_auto] sm:p-4">
        <label className="relative block">
          <span className="sr-only">Tìm theo mã, tên hoặc nhóm vân</span>
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-forest-900/50" aria-hidden="true" />
          <input
            name="ma-melamine"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="Ví dụ: BT111, BT 111, SC020M…"
            autoComplete="off"
            spellCheck={false}
            className="min-h-12 w-full border border-forest-900/15 bg-white pl-11 pr-4 text-sm font-semibold text-forest-950 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-wood-500"
          />
        </label>
        <label className="flex min-h-12 items-center gap-2 border border-forest-900/15 bg-white px-3 text-sm font-bold text-forest-950 sm:min-w-52">
          <SlidersHorizontal size={16} className="text-wood-600" aria-hidden="true" />
          <span className="sr-only">Lọc nhóm màu</span>
          <select name="nhom-mau" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} disabled={Boolean(fixedCategory)} className="min-h-10 flex-1 bg-white text-sm font-bold text-forest-950 focus-visible:ring-2 focus-visible:ring-wood-500 disabled:opacity-70">
            {!fixedCategory && <option value="all">Tất cả nhóm</option>}
            {categoryOptions.map((option) => <option key={option.slug} value={option.slug}>{option.label}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600" aria-live="polite">
        <p><strong className="text-forest-950">{filtered.length}</strong> mã phù hợp{query ? ` với “${query}”` : ""}</p>
        {copied && <p className="font-bold text-wood-700">{copied === "Không thể copy" ? copied : `Đã copy ${copied}`}</p>}
      </div>
      {filtered.length ? (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {visible.map((record) => <ColorCodeCard key={record.slug} record={record} onCopy={copyCode} />)}
          </div>
          {hasMore && <button type="button" onClick={() => setPage((current) => current + 1)} className="mx-auto mt-8 flex min-h-12 touch-manipulation items-center justify-center border border-forest-900/20 px-5 text-sm font-extrabold text-forest-950 transition-[transform,border-color] duration-[180ms] ease-out hover:-translate-y-0.5 hover:border-wood-500 focus-visible:ring-2 focus-visible:ring-wood-500 active:scale-[.97] motion-reduce:transform-none motion-reduce:transition-none">Xem thêm mã</button>}
        </>
      ) : (
        <div className="mt-6 border border-dashed border-forest-900/25 bg-[#f7f8f5] px-6 py-12 text-center">
          <p className="font-extrabold text-forest-950">Chưa tìm thấy mã phù hợp</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Thử bỏ khoảng trắng hoặc dấu gạch, ví dụ `BT111` hoặc `SC020M`. Nếu vẫn chưa thấy, gửi mã cho Tùng Phát để kiểm tra thêm.</p>
        </div>
      )}
    </section>
  );
}
