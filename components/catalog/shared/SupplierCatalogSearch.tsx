"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Info,
  Search,
} from "lucide-react";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CatalogueMaterialCard } from "@/components/catalog/CatalogueMaterialCard";
import { useCatalogFilterRobots } from "@/components/catalog/useCatalogFilterRobots";
import {
  getCatalogSearchOptionsForSelection,
  searchSupplierCatalog,
  type CatalogSearchIntent,
} from "@/lib/catalog/core/search";
import { supplierDefinitions } from "@/lib/catalog/core/registry";
import type { CatalogSearchEntry, SupplierId } from "@/lib/catalog/core/types";
import { materialTaxonomyOptionsForSupplier } from "@/lib/catalog/material-taxonomy";
import {
  findExactCatalogCodeMatch,
  findExactSupplierMatch,
  formatCatalogCardTaxonomy,
  formatCatalogCardTitle,
} from "@/lib/catalog/ui";
import {
  buildCatalogSearchParams,
  isCatalogFilterStateActive,
  parseCatalogUrlState,
} from "@/lib/catalog/url-state";
import { AutoLoadMore } from "@/components/catalog/shared/AutoLoadMore";

const PAGE_SIZE = 48;

type PrimarySelection = {
  value: string;
  label: string;
  count?: number;
  type: CatalogSearchIntent;
  group: string;
};

