"use client";

import Image from "next/image";
import Link from "next/link";
import { Copy, MessageCircle, Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { searchSupplierCatalog } from "@/lib/catalog/core/search";
import type { CatalogSearchEntry, SupplierId } from "@/lib/catalog/core/types";
import { buildSupplierZaloInquiryUrl } from "@/lib/catalog/inquiry";
import { materialTaxonomyOptions } from "@/lib/catalog/material-taxonomy";
import { buildCatalogCollectionSearchParams, parseCatalogCollectionUrlState } from "@/lib/catalog/url-state";
import { ZALO_URL } from "@/lib/seo";

const PAGE_SIZE = 48;

export function SupplierColorCodeSearch({
  entries,
  supplierId,
  supplierLabel,
}: {
  entries: CatalogSearchEntry[];
  supplierId?: SupplierId;
  supplierLabel?: string;
}) {
  const [query, setQuery] = useState("");
  const [material, setMaterial] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const deferredQuery = useDeferredValue(query);
  const scopedEntries = useMemo(
    () => supplierId ? entries.filter((entry) => entry.supplierId === supplierId) : entries,
    [entries, supplierId],
  );
  const materialOptions = useMemo(() => materialTaxonomyOptions(scopedEntries), [scopedEntries]);
  const results = useMemo(
    () => searchSupplierCatalog(scopedEntries, deferredQuery, { material: material || undefined }),
    [deferredQuery, material, scopedEntries],
  );
  const visibleResults = results.slice(0, visibleLimit);
  const label = supplierLabel ?? (supplierId === "an-cuong" ? "An Cường" : supplierId === "ba-thanh" ? "Ba Thanh" : supplierId === "thanh-thuy" ? "Thanh Thuỳ" : "các nhà cung cấp");

  useEffect(() => {
    const restoreFromUrl = () => {
      setQuery(parseCatalogCollectionUrlState(new URLSearchParams(window.location.search), []).query);
    };
    restoreFromUrl();
    window.addEventListener("popstate", restoreFromUrl);
    return () => window.removeEventListener("popstate", restoreFromUrl);
  }, []);

  function updateQuery(value: string) {
    setQuery(value);
    setVisibleLimit(PAGE_SIZE);
    const parameters = buildCatalogCollectionSearchParams(new URLSearchParams(window.location.search), { query: value, group: "" });
    const search = parameters.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`);
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Clipboard permission is optional; the code remains selectable.
    }
  }

  return (
    <section aria-labelledby="color-code-search-title" className="mt-6">
      <h2 id="color-code-search-title" className="sr-only">Tra cứu mã màu {label}</h2>
      <div className="border border-forest-900/10 bg-white p-4 shadow-card sm:p-5">
        <label className="relative block">
          <span className="sr-only">Tìm mã màu, tên màu hoặc thương hiệu</span>
          <Search aria-hidden="true" size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-forest-900/55" />
          <input
            type="search"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Escape") updateQuery(""); }}
            placeholder="Tìm mã màu, tên màu hoặc thương hiệu"
            autoComplete="off"
            spellCheck={false}
            className="min-h-14 w-full border border-forest-900/15 bg-[#fbfaf6] pl-11 pr-4 text-base font-semibold text-forest-950 outline-none focus-visible:border-wood-500 focus-visible:ring-2 focus-visible:ring-wood-500/20"
          />
        </label>
        <div role="group" aria-label="Lọc mã màu theo vật liệu" className="-mx-1 mt-4 flex snap-x gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
          {materialOptions.map((option) => {
            const value = option.slug === "all" ? "" : option.slug;
            const active = material === value;
            return <button key={option.slug} type="button" aria-pressed={active} onClick={() => { setMaterial(value); setVisibleLimit(PAGE_SIZE); }} className={`pressable min-h-11 shrink-0 snap-start border px-4 text-sm font-extrabold ${active ? "border-forest-900 bg-forest-900 text-white" : "border-forest-900/15 bg-white text-forest-950"}`}>{option.label} ({option.count})</button>;
          })}
        </div>
      </div>

      <div className="mt-5 border-l-2 border-wood-500 bg-[#fffdf8] px-5 py-4">
        <h2 className="text-lg font-extrabold text-forest-950">{scopedEntries.length} mã màu · {results.length} mã phù hợp</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">Giữ nguyên mã bề mặt và ảnh nguồn đã xác minh. Mã chưa có ảnh nguồn được ghi rõ, không render khung ảnh trống.</p>
      </div>

      {visibleResults.length ? (
        <div role="region" aria-label={`Kết quả mã màu ${label}`} className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleResults.map((item) => (
            <article key={item.id ?? `${item.supplierId}:${item.code}`} className="flex min-h-[270px] flex-col overflow-hidden border border-forest-900/10 bg-white shadow-sm">
              <Link href={item.canonicalRoute} aria-label={`${item.supplierName}, mã ${item.code}, xem chi tiết`} className="relative block aspect-[16/9] overflow-hidden bg-[#eef1ed] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-wood-600">
                {item.thumbnail ? <Image src={item.thumbnail} alt={`Swatch ${item.code}`} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" /> : <span className="grid h-full place-items-center px-3 text-center text-xs font-bold text-slate-600">Nguồn chưa cung cấp ảnh màu</span>}
              </Link>
              <div className="flex flex-1 flex-col p-4">
                <p className="text-[.65rem] font-extrabold uppercase tracking-[.13em] text-wood-600">{item.supplierName} · Mã màu</p>
                <p className="mt-2 break-words font-mono text-lg font-extrabold text-forest-950" translate="no">{item.code}</p>
                <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-6 text-slate-700"><Link href={item.canonicalRoute}>{item.name}</Link></h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">{[item.category, item.series, item.group].filter(Boolean).join(" · ")}</p>
                <div className="mt-auto grid gap-2 pt-4 sm:grid-cols-2">
                  <button type="button" onClick={() => copyCode(item.code)} className="pressable inline-flex min-h-11 items-center justify-center gap-2 border border-forest-900/15 px-3 text-xs font-extrabold text-forest-950"><Copy size={15} aria-hidden="true" />Sao chép mã</button>
                  <a href={buildSupplierZaloInquiryUrl(ZALO_URL, item.supplierName, item.code)} target="_blank" rel="noopener noreferrer" className="pressable inline-flex min-h-11 items-center justify-center gap-2 bg-wood-500 px-3 text-xs font-extrabold text-white hover:bg-wood-600"><MessageCircle size={15} aria-hidden="true" />Gửi Zalo</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : <div className="mt-6 border border-dashed border-forest-900/20 bg-white px-6 py-10 text-center"><Search className="mx-auto text-wood-600" size={24} aria-hidden="true" /><p className="mt-4 font-extrabold text-forest-950">Chưa tìm thấy mã màu phù hợp</p><p className="mt-2 text-sm leading-6 text-slate-700">Thử một phần mã hoặc gửi mã cho Tùng Phát để kiểm tra thêm.</p></div>}

      {visibleResults.length < results.length ? <button type="button" onClick={() => setVisibleLimit((value) => value + PAGE_SIZE)} className="pressable mx-auto mt-6 flex min-h-12 items-center justify-center border border-forest-900/20 bg-white px-6 text-sm font-extrabold text-forest-950">Xem thêm {Math.min(PAGE_SIZE, results.length - visibleResults.length)} mã</button> : null}
    </section>
  );
}

export function AnCuongCatalogueSearch({ entries }: { entries: CatalogSearchEntry[] }) {
  return <SupplierColorCodeSearch entries={entries} supplierId="an-cuong" supplierLabel="An Cường" />;
}
