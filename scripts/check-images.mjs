import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.join(process.cwd(), "public");
const extensions = /\.(avif|webp|png|jpe?g)$/i;
const errors = [];
const warnings = [];
let checked = 0;

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
}

for (const file of walk(root).filter((file) => extensions.test(file))) {
  checked += 1;
  const relative = path.relative(process.cwd(), file);
  const stat = fs.statSync(file);
  const uploaded = relative.startsWith(`public${path.sep}uploads${path.sep}`);
  const name = path.basename(file);
  const metadata = await sharp(file).metadata();
  const issue = `${relative} (${Math.round(stat.size / 1024)}KB, ${metadata.width || "?"}×${metadata.height || "?"})`;
  if (uploaded && /\.(png|jpe?g)$/i.test(file)) errors.push(`${issue}: ảnh CMS phải được chuyển sang WebP/AVIF`);
  if (/^(IMG[_-]?\d+|DSC[_-]?\d+|image[_-]?\d+)/i.test(name) || /\s/.test(name)) (uploaded ? errors : warnings).push(`${issue}: tên file không có ý nghĩa`);
  if (stat.size > 1_572_864) (uploaded ? errors : warnings).push(`${issue}: vượt 1.5MB`);
  if ((metadata.width || 0) > 2000) (uploaded ? errors : warnings).push(`${issue}: rộng hơn 2000px`);
}

if (warnings.length) console.warn(`Image warnings (asset nguồn/legacy, không chặn build):\n- ${warnings.join("\n- ")}`);
if (errors.length) { console.error(`Image validation thất bại:\n- ${errors.join("\n- ")}`); process.exit(1); }
console.log(`Image validation pass: ${checked} ảnh; uploads không có file vượt chuẩn.`);
