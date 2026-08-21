import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  discoverAnCuongColorMedia,
  semanticColorMediaPath,
} from "@/scripts/ancuong/media-discover";
import {
  applyBaThanhFallbackMedia,
  classifyBaThanhFallbackMedia,
  mergeBaThanhMapMedia,
  parseBaThanhColorMap,
} from "@/scripts/ba-thanh/media-discover";
import {
  downloadColorMediaArtifact,
  validateColorMediaDiscovery,
} from "@/scripts/catalog-suppliers/color-media";
import { applyColorMediaToIndex } from "@/scripts/catalog-suppliers/merge-color-media";
import type {
  ColorMediaDiscoveryArtifact,
} from "@/scripts/catalog-suppliers/color-media";
import type { PublicSupplierColorCode } from "@/lib/catalog/color-codes/types";

describe("color-code media discovery", () => {
  it("discovers An Cuong lazy swatch and fullsheet roles for every normal detail code", () => {
    const artifact = discoverAnCuongColorMedia();
    const code = artifact.entries.find(
      (entry) => entry.codeRaw === "MFC - MS 465 SC04",
    );

    expect(code).toMatchObject({
      reasonCode: "SOURCE_IMAGE_LAZY",
      previewSourceUrl:
        "https://ancuong.com/products/products-thumb/30300331800101572065.jpg",
      fullsheetSourceUrl:
        "https://ancuong.com/products/products-full/30300331800101572065.jpg",
    });
  });

  it("keeps local An Cuong media under the current material semantic path", () => {
    const artifact = discoverAnCuongColorMedia();
    const renamed = artifact.entries.find((entry) => entry.codeRaw === "LK 4458 A");

    expect(renamed?.localAssets?.[0]?.localPath).toBe("/catalog/an-cuong/laminate/lk-4458-a-fullsheet.webp");
    expect(artifact.entries.every((entry) =>
      (entry.localAssets ?? []).every((asset) => !asset.localPath.includes("/panel/")),
    )).toBe(true);
  });

  it("recovers An Cuong matching-code media from explicit same-color provenance", () => {
    const artifact = discoverAnCuongColorMedia();
    const matching = artifact.entries.find(
      (entry) => entry.codeRaw === "ECOVENEER EVS 4300",
    );

    expect(matching).toMatchObject({
      reasonCode: "SOURCE_HAS_IMAGE_BUT_PARSER_MISSED",
    });
    expect(matching?.previewSourceUrl).toMatch(
      /^https:\/\/ancuong\.com\/products\/products-thumb\//,
    );
  });

  it("extracts Ba Thanh responsive map images and fills detail-page parser gaps", () => {
    const parsed = parseBaThanhColorMap(`
      <a href=" https://bathanh.com.vn/way-p2052">
        <img src="https://bathanh.com.vn/wp-content/uploads/SC017MW.jpg"
          srcset="https://bathanh.com.vn/wp-content/uploads/SC017MW-300x180.jpg 300w,
                  https://bathanh.com.vn/wp-content/uploads/SC017MW-1024x614.jpg 1024w,
                  https://bathanh.com.vn/wp-content/uploads/SC017MW.jpg 8688w">
      </a>
    `);
    expect(parsed).toEqual([
      {
        codeNormalized: "P2052",
        detailUrl: "https://bathanh.com.vn/way-p2052",
        sourceUrl:
          "https://bathanh.com.vn/wp-content/uploads/SC017MW-1024x614.jpg",
      },
    ]);

    const merged = mergeBaThanhMapMedia(
      [
        {
          codeNormalized: "P2052",
          codeRaw: "P2052",
          sourceUrl: "https://bathanh.com.vn/way-p2052",
          localPath: undefined,
        },
      ],
      parsed,
    );
    expect(merged[0]).toMatchObject({
      previewSourceUrl:
        "https://bathanh.com.vn/wp-content/uploads/SC017MW-1024x614.jpg",
      reasonCode: "SOURCE_HAS_IMAGE_BUT_PARSER_MISSED",
    });
  });

  it("rejects Ba Thanh coming-soon and wrong-code detail images", () => {
    expect(
      classifyBaThanhFallbackMedia(
        "SC032DL",
        "https://bathanh.com.vn/wp-content/uploads/2017/07/soon-01.png",
      ),
    ).toEqual({
      previewSourceUrl: undefined,
      sourceHasMedia: false,
      reasonCode: "INVALID_IMAGE",
    });
    expect(
      classifyBaThanhFallbackMedia(
        "BT171EV",
        "https://bathanh.com.vn/wp-content/uploads/2023/10/BT-103-e1698733774228.jpg",
      ),
    ).toEqual({
      previewSourceUrl: undefined,
      sourceHasMedia: false,
      reasonCode: "INVALID_IMAGE",
    });
    expect(
      classifyBaThanhFallbackMedia(
        "BT49",
        "https://bathanh.com.vn/wp-content/uploads/2022/04/BT-49-e1713937690671.jpg",
      ),
    ).toEqual({
      previewSourceUrl:
        "https://bathanh.com.vn/wp-content/uploads/2022/04/BT-49-e1713937690671.jpg",
      sourceHasMedia: true,
      reasonCode: "SOURCE_HAS_IMAGE_DOWNLOAD_FAILED",
    });
  });

  it("preserves an existing Ba Thanh local preview when applying fallbacks", () => {
    expect(
      applyBaThanhFallbackMedia(
        {
          id: "ba-thanh:BT01",
          codeRaw: "BT01",
          codeNormalized: "BT01",
          sourceUrl: "https://bathanh.com.vn/way-bt01",
          localPath: "/catalog/ba-thanh/ba-thanh-melamine-bt-01-swatch.webp",
          sourceHasMedia: true,
          reasonCode: "DUPLICATE_IMAGE",
        },
        "https://bathanh.com.vn/wp-content/uploads/2022/04/BT-01.jpg",
      ),
    ).toMatchObject({
      localPath: "/catalog/ba-thanh/ba-thanh-melamine-bt-01-swatch.webp",
      previewSourceUrl:
        "https://bathanh.com.vn/wp-content/uploads/2022/04/BT-01.jpg",
      sourceHasMedia: true,
      reasonCode: "DUPLICATE_IMAGE",
    });
  });

  it("fails accounting when source media exists without a local preview or reason", () => {
    expect(
      validateColorMediaDiscovery({
        schemaVersion: 1,
        supplier: "ba-thanh",
        generatedAt: "2026-08-07T00:00:00.000Z",
        entries: [
          {
            id: "ba-thanh:P2052",
            codeRaw: "P2052",
            codeNormalized: "P2052",
            sourceUrl: "https://bathanh.com.vn/way-p2052",
            previewSourceUrl:
              "https://bathanh.com.vn/wp-content/uploads/SC017MW-1024x614.jpg",
            sourceHasMedia: true,
            reasonCode: "SOURCE_HAS_IMAGE_BUT_PARSER_MISSED",
          },
        ],
      }),
    ).toContainEqual(
      expect.objectContaining({ code: "SOURCE_MEDIA_LOCAL_PREVIEW_MISSING" }),
    );
  });

  it("revalidates an existing local preview without downloading it again", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "color-media-existing-"));
    try {
      const localPath = "/catalog/an-cuong/melamine/ms-465-sc04-swatch.webp";
      const target = path.join(root, "public", localPath.replace(/^\//, ""));
      fs.mkdirSync(path.dirname(target), { recursive: true });
      const bytes = await sharp({
        create: {
          width: 64,
          height: 48,
          channels: 3,
          background: { r: 90, g: 80, b: 70 },
        },
      })
        .webp({ lossless: true })
        .toBuffer();
      fs.writeFileSync(target, bytes);

      const artifact = await downloadColorMediaArtifact({
        root,
        artifact: {
          schemaVersion: 1,
          supplier: "an-cuong",
          generatedAt: "2026-08-07T00:00:00.000Z",
          entries: [
            {
              id: "an-cuong:MFCMS465SC04",
              codeRaw: "MFC - MS 465 SC04",
              codeNormalized: "MFCMS465SC04",
              sourceUrl: "https://ancuong.com/melamine/303003318.html",
              previewSourceUrl:
                "https://ancuong.com/products/products-thumb/30300331800101572065.jpg",
              localPath,
              sourceHasMedia: true,
              reasonCode: "SOURCE_IMAGE_LAZY",
            },
          ],
        },
        materialByCode: new Map([["MFCMS465SC04", "melamine"]]),
      });

      expect(artifact.entries[0]).toMatchObject({
        localPath,
        mimeType: "image/webp",
        width: 64,
        height: 48,
        checksum: expect.stringMatching(/^[a-f0-9]{64}$/),
      });
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("revalidates every existing local media role, not only the card swatch", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "color-media-roles-"));
    try {
      const makeImage = async (red: number) => sharp({
        create: {
          width: 64,
          height: 48,
          channels: 3,
          background: { r: red, g: 80, b: 70 },
        },
      }).webp({ lossless: true }).toBuffer();
      const swatchPath = "/catalog/an-cuong/melamine/example-swatch.webp";
      const fullsheetPath = "/catalog/an-cuong/melamine/example-fullsheet.webp";
      for (const [localPath, bytes] of [[swatchPath, await makeImage(90)], [fullsheetPath, await makeImage(120)]] as const) {
        const target = path.join(root, "public", localPath.replace(/^\//, ""));
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, bytes);
      }

      const artifact = await downloadColorMediaArtifact({
        root,
        artifact: {
          schemaVersion: 1,
          supplier: "an-cuong",
          generatedAt: "2026-08-07T00:00:00.000Z",
          entries: [{
            id: "an-cuong:example",
            codeRaw: "EXAMPLE 01",
            codeNormalized: "EXAMPLE01",
            sourceUrl: "https://ancuong.com/example/01.html",
            previewSourceUrl: "https://ancuong.com/products/products-thumb/example.jpg",
            fullsheetSourceUrl: "https://ancuong.com/products/products-full/example.jpg",
            localPath: swatchPath,
            localAssets: [{
              role: "fullsheet",
              sourceUrl: "https://ancuong.com/products/products-full/example.jpg",
              localPath: fullsheetPath,
            }],
            sourceHasMedia: true,
            reasonCode: "SOURCE_IMAGE_LAZY",
          } as never],
        },
        materialByCode: new Map([["EXAMPLE01", "melamine"]]),
      });

      expect(artifact.entries[0]?.localAssets).toEqual(expect.arrayContaining([
        expect.objectContaining({ role: "fullsheet", localPath: fullsheetPath, mimeType: "image/webp" }),
      ]));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("downscales fullsheet derivatives without cropping or upscaling", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "color-media-fullsheet-resize-"));
    const originalFetch = globalThis.fetch;
    try {
      const source = await sharp({
        create: {
          width: 3000,
          height: 1500,
          channels: 3,
          background: { r: 90, g: 80, b: 70 },
        },
      }).png().toBuffer();
      globalThis.fetch = async () => new Response(source, {
        status: 200,
        headers: {
          "content-type": "image/png",
          "content-length": String(source.length),
        },
      });

      const artifact = await downloadColorMediaArtifact({
        root,
        artifact: {
          schemaVersion: 1,
          supplier: "an-cuong",
          generatedAt: "2026-08-07T00:00:00.000Z",
          entries: [{
            id: "an-cuong:FULLSHEET01",
            codeRaw: "FULLSHEET 01",
            codeNormalized: "FULLSHEET01",
            sourceUrl: "https://ancuong.com/example/01.html",
            fullsheetSourceUrl: "https://ancuong.com/products/products-full/example.png",
            sourceHasMedia: true,
            reasonCode: "SOURCE_IMAGE_FULLSHEET_ONLY",
          }],
        },
        materialByCode: new Map([["FULLSHEET01", "melamine"]]),
      });

      expect(artifact.entries[0]?.localAssets).toEqual([
        expect.objectContaining({ role: "fullsheet", width: 1600, height: 800 }),
      ]);
    } finally {
      globalThis.fetch = originalFetch;
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("uses semantic safe filenames instead of anonymous image names", () => {
    expect(
      semanticColorMediaPath("melamine", "MFC - MS 465 SC04", "swatch"),
    ).toBe("/catalog/an-cuong/melamine/mfc-ms-465-sc04-swatch.webp");
    expect(
      semanticColorMediaPath("melamine", "MFC - MS 465 SC04", "application"),
    ).toBe("/catalog/an-cuong/melamine/mfc-ms-465-sc04-application.webp");
  });

  it("merges verified local media into public records and hides invalid source images", () => {
    const records: PublicSupplierColorCode[] = [
      {
        id: "an-cuong:MFCMS465SC04",
        supplier: "an-cuong",
        recordType: "color-code",
        codeRaw: "MFC - MS 465 SC04",
        codeNormalized: "MFCMS465SC04",
        searchAliases: ["MFCMS465SC04"],
        materialType: "melamine",
        sourceUrl: "https://ancuong.com/melamine/303003318.html",
        sourceUrls: ["https://ancuong.com/melamine/303003318.html"],
        images: [
          {
            role: "fullsheet",
            sourceUrl: "https://ancuong.com/products/products-full/30300331800101572065.jpg",
            rightsStatus: "UNCONFIRMED",
          },
        ],
        searchable: true,
        colorCodeEvidence: "decorative-product-detail",
        confidence: "verified",
        seoStatus: "NEEDS_ENRICHMENT",
        slug: "mfc-ms-465-sc04",
        canonicalRoute: "/catalogue/an-cuong/melamine/mfc-ms-465-sc04/",
        demandScore: 108,
      },
      {
        id: "ba-thanh:P2052",
        supplier: "ba-thanh",
        recordType: "color-code",
        codeRaw: "P2052",
        codeNormalized: "P2052",
        searchAliases: ["P2052"],
        materialType: "laminate",
        sourceUrl: "https://bathanh.com.vn/way-p2052",
        sourceUrls: ["https://bathanh.com.vn/way-p2052"],
        images: [],
        searchable: true,
        colorCodeEvidence: "official-color-map",
        confidence: "verified",
        seoStatus: "NOINDEX_USEFUL",
        slug: "p2052",
        canonicalRoute: "/catalogue/ba-thanh/laminate/p2052/",
        demandScore: 8,
      },
      {
        id: "ba-thanh:BT171EV",
        supplier: "ba-thanh",
        recordType: "color-code",
        codeRaw: "BT171EV",
        codeNormalized: "BT171EV",
        searchAliases: ["BT171EV"],
        materialType: "melamine",
        sourceUrl: "https://bathanh.com.vn/bt171ev",
        sourceUrls: ["https://bathanh.com.vn/bt171ev"],
        images: [
          {
            role: "swatch",
            sourceUrl: "https://bathanh.com.vn/wp-content/uploads/2023/10/BT-103-e1698733774228.jpg",
            rightsStatus: "UNCONFIRMED",
          },
        ],
        searchable: true,
        colorCodeEvidence: "official-color-map",
        confidence: "verified",
        seoStatus: "NOINDEX_USEFUL",
        slug: "bt171ev",
        canonicalRoute: "/catalogue/ba-thanh/melamine/bt171ev/",
        demandScore: 112,
      },
    ];
    const artifacts: ColorMediaDiscoveryArtifact[] = [
      {
        schemaVersion: 1,
        supplier: "an-cuong",
        generatedAt: "2026-08-07T00:00:00.000Z",
        entries: [
          {
            id: "an-cuong:MFCMS465SC04",
            codeRaw: "MFC - MS 465 SC04",
            codeNormalized: "MFCMS465SC04",
            sourceUrl: "https://ancuong.com/melamine/303003318.html",
            previewSourceUrl: "https://ancuong.com/products/products-thumb/30300331800101572065.jpg",
            fullsheetSourceUrl: "https://ancuong.com/products/products-full/30300331800101572065.jpg",
            localPath: "/catalog/an-cuong/melamine/mfc-ms-465-sc04-swatch.webp",
            checksum: "a".repeat(64),
            mimeType: "image/webp",
            width: 800,
            height: 600,
            sourceHasMedia: true,
            reasonCode: "SOURCE_IMAGE_LAZY",
          },
        ],
      },
      {
        schemaVersion: 1,
        supplier: "ba-thanh",
        generatedAt: "2026-08-07T00:00:00.000Z",
        entries: [
          {
            id: "ba-thanh:P2052",
            codeRaw: "P2052",
            codeNormalized: "P2052",
            sourceUrl: "https://bathanh.com.vn/way-p2052",
            previewSourceUrl: "https://bathanh.com.vn/wp-content/uploads/SC017MW-1024x614.jpg",
            localPath: "/catalog/ba-thanh/laminate/p2052-swatch.webp",
            checksum: "b".repeat(64),
            mimeType: "image/webp",
            width: 800,
            height: 600,
            sourceHasMedia: true,
            reasonCode: "SOURCE_HAS_IMAGE_BUT_PARSER_MISSED",
          },
          {
            id: "ba-thanh:BT171EV",
            codeRaw: "BT171EV",
            codeNormalized: "BT171EV",
            sourceUrl: "https://bathanh.com.vn/bt171ev",
            sourceHasMedia: false,
            reasonCode: "INVALID_IMAGE",
          },
        ],
      },
    ];
    const merged = applyColorMediaToIndex(records, artifacts);
    expect(merged[0]?.images).toEqual(expect.arrayContaining([
      expect.objectContaining({
        role: "fullsheet",
        sourceUrl: "https://ancuong.com/products/products-full/30300331800101572065.jpg",
      }),
      expect.objectContaining({
        role: "swatch",
        localPath: "/catalog/an-cuong/melamine/mfc-ms-465-sc04-swatch.webp",
        checksum: "a".repeat(64),
      }),
    ]));
    expect(merged[1]?.images).toEqual(expect.arrayContaining([
      expect.objectContaining({
        role: "swatch",
        localPath: "/catalog/ba-thanh/laminate/p2052-swatch.webp",
      }),
    ]));
    expect(merged[2]?.images).toEqual([]);
  });

});
