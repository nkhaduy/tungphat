import { describe, expect, it } from "vitest";
import {
  buildMediaManifest,
  classifyMediaPath,
  contentTypeForPath,
  extractCatalogueReferences,
  logicalObjectKey,
} from "../scripts/media/core";

describe("media inventory core", () => {
  it("classifies generated catalogue media separately from small source assets", () => {
    expect(classifyMediaPath("public/catalog/an-cuong/acrylic/a.webp", 1200)).toMatchObject({ externalize: true, runtimeCritical: true, seoCritical: true });
    expect(classifyMediaPath("public/logo-horizontal.webp", 1200)).toMatchObject({ externalize: false, runtimeCritical: true, seoCritical: true });
    expect(classifyMediaPath("public/vendor/catalogue.pdf", 2_000_000)).toMatchObject({ externalize: true });
  });

  it("normalizes only public media paths into safe object keys", () => {
    expect(logicalObjectKey("public/catalog/a/b.webp")).toBe("catalog/a/b.webp");
    expect(() => logicalObjectKey("public/catalog/../secret.webp")).toThrow(/unsafe/i);
    expect(() => logicalObjectKey("content/image.webp")).toThrow(/public/i);
  });

  it("extracts unique catalogue references from metadata", () => {
    expect(extractCatalogueReferences('{"src":"/catalog/a.webp","thumb":"/catalog/a.webp?width=480"}')).toEqual(new Set(["catalog/a.webp"]));
  });

  it("deduplicates exact content while retaining logical aliases", () => {
    const manifest = buildMediaManifest([
      { path: "public/catalog/a.webp", bytes: 10, sha256: "same", mimeType: "image/webp", referenced: true },
      { path: "public/catalog/b.webp", bytes: 10, sha256: "same", mimeType: "image/webp", referenced: true },
      { path: "public/catalog/c.png", bytes: 20, sha256: "other", mimeType: "image/png", referenced: false },
    ]);

    expect(manifest.entries).toHaveLength(2);
    expect(manifest.aliases).toEqual({ "catalog/b.webp": "catalog/a.webp" });
    expect(manifest.summary).toMatchObject({ files: 3, uniqueObjects: 2, duplicateFiles: 1, reclaimableBytes: 10 });
  });

  it("maps supported extensions to upload content types", () => {
    expect(contentTypeForPath("x.webp")).toBe("image/webp");
    expect(contentTypeForPath("x.pdf")).toBe("application/pdf");
    expect(contentTypeForPath("x.bin")).toBe("application/octet-stream");
  });
});
