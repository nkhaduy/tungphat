import { describe, expect, it } from "vitest";
import { isReservedRootSlug, validateRootSlug } from "@/lib/reserved-slugs";

describe("CMS root slug safety", () => {
  it("reserves static routes and system endpoints", () => {
    expect(isReservedRootSlug("bao-gia")).toBe(true);
    expect(isReservedRootSlug("api")).toBe(true);
    expect(validateRootSlug("bao-gia")).toContain("route tĩnh");
  });

  it("rejects invalid and traversal slugs", () => {
    for (const slug of ["", "Van MDF", "van--mdf", "-van-mdf", "van-mdf-", "../api", "van/mdf"]) {
      expect(validateRootSlug(slug)).toBeTruthy();
    }
  });

  it("leaves CMS product slugs available to the dynamic route", () => {
    expect(isReservedRootSlug("van-mdf")).toBe(false);
    expect(validateRootSlug("van-mdf")).toBeUndefined();
  });
});
