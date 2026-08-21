import { describe, expect, test } from "vitest";
import { validateDeletionBatch } from "../scripts/media-cleanup/r2-delete";

describe("R2 cleanup execution", () => {
  test("rejects a stale ETag before deleting any object", () => {
    expect(() => validateDeletionBatch(
      [{ key: "supplier/a.jpg", etag: "expected", size: 100 }],
      [{ key: "supplier/a.jpg", etag: "changed", size: 100 }],
    )).toThrow(/stale etag/i);
  });

  test("rejects a size drift before deleting any object", () => {
    expect(() => validateDeletionBatch(
      [{ key: "supplier/a.jpg", etag: "same", size: 100 }],
      [{ key: "supplier/a.jpg", etag: "same", size: 101 }],
    )).toThrow(/size drift/i);
  });
});
