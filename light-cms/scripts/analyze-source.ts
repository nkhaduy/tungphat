import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import matter from "gray-matter";
import { parseCollectionData, parseSettingData, type CollectionName, type SettingName } from "../src/contracts/content";

export type SourceRecord = { collection: CollectionName; slug: string; status: "draft" | "published"; data: Record<string, unknown>; sourcePath: string; checksum: string };
export type SourceSetting = { key: SettingName; data: Record<string, unknown>; sourcePath: string; checksum: string };
export type SourceMedia = { publicPath: string; sourcePath: string; size: number; checksum: string; mimeType: string; alt: string };
export type SourceAnalysis = { generatedAt: string; records: SourceRecord[]; settings: SourceSetting[]; media: SourceMedia[]; counts: Record<CollectionName, number>; issues: string[] };

const collectionFolders: CollectionName[] = ["products", "articles", "projects", "pages"];
const settingFiles: Array<[SettingName, string]> = [
  ["business-settings", "content/settings/business.json"], ["seo-defaults", "content/settings/seo.json"], ["static-pages", "content/settings/static-pages.json"],
  ["material-categories", "content/categories/materials.json"], ["brands", "content/categories/brands.json"],
];

function sha(value: string | Uint8Array) { return createHash("sha256").update(value).digest("hex"); }
function mime(file: string) { const ext = path.extname(file).toLowerCase(); return ext === ".png" ? "image/png" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : ext === ".avif" ? "image/avif" : "image/webp"; }
function normalizeBrands(value: Record<string, unknown>) {
  const items = Array.isArray(value.items) ? value.items.map((item) => {
    if (!item || typeof item !== "object") return item;
    const source = item as Record<string, unknown>;
    const { catalogues, ...brand } = source;
    delete brand.products;
    return { ...brand, catalogues: Array.isArray(catalogues) ? catalogues.map((entry) => entry && typeof entry === "object" ? { ...(entry as Record<string, unknown>), pdf: (entry as Record<string, unknown>).pdf ?? (entry as Record<string, unknown>).pdfUrl ?? "" } : entry) : [] };
  }) : [];
  return { items };
}

export function analyzeSource(repositoryRoot = path.resolve(import.meta.dirname, "../..")): SourceAnalysis {
  const issues: string[] = []; const records: SourceRecord[] = []; const settings: SourceSetting[] = []; const mediaPaths = new Set<string>(); const seen = new Set<string>();
  for (const collection of collectionFolders) {
    const directory = path.join(repositoryRoot, "content", collection);
    for (const file of fs.readdirSync(directory).filter((name) => /\.mdx?$/u.test(name)).sort()) {
      const sourcePath = path.join(directory, file); const parsed = matter(fs.readFileSync(sourcePath, "utf8"));
      const { draft, ...frontmatter } = parsed.data as Record<string, unknown>;
      const data: Record<string, unknown> = { ...frontmatter, body: parsed.content.trim() };
      const slug = String(data.slug || ""); const identity = `${collection}:${slug}`;
      if (seen.has(identity)) issues.push(`Duplicate slug: ${identity}`); seen.add(identity);
      try { parseCollectionData(collection, data); } catch (error) { issues.push(`${path.relative(repositoryRoot, sourcePath)}: ${(error as Error).message}`); }
      const serialized = JSON.stringify(data); for (const match of serialized.matchAll(/\/(?:[^"\\\s]+)\.(?:avif|webp|png|jpe?g)/giu)) if (match[0] !== "/og-logo.png") mediaPaths.add(match[0]);
      records.push({ collection, slug, status: draft === true ? "draft" : "published", data, sourcePath: path.relative(repositoryRoot, sourcePath), checksum: sha(JSON.stringify({ collection, slug, data })) });
    }
  }
  for (const [key, relative] of settingFiles) {
    const sourcePath = path.join(repositoryRoot, relative); let data = JSON.parse(fs.readFileSync(sourcePath, "utf8")) as Record<string, unknown>;
    if (key === "brands") data = normalizeBrands(data);
    try { parseSettingData(key, data); } catch (error) { issues.push(`${relative}: ${(error as Error).message}`); }
    const serialized = JSON.stringify(data); for (const match of serialized.matchAll(/\/(?:[^"\\\s]+)\.(?:avif|webp|png|jpe?g)/giu)) if (match[0] !== "/og-logo.png") mediaPaths.add(match[0]);
    settings.push({ key, data, sourcePath: relative, checksum: sha(JSON.stringify(data)) });
  }
  const altFor = (publicPath: string) => {
    for (const record of records) if (record.data.featuredImage === publicPath && typeof record.data.featuredImageAlt === "string") return record.data.featuredImageAlt;
    for (const setting of settings) {
      const locations = Array.isArray(setting.data.locations) ? setting.data.locations : [];
      for (const location of locations) if (location && typeof location === "object" && (location as Record<string, unknown>).image === publicPath && typeof (location as Record<string, unknown>).imageAlt === "string") return String((location as Record<string, unknown>).imageAlt);
    }
    return path.basename(publicPath, path.extname(publicPath)).replaceAll("-", " ");
  };
  const media = [...mediaPaths].sort().map((publicPath) => {
    const sourcePath = path.join(repositoryRoot, "public", publicPath.slice(1));
    if (!fs.existsSync(sourcePath)) { issues.push(`Missing media: ${publicPath}`); return { publicPath, sourcePath: path.relative(repositoryRoot, sourcePath), size: 0, checksum: "", mimeType: mime(sourcePath), alt: altFor(publicPath) }; }
    const bytes = fs.readFileSync(sourcePath); return { publicPath, sourcePath: path.relative(repositoryRoot, sourcePath), size: bytes.byteLength, checksum: sha(bytes), mimeType: mime(sourcePath), alt: altFor(publicPath) };
  });
  const counts = Object.fromEntries(collectionFolders.map((collection) => [collection, records.filter((record) => record.collection === collection).length])) as Record<CollectionName, number>;
  return { generatedAt: new Date().toISOString(), records, settings, media, counts, issues };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const analysis = analyzeSource(); console.log(JSON.stringify(analysis, null, 2));
  if (analysis.issues.length) process.exitCode = 1;
}
