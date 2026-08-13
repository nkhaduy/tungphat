"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown, Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { CatalogueMaterialCard } from "@/components/catalog/CatalogueMaterialCard";
import { useCatalogFilterRobots } from "@/components/catalog/useCatalogFilterRobots";
import {
  getCatalogSearchOptionsForSelection,
  searchSupplierCatalog,
  type CatalogSearchIntent,
} from "@/lib/catalog/core/search";
import { supplierDefinitions } from "@/lib/catalog/core/registry";
import type {
  CanonicalCatalogGroup,
  CatalogSearchEntry,
  SupplierId,
} from "@/lib/catalog/core/types";
import {
  canonicalCatalogGroups,
  catalogGroupOptions,
  materialTaxonomyOptionsForSupplier,
} from "@/lib/catalog/material-taxonomy";
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
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

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
  const [pattern, setPattern] = useState<CanonicalCatalogGroup | "">("");
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const deferredQuery = useDeferredValue(query);
  const primarySelections: PrimarySelection[] = useMemo(
    () =>
      materialTaxonomyOptionsForSupplier(entries, supplierId).map(
        (option) => ({
          value: option.slug,
          label: option.label,
          count: option.count,
          type: "all" as const,
          group: option.slug === "all" ? "" : option.slug,
        }),
      ),
    [entries, supplierId],
  );
  const selectedMaterial = group || (type === "melamine" ? "melamine" : "");
  const patternOptions = useMemo(
    () =>
      selectedMaterial
        ? catalogGroupOptions(entries, {
            supplierId,
            material: selectedMaterial,
          })
        : [],
    [entries, selectedMaterial, supplierId],
  );
  const patternLabelBySlug = useMemo(
    () => new Map(canonicalCatalogGroups.map((item) => [item.slug, item.label])),
    [],
  );

  const activeSelection =
    type === "melamine"
        ? "melamine"
        : group || "all";
  const currentState = { query, supplierId, type, group, pattern };
  const hasSearchIntent =
    isCatalogFilterStateActive(currentState) && type !== "supplier";
  const showSupplierDirectory = type === "supplier" && !query.trim();
  const showAllResults =
    !query.trim() && !supplierId && type === "all" && !group && !pattern;

  useEffect(() => {
    const restoreFromUrl = () => {
      const restored = parseCatalogUrlState(
        new URLSearchParams(window.location.search),
      );
      setQuery(restored.query);
      setSupplierId(restored.supplierId);
      setType(restored.type);
      setGroup(restored.group);
      setPattern(restored.pattern);
    };
    restoreFromUrl();
    window.addEventListener("popstate", restoreFromUrl);
    return () => window.removeEventListener("popstate", restoreFromUrl);
  }, []);

  useEffect(() => {
    setVisibleLimit(PAGE_SIZE);
  }, [group, pattern, query, supplierId, type]);

  useCatalogFilterRobots(hasSearchIntent || showSupplierDirectory);

  function updateUrl(
    next: {
      query?: string;
      supplierId?: SupplierId | "";
      type?: CatalogSearchIntent;
      group?: string;
      pattern?: CanonicalCatalogGroup | "";
    },
    mode: "push" | "replace" = "replace",
  ) {
    const values = {
      query: next.query ?? query,
      supplierId: next.supplierId ?? supplierId,
      type: next.type ?? type,
      group: next.group ?? group,
      pattern: next.pattern ?? pattern,
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
        ...getCatalogSearchOptionsForSelection(group, pattern, type),
      }),
    [deferredQuery, entries, group, pattern, supplierId, type],
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
    setPattern("");
    updateUrl({ type: selection.type, group: selection.group, pattern: "" }, "push");
  }

  function selectPattern(value: CanonicalCatalogGroup | "") {
    setPattern(value);
    updateUrl({ pattern: value }, "push");
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
      ...getCatalogSearchOptionsForSelection(group, pattern, type),
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
      <div className="catalogue-material-hero relative left-1/2 isolate flex min-h-[270px] w-screen -translate-x-1/2 overflow-hidden bg-forest-950 sm:min-h-[340px] lg:min-h-[400px]">
        <Image
          src="/images/material-color-hero.webp"
          alt="Các tấm ván MDF phủ bề mặt với nhiều màu và vân gỗ"
          fill
          priority
          fetchPriority="high"
          quality={95}
          sizes="100vw"
          className="catalogue-material-hero-image object-cover"
        />
        <div
          className="catalogue-material-hero-shade absolute inset-0 z-10"
          aria-hidden="true"
        />
        <div className="container-shell relative z-20 flex w-full items-center pb-10 pt-[calc(3.25rem+var(--site-header-height))] sm:pb-12 sm:pt-[calc(3.75rem+var(--site-header-height))] lg:pb-14 lg:pt-[calc(4.25rem+var(--site-header-height))]">
          <div>
            <Breadcrumbs
              compact
              tone="onDark"
              className="catalogue-hero-breadcrumb mb-3 sm:mb-4"
              items={[{ label: "Trang chủ", href: "/" }, { label: "Mã màu" }]}
            />
            <h1 className="whitespace-nowrap text-[clamp(2.7rem,8vw,4.75rem)] font-extrabold leading-none tracking-[-.05em] text-[#fffdf8] [text-shadow:0_2px_18px_rgba(0,0,0,.22)]">
              Mã màu
            </h1>
          </div>
        </div>
      </div>

      <div className="catalogue-search-panel relative z-20 py-5 sm:py-6 lg:py-7">
        <label className="catalogue-hero-search mx-auto block max-w-4xl">
          <span className="sr-only">Tra cứu mã màu</span>
          <span className="relative block rounded-md border border-forest-900/25 bg-white p-1 shadow-[0_8px_24px_rgba(6,43,29,.07)]">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-5 top-1/2 z-10 -translate-y-1/2 text-wood-600 sm:left-6"
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
              className="min-h-12 w-full rounded-sm border border-transparent bg-white py-2.5 pl-12 pr-4 text-base font-semibold text-forest-950 outline-none transition-[border-color,box-shadow] placeholder:font-medium placeholder:text-slate-500 focus:border-wood-500 focus:ring-2 focus:ring-wood-500/20 sm:min-h-14 sm:pl-14 sm:pr-5 sm:text-[17px]"
            />
          </span>
        </label>

        <div
          data-testid="catalogue-search-original"
          className="catalogue-filter-deck mt-5 border-t border-forest-900/10 pt-5 sm:mt-6 sm:pt-6"
        >
          <div className="min-w-0">
            <p className="text-sm font-extrabold uppercase tracking-[.13em] text-wood-600">
              Phân loại
            </p>
            <div
              className="catalogue-filter-scroll -mx-3 mt-2.5 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0"
            >
              <div
                role="group"
                aria-label="Chọn loại vật liệu"
                className="catalogue-filter-row flex w-max gap-1.5 sm:gap-2"
              >
                {primarySelections.map((selection) => {
                  const active = activeSelection === selection.value;
                  return (
                    <button
                      key={selection.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => selectPrimary(selection)}
                      className={`pressable inline-flex min-h-12 shrink-0 items-center rounded-[4px] border px-4 text-left text-[15px] font-extrabold sm:px-5 sm:text-base ${active ? "border-forest-900 bg-forest-900 text-white shadow-[0_5px_14px_rgba(2,18,12,.14)]" : "border-forest-900/25 bg-transparent text-forest-950 hover:border-wood-500/60 hover:bg-white"}`}
                    >
                      <span>{selection.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <label className="mt-4 flex flex-col gap-2 border-t border-forest-900/20 pt-4 sm:flex-row sm:items-center sm:gap-4">
            <span className="shrink-0 text-sm font-extrabold uppercase tracking-[.13em] text-wood-600">
              Theo thương hiệu
            </span>
            <span className="relative block w-full sm:w-[280px]">
              <select
                value={supplierId}
                onChange={(event) => {
                  const value = event.target.value as SupplierId | "";
                  setSupplierId(value);
                  setPattern("");
                  updateUrl({ supplierId: value, pattern: "" }, "push");
                }}
                className="min-h-12 w-full appearance-none rounded-[4px] border border-forest-900/25 bg-white px-4 pr-11 text-base font-bold text-forest-950 outline-none focus:border-wood-500 focus:ring-2 focus:ring-wood-500/20"
              >
                <option value="">Tất cả thương hiệu</option>
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

          {patternOptions.length > 1 ? (
            <div className="mt-4 border-t border-forest-900/20 pt-4">
              <p className="text-sm font-extrabold uppercase tracking-[.13em] text-wood-600">
                Kiểu vân / màu
              </p>
              <div className="catalogue-filter-scroll -mx-3 mt-2.5 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
                <div
                  role="group"
                  aria-label="Chọn kiểu vân hoặc màu"
                  className="catalogue-filter-row flex w-max gap-1.5 sm:gap-2"
                >
                  {patternOptions.map((option) => {
                    const value = option.slug === "all" ? "" : option.slug;
                    const active = pattern === value;
                    return (
                      <button
                        key={option.slug}
                        type="button"
                        aria-pressed={active}
                        onClick={() => selectPattern(value)}
                        className={`pressable inline-flex min-h-11 shrink-0 items-center rounded-[4px] border px-4 text-left text-sm font-extrabold ${active ? "border-forest-900 bg-forest-900 text-white" : "border-forest-900/20 bg-white text-forest-950 hover:border-wood-500/60"}`}
                      >
                        {patternLabelBySlug.get(option.slug) ?? option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
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
                  ? `${results.length.toLocaleString("vi-VN")} sản phẩm`
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
                  key={
                    entry.id ??
                    `${entry.supplierId}:${entry.code}:${entry.canonicalRoute}`
                  }
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
          {(hasSearchIntent || showAllResults) &&
          visibleResults.length < results.length ? (
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
