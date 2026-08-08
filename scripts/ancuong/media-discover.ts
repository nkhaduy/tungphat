import fs from "node:fs";
import path from "node:path";
import type { PublicSupplierColorCode } from "../../lib/catalog/color-codes/types";
import {
  semanticMediaPath,
  type ColorMediaDiscoveryArtifact,
  type ColorMediaDiscoveryEntry,
  writeColorMediaArtifact,
} from "../catalog-suppliers/color-media";

type AnCuongSourceRecord = {
  sourceUrl?: string;
  canonicalSourceUrl?: string;
  sourceUrls?: string[];
  productCode?: string;
  code?: string;
  primaryImage?: { sourceUrl?: string };
  gallery?: Array<{ sourceUrl?: string }>;
};

function previewFromFullsheet(sourceUrl: string): string {
  return sourceUrl.replace("/products/products-full/", "/products/products-thumb/");
}

export function semanticColorMediaPath(
  material: string,
  codeRaw: string,
  role: "swatch" | "fullsheet" | "application",
  ordinal?: number,
) {
  return semanticMediaPath("an-cuong", material, codeRaw, role, ordinal);
}

export function discoverAnCuongColorMedia(root = process.cwd()): ColorMediaDiscoveryArtifact {
  const artifact = JSON.parse(fs.readFileSync(path.join(root, "data/catalogs/supplier-color-codes.json"), "utf8")) as { records: PublicSupplierColorCode[] };
  const catalogue = JSON.parse(fs.readFileSync(path.join(root, "data/imports/ancuong/normalized/catalogue.json"), "utf8")) as AnCuongSourceRecord[];
  const sourceRecordByUrl = new Map<string, AnCuongSourceRecord>();
  for (const record of catalogue) {
    if (record.sourceUrl) sourceRecordByUrl.set(record.sourceUrl, record);
  }
  const entries = artifact.records
    .filter((record) => record.supplier === "an-cuong")
    .map((record): ColorMediaDiscoveryEntry => {
      const fullsheet = record.images.find((image) => image.role === "fullsheet")?.sourceUrl;
      const swatch = record.images.find((image) => image.role === "swatch")?.sourceUrl;
      const applications = record.images.filter((image) => image.role === "application").map((image) => image.sourceUrl);
      const semanticLocalAssets = record.images
        .filter((image) => image.localPath && (image.role === "swatch" || image.role === "fullsheet" || image.role === "application"))
        .map((image) => {
          const role = image.role as "swatch" | "fullsheet" | "application";
          const ordinal = role === "application"
            ? applications.findIndex((sourceUrl) => sourceUrl === image.sourceUrl) + 1
            : undefined;
          return {
            role,
            sourceUrl: image.sourceUrl,
            localPath: semanticColorMediaPath(record.materialType, record.codeRaw, role, ordinal),
            checksum: image.checksum,
            mimeType: image.mimeType,
            width: image.width,
            height: image.height,
          };
        });
      const localPreview = semanticLocalAssets.find((asset) => asset.role === "swatch");
      let previewSourceUrl = swatch || (fullsheet ? previewFromFullsheet(fullsheet) : undefined);
      let fullsheetSourceUrl = fullsheet;
      let reasonCode: ColorMediaDiscoveryEntry["reasonCode"] = previewSourceUrl ? "SOURCE_IMAGE_LAZY" : "SOURCE_NO_IMAGE";
      const supporting = record.sourceUrls.map((url) => sourceRecordByUrl.get(url)).find(Boolean);
      if (record.colorCodeEvidence === "matching-color" && supporting?.primaryImage?.sourceUrl) {
        fullsheetSourceUrl = supporting.primaryImage.sourceUrl;
        previewSourceUrl = previewFromFullsheet(fullsheetSourceUrl);
        reasonCode = "SOURCE_HAS_IMAGE_BUT_PARSER_MISSED";
      }
      if (!previewSourceUrl) {
        fullsheetSourceUrl = supporting?.primaryImage?.sourceUrl;
        previewSourceUrl = fullsheetSourceUrl ? previewFromFullsheet(fullsheetSourceUrl) : undefined;
        if (previewSourceUrl) reasonCode = "SOURCE_HAS_IMAGE_BUT_PARSER_MISSED";
      }
      return {
        id: record.id,
        codeRaw: record.codeRaw,
        codeNormalized: record.codeNormalized,
        sourceUrl: record.sourceUrl,
        previewSourceUrl,
        fullsheetSourceUrl,
        applicationSourceUrls: applications,
        localPath: localPreview?.localPath,
        checksum: localPreview?.checksum,
        mimeType: localPreview?.mimeType,
        width: localPreview?.width,
        height: localPreview?.height,
        localAssets: semanticLocalAssets.length ? semanticLocalAssets : undefined,
        sourceHasMedia: Boolean(previewSourceUrl || fullsheetSourceUrl || applications.length),
        reasonCode,
      };
    });
  return { schemaVersion: 1, supplier: "an-cuong", generatedAt: "2026-08-07T00:00:00.000Z", entries };
}

if (process.argv[1]?.endsWith("media-discover.ts")) {
  writeColorMediaArtifact(process.cwd(), "data/imports/an-cuong/color-media-discovery.json", discoverAnCuongColorMedia());
}
