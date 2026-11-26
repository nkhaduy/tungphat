import Image from "next/image";
import { supplierRegistry } from "@/lib/catalog/core/registry";
import type { SupplierId } from "@/lib/catalog/core/types";

type SupplierBrandLogoProps = {
  supplierId: SupplierId;
  variant?: "card" | "detail";
};

export function SupplierBrandLogo({ supplierId, variant = "card" }: SupplierBrandLogoProps) {
  const supplier = supplierRegistry.get(supplierId);
  if (!supplier?.logoSrc) return null;

  const isDetail = variant === "detail";
  return (
    <span
      data-testid="supplier-brand-logo"
      data-supplier-id={supplierId}
      className={isDetail
        ? "relative block h-10 w-28 shrink-0 sm:h-12 sm:w-32"
        : "relative block h-8 w-16 shrink-0 sm:h-9 sm:w-24"}
    >
      <Image
        src={supplier.logoSrc}
        alt={`Logo ${supplier.displayName}`}
        fill
        sizes={isDetail ? "(min-width: 640px) 128px, 112px" : "(min-width: 640px) 96px, 64px"}
        className={isDetail ? "object-contain object-left" : "object-contain object-right"}
      />
    </span>
  );
}
