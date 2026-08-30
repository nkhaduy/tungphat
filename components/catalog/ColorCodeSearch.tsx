"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  ColorCodeCard,
  type ColorCardRecord,
} from "@/components/catalog/ColorCodeCard";
import { AutoLoadMore } from "@/components/catalog/shared/AutoLoadMore";
import { useCatalogFilterRobots } from "@/components/catalog/useCatalogFilterRobots";
import {
  normalizeBaThanhSearch,
  sortBaThanhCodesByDemand,
} from "@/lib/catalog/ba-thanh-search";
import {
  buildCatalogCollectionSearchParams,
  parseCatalogCollectionUrlState,
} from "@/lib/catalog/url-state";

const PAGE_SIZE = 36;

export type { ColorCardRecord } from "@/components/catalog/ColorCodeCard";

export function ColorCodeSearch({
  records,
  categoryOptions,
  fixedCategory,
}: {
  records: ColorCardRecord[];
  categoryOptions: Array<{ slug: string; label: string }>;
  fixedCategory?: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(fixedCategory || "all");
  const [page, setPage] = useState(1);
  const needle = normalizeBaThanhSearch(query);
  const categorySlugs = useMemo(
    () => categoryOptions.map((option) => option.slug),
    [categoryOptions],
  );
  useCatalogFilterRobots(
    Boolean(query.trim() || (!fixedCategory && category !== "all")),
  );

  useEffect(() => {
    const restoreFromUrl = () => {
      const restored = parseCatalogCollectionUrlState(
        new URLSearchParams(window.location.search),
        categorySlugs,
      );
      const nextCategory = restored.group || "all";
      setQuery(restored.query);
      setCategory(
        fixedCategory ||
          (categorySlugs.includes(nextCategory) ? nextCategory : "all"),
      );
      setPage(1);
    };
    restoreFromUrl();
    window.addEventListener("popstate", restoreFromUrl);
    return () => window.removeEventListener("popstate", restoreFromUrl);
  }, [categorySlugs, fixedCategory]);

  function updateUrl(
    next: { query?: string; category?: string },
    mode: "push" | "replace" = "replace",
  ) {
    const nextQuery = next.query ?? query;
    const nextCategory = next.category ?? category;
    const parameters = buildCatalogCollectionSearchParams(
      new URLSearchParams(window.location.search),
      {
        query: nextQuery,
        group: !fixedCategory && nextCategory !== "all" ? nextCategory : "",
      },
    );
    const search = parameters.toString();
    window.history[mode === "push" ? "pushState" : "replaceState"](
      window.history.state,
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`,
    );
  }
  const filtered = useMemo(
    () =>
      sortBaThanhCodesByDemand(
        records.filter((record) => {
          if (category !== "all" && record.category !== category) return false;
          if (!needle) return true;
          return normalizeBaThanhSearch(
            `${record.displayName} ${record.codeNormalized} ${record.patternGroup || ""} ${record.category}`,
          ).includes(needle);
        }),
      ),
    [category, needle, records],
  );
  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
    updateUrl({ query: value });
  }

  return (
    <section aria-labelledby="catalogue-search-title">
      <h2 id="catalogue-search-title" className="sr-only">
        Tìm mã Melamine Ba Thanh
      </h2>
      <div className="border border-forest-900/10 bg-white p-4 shadow-card sm:p-5">
        <label className="relative block">
          <span className="sr-only">Tìm theo mã, tên hoặc nhóm vân</span>
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-forest-900/50"
            aria-hidden="true"
          />
          <input
            type="search"
            name="ma-melamine"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="Tìm mã BT 111 hoặc SC 020M"
            autoComplete="off"
            spellCheck={false}
            className="min-h-14 w-full border border-forest-900/15 bg-[#fbfaf6] pl-11 pr-4 text-base font-semibold text-forest-950 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-wood-500"
          />
        </label>
        <div className="mt-4">
          <p className="text-xs font-extrabold uppercase tracking-[.15em] text-slate-600">
            Chọn nhóm mã
          </p>
          <div
            role="group"
            aria-label="Lọc nhóm màu"
            className="mt-3 flex flex-wrap gap-2 pb-1"
          >
            {!fixedCategory ? (
              <button
                type="button"
                aria-pressed={category === "all"}
                onClick={() => {
                  setCategory("all");
                  setPage(1);
                  updateUrl({ category: "all" }, "push");
                }}
                className={`min-h-11 min-w-0 max-w-full whitespace-normal border px-4 text-left text-sm font-extrabold ${category === "all" ? "border-forest-900 bg-forest-900 text-white" : "border-forest-900/15 bg-white text-forest-950 hover:border-wood-500"}`}
              >
                Tất cả
              </button>
            ) : null}
            {categoryOptions.map((option) => (
              <button
                key={option.slug}
                type="button"
                aria-pressed={category === option.slug}
                disabled={Boolean(fixedCategory)}
                onClick={() => {
                  setCategory(option.slug);
                  setPage(1);
                  updateUrl({ category: option.slug }, "push");
                }}
                className={`min-h-11 min-w-0 max-w-full whitespace-normal border px-4 text-left text-sm font-extrabold disabled:cursor-default ${category === option.slug ? "border-forest-900 bg-forest-900 text-white" : "border-forest-900/15 bg-white text-forest-950 hover:border-wood-500"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div
        className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600"
        aria-live="polite"
      >
        <p>
          <strong className="text-forest-950">{filtered.length}</strong> mã phù
          hợp{query ? ` với “${query}”` : ""}
        </p>
      </div>
      {filtered.length ? (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {visible.map((record) => (
              <ColorCodeCard
                key={record.slug}
                record={record}
              />
            ))}
          </div>
          {hasMore ? (
            <AutoLoadMore
              hasMore={hasMore}
              onLoadMore={() => setPage((current) => current + 1)}
              remaining={filtered.length - visible.length}
              pageSize={PAGE_SIZE}
            />
          ) : null}
        </>
      ) : (
        <div className="mt-6 border border-dashed border-forest-900/25 bg-[#f7f8f5] px-6 py-12 text-center">
          <p className="font-extrabold text-forest-950">
            Chưa tìm thấy mã phù hợp
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Thử bỏ khoảng trắng hoặc dấu gạch, ví dụ <code>BT111</code> hoặc{" "}
            <code>SC020M</code>. Nếu vẫn chưa thấy, gửi mã cho Tùng Phát để kiểm
            tra thêm.
          </p>
        </div>
      )}
    </section>
  );
}
