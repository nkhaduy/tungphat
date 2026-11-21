import { describe, expect, it } from "vitest";
import { absolutePageUrl, schemaPageId } from "@/lib/seo";

describe("absolutePageUrl", () => {
  it.each([
    ["/", "https://gotungphat.com/"],
    ["van-mdf", "https://gotungphat.com/van-mdf/"],
    ["/van-mdf/", "https://gotungphat.com/van-mdf/"],
    ["https://gotungphat.com/van-mdf", "https://gotungphat.com/van-mdf/"],
    ["https://gotungphat.com/van-mdf/", "https://gotungphat.com/van-mdf/"],
    [" /van-mdf?key=value#product ", "https://gotungphat.com/van-mdf/?key=value#product"],
    ["/van-mdf#product?key=value", "https://gotungphat.com/van-mdf/#product?key=value"],
    ["/van-mdf//quy-cach", "https://gotungphat.com/van-mdf/quy-cach/"],
    ["/ván-gỗ", "https://gotungphat.com/v%C3%A1n-g%E1%BB%97/"],
    ["/v%C3%A1n-g%E1%BB%97", "https://gotungphat.com/v%C3%A1n-g%E1%BB%97/"],
  ])("normalizes %s", (input, expected) => {
    expect(absolutePageUrl(input)).toBe(expected);
  });

  it("keeps an external URL unchanged", () => {
    expect(absolutePageUrl(" https://example.com/path ")).toBe("https://example.com/path");
  });

  it("rejects file assets", () => {
    expect(() => absolutePageUrl("/images/example.webp")).toThrow(/file asset/u);
    expect(() => absolutePageUrl("https://gotungphat.com/catalogue.pdf/")).toThrow(/file asset/u);
    expect(() => absolutePageUrl("https://user:pass@mdftungphat.com/van-mdf/")).toThrow(/credentials/u);
  });
});

describe("schemaPageId", () => {
  it("places the fragment after the canonical trailing slash", () => {
    expect(schemaPageId("/cat-cnc-go", "#service")).toBe(
      "https://gotungphat.com/cat-cnc-go/#service",
    );
  });

  it("preserves query semantics before the fragment", () => {
    expect(schemaPageId("/path?key=value", "entity")).toBe(
      "https://gotungphat.com/path/?key=value#entity",
    );
  });
});
