import { readFileSync, existsSync } from "node:fs";
const manifest = JSON.parse(readFileSync("data/product-media.json", "utf8"));
const blocked = [];
const limited = [];
const permittedHosts = new Set(["gothanhthuy.com", "bathanhtaybac.com"]);
const originals = { "van-mdf": "sanpham-media/vanmdf.webp", "mdf-chong-am": "sanpham-media/mdfchongam.jpg", "chi-nep-nhua": "sanpham-media/sources/chi-dan-canh-user.png" };
function permitted(url) {
  if (!url) return false;
  const source = new URL(url);
  return source.protocol === "https:" && permittedHosts.has(source.hostname.replace(/^www\./u, ""));
}
const mainSlugs = new Set(["van-mdf", "mdf-chong-am", "van-okal", "van-plywood", "go-ghep-cao-su", "melamine", "laminate", "tam-veneer", "van-nhua-pvc", "chi-nep-nhua"]);
for (const [slug, media] of Object.entries(manifest)) {
  for (const source of [media, ...(media.supplementary ?? [])]) {
    if (!source.image && source.status === "blocked") continue;
    if (originals[slug] === source.sourceFile) continue;
    if (!permitted(source.sourceUrl) || !permitted(source.sourceImageUrl)) blocked.push(`${slug}: source outside the two approved suppliers`);
  }
  if (!mainSlugs.has(slug)) continue;
  if (media.status !== "approved" || !media.image || !existsSync(`public${media.image}`)) blocked.push(slug);
  else {
    if (!(media.sourceUrl || media.sourceFile) || !media.license || !media.permissionBasis || !media.verifiedMaterial) blocked.push(`${slug}: missing provenance`);
    for (const variant of media.variants) if (!existsSync(`public${variant.src}`)) blocked.push(`${slug}: missing derivative ${variant.src}`);
    if (media.width < 800) limited.push(`${slug}: ${media.width}×${media.height}px native-limited`);
  }
}
console.log(`Material imagery: ${mainSlugs.size - blocked.length}/${mainSlugs.size} approved available records.`);
if (limited.length) console.log(`Resolution limitations (review required, never claim all high resolution):\n- ${limited.join("\n- ")}`);
if (blocked.length) { console.error(`NOT READY: missing or unapproved product photography:\n- ${blocked.join("\n- ")}`); process.exitCode = 1; }
else console.log("All material photo records have a local asset and provenance. Visual suitability and resolution still require review.");
