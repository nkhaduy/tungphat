import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const CANONICAL_ORIGIN = "https://mdftungphat.com";
const EXCLUDED_ROUTES = new Set(["/404.html", "/404/", "/cms-preview/"]);
const IMAGE_EXTENSION = /\.(?:avif|gif|jpe?g|png|svg|webp)$/iu;
const RASTER_MIME_TYPES = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const FORMAT_MIME_TYPES = {
  avif: "image/avif",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  webp: "image/webp",
};

const EXPECTED = {
  metadataNonImageHash: "377bc31849c790e461abd553614b11d75ad77d8f4743c7d4ff6c8765d713f9b3",
  visibleTextHash: "73cb793acf8536a5df9375d1c0ecd9821b5ebce90764c581067af08c184e8b0a",
  visibleImageHash: "03b394f8cece0ad3f22f10ca48e05905992b2ac845ae7c11a2c47f0c58ee7643",
  schemaHash: "2cfb48a09093e9c4311b7383db8def9c6ffb460f0d1f83c25cd3cecbc7ab5e13",
  sitemapHash: "bd77380b37c0209b19c330f7193abf891ba12af135fcc5d29c35364557d5dca4",
  protectedFileHash: "3e862185da8abdda5d92225d4f850df8161f48d4f827b357161b41886a6ae2cc",
  quoteApp: {
    fileCount: 14252,
    bytes: 560715133,
    sha256: "cfc8239b063d49cc8f1b15654b5994fe106eeea4602dfac041958c95a0f2fc8b",
  },
};

const SOCIAL_ASSETS = {
  "public/og-logo.png": {
    bytes: 69706,
    width: 1200,
    height: 630,
    type: "image/png",
    sha256: "ded4df4721fc98edb35ab4e4f18c186998f8d0b2162ef2878c82e4694cacc33c",
  },
  "public/images/cnc-service.webp": {
    bytes: 133314,
    width: 1222,
    height: 821,
    type: "image/webp",
    sha256: "369a5bea2769efe083e7d50957cfd72c65f971e24d053a3bab3251e9f4c412c6",
  },
  "public/images/hero-workshop4.webp": {
    bytes: 164510,
    width: 1915,
    height: 821,
    type: "image/webp",
    sha256: "708390c4625ef2bc3a755c82c12f64d15554ff01a42c29b88f1ae9dae6319cde",
  },
  "public/images/hero-workshop5.webp": {
    bytes: 116464,
    width: 1915,
    height: 821,
    type: "image/webp",
    sha256: "d2bc03efb4cec0fd9e42feff1149ff77ca781af91f1c5daae627fceb3aa0da86",
  },
  "public/images/wood-panels.webp": {
    bytes: 128502,
    width: 1448,
    height: 1086,
    type: "image/webp",
    sha256: "2fc3b45affd9ecde6665d7cbbb376e6d82d2a86313618c1b57f5ad0c9737e4bc",
  },
  "public/wood/vanchongam.webp": {
    bytes: 100402,
    width: 1122,
    height: 1402,
    type: "image/webp",
    sha256: "11da3f5183f649dd218c3b70e8505a8253a9b5a2ede9b0771a9b108f35dd23a4",
  },
  "public/wood/mdfmfc.webp": {
    bytes: 102068,
    width: 1122,
    height: 1402,
    type: "image/webp",
    sha256: "6591c520fdc000c86eda1428c2166c29fc941e8a9cfa80c22be461a4b005e4d0",
  },
};

const PROTECTED_FILES = [
  "app/page.tsx",
  "components/Footer.tsx",
  "components/Header.tsx",
  "components/Hero.tsx",
  "components/Partners.tsx",
  "components/WorkshopMedia.tsx",
  "components/content/ArticleLanding.tsx",
  "components/content/MarkdownContent.tsx",
  "components/content/ProductLanding.tsx",
  "components/content/ProjectLanding.tsx",
  "components/content/ServiceLanding.tsx",
  "content/pages/cat-cnc-go.md",
  "content/pages/gia-cong-cnc-mdf.md",
  "content/products/go-ghep-cao-su.md",
  "content/products/go-ghep-tram.md",
  "content/products/go-ghep.md",
  "content/products/mdf-chong-am.md",
  "content/products/van-go-cong-nghiep.md",
  "content/products/van-mdf.md",
  "app/sitemap.ts",
  "lib/listing-indexability.ts",
];

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const outputDirectory = path.resolve(option("--out") ?? "out");
const runtimeOrigin = option("--origin")?.replace(/\/$/u, "");
const runtimeLabel = option("--label") ?? (runtimeOrigin ? "runtime" : "static export");
const jsonOutput = process.argv.includes("--json");
const browserMode = process.argv.includes("--browser");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableHash(records) {
  return sha256(records.slice().sort().join("\n"));
}

function walkFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(absolute) : entry.isFile() ? [absolute] : [];
  });
}

function htmlRoute(file) {
  const relative = path.relative(outputDirectory, file).split(path.sep).join("/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) return `/${relative.slice(0, -"/index.html".length)}/`;
  return `/${relative}`;
}

function publicHtmlFiles() {
  if (!existsSync(outputDirectory)) throw new Error(`Không tìm thấy static export: ${outputDirectory}`);
  return walkFiles(outputDirectory)
    .filter((file) => file.endsWith(".html"))
    .filter((file) => !EXCLUDED_ROUTES.has(htmlRoute(file)))
    .sort();
}

function rawAttributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)=(?:"([^"]*)"|'([^']*)')/gu)].map((match) => [
      match[1].toLowerCase(),
      match[2] ?? match[3] ?? "",
    ]),
  );
}

function attributes(tag) {
  return Object.fromEntries(Object.entries(rawAttributes(tag)).map(([key, value]) => [key, decodeHtml(value)]));
}

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function headMetadata(html) {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/iu)?.[1] ?? "";
  const documentHtml = html;
  return {
    head,
    title: decodeHtml(documentHtml.match(/<title>([\s\S]*?)<\/title>/iu)?.[1]?.trim() ?? ""),
    metas: [...documentHtml.matchAll(/<meta\b[^>]*>/giu)].map((match) => attributes(match[0])),
    links: [...documentHtml.matchAll(/<link\b[^>]*>/giu)].map((match) => attributes(match[0])),
    rawTitle: documentHtml.match(/<title>([\s\S]*?)<\/title>/iu)?.[1]?.trim() ?? "",
    rawMetas: [...documentHtml.matchAll(/<meta\b[^>]*>/giu)].map((match) => rawAttributes(match[0])),
    rawLinks: [...documentHtml.matchAll(/<link\b[^>]*>/giu)].map((match) => rawAttributes(match[0])),
  };
}

function socialMetadata(metas) {
  const ogImages = [];
  const twitterImages = [];
  const errors = [];
  let currentOg;
  let currentTwitter;

  for (const meta of metas) {
    const property = meta.property?.toLowerCase();
    const name = meta.name?.toLowerCase();
    if (property === "og:image") {
      currentOg = { url: meta.content ?? "" };
      ogImages.push(currentOg);
    } else if (property?.startsWith("og:image:")) {
      if (!currentOg) errors.push(`orphan ${property}`);
      else currentOg[property.slice("og:image:".length).replace("secure_url", "secureUrl")] = meta.content ?? "";
    }

    if (name === "twitter:image") {
      currentTwitter = { url: meta.content ?? "" };
      twitterImages.push(currentTwitter);
    } else if (name?.startsWith("twitter:image:")) {
      if (!currentTwitter) errors.push(`orphan ${name}`);
      else currentTwitter[name.slice("twitter:image:".length).replace("secure_url", "secureUrl")] = meta.content ?? "";
    }
  }

  const declarations = metas
    .filter((meta) => {
      const key = (meta.property ?? meta.name ?? "").toLowerCase();
      return key.startsWith("og:image") || key.startsWith("twitter:image");
    })
    .map((meta) => JSON.stringify(meta));
  const duplicateDeclarations = declarations.length - new Set(declarations).size;
  return { ogImages, twitterImages, errors, duplicateDeclarations };
}

function visibleText(html) {
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/iu)?.[1] ?? "";
  return decodeHtml(
    body
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, " ")
      .replace(/<[^>]+>/gu, " ")
      .replace(/\s+/gu, " ")
      .trim(),
  );
}

function visibleImages(html, route) {
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/iu)?.[1] ?? "";
  return [...body.matchAll(/<(?:img|source)\b[^>]*>/giu)].map((match) => {
    const values = attributes(match[0]);
    return `${route}\t${match[0].startsWith("<img") ? "img" : "source"}\t${JSON.stringify({
      src: values.src ?? "",
      srcset: values.srcset ?? "",
      alt: values.alt ?? "",
    })}`;
  });
}

