"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { searchSupplierCatalog } from "@/lib/catalog/core/search";
import { supplierDefinitions } from "@/lib/catalog/core/registry";
import type { CatalogSearchEntry, SupplierId } from "@/lib/catalog/core/types";
import {
  findExactCatalogCodeMatch,
  findExactSupplierMatch,
  humanizeCatalogLabel,
} from "@/lib/catalog/ui";

const kindLabels: Record<CatalogSearchEntry["kind"], string> = {
  product: "Sản phẩm",
  "color-code": "Mã màu",
  "catalogue-item": "Mục catalogue",
};

const supplierOptions: Array<{ value: SupplierId; label: string }> =
  supplierDefinitions.map((supplier) => ({
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
  const [category, setCategory] = useState("");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    const restoreFromUrl = () => {
      const parameters = new URLSearchParams(window.location.search);
      const nextSupplier = parameters.get("supplier") as SupplierId | null;
      setQuery(parameters.get("q") ?? "");
      setSupplierId(
        supplierOptions.some((option) => option.value === nextSupplier)
          ? nextSupplier!
          : "",
      );
      setCategory(parameters.get("category") ?? "");
    };
    restoreFromUrl();
    window.addEventListener("popstate", restoreFromUrl);
    return () => window.removeEventListener("popstate", restoreFromUrl);
  }, []);

  function updateUrl(next: {
    query?: string;
    supplierId?: SupplierId | "";
    category?: string;
  }) {
    const parameters = new URLSearchParams(window.location.search);
    const values = {
      query: next.query ?? query,
      supplierId: next.supplierId ?? supplierId,
      category: next.category ?? category,
    };
    if (values.query.trim()) parameters.set("q", values.query);
    else parameters.delete("q");
    if (values.supplierId) parameters.set("supplier", values.supplierId);
    else parameters.delete("supplier");
    if (values.category) parameters.set("category", values.category);
    else parameters.delete("category");
    const search = parameters.toString();
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`,
    );
  }
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
  const hasIntent = Boolean(query.trim() || supplierId || category);
  const supplierMatch = findExactSupplierMatch(supplierDefinitions, query);
  const exactSupplier =
    supplierMatch && (!supplierId || supplierMatch.id === supplierId)
      ? supplierMatch
      : undefined;
  const visibleResults =
    hasIntent && !exactSupplier ? results.slice(0, 48) : [];

  function updateQuery(value: string) {
    setQuery(value);
    updateUrl({ query: value });
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
      category: category || undefined,
    });
    const exact = findExactCatalogCodeMatch(currentResults, query);
    if (!exact) return;
    event.preventDefault();
    window.location.assign(exact.canonicalRoute);
  }

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
              onChange={(event) => updateQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              type="search"
              autoComplete="off"
              placeholder="Tìm theo mã, tên sản phẩm hoặc thương hiệu"
              className="min-h-12 w-full border border-forest-900/20 bg-[#f7f5ef] py-3 pl-11 pr-4 text-sm text-forest-950 outline-none transition focus:border-wood-500 focus:ring-2 focus:ring-wood-500/20"
            />
          </label>
          <label>
            <span className="sr-only">Lọc theo nhà cung cấp</span>
            <select
              value={supplierId}
              onChange={(event) => {
                const value = event.target.value as SupplierId | "";
                setSupplierId(value);
                setCategory("");
                updateUrl({ supplierId: value, category: "" });
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
              onChange={(event) => {
                setCategory(event.target.value);
                updateUrl({ category: event.target.value });
              }}
              className="min-h-12 w-full border border-forest-900/20 bg-white px-4 text-sm font-bold text-forest-950 outline-none focus:border-wood-500 focus:ring-2 focus:ring-wood-500/20"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {humanizeCatalogLabel(item)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {exactSupplier ? (
        <Link
          href={exactSupplier.cataloguePath}
          aria-label={`Khớp chính xác, nhà cung cấp ${exactSupplier.displayName}, mở catalogue`}
          className="group mt-8 flex min-h-36 flex-col justify-between border border-wood-500/45 bg-[#fff8ee] p-5 transition-[border-color,box-shadow] hover:border-wood-600 hover:shadow-[0_14px_34px_rgba(7,31,24,.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-600 sm:flex-row sm:items-center sm:gap-8 sm:p-6"
        >
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-wood-700">
              Khớp chính xác · Nhà cung cấp
            </p>
            <h3 className="mt-2 font-display text-2xl font-extrabold text-forest-950">
              {exactSupplier.displayName}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Mở trang catalogue riêng để xem phạm vi dữ liệu, nhóm vật liệu và
              cách gửi mã đúng cho Tùng Phát.
            </p>
          </div>
          <span className="mt-5 inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-extrabold text-forest-950 underline decoration-wood-500 decoration-2 underline-offset-4 sm:mt-0">
            Mở catalogue <ArrowRight size={16} aria-hidden="true" />
          </span>
        </Link>
      ) : hasIntent ? (
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
      ) : null}

      {exactSupplier ? null : visibleResults.length ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleResults.map((entry, index) => (
            <Link
              key={`${entry.supplierId}:${entry.code}:${index}`}
              href={entry.canonicalRoute}
              aria-label={`${entry.supplierName}, mã ${entry.code}, xem ${kindLabels[entry.kind].toLowerCase()}`}
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
                    .map((value) => humanizeCatalogLabel(value!))
                    .join(" · ")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : hasIntent ? (
        <div className="mt-5 border border-dashed border-forest-900/20 bg-white px-6 py-12 text-center text-sm text-slate-600">
          <p className="font-extrabold text-forest-950">
            Chưa tìm thấy mã phù hợp
          </p>
          <p className="mx-auto mt-2 max-w-xl leading-6">
            Hãy thử nhập mã không có khoảng trắng hoặc chọn một nhóm vật liệu
            khác. Bạn cũng có thể gửi mã cho Tùng Phát để được kiểm tra thêm.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 border border-forest-900/12 bg-[#f7f5ef] p-5 sm:grid-cols-3 sm:p-6">
          {["Nhập mã đã có", "Chọn nhà cung cấp", "Mở kết quả phù hợp"].map(
            (step, index) => (
              <div
                key={step}
                className="flex items-center gap-3 text-sm font-bold text-forest-950"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-forest-950 text-xs text-white">
                  {index + 1}
                </span>
                <span>{step}</span>
                {index < 2 ? (
                  <ArrowRight
                    className="ml-auto hidden text-wood-600 sm:block"
                    size={16}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            ),
          )}
        </div>
      )}
    </section>
  );
}
