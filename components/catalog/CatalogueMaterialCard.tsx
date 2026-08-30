import Image from "next/image";
import Link from "next/link";
import type { SupplierId } from "@/lib/catalog/core/types";
import { supplierRegistry } from "@/lib/catalog/core/registry";
import { resolveMediaUrl } from "@/lib/media";

type CatalogueMaterialCardProps = {
  href: string;
  supplierId: SupplierId;
  supplierName: string;
  code?: string;
  title: string;
  taxonomy: string;
  thumbnail?: string;
  thumbnailAlt?: string;
};

export function CatalogueMaterialCard({
  href,
  supplierId,
  supplierName,
  code,
  title,
  taxonomy,
  thumbnail,
  thumbnailAlt = "",
}: CatalogueMaterialCardProps) {
  const supplier = supplierRegistry.get(supplierId);

  return (
    <article className="catalogue-material-card group min-w-0 overflow-hidden rounded-lg border border-forest-900/10 bg-white shadow-[0_1px_2px_rgba(7,59,40,.04),0_7px_20px_rgba(7,59,40,.045)] transition-[transform,border-color,box-shadow] duration-200 motion-reduce:transition-none">
      <Link
        href={href}
        data-testid="catalogue-card-link"
        aria-label={`${supplierName}, ${code ? `mã ${code}` : title}, xem chi tiết`}
        className="block h-full cursor-pointer rounded-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-wood-600"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-[#e9ede8]">
          {thumbnail ? (
            <Image
              src={resolveMediaUrl(thumbnail)}
              alt={thumbnailAlt}
              fill
              sizes="(max-width: 639px) calc(100vw - 32px), (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 motion-reduce:transition-none"
            />
          ) : (
            <span className="grid h-full place-items-center px-3 text-center text-xs font-bold text-slate-600">
              Nguồn chưa cung cấp ảnh màu
            </span>
          )}
        </div>
        <div className="grid min-h-[6.75rem] grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1.5 p-4">
          <h3
            className="line-clamp-2 min-w-0 text-base font-extrabold leading-[1.4] tracking-[-.015em] text-forest-950 transition-colors group-hover:text-wood-600 sm:text-[1.05rem]"
            translate="no"
          >
            {title}
          </h3>
          {supplier?.logoSrc ? (
            <span className="relative mt-0.5 block h-8 w-16 shrink-0 sm:h-9 sm:w-24" aria-hidden="true">
              <Image
                src={supplier.logoSrc}
                alt=""
                fill
                sizes="96px"
                className="object-contain object-right"
              />
            </span>
          ) : null}
          <p className="col-span-2 line-clamp-2 text-xs leading-5 text-slate-600">
            {taxonomy}
          </p>
        </div>
      </Link>
    </article>
  );
}
