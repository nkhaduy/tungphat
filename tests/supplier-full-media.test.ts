import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildMediaCapacitySummary,
  classifySupplierMediaOrigin,
  checksumSupplierMediaManifest,
  inspectMediaBytes,
  inventoryMediaOrigin,
  inventoryMediaOriginsWithCache,
  fetchExactSupplierPreview,
  fetchExactSupplierPreviewsWithCache,
  mergeMediaAssetsByChecksum,
  selectCapacitySafePreviewUrls,
  validateSupplierMediaManifest,
  type SupplierMediaAsset,
  type SupplierMediaManifest,
} from "@/lib/catalog/full-import/media";

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

function asset(overrides: Partial<SupplierMediaAsset> = {}): SupplierMediaAsset {
  return {
    assetId: "source:https://ancuong.com/products/products-full/a.jpg",
    sourceKind: "archival-original",
    origins: [
      {
        sourceUrl: "https://ancuong.com/products/products-full/a.jpg",
        finalUrl: "https://ancuong.com/products/products-full/a.jpg",
        redirectChain: [],
        httpStatus: 200,
        mimeType: "image/jpeg",
        contentLength: 12_000_000,
      },
    ],
    references: [
      {
        productId: "an-cuong:sku:a",
        role: "primary",
        sourceUrl: "https://ancuong.com/products/products-full/a.jpg",
      },
    ],
    state: "ORIGINAL_PROVENANCE_ONLY",
    rightsStatus: "UNCONFIRMED",
    ...overrides,
  };
}

function manifest(assets: SupplierMediaAsset[]): SupplierMediaManifest {
  return {
    schemaVersion: 1,
    supplier: "an-cuong",
    generatedAt: "2026-08-07T00:00:00.000Z",
    assets,
    checksum: "",
  };
}

