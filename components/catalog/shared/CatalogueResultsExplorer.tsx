"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { AutoLoadMore } from "@/components/catalog/shared/AutoLoadMore";
import { CatalogueMaterialCard } from "@/components/catalog/CatalogueMaterialCard";
import { useCatalogFilterRobots } from "@/components/catalog/useCatalogFilterRobots";
import { searchSupplierCatalog } from "@/lib/catalog/core/search";
import { supplierDefinitions } from "@/lib/catalog/core/registry";
import type { CatalogSearchEntry, CanonicalCatalogGroup, SupplierId } from "@/lib/catalog/core/types";
import { deriveCatalogueFacets, filterCatalogueEntries, type CatalogueFacetOptions, type CatalogueFacetState } from "@/lib/catalog/facets";
import { buildCatalogueUrlParams, hasCatalogueUrlFilters, hasCatalogueUrlStateParams, parseCatalogueUrlState, type CatalogueSort, type CatalogueUrlState } from "@/lib/catalog/facet-url-state";
import { canonicalCatalogGroups } from "@/lib/catalog/material-taxonomy";
import { findExactCatalogCodeMatch, formatCatalogCardTaxonomy, formatCatalogCardTitle } from "@/lib/catalog/ui";

const PAGE_SIZE = 48;
const PATTERN_LABELS = new Map(canonicalCatalogGroups.map((group) => [group.slug, group.label]));
const MATERIAL_LABELS: Record<string, string> = {
  melamine: "Melamine", laminate: "Laminate", acrylic: "Acrylic", veneer: "Veneer",
  pvc: "PVC", ppet: "PPET", worktop: "Mặt Top", "edge-banding": "Mã cạnh", panel: "Panel",
};

type Props = {
  entries: CatalogSearchEntry[];
  totalCount: number;
  initialFacets: CatalogueFacetOptions;
};

function labelFor(key: keyof CatalogueFacetState, value: string): string {
  if (key === "supplier") return supplierDefinitions.find((item) => item.id === value)?.displayName ?? value;
  if (key === "material") return MATERIAL_LABELS[value] ?? value;
  if (key === "pattern") return PATTERN_LABELS.get(value as CanonicalCatalogGroup) ?? value;
  return value;
}

