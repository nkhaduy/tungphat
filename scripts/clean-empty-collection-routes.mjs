import fs from "node:fs";
import path from "node:path";

const collections = [
  { route: "bai-viet" },
  { route: "du-an" },
];

let removed = 0;
for (const collection of collections) {
  const outputDirectory = path.join(process.cwd(), "out", collection.route);

  if (!fs.existsSync(outputDirectory)) continue;
  const sentinel = path.join(outputDirectory, "__empty-collection");
  if (fs.existsSync(sentinel)) {
    fs.rmSync(sentinel, { recursive: true, force: true });
    removed += 1;
  }
}

console.log(`Đã loại ${removed} route sentinel/draft khỏi static export.`);
