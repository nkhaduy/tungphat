"use client";

import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { searchSupplierCatalog } from "@/lib/catalog/core/search";
import type { CatalogSearchEntry, SupplierId } from "@/lib/catalog/core/types";

const kindLabels: Record<CatalogSearchEntry["kind"], string> = {
  product: "Sản phẩm",
  "color-code": "Mã màu",
  "catalogue-item": "Mục catalogue",
};

const supplierOptions: Array<{ value: SupplierId; label: string }> = [
  { value: "thanh-thuy", label: "Thanh Thuỳ" },
  { value: "ba-thanh", label: "Ba Thanh" },
  { value: "an-cuong", label: "An Cường" },
];

export function SupplierCatalogSearch({
  entries,
}: {
  entries: CatalogSearchEntry[];
}) {
  const [query, setQuery] = useState("");
  const [supplierId, setSupplierId] = useState<SupplierId | "">("");
  const [category, setCategory] = useState("");
  const deferredQuery = useDeferredValue(query);
  const categories = useMemo(
    () =>
      [
        ...new Set(
          entries
            .filter((entry) => !supplierId || entry.supplierId === supplierId)
            .map((entry) => entry.category)
            .filter((value): value is string => Boolean(value)),
        ),
      ].sort((left, right) => left.localeCompare(right, "vi")),
    [entries, supplierId],
  );
  const results = useMemo(
    () =>
      searchSupplierCatalog(entries, deferredQuery, {
        supplierId: supplierId || undefined,
        category: category || undefined,
      }),
    [category, deferredQuery, entries, supplierId],
  );
  const visibleResults = results.slice(0, 48);

  return (
    <section aria-labelledby="supplier-search-title">
      <div className="border border-forest-900/12 bg-white p-4 shadow-[0_18px_50px_rgba(7,31,24,0.08)] sm:p-6">
        <h2
          id="supplier-search-title"
          className="text-2xl font-extrabold text-forest-950"
        >
          Tìm theo mã, tên hoặc nhóm vật liệu
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Kết quả ưu tiên mã trùng khớp chính xác, sau đó mới xét tên, series,
          nhóm màu và danh mục của từng nhà cung cấp.
        </p>
        <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_240px]">
          <label className="relative block">
            <span className="sr-only">Tìm catalogue nhà cung cấp</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-forest-900/55"
              size={18}
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              autoComplete="off"
              placeholder="Ví dụ: BT 111, LP 101, MFC - MS 01012 T"
              className="min-h-12 w-full border border-forest-900/20 bg-[#f7f5ef] py-3 pl-11 pr-4 text-sm text-forest-950 outline-none transition focus:border-wood-500 focus:ring-2 focus:ring-wood-500/20"
            />
          </label>
          <label>
            <span className="sr-only">Lọc theo nhà cung cấp</span>
            <select
              value={supplierId}
              onChange={(event) => {
                setSupplierId(event.target.value as SupplierId | "");
                setCategory("");
              }}
              className="min-h-12 w-full border border-forest-900/20 bg-white px-4 text-sm font-bold text-forest-950 outline-none focus:border-wood-500 focus:ring-2 focus:ring-wood-500/20"
            >
              <option value="">Tất cả nhà cung cấp</option>
              {supplierOptions.map((supplier) => (
                <option key={supplier.value} value={supplier.value}>
                  {supplier.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Lọc theo danh mục</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="min-h-12 w-full border border-forest-900/20 bg-white px-4 text-sm font-bold text-forest-950 outline-none focus:border-wood-500 focus:ring-2 focus:ring-wood-500/20"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-wood-600">
            Kết quả tra cứu
          </p>
          <p className="mt-1 text-sm text-slate-600" aria-live="polite">
            {results.length} mục phù hợp
            {results.length > visibleResults.length
              ? `, đang hiển thị ${visibleResults.length}`
              : ""}
          </p>
        </div>
      </div>

      {visibleResults.length ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleResults.map((entry, index) => (
            <Link
              key={`${entry.supplierId}:${entry.code}:${index}`}
              href={entry.canonicalRoute}
              className="group grid min-h-[152px] grid-cols-[112px_1fr] overflow-hidden border border-forest-900/12 bg-white transition hover:-translate-y-0.5 hover:border-wood-500/55 hover:shadow-[0_16px_36px_rgba(7,31,24,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-500"
            >
              <div className="relative bg-[#eef1ed]">
                {entry.thumbnail ? (
                  <Image
                    src={entry.thumbnail}
                    alt=""
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center px-3 text-center text-xs font-bold text-forest-900/55">
                    {entry.supplierName}
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-col p-4">
                <div className="flex flex-wrap gap-2 text-[.65rem] font-extrabold uppercase tracking-[.12em]">
                  <span className="text-wood-600">{entry.supplierName}</span>
                  <span className="text-slate-400">
                    {kindLabels[entry.kind]}
                  </span>
                </div>
                <p className="mt-3 font-mono text-sm font-extrabold text-forest-950">
                  {entry.code}
                </p>
                <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-slate-700 group-hover:text-forest-950">
                  {entry.name}
                </h3>
                <p className="mt-auto truncate pt-3 text-xs text-slate-500">
                  {[entry.category, entry.series, entry.group]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-5 border border-dashed border-forest-900/20 bg-white px-6 py-12 text-center text-sm text-slate-600">
          Không tìm thấy mã phù hợp. Hãy thử bỏ dấu cách, dấu gạch hoặc chọn lại
          nhà cung cấp.
        </div>
      )}
    </section>
  );
}
