import fs from "node:fs";
import path from "node:path";

const out = path.join(process.cwd(), "out");
const textExtensions = /\.(?:css|html|js|json|txt|webmanifest|xml)$/i;

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]
  );
}

const files = walk(out);
const searchable = files
  .filter((file) => textExtensions.test(file))
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");
const removed = [];

for (const source of files.filter((file) => /\.(?:png|jpe?g)$/i.test(file))) {
  const optimized = source.replace(/\.(?:png|jpe?g)$/i, ".webp");
  if (!fs.existsSync(optimized)) continue;
  const publicPath = `/${path.relative(out, source).split(path.sep).join("/")}`;
  if (searchable.includes(publicPath)) continue;
  fs.unlinkSync(source);
  removed.push(publicPath);
}

console.log(`Đã loại ${removed.length} ảnh nguồn legacy không được tham chiếu khỏi artifact; file nguồn trong repository được giữ nguyên.`);