describe("supplier full-media provenance", () => {
  it("rejects non-HTTPS, non-supplier and unsafe redirect source URLs", () => {
    const source = manifest([
      asset({
        origins: [
          {
            sourceUrl: "http://cdn.example.com/products/products-full/a.jpg",
            finalUrl: "https://cdn.example.com/a.jpg",
            redirectChain: ["https://cdn.example.com/a.jpg"],
            httpStatus: 200,
            mimeType: "image/jpeg",
            contentLength: "unknown",
          },
        ],
        references: [
          {
            productId: "an-cuong:sku:a",
            role: "primary",
            sourceUrl: "http://cdn.example.com/products/products-full/a.jpg",
          },
        ],
      }),
    ]);

    expect(validateSupplierMediaManifest(source).map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "SOURCE_URL_NOT_HTTPS",
        "SOURCE_HOST_NOT_ALLOWED",
        "REDIRECT_HOST_NOT_ALLOWED",
      ]),
    );
  });

  it("preserves unknown public length and validates exact local preview metadata", () => {
    const localPath = "/catalog/an-cuong/example.png";
    const source = manifest([
      asset({
        assetId: "sha256:preview",
        sourceKind: "supplier-thumbnail",
        origins: [
          {
            sourceUrl: "https://ancuong.com/products/products-thumb/example.png",
            finalUrl: "https://ancuong.com/products/products-thumb/example.png",
            redirectChain: [],
            httpStatus: 200,
            mimeType: "image/png",
            contentLength: "unknown",
          },
        ],
        references: [
          {
            productId: "an-cuong:sku:example",
            role: "preview",
            sourceUrl: "https://ancuong.com/products/products-thumb/example.png",
          },
        ],
        state: "LOCAL_PREVIEW",
        delivery: {
          kind: "exact-source-bytes",
          localPath,
          mimeType: "image/png",
          width: 1,
          height: 1,
          bytes: PNG_1X1.length,
          checksum: "a".repeat(64),
        },
      }),
    ]);

    expect(
      validateSupplierMediaManifest(source, { knownLocalPaths: new Set([localPath]) }),
    ).toEqual([]);
    expect(source.assets[0]?.rightsStatus).toBe("UNCONFIRMED");
    expect(source.assets[0]?.origins[0]?.contentLength).toBe("unknown");
  });

  it("detects image MIME from bytes and rejects a mismatched declaration", () => {
    expect(inspectMediaBytes(PNG_1X1, "image/png")).toEqual({
      mimeType: "image/png",
      width: 1,
      height: 1,
    });
    expect(() => inspectMediaBytes(PNG_1X1, "image/jpeg")).toThrow(/MIME/i);
    expect(() => inspectMediaBytes(Buffer.from("<html>captcha</html>"), "image/png")).toThrow(
      /not an image/i,
    );
  });

  it("inventories public metadata with HEAD only and keeps absent length unknown", async () => {
    const methods: string[] = [];
    const fetchImpl: typeof fetch = async (_input, init) => {
      methods.push(init?.method ?? "GET");
      return new Response(null, {
        status: 200,
        headers: { "content-type": "image/jpeg" },
      });
    };

    const origin = await inventoryMediaOrigin(
      "an-cuong",
      "https://ancuong.com/products/products-full/a.jpg",
      { fetchImpl, retries: 0 },
    );

    expect(methods).toEqual(["HEAD"]);
    expect(origin).toMatchObject({
      httpStatus: 200,
      mimeType: "image/jpeg",
      contentLength: "unknown",
      redirectChain: [],
    });
  });

  it("stops metadata inventory when a redirect leaves official supplier hosts", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(null, {
        status: 302,
        headers: { location: "https://cdn.example.com/a.jpg" },
      });

    await expect(
      inventoryMediaOrigin("an-cuong", "https://ancuong.com/a.jpg", {
        fetchImpl,
        retries: 0,
      }),
    ).rejects.toThrow(/allowlisted/i);
  });

  it("bounds the entire HEAD redirect and retry operation with one deadline", async () => {
    const fetchImpl: typeof fetch = async (_input, init) =>
      await new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      });
    const startedAt = Date.now();

    await expect(
      inventoryMediaOrigin("an-cuong", "https://ancuong.com/a.jpg", {
        fetchImpl,
        retries: 4,
        backoffMs: 10,
        timeoutMs: 20,
      }),
    ).rejects.toThrow();

    expect(Date.now() - startedAt).toBeLessThan(100);
  });

  it("records HTTP 429 as rate-limited metadata without trusting its payload length", async () => {
    const origin = await inventoryMediaOrigin(
      "an-cuong",
      "https://ancuong.com/a.jpg",
      {
        fetchImpl: async () =>
          new Response(null, {
            status: 429,
            headers: { "content-length": "9999", "retry-after": "120" },
          }),
        retries: 0,
      },
    );

    expect(origin).toMatchObject({
      httpStatus: 429,
      contentLength: "unknown",
      rateLimited: true,
      retryAfter: "120",
    });
  });

  it("checkpoints HEAD metadata and resumes without repeating cached requests", async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "supplier-media-"));
    const cacheFile = path.join(directory, "inventory.json");
    let requests = 0;
    const fetchImpl: typeof fetch = async () => {
      requests += 1;
      return new Response(null, {
        status: 200,
        headers: { "content-type": "image/jpeg", "content-length": "1234" },
      });
    };
    const inputs = [
      { supplier: "an-cuong" as const, sourceUrl: "https://ancuong.com/a.jpg" },
      { supplier: "ba-thanh" as const, sourceUrl: "https://bathanh.com.vn/b.jpg" },
    ];

    const first = await inventoryMediaOriginsWithCache(inputs, {
      cacheFile,
      fetchImpl,
      concurrency: 2,
      retries: 0,
    });
    const second = await inventoryMediaOriginsWithCache(inputs, {
      cacheFile,
      fetchImpl: async () => {
        throw new Error("network should not be used for cached metadata");
      },
      concurrency: 2,
      retries: 0,
    });

    expect(requests).toBe(2);
    expect(first.get("an-cuong|https://ancuong.com/a.jpg")?.contentLength).toBe(1234);
    expect(second).toEqual(first);
    expect(JSON.parse(fs.readFileSync(cacheFile, "utf8"))).toMatchObject({ schemaVersion: 1 });
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it("prefers the newer atomic checkpoint over a stale manifest seed", async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "supplier-media-precedence-"));
    const cacheFile = path.join(directory, "inventory.json");
    const key = "an-cuong|https://ancuong.com/a.jpg";
    fs.writeFileSync(cacheFile, JSON.stringify({
      schemaVersion: 1,
      origins: {
        [key]: {
          sourceUrl: "https://ancuong.com/a.jpg",
          redirectChain: [],
          httpStatus: 200,
          mimeType: "image/jpeg",
          contentLength: 222,
        },
      },
    }));

    const result = await inventoryMediaOriginsWithCache(
      [{ supplier: "an-cuong", sourceUrl: "https://ancuong.com/a.jpg" }],
      {
        cacheFile,
        offline: true,
        seed: new Map([[key, {
          sourceUrl: "https://ancuong.com/a.jpg",
          redirectChain: [],
          httpStatus: 200,
          mimeType: "image/jpeg",
          contentLength: 111,
        }]]),
      },
    );

    expect(result.get(key)?.contentLength).toBe(222);
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it("does not retry cached rate limits unless an explicit refresh window is requested", async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "supplier-media-retry-"));
    const cacheFile = path.join(directory, "inventory.json");
    const input = [{ supplier: "an-cuong" as const, sourceUrl: "https://ancuong.com/a.jpg" }];
    await inventoryMediaOriginsWithCache(input, {
      cacheFile,
      fetchImpl: async () => new Response(null, { status: 429 }),
      concurrency: 1,
      retries: 0,
    });

    let resumeRequests = 0;
    const resumed = await inventoryMediaOriginsWithCache(input, {
      cacheFile,
      fetchImpl: async () => {
        resumeRequests += 1;
        return new Response(null, { status: 200 });
      },
      concurrency: 1,
      retries: 0,
    });
    const refreshed = await inventoryMediaOriginsWithCache(input, {
      cacheFile,
      fetchImpl: async () =>
        new Response(null, {
          status: 200,
          headers: { "content-type": "image/jpeg", "content-length": "99" },
        }),
      concurrency: 1,
      retries: 0,
      refreshRateLimited: true,
    });

    expect(resumeRequests).toBe(0);
    expect(resumed.get("an-cuong|https://ancuong.com/a.jpg")).toMatchObject({
      httpStatus: 429,
      rateLimited: true,
    });
    expect(refreshed.get("an-cuong|https://ancuong.com/a.jpg")).toMatchObject({
      httpStatus: 200,
      contentLength: 99,
    });
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it("caps global inventory concurrency at three and spaces requests per host", async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "supplier-media-pace-"));
    const starts: number[] = [];
    let active = 0;
    let maxActive = 0;
    const inputs = Array.from({ length: 5 }, (_, index) => ({
      supplier: "an-cuong" as const,
      sourceUrl: `https://ancuong.com/${index}.jpg`,
    }));

    await inventoryMediaOriginsWithCache(inputs, {
      cacheFile: path.join(directory, "inventory.json"),
      concurrency: 8,
      retries: 0,
      minDelayMs: 5,
      fetchImpl: async () => {
        starts.push(Date.now());
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 50));
        active -= 1;
        return new Response(null, { status: 200 });
      },
    });

    expect(maxActive).toBeLessThanOrEqual(3);
    expect(starts.slice(1).every((started, index) => started - starts[index]! >= 3)).toBe(true);
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it("requires explicit opt-in and a small cap before selecting preview GETs", () => {
    const urls = ["https://ancuong.com/c.jpg", "https://ancuong.com/a.jpg", "https://ancuong.com/b.jpg"];

    expect(selectCapacitySafePreviewUrls(urls, { enabled: false, limit: 2 })).toEqual([]);
    expect(selectCapacitySafePreviewUrls(urls, { enabled: true, limit: 2 })).toEqual([
      "https://ancuong.com/a.jpg",
      "https://ancuong.com/b.jpg",
    ]);
    expect(() => selectCapacitySafePreviewUrls(urls, { enabled: true, limit: 51 })).toThrow(
      /50/,
    );
  });

  it("rejects a preview source before the first GET when the initial host is unsafe", async () => {
    let requests = 0;
    await expect(
      fetchExactSupplierPreview("an-cuong", "https://cdn.example.com/a.png", {
        fetchImpl: async () => {
          requests += 1;
          return new Response(PNG_1X1, { status: 200 });
        },
        retries: 0,
        maxRedirects: 0,
        timeoutMs: 100,
      }),
    ).rejects.toThrow(/allowlisted/i);
    expect(requests).toBe(0);
  });

  it("uses one total deadline across preview GET retries and redirects", async () => {
    const fetchImpl: typeof fetch = async (_input, init) =>
      await new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      });
    const startedAt = Date.now();

    await expect(
      fetchExactSupplierPreview("an-cuong", "https://ancuong.com/a.png", {
        fetchImpl,
        retries: 4,
        maxRedirects: 5,
        timeoutMs: 20,
      }),
    ).rejects.toThrow();
    expect(Date.now() - startedAt).toBeLessThan(100);
  });

  it("does not retry preview HTTP 429 and preserves Retry-After evidence", async () => {
    let requests = 0;
    const result = await fetchExactSupplierPreview("an-cuong", "https://ancuong.com/a.png", {
      fetchImpl: async () => {
        requests += 1;
        return new Response(null, { status: 429, headers: { "retry-after": "180" } });
      },
      retries: 3,
      maxRedirects: 0,
      timeoutMs: 100,
    });

    expect(requests).toBe(1);
    expect(result).toMatchObject({
      status: "rate-limited",
      origin: { httpStatus: 429, rateLimited: true, retryAfter: "180", contentLength: "unknown" },
    });
  });

  it("rejects unknown-length preview bodies before reading them", async () => {
    let bodyAccessed = false;
    const response = {
      status: 200,
      ok: true,
      headers: new Headers({ "content-type": "image/png" }),
      get body() {
        bodyAccessed = true;
        throw new Error("body must not be read");
      },
    } as Response;

    await expect(
      fetchExactSupplierPreview("an-cuong", "https://ancuong.com/a.png", {
        fetchImpl: async () => response,
        retries: 0,
        maxRedirects: 0,
        timeoutMs: 100,
      }),
    ).rejects.toThrow(/Content-Length/i);
    expect(bodyAccessed).toBe(false);
  });

  it("atomically checkpoints preview rate limits and suppresses normal resume", async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "supplier-preview-cache-"));
    const cacheFile = path.join(directory, "preview.json");
    const requests = [{ supplier: "an-cuong" as const, sourceUrl: "https://ancuong.com/a.png" }];
    await fetchExactSupplierPreviewsWithCache(requests, {
      cacheFile,
      fetchImpl: async () => new Response(null, { status: 429, headers: { "retry-after": "120" } }),
      concurrency: 1,
      retries: 0,
      maxRedirects: 0,
      timeoutMs: 100,
      minDelayMs: 0,
    });
    let resumedRequests = 0;
    const resumed = await fetchExactSupplierPreviewsWithCache(requests, {
      cacheFile,
      fetchImpl: async () => {
        resumedRequests += 1;
        return new Response(PNG_1X1, { status: 200, headers: { "content-type": "image/png", "content-length": String(PNG_1X1.length) } });
      },
      concurrency: 1,
      retries: 0,
      maxRedirects: 0,
      timeoutMs: 100,
      minDelayMs: 0,
    });

    expect(resumedRequests).toBe(0);
    expect(resumed.get("an-cuong|https://ancuong.com/a.png")?.status).toBe("rate-limited");
    expect(JSON.parse(fs.readFileSync(cacheFile, "utf8"))).toMatchObject({ schemaVersion: 1 });
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it("caps the actual preview GET batch at three concurrent requests", async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "supplier-preview-concurrency-"));
    let active = 0;
    let maxActive = 0;
    const requests = Array.from({ length: 6 }, (_, index) => ({
      supplier: "an-cuong" as const,
      sourceUrl: `https://ancuong.com/${index}.png`,
    }));
    const result = await fetchExactSupplierPreviewsWithCache(requests, {
      cacheFile: path.join(directory, "preview.json"),
      concurrency: 8,
      retries: 0,
      maxRedirects: 0,
      timeoutMs: 500,
      minDelayMs: 0,
      fetchImpl: async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 30));
        active -= 1;
        return new Response(PNG_1X1, {
          status: 200,
          headers: { "content-type": "image/png", "content-length": String(PNG_1X1.length) },
        });
      },
    });

    expect(maxActive).toBeLessThanOrEqual(3);
    expect([...result.values()].every((item) => item.status === "downloaded")).toBe(true);
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it("classifies HTTP 200 non-image media origins as invalid evidence", () => {
    expect(classifySupplierMediaOrigin({
      sourceUrl: "https://ancuong.com/a.jpg",
      redirectChain: [],
      httpStatus: 200,
      mimeType: "text/html",
      contentLength: 120,
    })).toEqual({
      state: "INVALID",
      reason: "Supplier media HEAD returned non-image MIME text/html.",
    });
  });

  it("deduplicates exact local bytes while retaining every source and product relationship", () => {
    const delivery = {
      kind: "exact-source-bytes" as const,
      localPath: "/catalog/an-cuong/shared.jpg",
      mimeType: "image/jpeg",
      width: 100,
      height: 100,
      bytes: 1234,
      checksum: "b".repeat(64),
    };
    const left = asset({
      assetId: "sha256:left",
      sourceKind: "supplier-thumbnail",
      state: "LOCAL_PREVIEW",
      delivery,
    });
    const rightUrl = "https://ancuong.com/products/products-thumb/b.jpg";
    const right = asset({
      assetId: "sha256:right",
      sourceKind: "supplier-thumbnail",
      origins: [
        {
          sourceUrl: rightUrl,
          finalUrl: rightUrl,
          redirectChain: [],
          httpStatus: 200,
          mimeType: "image/jpeg",
          contentLength: 1234,
        },
      ],
      references: [{ productId: "an-cuong:sku:b", role: "preview", sourceUrl: rightUrl }],
      state: "LOCAL_PREVIEW",
      delivery,
    });

    const [merged] = mergeMediaAssetsByChecksum([left, right]);

    expect(merged?.origins.map((origin) => origin.sourceUrl)).toEqual([
      "https://ancuong.com/products/products-full/a.jpg",
      rightUrl,
    ]);
    expect(merged?.references.map((reference) => reference.productId)).toEqual([
      "an-cuong:sku:a",
      "an-cuong:sku:b",
    ]);
  });

  it("rejects hotlinks, invented local paths, missing reasons and rights escalation", () => {
    const source = manifest([
      asset({
        state: "LOCAL_PREVIEW",
        rightsStatus: "CONFIRMED" as never,
        delivery: {
          kind: "legacy-transformed",
          localPath: "https://ancuong.com/products/products-thumb/a.jpg",
          mimeType: "image/jpeg",
          width: 100,
          height: 100,
          bytes: 1234,
          checksum: "c".repeat(64),
        },
      }),
      asset({
        assetId: "source:missing",
        state: "UNRESOLVED",
        reason: "",
      }),
    ]);

    expect(
      validateSupplierMediaManifest(source, { knownLocalPaths: new Set() }).map(
        (issue) => issue.code,
      ),
    ).toEqual(
      expect.arrayContaining([
        "HOTLINK_NOT_ALLOWED",
        "LOCAL_FILE_NOT_IN_INVENTORY",
        "RIGHTS_STATUS_INVALID",
        "UNRESOLVED_REASON_REQUIRED",
      ]),
    );
  });

  it("checksums stable content independently of generated time and asset order", () => {
    const left = manifest([asset(), asset({ assetId: "source:b" })]);
    const right = {
      ...left,
      generatedAt: "2027-01-01T00:00:00.000Z",
      assets: [...left.assets].reverse(),
    };

    expect(checksumSupplierMediaManifest(left)).toBe(checksumSupplierMediaManifest(right));
  });

  it("counts deduplicated preview files separately from retained media references", () => {
    const localPath = "/catalog/an-cuong/shared.jpg";
    const local = mergeMediaAssetsByChecksum([
      asset({
        sourceKind: "supplier-thumbnail",
        state: "LOCAL_PREVIEW",
        delivery: {
          kind: "exact-source-bytes",
          localPath,
          mimeType: "image/jpeg",
          width: 100,
          height: 100,
          bytes: 1234,
          checksum: "d".repeat(64),
        },
      }),
      asset({
        assetId: "source:b",
        sourceKind: "supplier-thumbnail",
        origins: [
          {
            sourceUrl: "https://ancuong.com/products/products-thumb/b.jpg",
            redirectChain: [],
            contentLength: 1234,
          },
        ],
        references: [
          {
            productId: "an-cuong:sku:b",
            role: "preview",
            sourceUrl: "https://ancuong.com/products/products-thumb/b.jpg",
          },
        ],
        state: "LOCAL_PREVIEW",
        delivery: {
          kind: "exact-source-bytes",
          localPath,
          mimeType: "image/jpeg",
          width: 100,
          height: 100,
          bytes: 1234,
          checksum: "d".repeat(64),
        },
      }),
    ]);
    const source = manifest([...local, asset()]);

    expect(
      buildMediaCapacitySummary([source], {
        publicFileCount: 1331,
        publicBytes: 110_000_000,
        maxPublicFileBytes: 1234,
        scope: "PREBUILD_SOURCE_PUBLIC",
      }).suppliers["an-cuong"],
    ).toMatchObject({
      totalRefs: 3,
      uniqueUrls: 2,
      localPreviewRefs: 2,
      localPreviewFiles: 1,
      localPreviewBytes: 1234,
      originalProvenanceOnlyRefs: 1,
      rightsStatus: "UNCONFIRMED",
    });
    expect(
      buildMediaCapacitySummary([source], {
        publicFileCount: 1331,
        publicBytes: 110_000_000,
        maxPublicFileBytes: 1234,
        scope: "PREBUILD_SOURCE_PUBLIC",
      }).publicDelivery.scope,
    ).toBe("PREBUILD_SOURCE_PUBLIC");
  });

  it("never promotes an explicitly source-only relationship into local delivery", () => {
    const records = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "data/imports/ba-thanh/full-records.json"), "utf8"),
    ) as { records: Array<{ images?: Array<{ localPath?: string }> }> };
    const generated = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "data/imports/ba-thanh/full-media-manifest.json"), "utf8"),
    ) as SupplierMediaManifest;
    const explicitLocalRefs = records.records.reduce(
      (total, record) => total + (record.images ?? []).filter((image) => image.localPath).length,
      0,
    );
    const explicitSourceOnlyRefs = records.records.reduce(
      (total, record) => total + (record.images ?? []).filter((image) => !image.localPath).length,
      0,
    );
    const manifestLocalRefs = generated.assets
      .filter((item) => item.state === "LOCAL_PREVIEW")
      .reduce((total, item) => total + item.references.length, 0);
    const manifestDeferredRefs = generated.assets
      .filter((item) => item.state === "DEFERRED")
      .reduce((total, item) => total + item.references.length, 0);

    expect(manifestLocalRefs).toBe(explicitLocalRefs);
    expect(manifestDeferredRefs).toBe(explicitSourceOnlyRefs);
  });
});
