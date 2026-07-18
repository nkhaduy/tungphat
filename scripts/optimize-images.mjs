import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const uploadRoot = path.join(root, "public", "uploads");
const thumbnailRoot = path.join(root, "public", "uploads-thumbnails");
const contentRoot = path.join(root, "content");
const converted = [];
const optimized = [];

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]
  );
}

function publicPath(file) {
  return `/${path.relative(path.join(root, "public"), file).split(path.sep).join("/")}`;
}

function replaceContentReference(before, after) {
  for (const contentFile of walk(contentRoot).filter((candidate) => /\.(md|mdx|json)$/.test(candidate))) {
    const source = fs.readFileSync(contentFile, "utf8");
    if (source.includes(before)) fs.writeFileSync(contentFile, source.split(before).join(after));
  }
}

for (const source of walk(uploadRoot).filter((file) => /\.(avif|webp|png|jpe?g)$/i.test(file))) {
  const originalPublicPath = publicPath(source);
  const isLegacy = /\.(png|jpe?g)$/i.test(source);
  const target = isLegacy ? source.replace(/\.(png|jpe?g)$/i, ".webp") : source;
  const metadata = await sharp(source).metadata();
  const stat = fs.statSync(source);
  const needsOptimization = isLegacy || (metadata.width || 0) > 2000 || stat.size > 1_572_864;

  if (needsOptimization) {
    const temporary = `${target}.optimizing`;
    const pipeline = sharp(source)
      .rotate()
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true });
    if (/\.avif$/i.test(target)) await pipeline.avif({ quality: 58, effort: 5 }).toFile(temporary);
    else await pipeline.webp({ quality: 84, effort: 5 }).toFile(temporary);
    if (source !== target) fs.unlinkSync(source);
    else fs.unlinkSync(target);
    fs.renameSync(temporary, target);
    optimized.push(publicPath(target));
  }

  const finalPath = target;
  const finalPublicPath = publicPath(finalPath);
  if (originalPublicPath !== finalPublicPath) {
    replaceContentReference(originalPublicPath, finalPublicPath);
    converted.push(`${originalPublicPath} → ${finalPublicPath}`);
  }

  const relative = path.relative(uploadRoot, finalPath).replace(/\.(avif|webp)$/i, ".webp");
  const thumbnail = path.join(thumbnailRoot, relative);
  fs.mkdirSync(path.dirname(thumbnail), { recursive: true });
  await sharp(finalPath)
    .rotate()
    .resize({ width: 480, height: 480, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78, effort: 4 })
    .toFile(thumbnail);
}

console.log(
  converted.length || optimized.length
    ? `Đã tối ưu ${optimized.length} ảnh, đổi ${converted.length} đường dẫn và tạo thumbnail.\n- ${[...converted, ...optimized].join("\n- ")}`
    : "Không có ảnh upload; không cần tối ưu."
);