function toggle(values: string[] = [], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function CatalogueResultsExplorer({ entries, totalCount, initialFacets }: Props) {
  const [loadedEntries, setLoadedEntries] = useState(entries);
  const [fullIndex, setFullIndex] = useState<CatalogSearchEntry[] | null>(null);
  const [indexRequested, setIndexRequested] = useState(false);
  const [indexLoading, setIndexLoading] = useState(false);
  const [indexError, setIndexError] = useState(false);
  const [retryIndex, setRetryIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<CatalogueFacetState>({ supplier: [], material: [], pattern: [], surfaceEffect: [] });
  const [sort, setSort] = useState<CatalogueSort>("relevance");
  const [hasUrlState, setHasUrlState] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const [pageNumber, setPageNumber] = useState(1);
  const [loadingBatch, setLoadingBatch] = useState(false);
  const batchLoadingRef = useRef(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const state: CatalogueUrlState = { ...filters, query, sort };
  const facetsAreActive = Boolean(query.trim() || filters.supplier?.length || filters.material?.length || filters.pattern?.length || filters.surfaceEffect?.length);
  const needsFullIndex = facetsAreActive || sort !== "relevance";
  const stateIsActive = hasCatalogueUrlFilters(state);
  useCatalogFilterRobots(hasUrlState);

  useEffect(() => {
    const restore = () => {
      const params = new URLSearchParams(window.location.search);
      const restored = parseCatalogueUrlState(params, initialFacets);
      const restoredFilters: CatalogueFacetState = {
        supplier: restored.supplier ?? [], material: restored.material ?? [],
        pattern: restored.pattern ?? [], surfaceEffect: restored.surfaceEffect ?? [],
      };
      setQuery(restored.query);
      setFilters(restoredFilters);
      setSort(restored.sort);
      setVisibleLimit(PAGE_SIZE);
      setHasUrlState(hasCatalogueUrlFilters(restored) || hasCatalogueUrlStateParams(params));
      if (hasCatalogueUrlFilters(restored)) setIndexRequested(true);
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [initialFacets]);

  useEffect(() => {
    if (!indexRequested || fullIndex) return;
    const controller = new AbortController();
    setIndexLoading(true);
    setIndexError(false);
    Promise.all(supplierDefinitions.map(async ({ id }) => {
      const response = await fetch(`/data/catalogue-search-${id}.json`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Catalogue index request failed: ${response.status}`);
      return response.json() as Promise<CatalogSearchEntry[]>;
    })).then((indexes) => {
      const unique = new Map<string, CatalogSearchEntry>();
      for (const entry of indexes.flat()) {
        if (entry.kind === "color-code") unique.set(entry.id ?? `${entry.supplierId}:${entry.code}:${entry.canonicalRoute}`, entry);
      }
      setFullIndex([...unique.values()]);
    }).catch((error) => {
      if (error.name !== "AbortError") setIndexError(true);
    }).finally(() => {
      if (!controller.signal.aborted) setIndexLoading(false);
    });
    return () => controller.abort();
  }, [fullIndex, indexRequested, retryIndex]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (filterDialogOpen && !dialog.open) dialog.showModal();
    if (!filterDialogOpen && dialog.open) dialog.close();
  }, [filterDialogOpen]);

  const sourceEntries = fullIndex ?? loadedEntries;
  const searched = useMemo(() => searchSupplierCatalog(sourceEntries, deferredQuery).filter((entry) => entry.kind === "color-code"), [deferredQuery, sourceEntries]);
  const filtered = useMemo(() => filterCatalogueEntries(searched, filters), [filters, searched]);
  const results = useMemo(() => {
    if (sort === "relevance") return filtered;
    return [...filtered].sort((a, b) => {
      const left = sort === "code" ? (a.normalizedCode ?? a.code) : a.name;
      const right = sort === "code" ? (b.normalizedCode ?? b.code) : b.name;
      return left.localeCompare(right, "vi", { numeric: true }) || a.supplierName.localeCompare(b.supplierName, "vi");
    });
  }, [filtered, sort]);
  const activeFacetOptions = useMemo(
    () => fullIndex ? deriveCatalogueFacets(searched, filters) : initialFacets,
    [filters, fullIndex, initialFacets, searched],
  );
  const resultsReady = !needsFullIndex || Boolean(fullIndex);
  const visibleResults = resultsReady ? results.slice(0, visibleLimit) : [];
  const supplierOnly = !query.trim() && !filters.material?.length && !filters.pattern?.length && !filters.surfaceEffect?.length;
  const initialSupplierCount = filters.supplier?.length
    ? initialFacets.supplier.filter((option) => filters.supplier?.includes(option.value as SupplierId)).reduce((sum, item) => sum + item.count, 0)
    : totalCount;
  const exactResultCount = fullIndex ? results.length : !facetsAreActive ? totalCount : supplierOnly ? initialSupplierCount : undefined;
  const countsReady = Boolean(fullIndex) || !facetsAreActive;
  const tabsCanShowCounts = Boolean(fullIndex) || !query.trim() && !filters.material?.length && !filters.pattern?.length && !filters.surfaceEffect?.length;
  const allBrandsCount = activeFacetOptions.supplier.reduce((sum, item) => sum + item.count, 0);

  function applyState(next: CatalogueUrlState, mode: "push" | "replace" = "replace") {
    setQuery(next.query);
    setFilters({ supplier: next.supplier ?? [], material: next.material ?? [], pattern: next.pattern ?? [], surfaceEffect: next.surfaceEffect ?? [] });
    setSort(next.sort);
    const active = hasCatalogueUrlFilters(next);
    setHasUrlState(active);
    if (active) setIndexRequested(true);
    const params = buildCatalogueUrlParams(new URLSearchParams(window.location.search), next);
    const search = params.toString();
    const url = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
    window.history[mode === "push" ? "pushState" : "replaceState"](window.history.state, "", url);
    setVisibleLimit(PAGE_SIZE);
  }

  function changeFacet(key: keyof CatalogueFacetState, value: string) {
    const nextList = toggle((filters[key] ?? []) as string[], value);
    const next = { ...state, [key]: nextList } as CatalogueUrlState;
    applyState(next, "push");
  }

  function clearFacet(key: keyof CatalogueFacetState, value: string) {
    const next = { ...state, [key]: ((filters[key] ?? []) as string[]).filter((item) => item !== value) } as CatalogueUrlState;
    applyState(next, "push");
  }

  async function loadMore() {
    if (batchLoadingRef.current) return;
    batchLoadingRef.current = true;
    setLoadingBatch(true);
    try {
      if (!fullIndex && !needsFullIndex && loadedEntries.length < totalCount) {
        const nextPage = pageNumber + 1;
        const response = await fetch(`/data/catalogue-pages/page-${nextPage}.json`);
        if (!response.ok) throw new Error(`Catalogue batch request failed: ${response.status}`);
        const batch = await response.json() as CatalogSearchEntry[];
        setLoadedEntries((current) => {
          const ids = new Set(current.map((entry) => entry.id));
          return [...current, ...batch.filter((entry) => !ids.has(entry.id))];
        });
        setPageNumber(nextPage);
      }
      setVisibleLimit((current) => current + PAGE_SIZE);
    } finally {
      batchLoadingRef.current = false;
      setLoadingBatch(false);
    }
  }

  function renderFacet(key: keyof CatalogueFacetState, title: string, options: Array<{ value: string; count: number }>, prefix: string) {
    const selected = (filters[key] ?? []) as string[];
    if (options.length === 0 && selected.length === 0) return null;
    const visibleOptions = [...options];
    for (const value of selected) if (!visibleOptions.some((option) => option.value === value)) visibleOptions.push({ value, count: 0 });
    return <details key={`${prefix}-${key}`} open className="border-b border-slate-200 py-3 last:border-b-0">
      <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-500">
        <span>{title}</span><span aria-hidden="true" className="text-slate-500">⌄</span>
      </summary>
      <fieldset className="mt-2 space-y-1">
        <legend className="sr-only">Lọc theo {title.toLocaleLowerCase("vi-VN")}</legend>
        {visibleOptions.map((option) => {
          const id = `${prefix}-${key}-${option.value.replace(/[^a-z0-9]+/gi, "-")}`;
          return <label key={option.value} htmlFor={id} className="flex min-h-9 cursor-pointer items-center gap-2 rounded px-1 text-sm text-slate-800 hover:bg-slate-50">
            <input id={id} type="checkbox" checked={selected.includes(option.value)} onChange={() => changeFacet(key, option.value)} className="h-4 w-4 accent-forest-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wood-600" />
            <span className="min-w-0 flex-1">{labelFor(key, option.value)}</span>
            <span className="tabular-nums text-xs text-slate-500">{countsReady ? option.count.toLocaleString("vi-VN") : "…"}</span>
          </label>;
        })}
      </fieldset>
    </details>;
  }

  function filterPanel(prefix: string) {
    return <div className="px-4 pb-3">
      <div className="flex items-center justify-between border-b border-slate-200 py-3">
        <h2 className="text-base font-bold text-slate-950">Bộ lọc</h2>
        {stateIsActive ? <button type="button" onClick={() => applyState({ query: "", sort: "relevance", supplier: [], material: [], pattern: [], surfaceEffect: [] }, "push")} className="min-h-9 text-xs font-semibold text-forest-900 underline underline-offset-2">Xóa tất cả</button> : null}
      </div>
      {renderFacet("supplier", "Thương hiệu", activeFacetOptions.supplier, prefix)}
      {renderFacet("material", "Loại mã / bề mặt", activeFacetOptions.material, prefix)}
      {renderFacet("pattern", "Nhóm vân", activeFacetOptions.pattern, prefix)}
      {renderFacet("surfaceEffect", "Hiệu ứng bề mặt", activeFacetOptions.surfaceEffect, prefix)}
    </div>;
  }

  const selectedChips = (Object.keys(filters) as Array<keyof CatalogueFacetState>).flatMap((key) =>
    ((filters[key] ?? []) as string[]).map((value) => ({ key, value, label: labelFor(key, value) })),
  );
  const activeCount = selectedChips.length + (query.trim() ? 1 : 0);
  const canLoadMore = resultsReady && visibleResults.length < (exactResultCount ?? 0);

  return <section aria-label="Tra cứu mã màu">
    <div className="border-b border-slate-200 bg-white py-4 sm:py-5">
      <form role="search" onSubmit={(event) => event.preventDefault()} className="relative">
        <Search aria-hidden="true" size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-forest-900" />
        <label htmlFor="catalogue-search" className="sr-only">Tìm theo mã màu, tên màu hoặc thương hiệu</label>
        <input id="catalogue-search" type="search" value={query} onChange={(event) => applyState({ ...state, query: event.target.value }, "replace")} onKeyDown={(event) => {
          if (event.key === "Escape") applyState({ ...state, query: "" }, "replace");
          if (event.key === "Enter" && fullIndex) {
            const exact = findExactCatalogCodeMatch(filtered, query);
            if (exact) window.location.assign(exact.canonicalRoute);
          }
        }} placeholder="Nhập mã hoặc tên màu" autoComplete="off" className="h-12 w-full rounded border border-slate-300 bg-white pl-11 pr-12 text-sm text-slate-950 outline-none placeholder:text-slate-500 focus:border-forest-900 focus:ring-2 focus:ring-forest-900/15" />
        {query ? <button type="button" aria-label="Xóa nội dung tìm kiếm" onClick={() => applyState({ ...state, query: "" }, "replace")} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-wood-600"><X size={17} aria-hidden="true" /></button> : null}
      </form>

      <div role="group" aria-label="Lọc theo thương hiệu" className="mt-3 flex gap-2 overflow-x-auto pb-1">
        <button type="button" aria-pressed={!filters.supplier?.length} onClick={() => applyState({ ...state, supplier: [] }, "push")} className={`min-h-10 shrink-0 rounded px-4 text-sm font-semibold ${!filters.supplier?.length ? "bg-forest-900 text-white" : "border border-slate-300 text-slate-800 hover:border-forest-900"}`}>
          Tất cả <span className="ml-1 text-xs opacity-80">{tabsCanShowCounts ? allBrandsCount.toLocaleString("vi-VN") : "…"}</span>
        </button>
        {supplierDefinitions.map((supplier) => {
          const active = filters.supplier?.length === 1 && filters.supplier[0] === supplier.id;
          const count = (fullIndex ? activeFacetOptions.supplier : initialFacets.supplier).find((item) => item.value === supplier.id)?.count ?? 0;
          return <button key={supplier.id} type="button" aria-pressed={active} onClick={() => applyState({ ...state, supplier: [supplier.id as SupplierId] }, "push")} className={`min-h-10 shrink-0 rounded px-4 text-sm font-semibold ${active ? "bg-forest-900 text-white" : "border border-slate-300 text-slate-800 hover:border-forest-900"}`}>
            {supplier.displayName} <span className="ml-1 text-xs opacity-80">{tabsCanShowCounts ? count.toLocaleString("vi-VN") : "…"}</span>
          </button>;
        })}
      </div>
    </div>

    <div className="mt-4 flex items-center justify-between gap-3 lg:hidden">
      <button type="button" onClick={() => setFilterDialogOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 focus-visible:outline-2 focus-visible:outline-wood-600">
        <SlidersHorizontal size={16} aria-hidden="true" /> Bộ lọc {activeCount ? <span className="rounded-full bg-forest-900 px-2 py-0.5 text-xs text-white">{activeCount}</span> : null}
      </button>
      <p className="text-sm font-semibold text-slate-700" aria-live="polite">{exactResultCount === undefined ? "Đang tính kết quả…" : `${exactResultCount.toLocaleString("vi-VN")} mã`}</p>
    </div>

    {selectedChips.length || query.trim() ? <div className="mt-3 flex flex-wrap gap-2" aria-label="Bộ lọc đang chọn">
      {query.trim() ? <button type="button" onClick={() => applyState({ ...state, query: "" }, "push")} className="inline-flex min-h-8 items-center gap-1 rounded-full bg-slate-100 px-3 text-xs text-slate-800">Từ khóa: {query}<X size={13} aria-hidden="true" /></button> : null}
      {selectedChips.map((chip) => <button key={`${chip.key}-${chip.value}`} type="button" onClick={() => clearFacet(chip.key, chip.value)} className="inline-flex min-h-8 items-center gap-1 rounded-full bg-slate-100 px-3 text-xs text-slate-800">{chip.label}<X size={13} aria-hidden="true" /></button>)}
      <button type="button" onClick={() => applyState({ query: "", sort: "relevance", supplier: [], material: [], pattern: [], surfaceEffect: [] }, "push")} className="min-h-8 px-2 text-xs font-semibold text-forest-900 underline underline-offset-2">Xóa bộ lọc</button>
    </div> : null}

    <div className="mt-4 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-6">
      <aside aria-label="Bộ lọc catalogue" className="hidden rounded border border-slate-200 bg-white lg:sticky lg:top-[calc(var(--site-header-height)+1rem)] lg:block lg:max-h-[calc(100dvh-var(--site-header-height)-2rem)] lg:overflow-y-auto lg:overscroll-contain">
        {filterPanel("desktop")}
      </aside>

      <div className="min-w-0">
        <h2 className="sr-only lg:hidden">{exactResultCount === undefined ? "Đang tính kết quả…" : `${exactResultCount.toLocaleString("vi-VN")} mã màu`}</h2>
        <header className="hidden items-center justify-between gap-4 lg:flex">
          <h2 className="text-xl font-bold text-slate-950" aria-live="polite">{exactResultCount === undefined ? "Đang tính kết quả…" : `${exactResultCount.toLocaleString("vi-VN")} mã màu`}</h2>
          <label className="flex items-center gap-2 text-sm text-slate-600">Sắp xếp
            <select value={sort} onChange={(event) => applyState({ ...state, sort: event.target.value as CatalogueSort }, "push")} className="h-10 rounded border border-slate-300 bg-white px-3 font-medium text-slate-900 focus-visible:outline-2 focus-visible:outline-wood-600">
              <option value="relevance">Phù hợp</option><option value="code">Mã A–Z</option><option value="name">Tên A–Z</option>
            </select>
          </label>
        </header>
        <label className="mb-3 mt-3 flex items-center justify-end gap-2 text-sm text-slate-600 lg:hidden">Sắp xếp
          <select value={sort} onChange={(event) => applyState({ ...state, sort: event.target.value as CatalogueSort }, "push")} className="h-10 rounded border border-slate-300 bg-white px-3 font-medium text-slate-900"><option value="relevance">Phù hợp</option><option value="code">Mã A–Z</option><option value="name">Tên A–Z</option></select>
        </label>

        {indexLoading && needsFullIndex && !fullIndex ? <p role="status" aria-live="polite" className="my-4 text-sm text-slate-600">Đang tải chỉ mục để tính kết quả chính xác…</p> : null}
        {indexError ? <div role="alert" className="my-4 flex flex-wrap items-center gap-3 border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"><span>Chưa tải được dữ liệu lọc.</span><button type="button" onClick={() => { setIndexError(false); setIndexRequested(true); setRetryIndex((value) => value + 1); }} className="font-semibold underline underline-offset-2">Thử lại</button></div> : null}

        {indexLoading && needsFullIndex && !fullIndex ? <div aria-hidden="true" className="mt-3 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => <div key={index} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="aspect-[2/1] animate-pulse bg-slate-100 motion-reduce:animate-none" />
            <div className="space-y-2 p-4"><div className="h-4 w-3/4 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" /><div className="h-3 w-1/2 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" /></div>
          </div>)}
        </div> : null}

        {visibleResults.length ? <div role="region" aria-label="Kết quả mã màu" aria-busy={loadingBatch} className="mt-3 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
          {visibleResults.map((entry, index) => <CatalogueMaterialCard key={entry.id ?? entry.canonicalRoute} deferImages href={entry.canonicalRoute} supplierId={entry.supplierId} supplierName={entry.supplierName} code={entry.code} title={formatCatalogCardTitle(entry)} taxonomy={formatCatalogCardTaxonomy(entry)} thumbnail={entry.thumbnail} priorityImage={index === 0 && visibleLimit === PAGE_SIZE} showSupplierLogo={false} showSupplierName />)}
        </div> : null}

        {resultsReady && !visibleResults.length ? <div className="my-8 border-y border-slate-200 py-10 text-center"><h3 className="text-base font-semibold text-slate-950">Không tìm thấy mã phù hợp</h3><p className="mt-2 text-sm text-slate-600">Thử đổi từ khóa hoặc bỏ bớt một điều kiện lọc.</p><button type="button" onClick={() => applyState({ query: "", sort: "relevance", supplier: [], material: [], pattern: [], surfaceEffect: [] }, "push")} className="mt-4 min-h-10 rounded border border-slate-300 px-4 text-sm font-semibold text-forest-900 hover:bg-slate-50">Xóa tìm kiếm và bộ lọc</button></div> : null}

        {canLoadMore ? <AutoLoadMore hasMore onLoadMore={loadMore} remaining={(exactResultCount ?? 0) - visibleResults.length} pageSize={PAGE_SIZE} /> : null}
        {resultsReady && !facetsAreActive && loadedEntries.length < totalCount ? <p className="mt-5 text-center text-sm"><Link href="/catalogue/page/2/" className="text-forest-900 underline underline-offset-4">Mở danh sách catalogue theo trang</Link></p> : null}
        {resultsReady && exactResultCount === 0 ? <p className="sr-only" role="status">Không có mã màu phù hợp.</p> : null}
      </div>
    </div>

    <dialog ref={dialogRef} onClose={() => setFilterDialogOpen(false)} aria-label="Bộ lọc mã màu" className="m-auto max-h-[90dvh] w-[min(32rem,calc(100vw-1rem))] overflow-hidden rounded-lg p-0 shadow-xl backdrop:bg-black/40">
      <div className="flex max-h-[90dvh] flex-col bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3"><p className="font-bold text-slate-950">Bộ lọc</p><button type="button" aria-label="Đóng bộ lọc" onClick={() => setFilterDialogOpen(false)} className="grid h-10 w-10 place-items-center rounded hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-wood-600"><X size={19} aria-hidden="true" /></button></div>
        <div className="min-h-0 flex-1 overflow-y-auto">{filterPanel("mobile")}</div>
        <div className="flex gap-3 border-t border-slate-200 p-3"><button type="button" onClick={() => applyState({ query: "", sort: "relevance", supplier: [], material: [], pattern: [], surfaceEffect: [] }, "push")} className="min-h-11 flex-1 rounded border border-slate-300 text-sm font-semibold">Xóa</button><button type="button" onClick={() => setFilterDialogOpen(false)} className="min-h-11 flex-[2] rounded bg-forest-900 text-sm font-semibold text-white">Xem {exactResultCount === undefined ? "kết quả" : `${exactResultCount.toLocaleString("vi-VN")} mã`}</button></div>
      </div>
    </dialog>
  </section>;
}
