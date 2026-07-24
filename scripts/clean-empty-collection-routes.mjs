import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const collections = [
  { route: "bai-viet", folder: "articles" },
  { route: "du-an", folder: "projects" },
];

let removed = 0;
for (const collection of collections) {
  const sourceDirectory = path.join(process.cwd(), "content", collection.folder);
  const entries = fs.readdirSync(sourceDirectory)
    .filter((file) => /\.mdx?$/u.test(file))
    .map((file) => matter(fs.readFileSync(path.join(sourceDirectory, file), "utf8")))
    .map((parsed) => parsed.data);
  const publishedSlugs = new Set(
    entries
      .filter((entry) => entry.draft === false && entry.noindex === false)
      .map((entry) => entry.slug),
  );
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
