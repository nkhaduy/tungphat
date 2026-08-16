import { existsSync } from "node:fs";
import path from "node:path";
import { measurePagesCapacity } from "./lib/cloudflare-pages-capacity.mjs";

const outputDirectory = path.resolve("out");
const sourcePublicDirectory = path.resolve("public");
const hasOutput = existsSync(outputDirectory);
const result = measurePagesCapacity(
  hasOutput ? outputDirectory : sourcePublicDirectory,
  hasOutput ? "STATIC_OUTPUT" : "PREBUILD_SOURCE_PUBLIC",
);

console.log(JSON.stringify(result, null, 2));
if (result.fileCountGate !== "PASS" || result.maxFileGate !== "PASS") process.exitCode = 1;
