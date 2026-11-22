import { readFileSync, writeFileSync } from "node:fs";
const manifest = JSON.parse(readFileSync("data/product-media.json", "utf8"));
function compact(media) {
  return media.status === "approved" ? {
    image: media.image, alt: media.alt, width: media.width, height: media.height,
    srcSet: media.variants.map((variant) => `${variant.src} ${variant.width}w`).join(", "),
    credit: media.licenseUrl ? { author: media.author, sourceUrl: media.sourceUrl, license: media.license, licenseUrl: media.licenseUrl } : null,
  } : { image: "", alt: "", width: 0, height: 0, srcSet: "", credit: null };
}
const index = Object.fromEntries(Object.entries(manifest).map(([slug, media]) => [slug, {
  ...compact(media), gallery: (media.supplementary ?? []).map(compact),
}]));
writeFileSync("data/product-image-index.json", `${JSON.stringify(index, null, 2)}\n`);
console.log(`Built compact image index for ${Object.keys(index).length} material families.`);
