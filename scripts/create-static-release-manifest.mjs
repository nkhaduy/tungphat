import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputDirectory = path.join(root, "out");
const evidenceDirectory = path.join(root, "docs/production-regression-recovery/evidence");
const snapshotPath = path.join(evidenceDirectory, "release-content-snapshot.json");
const manifestPath = path.join(root, "docs/production-regression-recovery/release-manifest.json");
const stagingConfigPath = path.join(root, "wrangler.static-staging.jsonc");

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

const workerVersion = option("--worker-version");
const stagingUrl = option("--staging-url");
if (!workerVersion || !stagingUrl) {
  console.error("Usage: npm run release:manifest -- --worker-version <version-id> --staging-url <https-url>");
  process.exit(2);
}
if (!/^https:\/\//u.test(stagingUrl)) throw new Error("Staging URL must use HTTPS.");
if (!statSync(outputDirectory, { throwIfNoEntry: false })?.isDirectory()) {
  throw new Error("Static output not found. Run npm run verify before creating the release manifest.");
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(absolute);
    return entry.isFile() ? [absolute] : [];
  });
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function fileSha256(file) {
  return sha256(readFileSync(path.join(root, file)));
}

function htmlAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, "iu"));
  return match?.[2] ?? "";
}

function visibleText(value) {
  return value
    .replace(/<[^>]*>/gu, " ")
    .replace(/&amp;/gu, "&")
    .replace(/&quot;/gu, '"')
    .replace(/&#39;|&apos;/gu, "'")
    .replace(/&lt;/gu, "<")
    .replace(/&gt;/gu, ">")
    .replace(/\s+/gu, " ")
    .trim();
}

function routeFor(relativePath) {
  if (relativePath === "index.html") return "/";
  if (relativePath.endsWith("/index.html")) return `/${relativePath.slice(0, -"index.html".length)}`;
  return `/${relativePath.replace(/\.html?$/u, "")}`;
}

const files = walk(outputDirectory).sort((left, right) => left.localeCompare(right));
const htmlFiles = files.filter((file) => /\.html?$/iu.test(file));
const routes = htmlFiles.map((file) => {
  const html = readFileSync(file, "utf8");
  const relativePath = path.relative(outputDirectory, file).split(path.sep).join("/");
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/iu)?.[1] ?? "";
  const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/iu)?.[1] ?? "";
  const tags = [...html.matchAll(/<(?:meta|link)\b[^>]*>/giu)].map((match) => match[0]);
  const description = tags.find((tag) => htmlAttribute(tag, "name").toLowerCase() === "description");
  const robots = tags.find((tag) => htmlAttribute(tag, "name").toLowerCase() === "robots");
  const canonical = tags.find((tag) => htmlAttribute(tag, "rel").toLowerCase() === "canonical");
  return {
    route: routeFor(relativePath),
    title: visibleText(title),
    h1: visibleText(heading),
    description: htmlAttribute(description ?? "", "content"),
    canonical: htmlAttribute(canonical ?? "", "href"),
    robots: htmlAttribute(robots ?? "", "content"),
  };
});

const contentSnapshot = {
  schemaVersion: 1,
  routeCount: routes.length,
  routes,
};
const contentSnapshotJson = `${JSON.stringify(contentSnapshot, null, 2)}\n`;
writeFileSync(snapshotPath, contentSnapshotJson);

const artifactHash = createHash("sha256");
let artifactBytes = 0;
for (const file of files) {
  const relativePath = path.relative(outputDirectory, file).split(path.sep).join("/");
  const content = readFileSync(file);
  artifactBytes += content.length;
  artifactHash.update(relativePath).update("\0").update(content).update("\0");
}

const sourceBranch = execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();
const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const stagingConfig = readFileSync(stagingConfigPath, "utf8");
const workerName = stagingConfig.match(/"name"\s*:\s*"([^"]+)"/u)?.[1] ?? "unknown";
const canonicalOrigin = routes.find((route) => route.canonical.startsWith("https://"))?.canonical;
const buildConfigFiles = [
  "next.config.mjs",
  "package.json",
  "package-lock.json",
  "wrangler.static-production.jsonc",
  "wrangler.static-staging.jsonc",
  "lib/site-domain.ts",
  "content/categories/product-publication.json",
  "data/trustindex-reviews.json",
];

const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: {
    branch: sourceBranch,
    commit: sourceCommit,
    baseCommit: "74a9f8958a9fde5edd90674deeb94592452d930f",
  },
  productionBeforeRelease: {
    worker: "tungphat-static-assets",
    versionId: "16750c49-4e3d-4c2f-aa8a-0b50cf1ff3c4",
    sourceBranch: "codex/gotungphat-release",
    sourceCommit: "d4e5d1efc454afb18662099ad677a86ae1d98993",
    attribution: "high confidence from branch source and upload timestamp; exact old bundle was not retrievable",
  },
  productionAfterRelease: {
    worker: "tungphat-static-assets",
    versionId: "b43086b6-d8d0-4355-8842-fbe476d25890",
  },
  build: {
    command: "npm run verify",
    nodeVersion: process.version,
    outputDirectory: "out",
    fileCount: files.length,
    htmlPageCount: routes.length,
    totalBytes: artifactBytes,
    artifactSha256: artifactHash.digest("hex"),
    publicCanonicalOrigin: canonicalOrigin ? new URL(canonicalOrigin).origin : "unknown",
    configurationSha256: Object.fromEntries(buildConfigFiles.map((file) => [file, fileSha256(file)])),
  },
  contentSnapshot: {
    path: "docs/production-regression-recovery/evidence/release-content-snapshot.json",
    sha256: sha256(contentSnapshotJson),
    routeCount: routes.length,
  },
  stagingDeployment: {
    worker: workerName,
    versionId: workerVersion,
    url: stagingUrl,
    robots: "X-Robots-Tag: noindex, nofollow",
  },
  regressionGuards: [
    "tests/production-home-regression.test.ts",
    "e2e/production-regression-recovery.spec.ts",
  ],
};

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ manifest: path.relative(root, manifestPath), snapshot: path.relative(root, snapshotPath), sourceCommit, artifactSha256: manifest.build.artifactSha256, stagingWorkerVersion: workerVersion }, null, 2));
