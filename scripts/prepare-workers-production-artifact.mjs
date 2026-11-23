import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const STAGING_CMS_ORIGIN = "https://tungphat-payload-cms-staging.nkhaduy.workers.dev";

export function sanitizeProductionHeaders(content) {
  return content.split(/\r?\n/u).map((line) => {
    if (!/^\s*content-security-policy\s*:/iu.test(line)) return line;
    return line.replaceAll(` ${STAGING_CMS_ORIGIN}`, "").replaceAll(`${STAGING_CMS_ORIGIN} `, "");
  }).join("\n");
}

export function assertProductionHeaders(content) {
  let pattern = "";
  for (const line of content.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    if (!/^\s/.test(line)) pattern = line.trim();
    else if ((pattern === "/*" || pattern === "*" || /^https?:\/\/[^/]+\/\*$/.test(pattern)) && /^\s*x-robots-tag\s*:/i.test(line) && /\bnoindex\b/i.test(line)) {
      throw new Error("Refusing production artifact: global noindex header present");
    }
  }
}

export function prepareProductionArtifact(root = process.cwd()) {
  if (process.env.CLOUDFLARE_PREVIEW === "1" || (process.env.CF_PAGES_BRANCH && process.env.CF_PAGES_BRANCH !== "main")) {
    throw new Error("Refusing production artifact in a preview build environment");
  }
  const source = path.join(root, "out");
  const destination = path.join(root, ".wrangler", "workers-production-assets");
  const productionHeaders = sanitizeProductionHeaders(readFileSync(path.join(source, "_headers"), "utf8"));
  assertProductionHeaders(productionHeaders);
  if (!existsSync(path.join(source, "index.html")) || !existsSync(path.join(source, "404.html"))) throw new Error("Build output missing index.html or 404.html");
  if (existsSync(destination)) throw new Error(`Destination already exists; inspect and remove it explicitly before preparing: ${destination}`);
  mkdirSync(path.dirname(destination), { recursive: true });
  cpSync(source, destination, { recursive: true, errorOnExist: true, force: false });
  writeFileSync(path.join(destination, "_headers"), productionHeaders);
  console.log(`Prepared production assets in ${destination}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) prepareProductionArtifact();
