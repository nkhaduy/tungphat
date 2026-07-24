import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { tsImport } from "tsx/esm/api";

const [{ articleSchema, projectSchema }, { filterPublishedContent }] = await Promise.all([
  tsImport("../lib/content-schema.ts", import.meta.url),
  tsImport("../lib/listing-indexability.ts", import.meta.url),
]);

const collections = [
  { route: "bai-viet", folder: "articles", schema: articleSchema },
  { route: "du-an", folder: "projects", schema: projectSchema },
];

let removed = 0;
for (const collection of collections) {
  const sourceDirectory = path.join(process.cwd(), "content", collection.folder);
  const entries = fs.readdirSync(sourceDirectory)
    .filter((file) => /\.mdx?$/u.test(file))
    .map((file) => matter(fs.readFileSync(path.join(sourceDirectory, file), "utf8")))
    .map((parsed) => collection.schema.parse(parsed.data));
  const publishedSlugs = new Set(filterPublishedContent(entries).map((entry) => entry.slug));
  const outputDirectory = path.join(process.cwd(), "out", collection.route);

  if (!fs.existsSync(outputDirectory)) continue;
  for (const entry of fs.readdirSync(outputDirectory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name !== "__empty-collection" && publishedSlugs.has(entry.name)) continue;
    fs.rmSync(path.join(outputDirectory, entry.name), { recursive: true, force: true });
    removed += 1;
  }
}

console.log(`Đã loại ${removed} route sentinel/draft khỏi static export.`);
