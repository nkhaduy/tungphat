import fs from "node:fs";
import path from "node:path";
import {
  validateColorMediaDiscovery,
  type ColorMediaDiscoveryArtifact,
} from "../catalog-suppliers/color-media";

export function validateBaThanhColorMedia(root = process.cwd()) {
  const artifact = JSON.parse(fs.readFileSync(path.join(root, "data/imports/ba-thanh/color-media-discovery.json"), "utf8")) as ColorMediaDiscoveryArtifact;
  return validateColorMediaDiscovery(artifact, root);
}

if (process.argv[1]?.endsWith("media-validate.ts")) {
  const issues = validateBaThanhColorMedia();
  console.log(JSON.stringify({ issues: issues.length, details: issues.slice(0, 100) }, null, 2));
  if (issues.length) process.exitCode = 1;
}
