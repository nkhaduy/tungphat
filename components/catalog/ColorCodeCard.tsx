import { CatalogueMaterialCard } from "@/components/catalog/CatalogueMaterialCard";
import type { SupplierColorCode } from "@/lib/catalog/types";
import {
  formatCatalogCardTaxonomy,
  formatCatalogCardTitle,
} from "@/lib/catalog/ui";

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
}: {
  record: ColorCardRecord;
  onCopy?: (code: string) => void;
}) {
  const image = record.images[0];
  return (
    <CatalogueMaterialCard
      href={`/ma-mau-melamine/ba-thanh/${record.slug}/`}
      supplierId="ba-thanh"
      supplierName="Ba Thanh"
      code={record.codeNormalized}
      title={formatCatalogCardTitle({
        supplierId: "ba-thanh",
        code: record.codeNormalized,
        name: record.displayName,
      })}
      taxonomy={formatCatalogCardTaxonomy({
        category: record.category,
        group: record.patternGroup,
      })}
      thumbnail={image?.thumbnailSrc || image?.src}
      thumbnailAlt={image?.alt}
    />
  );
}
