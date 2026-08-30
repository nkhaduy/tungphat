import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MaterialSwatchImage } from "@/components/thanh-thuy/MaterialSwatchImage";
import { allowedProcessVideo } from "@/components/WorkshopMedia";
import { getBaThanhCode } from "@/lib/catalog/ba-thanh";
import { getPublicColorCode } from "@/lib/catalog/color-codes/public";
import { getSupplierSearchIndex } from "@/lib/catalog/suppliers/search-index";
import { locations } from "@/lib/locations";
import { getBrand } from "@/lib/brands";
import { getThanhThuyProduct } from "@/lib/thanh-thuy";
import { createThanhThuyMetadata } from "@/lib/thanh-thuy-seo";
import { createThanhThuyProductSchema } from "@/lib/thanh-thuy-schema";

const samplePath = "catalog/thanh-thuy/0330-mw-ambassador-1600w-f9875836c598.webp";
const sampleUrl = `https://cdn.mdftungphat.com/${samplePath}`;

describe("public media boundaries", () => {
  it("normalizes the exact Thanh Thuy sample before it reaches RSC or srcset", () => {
    const product = getThanhThuyProduct("melamine", "thanh-thuy-0330-mw-ambassador");
    expect(product?.image).toBe(sampleUrl);
    expect(product?.imageSrcSet).toContain("https://cdn.mdftungphat.com/catalog/thanh-thuy/");
    expect(product?.imageSrcSet).not.toContain(" /catalog/");
  });

  it("normalizes public supplier records, search entries, and legacy gallery records", () => {
    const record = getPublicColorCode("thanh-thuy", "melamine", "0330");
    expect(record?.images[0]?.localPath).toBe(sampleUrl);
    expect(record?.images[0]?.originalUrl).toBe(
      "https://cdn.mdftungphat.com/supplier/thanh-thuy/0330/swatch/c4d8e1bbc28f6583b13b05edf9faabde9e2453460289f689b4a458c4d28e7146.webp",
    );
    expect(getSupplierSearchIndex().records.find((entry) => entry.code === "0330")?.thumbnail).toBe(sampleUrl);
    expect(getBaThanhCode("bt-111")?.images[0]?.src).toMatch(/^https:\/\/cdn\.mdftungphat\.com\/catalog\//u);
  });

  it("normalizes CMS-backed brand and location images", () => {
    expect(getBrand("an-cuong")?.logo).toBe("https://cdn.mdftungphat.com/uploads/an-cuong-logo.webp");
    expect(locations[0]?.image).toBe("https://cdn.mdftungphat.com/uploads/chi-nhanh-1.webp");
  });

  it("renders direct CDN src and every responsive candidate", () => {
    const html = renderToStaticMarkup(createElement(MaterialSwatchImage, {
      src: `/${samplePath}`,
      srcSet: "/catalog/thanh-thuy/sample-480.webp 480w, /catalog/thanh-thuy/sample-960.webp 960w",
      alt: "Mẫu vật liệu",
    }));
    expect(html).toContain(`src=\"${sampleUrl}\"`);
    expect(html).toContain("https://cdn.mdftungphat.com/catalog/thanh-thuy/sample-480.webp 480w");
    expect(html).not.toContain("srcset=\"/catalog/");
  });

  it("emits CDN URLs in Open Graph, Twitter, and Product JSON-LD", () => {
    const metadata = createThanhThuyMetadata({ name: "0330 MW Ambassador", image: `/${samplePath}` }, "/sample/");
    expect(metadata.openGraph?.images).toEqual([{ url: sampleUrl, alt: "0330 MW Ambassador" }]);
    expect(metadata.twitter?.images).toEqual([sampleUrl]);
    expect(createThanhThuyProductSchema({ name: "0330 MW Ambassador", image: `/${samplePath}` }, "/sample/")).toMatchObject({ image: sampleUrl });
  });

  it("normalizes first-party process video URLs without changing unrelated hosts", () => {
    expect(allowedProcessVideo("/videos/cnc.mp4")).toBe("https://cdn.mdftungphat.com/videos/cnc.mp4");
    expect(allowedProcessVideo("https://cms.mdftungphat.com/media/videos/cnc.mp4?download=1")).toBe(
      "https://cdn.mdftungphat.com/videos/cnc.mp4?download=1",
    );
    expect(allowedProcessVideo("https://youtube.com/watch?v=abc")).toBe("");
  });
});
