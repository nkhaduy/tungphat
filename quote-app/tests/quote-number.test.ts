import { describe, expect, it } from "vitest";
import { OFFICIAL_BRANCHES } from "../src/shared/branches";
import { formatQuoteNumber, vietnamDateParts } from "../src/shared/quote-number";

describe("quote number", () => {
  it("matches the Tùng Phát branch-date-sequence format", () => {
    expect(formatQuoteNumber("TP81", "220726", 1)).toBe("TP81-220726-001");
    expect(formatQuoteNumber("TP14", "220726", 12)).toBe("TP14-220726-012");
  });

  it("does not duplicate numbers when the atomic counter returns distinct sequences", () => {
    const numbers = Array.from({ length: 1_000 }, (_, index) => formatQuoteNumber("TP81", "220726", index + 1));
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it("uses Vietnam timezone for date parts", () => {
    expect(vietnamDateParts(new Date("2026-07-21T18:00:00.000Z"))).toEqual({ isoDate: "2026-07-22", compact: "220726" });
  });

  it("keeps the official branches on the shared Mr. Tùng contact", () => {
    expect(OFFICIAL_BRANCHES).toEqual([
      { code: "TP14", name: "Tùng Phát 1", address: "14 Tam Bình, Hiệp Bình, TP.HCM", phone: "0909 259 160" },
      { code: "TP81", name: "Tùng Phát 2", address: "81B Tam Bình, Hiệp Bình, TP.HCM", phone: "0909 259 160" },
    ]);
  });
});
