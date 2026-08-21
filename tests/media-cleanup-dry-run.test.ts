import { describe, expect, test } from "vitest";
import { groupExactDuplicateObjects } from "../scripts/media-cleanup/dry-run";

describe("R2 dry-run", () => {
  test("groups only objects with matching size and ETag", () => {
    const groups = groupExactDuplicateObjects([
      { key: "supplier/a.jpg", size: 100, etag: "same" },
      { key: "supplier/b.jpg", size: 100, etag: "same" },
      { key: "supplier/c.jpg", size: 101, etag: "same" },
    ]);

    expect(groups).toEqual([{
      signature: "100:same",
      objects: ["supplier/a.jpg", "supplier/b.jpg"],
      potentialSaving: 100,
    }]);
  });
});
