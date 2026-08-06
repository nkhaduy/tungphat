"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle, Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { searchSupplierCatalog } from "@/lib/catalog/core/search";
import type { CatalogSearchEntry } from "@/lib/catalog/core/types";
import { buildSupplierZaloInquiryUrl } from "@/lib/catalog/inquiry";
import { materialTaxonomyOptions } from "@/lib/catalog/material-taxonomy";
import {
  buildCatalogCollectionSearchParams,
  parseCatalogCollectionUrlState,
} from "@/lib/catalog/url-state";
import { ZALO_URL } from "@/lib/seo";

const PAGE_SIZE = 48;

export function AnCuongCatalogueSearch({ entries }: { entries: CatalogSearchEntry[] }) {
  const [query, setQuery] = useState("");
  const [material, setMaterial] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const deferredQuery = useDeferredValue(query);
  const materialOptions = useMemo(() => materialTaxonomyOptions(entries), [entries]);
  const results = useMemo(
    () => searchSupplierCatalog(entries, deferredQuery, {
      supplierId: "an-cuong",
      material: material || undefined,
    }),
    [deferredQuery, entries, material],
  );
  const visibleResults = results.slice(0, visibleLimit);

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
    const parameters = buildCatalogCollectionSearchParams(
      new URLSearchParams(window.location.search),
      { query: value, group: "" },
    );
    const search = parameters.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`);
  }

  return (
    <section aria-labelledby="an-cuong-catalogue-search-title" className="mt-6">
      <h2 id="an-cuong-catalogue-search-title" className="sr-only">
        Tra cứu catalogue An Cường
      </h2>
      <div className="border border-forest-900/10 bg-white p-4 shadow-card sm:p-5">
        <label className="relative block">
          <span className="sr-only">Tìm mã, tên hoặc dòng vật liệu An Cường</span>
          <Search aria-hidden="true" size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-forest-900/55" />
          <input
            type="search"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Escape") updateQuery(""); }}
            placeholder="Tìm mã, tên hoặc dòng vật liệu An Cường"
            autoComplete="off"
            spellCheck={false}
            className="min-h-14 w-full border border-forest-900/15 bg-[#fbfaf6] pl-11 pr-4 text-base font-semibold text-forest-950 outline-none focus-visible:border-wood-500 focus-visible:ring-2 focus-visible:ring-wood-500/20"
          />
        </label>
        <div role="group" aria-label="Lọc vật liệu An Cường" className="-mx-1 mt-4 flex snap-x gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
          {materialOptions.map((option) => {
            const value = option.slug === "all" ? "" : option.slug;
            const active = material === value;
            return (
              <button
                key={option.slug}
                type="button"
                aria-pressed={active}
                onClick={() => { setMaterial(value); setVisibleLimit(PAGE_SIZE); }}
                className={`pressable min-h-11 shrink-0 snap-start border px-4 text-sm font-extrabold ${active ? "border-forest-900 bg-forest-900 text-white" : "border-forest-900/15 bg-white text-forest-950"}`}
              >
                {option.label} ({option.count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 border-l-2 border-wood-500 bg-[#fffdf8] px-5 py-4">
        <h2 className="text-lg font-extrabold text-forest-950">{entries.length} mục tra cứu · {results.length} mục phù hợp</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
          Tra cứu theo mã thật, tên, dòng sản phẩm và nhóm vật liệu. Các mục nguồn-only mở về hub hoặc trang nhóm để tránh tạo trang sản phẩm mỏng.
        </p>
      </div>

      {visibleResults.length ? (
        <div role="region" aria-label="Kết quả catalogue An Cường" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleResults.map((item) => (
            <article key={item.id ?? `${item.name}:${item.code}`} className="flex min-h-[230px] flex-col border border-forest-900/10 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                {item.thumbnail ? (
                  <Image src={item.thumbnail} alt="" width={72} height={48} className="h-12 w-[72px] shrink-0 object-contain" />
                ) : (
                  <span className="grid h-12 w-[72px] shrink-0 place-items-center border border-dashed border-forest-900/15 bg-[#f7f8f5] px-2 text-center text-[.6rem] font-bold leading-4 text-slate-500">
                    Chưa có swatch cục bộ
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-[.65rem] font-extrabold uppercase tracking-[.13em] text-wood-600">An Cường · {item.recordType === "sku" ? "Mã vật liệu" : item.recordType === "family" ? "Dòng sản phẩm" : "Tài liệu"}</p>
                  {item.code ? <p className="mt-2 break-words font-mono text-base font-extrabold text-forest-950" translate="no">{item.code}</p> : null}
                </div>
              </div>
              <h3 className="mt-4 text-base font-extrabold leading-6 text-forest-950">{item.name}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-600">{[item.category, item.series].filter(Boolean).join(" · ")}</p>
              {item.formats?.length ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">Quy cách nguồn: {item.formats.join(" · ")}</p> : null}
              <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2">
                <Link href={item.canonicalRoute} className="pressable inline-flex min-h-11 items-center justify-center gap-2 border border-forest-900/15 px-3 text-xs font-extrabold text-forest-950">
                  Xem nhóm <ArrowRight size={15} aria-hidden="true" />
                </Link>
                <a
                  href={buildSupplierZaloInquiryUrl(ZALO_URL, "An Cường", item.code || undefined)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pressable inline-flex min-h-11 items-center justify-center gap-2 bg-wood-500 px-3 text-xs font-extrabold text-white hover:bg-wood-600"
                >
                  <MessageCircle size={15} aria-hidden="true" />
                  {item.code ? "Gửi mã qua Zalo" : "Nhắn Zalo tư vấn"}
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 border border-dashed border-forest-900/20 bg-white px-6 py-10 text-center">
          <p className="font-extrabold text-forest-950">Chưa tìm thấy mục phù hợp</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">Thử một phần mã, tên hoặc đổi nhóm vật liệu, sau đó gửi yêu cầu để Tùng Phát kiểm tra.</p>
        </div>
      )}

      {visibleResults.length < results.length ? (
        <button type="button" onClick={() => setVisibleLimit((value) => value + PAGE_SIZE)} className="pressable mx-auto mt-6 flex min-h-12 items-center justify-center border border-forest-900/20 bg-white px-6 text-sm font-extrabold text-forest-950">
          Xem thêm {Math.min(PAGE_SIZE, results.length - visibleResults.length)} mục
        </button>
      ) : null}
    </section>
  );
}