function schemaRecords(html, route, errors) {
  return [...html.matchAll(/<script\b[^>]*type=(?:"application\/ld\+json"|'application\/ld\+json')[^>]*>([\s\S]*?)<\/script>/giu)].map(
    (match, index) => {
      try {
        return `${route}\t${JSON.stringify(JSON.parse(match[1]))}`;
      } catch (error) {
        errors.push(`${route}: JSON-LD block ${index + 1} không parse được: ${error.message}`);
        return `${route}\t<parse-error>`;
      }
    },
  );
}

function mimeWithoutParameters(value) {
  return value?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
}

function isInternalHostname(hostname) {
  return hostname === "mdftungphat.com" || hostname === "www.mdftungphat.com";
}

function localAssetPath(url) {
  if (!isInternalHostname(url.hostname)) return undefined;
  const candidate = path.resolve("public", `.${decodeURIComponent(url.pathname)}`);
  const publicRoot = path.resolve("public");
  return candidate.startsWith(`${publicRoot}${path.sep}`) ? candidate : undefined;
}

async function inspectImage(rawUrl, errors) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    errors.push(`URL ảnh không absolute: ${rawUrl}`);
    return { url: rawUrl, status: 0, type: "", width: 0, height: 0 };
  }

  if (url.protocol !== "https:") errors.push(`URL ảnh không dùng HTTPS: ${rawUrl}`);
  if (["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname)) errors.push(`URL ảnh dùng dev origin: ${rawUrl}`);
  if (isInternalHostname(url.hostname) && url.origin !== CANONICAL_ORIGIN) errors.push(`URL ảnh internal không dùng canonical origin: ${rawUrl}`);
  if (/\.(?:avif|gif|jpe?g|png|svg|webp)\/$/iu.test(url.pathname)) errors.push(`URL ảnh có slash sau extension: ${rawUrl}`);
  if (IMAGE_EXTENSION.test(url.pathname) && url.search) errors.push(`URL ảnh file có query cache-busting: ${rawUrl}`);

  let response;
  try {
    response = await fetch(url, { redirect: "manual" });
  } catch (error) {
    errors.push(`Không tải được ảnh ${rawUrl}: ${error.message}`);
    return { url: rawUrl, status: 0, type: "", width: 0, height: 0 };
  }

  const location = response.headers.get("location");
  if (location) errors.push(`Ảnh redirect ${response.status}: ${rawUrl} -> ${location}`);
  if (response.status !== 200) errors.push(`Ảnh không trả 200 trực tiếp (${response.status}): ${rawUrl}`);
  const type = mimeWithoutParameters(response.headers.get("content-type"));
  if (!type.startsWith("image/")) errors.push(`Content-Type không phải ảnh (${type || "missing"}): ${rawUrl}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  let width = 0;
  let height = 0;
  let format = "";
  if (type === "image/svg+xml") {
    format = "svg";
  } else if (RASTER_MIME_TYPES.has(type)) {
    try {
      const metadata = await sharp(buffer).metadata();
      width = metadata.width ?? 0;
      height = metadata.height ?? 0;
      format = metadata.format ?? "";
      const actualType = FORMAT_MIME_TYPES[format];
      if (actualType && actualType !== type) errors.push(`HTTP MIME ${type} không khớp format ${actualType}: ${rawUrl}`);
      if (!width || !height) errors.push(`Không đo được pixel dimensions: ${rawUrl}`);
    } catch (error) {
      errors.push(`Không đọc được raster image ${rawUrl}: ${error.message}`);
    }
  }

  const localPath = localAssetPath(url);
  if (localPath && !existsSync(localPath)) errors.push(`Không tìm thấy asset local cho ${rawUrl}`);
  return {
    url: rawUrl,
    status: response.status,
    redirect: location,
    type,
    bytes: buffer.byteLength,
    width,
    height,
    format,
    localPath,
  };
}

let runtimeBrowser;
let runtimePage;
let activeRuntimeRoute = "";

async function htmlFor(file, route, errors) {
  if (!runtimeOrigin) return readFileSync(file, "utf8");
  if (browserMode) {
    const response = await runtimePage.goto(new URL(route, runtimeOrigin).toString(), { waitUntil: "domcontentloaded" });
    if (response?.status() !== 200) errors.push(`${route}: browser runtime trả ${response?.status() ?? "no response"}.`);
    try {
      await runtimePage.waitForFunction(() => document.querySelector('meta[property="og:image"]'), undefined, { timeout: 15_000 });
    } catch {
      errors.push(`${route}: browser runtime không render og:image trong 15 giây.`);
    }
    return runtimePage.content();
  }
  const response = await fetch(new URL(route, runtimeOrigin), { redirect: "manual" });
  if (response.status !== 200 || response.headers.get("location")) {
    errors.push(`${route}: runtime trả ${response.status}${response.headers.get("location") ? ` -> ${response.headers.get("location")}` : ""}`);
  }
  return response.text();
}

async function inspectProtectedAssets(errors) {
  for (const [relative, expected] of Object.entries(SOCIAL_ASSETS)) {
    if (!existsSync(relative)) {
      errors.push(`Thiếu social image asset: ${relative}`);
      continue;
    }
    const bytes = readFileSync(relative);
    const metadata = await sharp(bytes).metadata();
    const type = FORMAT_MIME_TYPES[metadata.format ?? ""] ?? "";
    const actual = {
      bytes: bytes.byteLength,
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
      type,
      sha256: sha256(bytes),
    };
    for (const key of Object.keys(expected)) {
      if (actual[key] !== expected[key]) errors.push(`${relative}: ${key} drift (${actual[key]} != ${expected[key]}).`);
    }
  }
}

function quoteAppManifest() {
  const files = walkFiles("quote-app").sort();
  let bytes = 0;
  const records = [];
  for (const file of files) {
    const content = readFileSync(file);
    bytes += content.byteLength;
    records.push(`${sha256(content)}  ${file}`);
  }
  return { fileCount: files.length, bytes, sha256: sha256(`${records.join("\n")}\n`) };
}

const files = publicHtmlFiles();
const errors = [];
const rows = [];
const metadataRecords = [];
const visibleTextRecords = [];
const visibleImageRecords = [];
const allSchemaRecords = [];
const imageOccurrences = [];
let duplicateDeclarations = 0;

if (browserMode) {
  if (!runtimeOrigin) throw new Error("--browser requires --origin.");
  runtimeBrowser = await chromium.launch({ headless: true });
  runtimePage = await runtimeBrowser.newPage({ viewport: { width: 1440, height: 900 } });
  runtimePage.on("console", (message) => {
    if (message.type() === "error") errors.push(`${activeRuntimeRoute || "runtime"}: console error: ${message.text()}`);
  });
  runtimePage.on("pageerror", (error) => errors.push(`${activeRuntimeRoute || "runtime"}: page error: ${error.message}`));
}

for (const file of files) {
  const route = htmlRoute(file);
  activeRuntimeRoute = route;
  const html = await htmlFor(file, route, errors);
  const metadata = headMetadata(html);
  const social = socialMetadata(metadata.metas);
  duplicateDeclarations += social.duplicateDeclarations;
  for (const issue of social.errors) errors.push(`${route}: ${issue}`);
  if (!social.ogImages.length) errors.push(`${route}: thiếu og:image.`);
  if (!social.twitterImages.length) errors.push(`${route}: thiếu twitter:image.`);
  if (social.duplicateDeclarations) errors.push(`${route}: có ${social.duplicateDeclarations} duplicate social meta declarations.`);

  for (const image of social.ogImages) imageOccurrences.push({ route, family: "og", image });
  for (const image of social.twitterImages) imageOccurrences.push({ route, family: "twitter", image });

  for (const image of social.ogImages) {
    if (!image.url) errors.push(`${route}: og:image rỗng.`);
    if (!image.alt?.trim()) errors.push(`${route}: og:image:alt rỗng.`);
    if (!image.type?.trim()) errors.push(`${route}: thiếu og:image:type.`);
    const width = Number(image.width);
    const height = Number(image.height);
    if (!Number.isInteger(width) || width <= 0) errors.push(`${route}: og:image:width không phải integer dương.`);
    if (!Number.isInteger(height) || height <= 0) errors.push(`${route}: og:image:height không phải integer dương.`);
  }
  for (const image of social.twitterImages) {
    if (!image.url) errors.push(`${route}: twitter:image rỗng.`);
    if (!image.alt?.trim()) errors.push(`${route}: twitter:image:alt rỗng.`);
    if (!social.ogImages.some((ogImage) => ogImage.url === image.url)) {
      errors.push(`${route}: Twitter image không khớp một OG image có chủ đích.`);
    }
  }

  metadataRecords.push(`${route}\ttitle\t${metadata.rawTitle}`);
  for (const meta of metadata.rawMetas) {
    const key = (meta.property ?? meta.name ?? "").toLowerCase();
    if (!key.startsWith("og:image") && !key.startsWith("twitter:image")) {
      metadataRecords.push(`${route}\tmeta\t${JSON.stringify(meta)}`);
    }
  }
  for (const link of metadata.rawLinks) {
    if (link.rel?.toLowerCase() === "canonical") metadataRecords.push(`${route}\tlink\t${JSON.stringify(link)}`);
  }
  visibleTextRecords.push(`${route}\t${visibleText(html)}`);
  visibleImageRecords.push(...visibleImages(html, route));
  allSchemaRecords.push(...schemaRecords(html, route, errors));
  rows.push({ route, ogImages: social.ogImages, twitterImages: social.twitterImages });
}

const imageAudits = new Map();
for (const rawUrl of [...new Set(imageOccurrences.map((occurrence) => occurrence.image.url).filter(Boolean))]) {
  imageAudits.set(rawUrl, await inspectImage(rawUrl, errors));
}

for (const { route, family, image } of imageOccurrences) {
  const audit = imageAudits.get(image.url);
  if (!audit) continue;
  if (family === "og") {
    if (Number(image.width) !== audit.width || Number(image.height) !== audit.height) {
      errors.push(`${route}: OG dimensions ${image.width}x${image.height} != actual ${audit.width}x${audit.height} (${image.url}).`);
    }
    if (mimeWithoutParameters(image.type) !== audit.type) {
      errors.push(`${route}: og:image:type ${image.type || "missing"} != ${audit.type} (${image.url}).`);
    }
  }
}

await inspectProtectedAssets(errors);

const computedProtection = {
  metadataNonImageHash: stableHash(metadataRecords),
  visibleTextHash: stableHash(visibleTextRecords),
  visibleImageHash: stableHash(visibleImageRecords),
  schemaHash: stableHash(allSchemaRecords),
  sitemapHash: sha256(readFileSync(path.join(outputDirectory, "sitemap.xml"))),
  protectedFileHash: stableHash(PROTECTED_FILES.map((file) => `${file}\t${sha256(readFileSync(file))}`)),
};
for (const [key, expected] of Object.entries(EXPECTED)) {
  if (!browserMode && typeof expected === "string" && computedProtection[key] !== expected) {
    errors.push(`${key} drift: ${computedProtection[key]} != ${expected}.`);
  }
}

const quoteApp = quoteAppManifest();
for (const [key, expected] of Object.entries(EXPECTED.quoteApp)) {
  if (quoteApp[key] !== expected) errors.push(`quote-app ${key} drift: ${quoteApp[key]} != ${expected}.`);
}

const metrics = {
  label: runtimeLabel,
  routes: rows.length,
  routesWithOgImage: rows.filter((row) => row.ogImages.length > 0).length,
  routesMissingOgImage: rows.filter((row) => row.ogImages.length === 0).length,
  uniqueImages: imageAudits.size,
  ogImageOccurrences: imageOccurrences.filter((occurrence) => occurrence.family === "og").length,
  twitterImageOccurrences: imageOccurrences.filter((occurrence) => occurrence.family === "twitter").length,
  duplicateDeclarations,
  socialAssets: Object.keys(SOCIAL_ASSETS).length,
  quoteApp,
  protection: computedProtection,
};

await runtimeBrowser?.close();

if (errors.length) {
  console.error(`Social image metadata validation thất bại (${runtimeLabel}):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

if (jsonOutput) console.log(JSON.stringify({ ...metrics, images: [...imageAudits.values()] }, null, 2));
else {
  const protectionSummary = browserMode
    ? "runtime DOM, source/asset/quote-app protection"
    : "protected output/source/asset hashes";
  console.log(`Social image metadata validation pass (${runtimeLabel}): ${rows.length} routes, ${imageAudits.size} unique images, direct 200, dimensions/MIME/alt/Twitter và ${protectionSummary} đều đúng.`);
}
