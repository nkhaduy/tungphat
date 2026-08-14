import { describe, expect, it } from "vitest";
import { syncManifestEntries } from "../scripts/media/sync";

describe("media sync", () => {
  it("skips matching objects and uploads missing objects with immutable metadata", async () => {
    const uploaded: Array<{ key: string; contentType: string; cacheControl: string }> = [];
    const result = await syncManifestEntries({
      entries: [
        { logicalPath: "catalog/a.webp", objectKey: "catalog/a.webp", sourcePath: "public/catalog/a.webp", sha256: "a", bytes: 1, mimeType: "image/webp" },
        { logicalPath: "catalog/b.webp", objectKey: "catalog/b.webp", sourcePath: "public/catalog/b.webp", sha256: "b", bytes: 2, mimeType: "image/webp" },
      ],
      head: async (key) => key === "catalog/a.webp" ? { sha256: "a", bytes: 1 } : null,
      upload: async (entry, metadata) => uploaded.push({ key: entry.objectKey, ...metadata }),
      concurrency: 2,
    });

    expect(result).toEqual({ checked: 2, skipped: 1, uploaded: 1, failed: 0 });
    expect(uploaded).toEqual([{ key: "catalog/b.webp", contentType: "image/webp", cacheControl: "public, max-age=31536000, immutable" }]);
  });
});
