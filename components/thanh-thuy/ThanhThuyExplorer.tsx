"use client";

import Link from "next/link";
import { Copy, Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useCatalogFilterRobots } from "@/components/catalog/useCatalogFilterRobots";
import { MaterialSwatchImage } from "@/components/thanh-thuy/MaterialSwatchImage";
import { searchThanhThuyItems } from "@/lib/catalog/thanh-thuy-search";
import {
  buildCatalogCollectionSearchParams,
  parseCatalogCollectionUrlState,
} from "@/lib/catalog/url-state";

export type ThanhThuyExplorerItem = {
  slug: string;
  code: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  seriesName?: string;
  color?: string;
  pattern?: string;
  image: string;
  imageAlt: string;
  imageWidth?: number;
  imageHeight?: number;
  imageSrcSet?: string;
  seoStatus: string;
};

type ExplorerCategory = { slug: string; name: string; parentSlug?: string };

type ThanhThuyExplorerProps = {
  items: ThanhThuyExplorerItem[];
  categories: ExplorerCategory[];
  basePath?: string;
  title?: string;
  compact?: boolean;
};

export function ThanhThuyExplorer({
  items,
  categories,
  basePath = "/san-pham",
  title = "Tra cứu mã màu Thanh Thuỳ",
  compact = false,
}: ThanhThuyExplorerProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [copied, setCopied] = useState("");
  const [visibleCount, setVisibleCount] = useState(48);
  const deferredQuery = useDeferredValue(query);
  const topCategories = useMemo(
    () => categories.filter((item) => !item.parentSlug),
    [categories],
  );
  const categorySlugs = useMemo(
    () => topCategories.map((item) => item.slug),
    [topCategories],
  );
  const filtered = useMemo(
    () => searchThanhThuyItems(items, deferredQuery, category),
    [category, deferredQuery, items],
  );
  const visibleItems = filtered.slice(0, visibleCount);
  useCatalogFilterRobots(Boolean(query.trim() || category));

  useEffect(() => {
    const restoreFromUrl = () => {
      const restored = parseCatalogCollectionUrlState(
        new URLSearchParams(window.location.search),
        categorySlugs,
      );
      setQuery(restored.query);
      setCategory(restored.group);
      setVisibleCount(48);
    };
    restoreFromUrl();
    window.addEventListener("popstate", restoreFromUrl);
    return () => window.removeEventListener("popstate", restoreFromUrl);
  }, [categorySlugs]);

  function updateUrl(
    next: { query?: string; category?: string },
    mode: "push" | "replace" = "replace",
  ) {
    const parameters = buildCatalogCollectionSearchParams(
      new URLSearchParams(window.location.search),
      {
        query: next.query ?? query,
        group: next.category ?? category,
      },
    );
    const search = parameters.toString();
    window.history[mode === "push" ? "pushState" : "replaceState"](
      window.history.state,
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`,
    );
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      window.setTimeout(() => setCopied(""), 1600);
    } catch {
      setCopied("");
    }
  }

  const Root = compact ? "div" : "section";

  return (
    <Root
      aria-labelledby="thanh-thuy-explorer-title"
      className={compact ? "" : "bg-[#f6f7f5] py-14 lg:py-20"}
    >
      <div className={compact ? "" : "container-shell"}>
        {compact ? (
          <h2 id="thanh-thuy-explorer-title" className="sr-only">
            {title}
          </h2>
        ) : (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="eyebrow eyebrow-on-light">
                MÃ MÀU &amp; VẬT LIỆU
              </span>
              <h2
                id="thanh-thuy-explorer-title"
                className="mt-3 font-display text-3xl font-extrabold tracking-[-.03em] text-forest-950 sm:text-4xl"
              >
                {title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Tìm theo tên, mã, nhóm vật liệu hoặc vân màu. Mã chưa có thông
                tin tồn kho trực tuyến vẫn được giữ để Tùng Phát kiểm tra theo
                mẫu thực tế.
              </p>
            </div>
            <p className="text-sm font-bold text-forest-900" aria-live="polite">
              {filtered.length} mã phù hợp
            </p>
          </div>
        )}

        <div
          className={`${compact ? "mt-6" : "mt-8"} grid gap-3 border border-forest-900/10 bg-white p-4 shadow-card md:grid-cols-[minmax(0,1fr)_220px]`}
        >
          <label className="relative block">
            <span className="sr-only">Tìm tên hoặc mã Thanh Thuỳ</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-forest-700"
              size={18}
            />
            <input
              name="thanh-thuy-search"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setVisibleCount(48);
                updateUrl({ query: event.target.value });
              }}
              type="search"
              placeholder="Ví dụ: 142, Roman Oak, Laminate…"
              className="min-h-12 w-full border border-slate-200 bg-[#fffdf8] pl-11 pr-4 text-sm text-forest-950 outline-none transition-colors focus-visible:border-wood-600 focus-visible:ring-2 focus-visible:ring-wood-600/20"
            />
          </label>
          <label>
            <span className="sr-only">Lọc theo nhóm vật liệu</span>
            <select
              name="thanh-thuy-category"
              autoComplete="off"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setVisibleCount(48);
                updateUrl({ category: event.target.value }, "push");
              }}
              className="min-h-12 w-full border border-slate-200 bg-[#fffdf8] px-4 text-sm font-semibold text-forest-950 outline-none transition-colors focus-visible:border-wood-600 focus-visible:ring-2 focus-visible:ring-wood-600/20"
            >
              <option value="">Tất cả nhóm vật liệu</option>
              {topCategories.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {compact ? (
          <p
            className="mt-4 text-sm font-bold text-forest-900"
            aria-live="polite"
          >
            {filtered.length} mã phù hợp
          </p>
        ) : null}

        {filtered.length === 0 ? (
          <div className="mt-8 border border-dashed border-forest-900/20 bg-white p-10 text-center">
            <h3 className="text-lg font-extrabold text-forest-950">
              Chưa tìm thấy mã phù hợp
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Thử tìm bằng một phần mã hoặc gửi yêu cầu để Tùng Phát tra cứu
              thêm trong catalogue.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {visibleItems.map((item) => {
                const href = `${basePath}/${item.categorySlug}/${item.slug}/`;
                return (
                  <article
                    key={item.slug}
                    className="group overflow-hidden border border-forest-900/10 bg-white shadow-[0_8px_30px_rgba(10,42,28,.05)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_16px_38px_rgba(10,42,28,.1)]"
                  >
                    <Link
                      href={href}
                      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-600 focus-visible:ring-inset"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                        <MaterialSwatchImage
                          src={item.image}
                          srcSet={item.imageSrcSet}
                          alt={item.imageAlt}
                          width={item.imageWidth}
                          height={item.imageHeight}
                          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 25vw, 20vw"
                          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                        />
                      </div>
                      <div className="p-4">
                        <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-forest-700">
                          Thanh Thuỳ · {item.categoryName}
                        </p>
                        <h3 className="mt-2 min-h-12 text-base font-extrabold leading-6 text-forest-950">
                          {item.name}
                        </h3>
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          {item.seriesName ||
                            item.pattern ||
                            "Mã màu Thanh Thuỳ"}
                        </p>
                      </div>
                    </Link>
                    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
                      <span className="text-sm font-bold text-forest-950">
                        {item.code || "Chưa có mã"}
                      </span>
                      {item.code ? (
                        <button
                          type="button"
                          onClick={() => copyCode(item.code)}
                          className="inline-flex min-h-9 touch-manipulation items-center gap-1.5 px-2 text-xs font-bold text-forest-700 transition-colors hover:bg-wood-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-600 focus-visible:ring-offset-2 active:scale-[.97]"
                          aria-label={`Sao chép mã ${item.code}`}
                        >
                          <Copy aria-hidden="true" size={14} />
                          {copied === item.code ? "Đã sao chép" : "Sao chép mã"}
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
            {visibleItems.length < filtered.length ? (
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + 48)}
                className="mx-auto mt-8 flex min-h-11 touch-manipulation items-center justify-center border border-forest-900/15 bg-white px-5 text-sm font-bold text-forest-950 transition-colors hover:border-wood-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-600 focus-visible:ring-offset-2"
              >
                Xem thêm mã
              </button>
            ) : null}
          </>
        )}
      </div>
    </Root>
  );
}
