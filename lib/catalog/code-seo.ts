import type { PublicSupplierColorCode } from "./color-codes/types";
import { absoluteMediaUrl } from "@/lib/media";
import { absoluteUrl, SITE_URL } from "@/lib/seo";

export type CatalogueCodeTier = "A" | "B" | "C";

export const CATALOGUE_CODE_SEO_PILOT_ROUTES = [
  "/catalogue/thanh-thuy/melamine/301/",
] as const;

type CatalogueCodeSeoOptions = {
  supplierName: string;
  pilotRoutes?: readonly string[];
};

function normalize(value: string | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .replace(/[^a-z0-9]+/gi, "")
    .toLowerCase();
}

function materialLabel(material: string) {
  return material === "ppet" ? "PPET" : material === "pvc" ? "PVC" : material[0].toUpperCase() + material.slice(1);
}

function hasUsefulImage(record: PublicSupplierColorCode) {
  return record.images.some(
    (image) => Boolean(image.localPath && image.width && image.height),
  );
}

function hasDescriptiveName(record: PublicSupplierColorCode, supplierName: string) {
  const displayName = normalize(record.displayName);
  if (!displayName) return false;
  const context = [record.codeRaw, supplierName, materialLabel(record.materialType)]
    .map(normalize)
    .filter(Boolean)
    .join("|");
  const withoutContext = context
    .split("|")
    .reduce((value, part) => value.replaceAll(part, ""), displayName);
  return withoutContext.length >= 3;
}

function hasUsefulContext(record: PublicSupplierColorCode) {
  return Boolean(
    record.collection || record.colorFamily || record.patternType || record.surfaceEffect,
  );
}

function exactIdentity(record: PublicSupplierColorCode) {
  const displayName = record.displayName?.trim();
  if (!displayName) return record.codeRaw;
  return normalize(displayName).includes(normalize(record.codeRaw))
    ? displayName
    : `${record.codeRaw} ${displayName}`;
}

function contextIdentity(identity: string, material: string, supplierName: string) {
  const materialContext = normalize(identity).includes(normalize(supplierName))
    ? materialLabel(material)
    : `${materialLabel(material)} ${supplierName}`;
  return `${identity} - ${materialContext}`;
}

export function buildCatalogueCodeSeo(
  record: PublicSupplierColorCode,
  { supplierName, pilotRoutes = CATALOGUE_CODE_SEO_PILOT_ROUTES }: CatalogueCodeSeoOptions,
) {
  const hasImage = hasUsefulImage(record);
  const descriptiveName = hasDescriptiveName(record, supplierName);
  const tier: CatalogueCodeTier =
    record.codeRaw && record.supplier && record.materialType && hasImage
      ? descriptiveName || record.seoStatus === "READY_TO_INDEX"
        ? "A"
        : hasUsefulContext(record)
          ? "B"
          : "C"
      : "C";
  const approvedForIndex = record.seoStatus === "READY_TO_INDEX" || pilotRoutes.includes(record.canonicalRoute);
  const indexable = tier === "A" && approvedForIndex;
  const identity = exactIdentity(record);
  const fullIdentity = contextIdentity(identity, record.materialType, supplierName);

  return {
    tier,
    indexable,
    materialLabel: materialLabel(record.materialType),
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
    identity,
    title: fullIdentity,
    h1: fullIdentity,
    description: `Tra cứu mã ${identity} thuộc bảng ${materialLabel(record.materialType)} ${supplierName}, kèm hình ảnh mã màu và đường dẫn gửi mã qua Zalo.`,
    imageAlt: `Mã ${identity} - ${materialLabel(record.materialType)} ${supplierName}`,
    ctaLabel: `Gửi mã ${record.codeRaw} qua Zalo`,
  };
}

export function catalogueCodeProductSchema(
  record: PublicSupplierColorCode,
  seo: ReturnType<typeof buildCatalogueCodeSeo>,
  supplierName: string,
) {
  const images = record.images
    .filter((image) => image.localPath)
    .map((image) => absoluteMediaUrl(image.localPath!, SITE_URL));

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: seo.title,
    sku: record.codeRaw,
    brand: { "@type": "Brand", name: supplierName },
    category: materialLabel(record.materialType),
    url: absoluteUrl(record.canonicalRoute),
    ...(images.length ? { image: images } : {}),
  };
}

export function findRelatedCatalogueCodes(
  record: PublicSupplierColorCode,
  records: readonly PublicSupplierColorCode[],
) {
  const family = normalize(record.colorFamily);
  if (!family) return [];

  return records
    .filter((candidate) =>
      candidate.id !== record.id &&
      candidate.supplier === record.supplier &&
      candidate.materialType === record.materialType &&
      normalize(candidate.colorFamily) === family,
    )
    .sort((left, right) => left.codeRaw.localeCompare(right.codeRaw, "vi"));
}

export function createCatalogueCodeSeoIndex(records: readonly PublicSupplierColorCode[]) {
  const groups = new Map<string, PublicSupplierColorCode[]>();
  for (const record of records) {
    const family = normalize(record.colorFamily);
    if (!family) continue;
    const key = `${record.supplier}:${record.materialType}:${family}`;
    const group = groups.get(key) ?? [];
    group.push(record);
    groups.set(key, group);
  }
  for (const group of groups.values()) {
    group.sort((left, right) => left.codeRaw.localeCompare(right.codeRaw, "vi"));
  }

  return {
    relatedFor: (record: PublicSupplierColorCode) => {
      const family = normalize(record.colorFamily);
      if (!family) return [];
      const key = `${record.supplier}:${record.materialType}:${family}`;
      return (groups.get(key) ?? []).filter((candidate) => candidate.id !== record.id);
    },
  };
}
