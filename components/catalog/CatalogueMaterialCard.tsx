import { CatalogueDeferredImage } from "@/components/catalog/CatalogueDeferredImage";
import { SupplierBrandLogo } from "@/components/catalog/SupplierBrandLogo";
import Link from "next/link";
import type { SupplierId } from "@/lib/catalog/core/types";
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
  deferImages?: boolean;
  priorityImage?: boolean;
  showSupplierLogo?: boolean;
  showSupplierName?: boolean;
};

function CardImage({ defer, priority = false, fallbackLabel, ...props }: { defer: boolean; priority?: boolean; fallbackLabel?: string; src: string; alt: string; sizes: string; className: string }) {
  return <CatalogueDeferredImage {...props} eager={!defer} priority={priority} fallbackLabel={fallbackLabel} />;
}

export function CatalogueMaterialCard({
  href,
  supplierId,
  supplierName,
  code,
  title,
  taxonomy,
  thumbnail,
  thumbnailAlt = "",
  deferImages = false,
  priorityImage = false,
  showSupplierLogo = true,
  showSupplierName = false,
}: CatalogueMaterialCardProps) {
  return (
    <article className="catalogue-material-card group min-w-0 overflow-hidden rounded-lg border border-forest-900/10 bg-white shadow-[0_1px_2px_rgba(7,59,40,.04),0_7px_20px_rgba(7,59,40,.045)] transition-[transform,border-color,box-shadow] duration-200 motion-reduce:transition-none">
      <Link
        href={href}
        data-testid="catalogue-card-link"
        aria-label={`${supplierName}, ${code ? `mã ${code}` : title}, xem chi tiết`}
        className="block h-full cursor-pointer rounded-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-wood-600"
      >
        <div className="relative aspect-[2/1] overflow-hidden bg-[#e9ede8]">
          {thumbnail ? (
            <CardImage
              defer={deferImages && !priorityImage}
              priority={priorityImage}
              src={resolveMediaUrl(thumbnail)}
              alt={thumbnailAlt || `${supplierName}, mã ${code ?? title}: bề mặt vật liệu`}
              sizes="(max-width: 639px) calc((100vw - 44px) / 2), (max-width: 1023px) calc((100vw - 72px) / 2), (max-width: 1279px) 34vw, (max-width: 1535px) 22vw, (max-width: 1919px) 16rem, 15rem"
              className="object-cover transition-transform duration-300 motion-reduce:transition-none"
              fallbackLabel="Không tải được ảnh xem trước từ nguồn."
            />
          ) : (
            <>
              <CardImage
                defer={deferImages && !priorityImage}
                priority={priorityImage}
                src="/images/catalogue-preview-unavailable.svg"
                alt=""
                sizes="(max-width: 639px) calc((100vw - 44px) / 2), (max-width: 1023px) calc((100vw - 72px) / 2), (max-width: 1279px) 34vw, (max-width: 1535px) 22vw, (max-width: 1919px) 16rem, 15rem"
                className="object-contain"
              />
              <span className="relative z-10 grid h-full place-items-center px-3 text-center text-xs font-bold text-slate-600">
                Nguồn chưa cung cấp ảnh màu
              </span>
            </>
          )}
        </div>
        <div className="grid min-h-[6.75rem] grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1.5 p-4">
          <h3
            className={`${showSupplierLogo ? "" : "col-span-2"} line-clamp-2 min-w-0 text-base font-extrabold leading-[1.4] tracking-[-.015em] text-forest-950 transition-colors group-hover:text-wood-600 sm:text-[1.05rem]`}
            translate="no"
          >
            {title}
          </h3>
          {showSupplierLogo ? <SupplierBrandLogo supplierId={supplierId} /> : null}
          <p className="col-span-2 line-clamp-2 text-xs leading-5 text-slate-600">
            {showSupplierName ? <><span className="font-medium text-slate-700">{supplierName}</span>{taxonomy ? " · " : ""}</> : null}{taxonomy}
          </p>
        </div>
      </Link>
    </article>
  );
}
