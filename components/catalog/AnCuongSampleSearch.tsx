"use client";

import { Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { searchSupplierCatalog } from "@/lib/catalog/core/search";
import type { CatalogSearchEntry } from "@/lib/catalog/core/types";
import {
  buildCatalogCollectionSearchParams,
  parseCatalogCollectionUrlState,
} from "@/lib/catalog/url-state";

export function AnCuongSampleSearch({
  entries,
}: {
  entries: CatalogSearchEntry[];
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(
    () =>
      searchSupplierCatalog(entries, deferredQuery, {
        supplierId: "an-cuong",
      }),
    [deferredQuery, entries],
  );

  useEffect(() => {
    const restoreFromUrl = () => {
      setQuery(
        parseCatalogCollectionUrlState(
          new URLSearchParams(window.location.search),
          [],
        ).query,
      );
    };
    restoreFromUrl();
    window.addEventListener("popstate", restoreFromUrl);
    return () => window.removeEventListener("popstate", restoreFromUrl);
  }, []);

  function updateQuery(value: string) {
    setQuery(value);
    const parameters = buildCatalogCollectionSearchParams(
      new URLSearchParams(window.location.search),
      { query: value, group: "" },
    );
    const search = parameters.toString();
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`,
    );
  }

  return (
    <section aria-labelledby="an-cuong-sample-search-title" className="mt-6">
      <h2 id="an-cuong-sample-search-title" className="sr-only">
        Tìm trong dữ liệu mẫu An Cường
      </h2>
      <div className="border border-forest-900/10 bg-white p-4 shadow-card sm:p-5">
        <label className="relative block">
          <span className="sr-only">Tìm mã hoặc tên mẫu An Cường</span>
          <Search
            aria-hidden="true"
            size={19}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-forest-900/55"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") updateQuery("");
            }}
            placeholder="Tìm mã hoặc tên mẫu An Cường"
            autoComplete="off"
            spellCheck={false}
            className="min-h-14 w-full border border-forest-900/15 bg-[#fbfaf6] pl-11 pr-4 text-base font-semibold text-forest-950 outline-none focus-visible:border-wood-500 focus-visible:ring-2 focus-visible:ring-wood-500/20"
          />
        </label>
      </div>

      <div className="mt-5 border-l-2 border-wood-500 bg-[#fffdf8] px-5 py-4">
        <h2 className="text-lg font-extrabold text-forest-950">
          7 mẫu dữ liệu tham khảo đang có tại Tùng Phát
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
          Đây là dữ liệu mẫu để tra cứu tên, mã và dòng vật liệu, không đại diện
          cho toàn bộ catalogue An Cường.
        </p>
      </div>

      {results.length ? (
        <div
          role="region"
          aria-label="Mẫu dữ liệu An Cường"
          className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {results.map((item) => (
            <article
              key={item.code}
              className="flex min-h-[210px] flex-col border border-forest-900/10 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2 text-[.65rem] font-extrabold uppercase tracking-[.13em]">
                <span className="text-wood-600">An Cường</span>
                <span className="text-slate-500">Dữ liệu mẫu</span>
              </div>
              <p
                className="mt-5 break-words font-mono text-lg font-extrabold text-forest-950"
                translate="no"
              >
                {item.code}
              </p>
              <h3 className="mt-2 text-base font-extrabold leading-6 text-forest-950">
                {item.name}
              </h3>
              <dl className="mt-auto grid gap-1 pt-5 text-xs leading-5 text-slate-700">
                <div>
                  <dt className="inline font-bold">Nhóm: </dt>
                  <dd className="inline">
                    {item.category || "Chưa phân nhóm"}
                  </dd>
                </div>
                {item.series ? (
                  <div>
                    <dt className="inline font-bold">Dòng: </dt>
                    <dd className="inline">{item.series}</dd>
                  </div>
                ) : null}
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 border border-dashed border-forest-900/20 bg-white px-6 py-10 text-center">
          <p className="font-extrabold text-forest-950">
            Chưa tìm thấy mẫu phù hợp
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Thử tìm bằng một phần mã hoặc tên, sau đó gửi yêu cầu để Tùng Phát
            kiểm tra catalogue thực tế.
          </p>
        </div>
      )}
    </section>
  );
}
