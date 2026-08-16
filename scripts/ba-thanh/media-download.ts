import fs from "node:fs";
import path from "node:path";
import type { PublicSupplierColorCode } from "../../lib/catalog/color-codes/types";
import {
  downloadColorMediaArtifact,
  type ColorMediaDiscoveryArtifact,
  writeColorMediaArtifact,
} from "../catalog-suppliers/color-media";
import { discoverBaThanhColorMedia } from "./media-discover";

export async function downloadBaThanhColorMedia(root = process.cwd()) {
  const discoveryPath = path.join(root, "data/imports/ba-thanh/color-media-discovery.json");
  const discovery = fs.existsSync(discoveryPath)
    ? (JSON.parse(fs.readFileSync(discoveryPath, "utf8")) as ColorMediaDiscoveryArtifact)
    : await discoverBaThanhColorMedia(root);
  const index = JSON.parse(fs.readFileSync(path.join(root, "data/catalogs/supplier-color-codes.json"), "utf8")) as { records: PublicSupplierColorCode[] };
  const materialByCode = new Map(
    index.records
      .filter((record) => record.supplier === "ba-thanh")
      .map((record) => [record.codeNormalized, record.materialType]),
  );
  const downloaded = await downloadColorMediaArtifact({
    artifact: discovery,
    materialByCode,
    root,
    concurrency: 2,
    minDelayMs: 250,
    checkpointRelativePath: "data/imports/ba-thanh/color-media-discovery.json",
  });
  writeColorMediaArtifact(root, "data/imports/ba-thanh/color-media-discovery.json", downloaded);
  return downloaded;
}

if (process.argv[1]?.endsWith("media-download.ts")) {
  downloadBaThanhColorMedia().then((artifact) => {
    console.log(JSON.stringify({ entries: artifact.entries.length, local: artifact.entries.filter((entry) => entry.localPath).length }, null, 2));
  });
}
