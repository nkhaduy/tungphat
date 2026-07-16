import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const uploadRoot = path.join(root, "public", "uploads");
const contentRoot = path.join(root, "content");
const converted = [];

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
}

for (const file of walk(uploadRoot).filter((file) => /\.(png|jpe?g)$/i.test(file))) {
  const target = file.replace(/\.(png|jpe?g)$/i, ".webp");
  const sourceStat = fs.statSync(file);
  const metadata = await sharp(file).metadata();
  if (sourceStat.size <= 450_000 && (metadata.width || 0) <= 1600) continue;
  await sharp(file).rotate().resize({ width: 2000, withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(target);
  const oldPublic = `/${path.relative(path.join(root, "public"), file).split(path.sep).join("/")}`;
  const newPublic = oldPublic.replace(/\.(png|jpe?g)$/i, ".webp");
  for (const contentFile of walk(contentRoot).filter((candidate) => /\.(md|mdx|json)$/.test(candidate))) {
    const source = fs.readFileSync(contentFile, "utf8");
    if (source.includes(oldPublic)) fs.writeFileSync(contentFile, source.split(oldPublic).join(newPublic));
  }
  fs.unlinkSync(file);
  converted.push(`${oldPublic} → ${newPublic}`);
}

console.log(converted.length ? `Đã tối ưu ${converted.length} ảnh:\n- ${converted.join("\n- ")}` : "Không có ảnh upload mới cần tối ưu.");