const supplierOptions = supplierDefinitions.map((supplier) => ({
  value: supplier.id,
  label: supplier.displayName,
}));
export function SupplierCatalogSearch({
  entries,
}: {
  entries: CatalogSearchEntry[];
}) {
  const [query, setQuery] = useState("");
  const [supplierId, setSupplierId] = useState<SupplierId | "">("");
  const [type, setType] = useState<CatalogSearchIntent>("all");
  const [group, setGroup] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const deferredQuery = useDeferredValue(query);
  const primarySelections: PrimarySelection[] = useMemo(() => [
    ...materialTaxonomyOptionsForSupplier(entries, supplierId).map((option) => ({
      value: option.slug,
      label: option.label,
      count: option.count,
      type: "all" as const,
      group: option.slug === "all" ? "" : option.slug,
    })),
    { value: "supplier", label: "Theo thương hiệu", type: "supplier" as const, group: "" },
  ], [entries, supplierId]);

  const activeSelection =
    type === "supplier"
      ? "supplier"
      : type === "melamine"
        ? "melamine"
        : group || "all";
  const currentState = { query, supplierId, type, group };
  const hasSearchIntent =
    isCatalogFilterStateActive(currentState) && type !== "supplier";
  const showSupplierDirectory = type === "supplier" && !query.trim();
  const showAllResults = !query.trim() && !supplierId && type === "all" && !group;

  useEffect(() => {
    const restoreFromUrl = () => {
      const restored = parseCatalogUrlState(
        new URLSearchParams(window.location.search),
      );
      setQuery(restored.query);
      setSupplierId(restored.supplierId);
      setType(restored.type);
      setGroup(restored.group);
    };
    restoreFromUrl();
    window.addEventListener("popstate", restoreFromUrl);
    return () => window.removeEventListener("popstate", restoreFromUrl);
  }, []);

  useEffect(() => {
    setVisibleLimit(PAGE_SIZE);
  }, [group, query, supplierId, type]);

  useCatalogFilterRobots(hasSearchIntent || showSupplierDirectory);

  function updateUrl(
    next: {
      query?: string;
      supplierId?: SupplierId | "";
      type?: CatalogSearchIntent;
      group?: string;
    },
    mode: "push" | "replace" = "replace",
  ) {
    const values = {
      query: next.query ?? query,
      supplierId: next.supplierId ?? supplierId,
      type: next.type ?? type,
      group: next.group ?? group,
    };
    const parameters = buildCatalogSearchParams(
      new URLSearchParams(window.location.search),
      values,
    );
    const search = parameters.toString();
    const url = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
    window.history[mode === "push" ? "pushState" : "replaceState"](
      window.history.state,
      "",
      url,
    );
  }

  const results = useMemo(
    () =>
      searchSupplierCatalog(entries, deferredQuery, {
        supplierId: supplierId || undefined,
        ...getCatalogSearchOptionsForSelection(group, type),
      }),
    [deferredQuery, entries, group, supplierId, type],
  );
  const featured = useMemo(
    () => searchSupplierCatalog(entries, "", { type: "melamine" }).slice(0, 8),
    [entries],
  );
  const supplierMatch = findExactSupplierMatch(supplierDefinitions, query);
  const exactSupplier =
    supplierMatch && (!supplierId || supplierMatch.id === supplierId)
      ? supplierMatch
      : undefined;
  const visibleResults =
    (hasSearchIntent || showAllResults) && !exactSupplier
      ? results.slice(0, visibleLimit)
      : featured;

  function updateQuery(value: string) {
    setQuery(value);
    updateUrl({ query: value });
  }

  function selectPrimary(selection: PrimarySelection) {
    setType(selection.type);
    setGroup(selection.group);
    updateUrl({ type: selection.type, group: selection.group }, "push");
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      updateQuery("");
      return;
    }
    if (event.key !== "Enter") return;
    const currentResults = searchSupplierCatalog(entries, query, {
      supplierId: supplierId || undefined,
      ...getCatalogSearchOptionsForSelection(group, type),
    });
    const exact = findExactCatalogCodeMatch(currentResults, query);
    if (!exact) return;
    event.preventDefault();
    window.location.assign(exact.canonicalRoute);
  }

  return (
    <section aria-labelledby="supplier-search-title">
      <h2 id="supplier-search-title" className="sr-only">
        Tìm mã màu
      </h2>
      <div
        data-testid="catalogue-search-original"
        className="rounded-xl border border-forest-900/10 bg-white p-4 shadow-[0_18px_50px_rgba(7,59,40,.08)] sm:p-6 lg:p-7"
      >
        <label className="block">
          <span className="mb-2.5 block text-xs font-extrabold uppercase tracking-[.15em] text-forest-900">
            Tra cứu mã màu
          </span>
          <span className="relative block">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-wood-600"
              size={22}
              strokeWidth={1.8}
            />
            <input
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              type="search"
              aria-label="Nhập mã màu, tên màu hoặc thương hiệu..."
              autoComplete="off"
              spellCheck={false}
              placeholder="Nhập mã màu, tên màu hoặc thương hiệu..."
              className="min-h-16 w-full rounded-lg border border-forest-900/20 bg-[#fbfaf6] py-4 pl-14 pr-5 text-base font-semibold text-forest-950 shadow-inner shadow-forest-950/[.025] outline-none transition-[border-color,box-shadow,background-color] placeholder:font-medium placeholder:text-slate-500 focus:border-wood-500 focus:bg-white focus:ring-2 focus:ring-wood-500/20"
            />
          </span>
        </label>

        <div className="mt-6">
          <p className="text-xs font-extrabold uppercase tracking-[.15em] text-slate-600">
            Chọn nhóm vật liệu
          </p>
          <div
            role="group"
            aria-label="Chọn loại vật liệu"
            className="mt-3 flex flex-wrap gap-2.5 pb-1"
          >
            {primarySelections.map((selection) => {
              const active = activeSelection === selection.value;
              return (
                <button
                  key={selection.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectPrimary(selection)}
                  className={`pressable inline-flex min-h-11 min-w-0 max-w-full items-center gap-2 rounded-full border px-4 text-left text-sm font-extrabold ${active ? "border-forest-900 bg-forest-900 text-white shadow-sm" : "border-forest-900/15 bg-white text-forest-950 hover:border-wood-500 hover:bg-[#fffaf3]"}`}
                >
                  <span>{selection.label}</span>
                  {selection.count !== undefined ? (
                    <span
                      className={`text-xs tabular-nums ${active ? "text-white/70" : "text-slate-500"}`}
                    >
                      {selection.count.toLocaleString("vi-VN")}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 grid gap-4 border-t border-forest-900/10 pt-5 md:grid-cols-[minmax(0,280px)_1fr] md:items-end">
          <label className="block">
            <span className="mb-2 block text-xs font-extrabold uppercase tracking-[.14em] text-slate-600">
              Lọc theo nhà cung cấp
            </span>
            <span className="relative block">
              <select
                value={supplierId}
                onChange={(event) => {
                  const value = event.target.value as SupplierId | "";
                  setSupplierId(value);
                  updateUrl({ supplierId: value }, "push");
                }}
                className="min-h-12 w-full appearance-none rounded-lg border border-forest-900/20 bg-white px-4 pr-11 text-sm font-bold text-forest-950 outline-none focus:border-wood-500 focus:ring-2 focus:ring-wood-500/20"
              >
                <option value="">Tất cả nhà cung cấp</option>
                {supplierOptions.map((supplier) => (
                  <option key={supplier.value} value={supplier.value}>
                    {supplier.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-forest-900/60"
                size={17}
                aria-hidden="true"
              />
            </span>
          </label>
          <div className="flex min-h-12 items-start gap-3 rounded-lg border border-forest-900/10 bg-[#f5f7f3] px-4 py-3 text-xs leading-5 text-slate-600">
            <Info
              className="mt-0.5 shrink-0 text-forest-800"
              size={16}
              aria-hidden="true"
            />
            <p>
              Mặc định ưu tiên ý định tra mã Melamine, nhóm bề mặt và mức độ
              đầy đủ của dữ liệu. A–Z chỉ dùng khi các mục có cùng điểm.
            </p>
          </div>
        </div>
      </div>

      {exactSupplier ? (
        <Link
          href={exactSupplier.cataloguePath}
          aria-label={`Khớp chính xác, nhà cung cấp ${exactSupplier.displayName}, mở catalogue`}
          className="pressable mt-6 flex min-h-32 flex-col justify-between border border-wood-500/40 bg-[#fff8ee] p-5 hover:border-wood-600 focus-visible:ring-2 focus-visible:ring-wood-600 sm:flex-row sm:items-center sm:gap-8 sm:p-6"
        >
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-wood-600">
              Khớp chính xác · Nhà cung cấp
            </p>
            <h3 className="mt-2 text-2xl font-extrabold text-forest-950">
              {exactSupplier.displayName}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
              Mở trang riêng để xem phạm vi dữ liệu và các nhóm vật liệu hiện
              có.
            </p>
          </div>
          <span className="mt-4 inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-extrabold text-forest-950 sm:mt-0">
            Mở mã màu <ArrowRight size={16} aria-hidden="true" />
          </span>
        </Link>
      ) : showSupplierDirectory ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {supplierDefinitions.map((supplier) => (
            <Link
              key={supplier.id}
              href={supplier.cataloguePath}
              className="pressable border border-forest-900/10 bg-white p-5 hover:border-wood-500/50 hover:shadow-card focus-visible:ring-2 focus-visible:ring-wood-600"
            >
              <p className="text-xs font-extrabold uppercase tracking-[.14em] text-wood-600">
                Thương hiệu
              </p>
              <h3 className="mt-2 text-lg font-extrabold text-forest-950">
                {supplier.displayName}
              </h3>
              <span className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-forest-950">
                Mở mã màu <ArrowRight size={16} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <>
          <div className="mt-10 flex flex-wrap items-end justify-between gap-4 sm:mt-12">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-wood-600">
                {hasSearchIntent || showAllResults
                  ? "Kết quả phù hợp"
                  : "Gợi ý bắt đầu"}
              </p>
              <h3 className="mt-2 text-2xl font-extrabold tracking-[-.025em] text-forest-950 sm:text-3xl">
                {hasSearchIntent || showAllResults
                  ? `${results.length.toLocaleString("vi-VN")} mã màu`
                  : "Bắt đầu từ các mã có dữ liệu đầy đủ"}
              </h3>
            </div>
            {!hasSearchIntent && !showAllResults ? (
              <Link
                href="/ma-mau-melamine/ba-thanh/"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-forest-950 hover:text-wood-600"
              >
                Xem toàn bộ mã Melamine{" "}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            ) : null}
          </div>

          {visibleResults.length ? (
            <div
              role="region"
              aria-label="Kết quả mã màu"
              className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-5"
            >
              {visibleResults.map((entry) => (
                <CatalogueMaterialCard
                  key={entry.id ?? `${entry.supplierId}:${entry.code}:${entry.canonicalRoute}`}
                  href={entry.canonicalRoute}
                  supplierId={entry.supplierId}
                  supplierName={entry.supplierName}
                  code={entry.code}
                  title={formatCatalogCardTitle(entry)}
                  taxonomy={formatCatalogCardTaxonomy(entry)}
                  thumbnail={entry.thumbnail}
                />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-forest-900/20 bg-white px-6 py-14 text-center text-sm text-slate-700">
              <Search
                className="mx-auto text-wood-600"
                size={24}
                aria-hidden="true"
              />
              <p className="mt-4 font-extrabold text-forest-950">
                Chưa tìm thấy mã phù hợp
              </p>
              <p className="mx-auto mt-2 max-w-xl leading-6">
                Thử bỏ khoảng trắng hoặc dấu gạch, đổi nhóm vật liệu, hoặc gửi
                mã cho Tùng Phát để kiểm tra thêm.
              </p>
            </div>
          )}
          {(hasSearchIntent || showAllResults) && visibleResults.length < results.length ? (
            <AutoLoadMore
              hasMore={visibleResults.length < results.length}
              onLoadMore={() => setVisibleLimit((value) => value + PAGE_SIZE)}
              remaining={results.length - visibleResults.length}
              pageSize={PAGE_SIZE}
            />
          ) : null}
        </>
      )}
    </section>
  );
}
