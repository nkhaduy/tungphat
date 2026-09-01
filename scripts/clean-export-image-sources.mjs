import fs from "node:fs";
import path from "node:path";
import { findReferencedExportAssetPaths } from "./lib/export-image-source-references.mjs";

const out = path.join(process.cwd(), "out");

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]
  );
}

const files = walk(out);
const removed = [];
const sourceImages = files.filter((file) => /\.(?:png|jpe?g)$/i.test(file));
const candidates = sourceImages
  .filter((source) => fs.existsSync(source.replace(/\.(?:png|jpe?g)$/i, ".webp")))
  .map((source) => `/${path.relative(out, source).split(path.sep).join("/")}`);
const referenced = findReferencedExportAssetPaths(
  files,
  candidates,
  (file) => fs.readFileSync(file, "utf8"),
);

for (const source of sourceImages) {
  const optimized = source.replace(/\.(?:png|jpe?g)$/i, ".webp");
  if (!fs.existsSync(optimized)) continue;
  const publicPath = `/${path.relative(out, source).split(path.sep).join("/")}`;
  if (referenced.has(publicPath)) continue;
  fs.unlinkSync(source);
  removed.push(publicPath);
}

console.log(`Đã loại ${removed.length} ảnh nguồn legacy không được tham chiếu khỏi artifact; file nguồn trong repository được giữ nguyên.`);
