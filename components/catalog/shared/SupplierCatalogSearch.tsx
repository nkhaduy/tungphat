"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Copy, Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
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
  const [copyStatus, setCopyStatus] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const deferredQuery = useDeferredValue(query);
  const primarySelections: PrimarySelection[] = useMemo(() => [
    ...materialTaxonomyOptionsForSupplier(entries, supplierId).map((option) => ({
      value: option.slug,
      label: `${option.label} (${option.count})`,
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

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus(`Đã sao chép mã ${code}`);
      window.setTimeout(() => setCopyStatus(""), 1800);
    } catch {
      setCopyStatus("Không thể sao chép mã. Hãy chọn và sao chép thủ công.");
    }
  }

  return (
    <section aria-labelledby="supplier-search-title">
      <h2 id="supplier-search-title" className="sr-only">
        Tìm mã màu
      </h2>
      <div className="border border-forest-900/10 bg-white p-4 shadow-card sm:p-6">
        <label className="relative block">
          <span className="sr-only">Tìm mã màu, tên màu hoặc thương hiệu</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-forest-900/55"
            size={20}
          />
          <input
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            type="search"
            autoComplete="off"
            spellCheck={false}
            placeholder="Tìm mã màu, tên màu hoặc thương hiệu"
            className="min-h-14 w-full border border-forest-900/20 bg-[#fbfaf6] py-3 pl-12 pr-4 text-base font-semibold text-forest-950 outline-none transition focus:border-wood-500 focus:ring-2 focus:ring-wood-500/20"
          />
        </label>

        <div className="mt-5">
          <p className="text-xs font-extrabold uppercase tracking-[.15em] text-slate-600">
            Chọn nhóm vật liệu
          </p>
          <div
            role="group"
            aria-label="Chọn loại vật liệu"
            className="mt-3 flex flex-wrap gap-2 pb-1"
          >
            {primarySelections.map((selection) => {
              const active = activeSelection === selection.value;
              return (
                <button
                  key={selection.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectPrimary(selection)}
                  className={`pressable min-h-11 min-w-0 max-w-full whitespace-normal border px-4 text-left text-sm font-extrabold ${active ? "border-forest-900 bg-forest-900 text-white" : "border-forest-900/15 bg-white text-forest-950 hover:border-wood-500"}`}
                >
                  {selection.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid gap-3 border-t border-forest-900/10 pt-4 sm:grid-cols-[minmax(0,260px)_1fr] sm:items-center">
          <label>
            <span className="sr-only">Lọc theo nhà cung cấp</span>
            <select
              value={supplierId}
              onChange={(event) => {
                const value = event.target.value as SupplierId | "";
                setSupplierId(value);
                updateUrl({ supplierId: value }, "push");
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
          <p className="text-xs leading-5 text-slate-600">
            Mặc định ưu tiên ý định tra mã Melamine, nhóm bề mặt và mức độ đầy
            đủ của dữ liệu. A–Z chỉ dùng khi các mục có cùng điểm.
          </p>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {copyStatus}
      </p>

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
          <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-wood-600">
                {hasSearchIntent
                  ? "Kết quả tra cứu"
                  : "Mã Melamine được quan tâm"}
              </p>
              <h3 className="mt-2 text-2xl font-extrabold text-forest-950">
                {hasSearchIntent || showAllResults
                  ? `${results.length} mục phù hợp`
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
              className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              {visibleResults.map((entry) => (
                <article
                  key={entry.id ?? `${entry.supplierId}:${entry.code}:${entry.canonicalRoute}`}
                  className="group flex min-w-0 flex-col overflow-hidden border border-forest-900/10 bg-white shadow-sm transition hover:border-wood-500/50 hover:shadow-card"
                >
                  <Link
                    href={entry.canonicalRoute}
                    aria-label={entry.code
                      ? `${entry.supplierName}, mã ${entry.code}, xem chi tiết`
                      : `${entry.supplierName}, ${entry.name}, xem chi tiết`}
                    className="relative block aspect-[16/9] overflow-hidden bg-[#eef1ed] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-wood-600"
                  >
                    {entry.thumbnail ? (
                      <Image
                        src={entry.thumbnail}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                        className="object-cover"
                      />
                    ) : (
                      <span className="grid h-full place-items-center px-3 text-center text-xs font-bold text-slate-600">
                        Nguồn chưa cung cấp ảnh màu
                      </span>
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-[.65rem] font-extrabold uppercase tracking-[.12em] text-wood-600">
                      {entry.supplierName}
                    </p>
                    <h4 className="mt-2 line-clamp-2 text-lg font-extrabold leading-6 text-forest-950">
                      <Link href={entry.canonicalRoute} translate="no">
                        {formatCatalogCardTitle(entry)}
                      </Link>
                    </h4>
                    <p className="mt-3 text-xs leading-5 text-slate-500">{formatCatalogCardTaxonomy(entry)}</p>
                    <div className={`mt-auto grid gap-2 pt-5 ${entry.code ? "grid-cols-2" : "grid-cols-1"}`}>
                      {entry.code ? (
                        <button
                          type="button"
                          onClick={() => copyCode(entry.code)}
                          aria-label={`Sao chép mã ${entry.code}`}
                          className="pressable inline-flex min-h-11 items-center justify-center gap-2 border border-forest-900/15 px-3 text-xs font-extrabold text-forest-950 hover:border-wood-500"
                        >
                          <Copy size={15} aria-hidden="true" />
                          Sao chép mã
                        </button>
                      ) : null}
                      <Link
                        href={entry.canonicalRoute}
                        className="pressable inline-flex min-h-11 items-center justify-center gap-2 bg-forest-900 px-3 text-xs font-extrabold text-white hover:bg-forest-950"
                      >
                        Chi tiết <ArrowRight size={15} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 border border-dashed border-forest-900/20 bg-white px-6 py-12 text-center text-sm text-slate-700">
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

      {copyStatus ? (
        <p
          className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 border border-forest-900/10 bg-white px-4 py-3 text-sm font-bold text-forest-950 shadow-card"
          aria-hidden="true"
        >
          <Check className="mr-2 inline text-wood-600" size={16} />
          {copyStatus}
        </p>
      ) : null}
    </section>
  );
}
