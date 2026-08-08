import fs from "node:fs";
import path from "node:path";
import {
  validateColorMediaDiscovery,
  type ColorMediaDiscoveryArtifact,
} from "../catalog-suppliers/color-media";

export function validateAnCuongColorMedia(root = process.cwd()) {
  const artifact = JSON.parse(fs.readFileSync(path.join(root, "data/imports/an-cuong/color-media-discovery.json"), "utf8")) as ColorMediaDiscoveryArtifact;
  return validateColorMediaDiscovery(artifact, root);
}

if (process.argv[1]?.endsWith("media-validate.ts")) {
  const issues = validateAnCuongColorMedia();
  console.log(JSON.stringify({ issues: issues.length, details: issues.slice(0, 100) }, null, 2));
  if (issues.length) process.exitCode = 1;
}
