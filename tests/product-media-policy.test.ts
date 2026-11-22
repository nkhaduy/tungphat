import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

type MediaSource = { status: string; image: string; sourceUrl: string | null; sourceImageUrl: string | null; sourceFile: string; supplementary?: MediaSource[] };
const manifest = JSON.parse(readFileSync("data/product-media.json", "utf8")) as Record<string, MediaSource>;
const allowedHosts = new Set(["gothanhthuy.com", "bathanhtaybac.com"]);
const originals: Record<string, string> = { "van-mdf": "sanpham-media/vanmdf.webp", "mdf-chong-am": "sanpham-media/mdfchongam.jpg", "chi-nep-nhua": "sanpham-media/sources/chi-dan-canh-user.png" };
function allowed(url: string | null) {
  if (!url) return false;
  const parsed = new URL(url);
  return parsed.protocol === "https:" && allowedHosts.has(parsed.hostname.replace(/^www\./u, ""));
}

it("only sources product photography from the approved suppliers or user-supplied images", () => {
  const forbidden: string[] = [];
  for (const [slug, media] of Object.entries(manifest)) {
    for (const source of [media, ...(media.supplementary ?? [])]) {
      if (!source.image) { expect(source.status).toBe("blocked"); continue; }
      if (originals[slug] === source.sourceFile) continue;
      if (!allowed(source.sourceUrl) || !allowed(source.sourceImageUrl)) forbidden.push(slug);
    }
  }
  expect(forbidden).toEqual([]);
});
