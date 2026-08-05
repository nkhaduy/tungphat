import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Copy } from "lucide-react";
import type { SupplierColorCode } from "@/lib/catalog/types";
import { humanizeCatalogLabel } from "@/lib/catalog/ui";

export type ColorCardRecord = Pick<
  SupplierColorCode,
  | "slug"
  | "displayName"
  | "codeNormalized"
  | "category"
  | "patternGroup"
  | "images"
  | "seoStatus"
>;

export function ColorCodeCard({
  record,
  onCopy,
}: {
  record: ColorCardRecord;
  onCopy?: (code: string) => void;
}) {
  const image = record.images[0];
  return (
    <article className="group overflow-hidden border border-forest-900/12 bg-white shadow-[0_8px_30px_rgba(7,59,40,.05)] transition-[transform,box-shadow,border-color] duration-[180ms] ease-out hover:-translate-y-1 hover:border-wood-500/50 hover:shadow-[0_16px_34px_rgba(7,59,40,.11)] motion-reduce:transform-none motion-reduce:transition-none">
      <Link
        href={`/ma-mau-melamine/ba-thanh/${record.slug}/`}
        className="block focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-wood-500"
      >
        <div className="relative aspect-[1.65/1] overflow-hidden bg-[#eef1ed]">
          {image ? (
            <Image
              src={image.thumbnailSrc || image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
              quality={90}
              loading="lazy"
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none"
            />
          ) : (
            <div className="grid h-full place-items-center text-xs font-bold text-slate-500">
              Ảnh đang cập nhật
            </div>
          )}
          <span className="absolute left-3 top-3 bg-forest-950/90 px-2 py-1 text-[.65rem] font-extrabold uppercase tracking-[.12em] text-white">
            Ba Thanh
          </span>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3
                className="break-words text-lg font-extrabold tracking-tight text-forest-950"
                translate="no"
              >
                {record.displayName}
              </h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[.12em] text-slate-500">
                {humanizeCatalogLabel(record.patternGroup || record.category)}
              </p>
            </div>
            <ArrowUpRight
              size={18}
              className="mt-1 shrink-0 text-wood-600 transition-transform duration-[180ms] ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
              aria-hidden="true"
            />
          </div>
        </div>
      </Link>
      {onCopy && (
        <button
          type="button"
          onClick={() => onCopy(record.displayName)}
          aria-label={`Sao chép mã ${record.displayName}`}
          className="flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 border-t border-forest-900/10 px-4 text-xs font-extrabold text-forest-900/70 transition-[transform,background-color,color] duration-150 hover:bg-[#fff8ee] hover:text-forest-950 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-wood-500 active:scale-[.97] motion-reduce:transform-none motion-reduce:transition-none"
        >
          <Copy size={14} aria-hidden="true" /> Sao chép mã
        </button>
      )}
    </article>
  );
}
