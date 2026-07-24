import { describe, expect, it } from "vitest";
import { formatPageTitle } from "@/lib/seo";

describe("formatPageTitle", () => {
  it("adds one suffix to a raw page title", () => {
    expect(formatPageTitle("Ván MDF tại TP.HCM")).toBe("Ván MDF tại TP.HCM | Tùng Phát");
  });

  it("keeps a single existing suffix", () => {
    expect(formatPageTitle("Ván MDF tại TP.HCM | Tùng Phát")).toBe("Ván MDF tại TP.HCM | Tùng Phát");
  });

  it("collapses duplicate terminal suffixes", () => {
    expect(formatPageTitle("Ván MDF | Tùng Phát | Tùng Phát")).toBe("Ván MDF | Tùng Phát");
  });

  it("normalizes separator whitespace", () => {
    expect(formatPageTitle("  Ván MDF  |   Tùng Phát  ")).toBe("Ván MDF | Tùng Phát");
  });

  it("does not turn a brand-only title into a duplicate", () => {
    expect(formatPageTitle("Tùng Phát")).toBe("Tùng Phát");
  });

  it("preserves a natural brand mention in the title content", () => {
    expect(formatPageTitle("Liên hệ Tùng Phát")).toBe("Liên hệ Tùng Phát | Tùng Phát");
  });

  it("preserves the brand-first homepage title", () => {
    expect(formatPageTitle("Tùng Phát | Vật liệu gỗ và gia công CNC")).toBe(
      "Tùng Phát | Vật liệu gỗ và gia công CNC",
    );
  });

  it("handles Vietnamese Unicode without changing intent", () => {
    expect(formatPageTitle("Gỗ ghép tràm tại TP.HCM: kiểm tra quy cách")).toBe(
      "Gỗ ghép tràm tại TP.HCM: kiểm tra quy cách | Tùng Phát",
    );
  });
});
