import { describe, expect, it } from "vitest";
import { auditMediaReferences, extractMediaReferences } from "@/lib/media-cdn-audit";

describe("media CDN audit", () => {
  it("extracts responsive, metadata, JSON-LD, CSS, and RSC media references", () => {
    const body = `
      <img src="https://cdn.mdftungphat.com/catalog/a.webp"
        srcset="/catalog/a-480.webp 480w, https://cdn.mdftungphat.com/catalog/a-960.webp 960w">
      <source srcset="https://cms.mdftungphat.com/media/uploads/a.avif 1x">
      <meta property="og:image" content="https://mdftungphat.com/catalog/og.webp">
      <script type="application/ld+json">{"image":"https://old.r2.dev/catalog/schema.webp"}</script>
      <div style="background-image:url('/uploads/background.webp')"></div>
      <script>self.__next_f.push([1,"{\\"image\\":\\"/catalog/rsc.webp\\"}"])</script>
    `;

    expect(extractMediaReferences(body)).toEqual(expect.arrayContaining([
      "https://cdn.mdftungphat.com/catalog/a.webp",
      "/catalog/a-480.webp",
      "https://cdn.mdftungphat.com/catalog/a-960.webp",
      "https://cms.mdftungphat.com/media/uploads/a.avif",
      "https://mdftungphat.com/catalog/og.webp",
      "https://old.r2.dev/catalog/schema.webp",
      "/uploads/background.webp",
      "/catalog/rsc.webp",
    ]));
  });

  it("fails every non-CDN first-party media form while allowing app assets and third parties", () => {
    const result = auditMediaReferences([
      "https://cdn.mdftungphat.com/catalog/good.webp",
      "/catalog/relative.webp",
      "https://mdftungphat.com/catalog/proxied.webp",
      "https://cms.mdftungphat.com/media/uploads/cms.webp",
      "https://legacy.r2.dev/catalog/legacy.webp",
      "https://account.r2.cloudflarestorage.com/tung-phat-media/catalog/api.webp",
      "/images/app-static.webp",
      "/media/next-font.woff2",
      "https://googleusercontent.com/avatar.webp",
    ]);

    expect(result).toMatchObject({
      inspected: 6,
      cdn: 1,
      relative: 1,
      mainDomain: 1,
      cms: 1,
      legacyR2: 2,
      broken: 0,
    });
    expect(result.failures).toHaveLength(5);
  });

  it("covers every generated media storage namespace", () => {
    const references = extractMediaReferences("/gallery/a.webp /thumbnails/a.webp /uploads-thumbnails/a.webp /vendor/a.webp");
    expect(auditMediaReferences(references)).toMatchObject({ inspected: 4, relative: 4 });
  });
});
