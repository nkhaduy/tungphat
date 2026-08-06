import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildMediaDiscoveryManifest,
  buildMediaInputs,
  downloadMedia,
  inspectImageBytes,
  type MediaDownloadInput,
} from "../../scripts/ancuong/download-media";
import { stableStringify } from "../../scripts/ancuong/stable-json";

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

describe("An Cuong media pipeline", () => {
  it("builds a manifest-only inventory without downloading product media", () => {
    const inputs = buildMediaInputs([{
      sourceId: "303000078",
      sourceUrl: "https://ancuong.com/melamine/303000078.html",
      productCode: "MFC - MS 106 SH",
      name: "Milky White",
      categorySlug: "melamine",
      primaryImage: { sourceUrl: "https://ancuong.com/products/products-full/303000078.jpg" },
      gallery: [
        { sourceUrl: "https://ancuong.com/products/products-full/303000078.jpg" },
        { sourceUrl: "https://acshopping.ancuong.com/Upload/MaterialApp/303000078-0-0-1.jpg" },
      ],
    }]);

    expect(inputs.map((item) => item.role)).toEqual(["primary", "gallery", "application"]);
    const manifest = buildMediaDiscoveryManifest(inputs);
    expect(manifest.summary).toEqual(expect.objectContaining({ total: 3, discovered: 3, totalBytes: 0 }));
    expect(manifest.records.every((record) => record.status === "discovered")).toBe(true);
  });

  it("detects MIME from bytes and rejects an HTML challenge", () => {
    expect(inspectImageBytes(PNG_1X1, "image/jpeg")).toEqual({
      mimeType: "image/png",
      width: 1,
      height: 1,
    });
    expect(() => inspectImageBytes(Buffer.from("<!doctype html><title>Attention Required</title>"), "image/webp"))
      .toThrow(/HTML|challenge/i);
  });

  it("downloads once, deduplicates by checksum and writes a stable manifest", async () => {
    const outputDir = await mkdtemp(path.join(tmpdir(), "ancuong-media-"));
    const input: MediaDownloadInput[] = [
      { sourceUrl: "https://ancuong.com/a.png", productSourceId: "10", productCode: "MFC - MS 103 SMM", role: "primary" },
      { sourceUrl: "https://ancuong.com/a.png", productSourceId: "11", productCode: "LK 4614 A", role: "gallery" },
    ];
    const fetchImpl = async () => new Response(PNG_1X1, { status: 200, headers: { "content-type": "image/jpeg" } });

    const first = await downloadMedia(input, { outputDir, fetchImpl, concurrency: 2 });
    const second = await downloadMedia(input, { outputDir, fetchImpl, concurrency: 2 });

    expect(first.records.map((record) => record.status)).toEqual(["downloaded", "duplicate"]);
    expect(first.records[1]?.duplicateOf).toBe(first.records[0]?.localPath);
    expect(first.records[0]?.mimeType).toBe("image/png");
    expect(first.records[0]?.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(await stat(path.join(outputDir, first.records[0]!.localPath!))).toBeTruthy();
    expect(second.records.map((record) => record.sha256)).toEqual(first.records.map((record) => record.sha256));
    expect(second.records.map((record) => record.localPath)).toEqual(first.records.map((record) => record.localPath));
    expect(stableStringify(second)).toBe(stableStringify(first));
    expect(await readFile(path.join(outputDir, "media-manifest.json"), "utf8"))
      .toBe(stableStringify(second));
  });

  it("marks non-images and missing responses without writing payload files", async () => {
    const outputDir = await mkdtemp(path.join(tmpdir(), "ancuong-media-invalid-"));
    const fetchImpl = async (input: string | URL | Request) => {
      const url = String(input);
      return url.endsWith("missing.png")
        ? new Response("missing", { status: 404 })
        : new Response("<html>challenge</html>", { status: 200, headers: { "content-type": "image/png" } });
    };
    const result = await downloadMedia([
      { sourceUrl: "https://ancuong.com/missing.png", productCode: "M1", role: "primary" },
      { sourceUrl: "https://ancuong.com/challenge.png", productCode: "M2", role: "gallery" },
    ], { outputDir, fetchImpl });

    expect(result.records.map((record) => record.status)).toEqual(["missing", "invalid"]);
    expect(result.summary).toEqual(expect.objectContaining({ missing: 1, invalid: 1, downloaded: 0 }));
  });
});
