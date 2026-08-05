import { describe, expect, it } from "vitest";
import { mapConcurrent } from "@/scripts/ancuong/concurrency";

describe("An Cuong bounded concurrency", () => {
  it("preserves input order and never exceeds the requested worker count", async () => {
    let active = 0;
    let maximum = 0;
    const result = await mapConcurrent([1, 2, 3, 4, 5], 2, async (value) => {
      active += 1;
      maximum = Math.max(maximum, active);
      await new Promise((resolve) => setTimeout(resolve, value % 2));
      active -= 1;
      return value * 2;
    });
    expect(result).toEqual([2, 4, 6, 8, 10]);
    expect(maximum).toBe(2);
  });
});
