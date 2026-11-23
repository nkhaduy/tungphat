"use client";

import Image from "next/image";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CatalogueResultsExplorer } from "@/components/catalog/shared/CatalogueResultsExplorer";
import type { CatalogSearchEntry } from "@/lib/catalog/core/types";
import type { CatalogueFacetOptions } from "@/lib/catalog/facets";

type Props = {
  entries: CatalogSearchEntry[];
  totalCount: number;
  initialFacets: CatalogueFacetOptions;
};

export function SupplierCatalogSearch({ entries, totalCount, initialFacets }: Props) {
  return (
    <section aria-labelledby="supplier-search-title">
      <h2 id="supplier-search-title" className="sr-only">Tìm mã màu</h2>
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

      <CatalogueResultsExplorer entries={entries} totalCount={totalCount} initialFacets={initialFacets} />
    </section>
  );
}
