import { describe, expect, it } from "vitest";
import { absolutePageUrl, schemaPageId } from "@/lib/seo";

describe("absolutePageUrl", () => {
  it.each([
    ["/", "https://mdftungphat.com/"],
    ["van-mdf", "https://mdftungphat.com/van-mdf/"],
    ["/van-mdf/", "https://mdftungphat.com/van-mdf/"],
    ["https://mdftungphat.com/van-mdf", "https://mdftungphat.com/van-mdf/"],
    ["https://mdftungphat.com/van-mdf/", "https://mdftungphat.com/van-mdf/"],
    [" /van-mdf?key=value#product ", "https://mdftungphat.com/van-mdf/?key=value#product"],
    ["/van-mdf#product?key=value", "https://mdftungphat.com/van-mdf/#product?key=value"],
    ["/van-mdf//quy-cach", "https://mdftungphat.com/van-mdf/quy-cach/"],
    ["/ván-gỗ", "https://mdftungphat.com/v%C3%A1n-g%E1%BB%97/"],
    ["/v%C3%A1n-g%E1%BB%97", "https://mdftungphat.com/v%C3%A1n-g%E1%BB%97/"],
  ])("normalizes %s", (input, expected) => {
    expect(absolutePageUrl(input)).toBe(expected);
  });

  it("keeps an external URL unchanged", () => {
    expect(absolutePageUrl(" https://example.com/path ")).toBe("https://example.com/path");
  });

  it("rejects file assets", () => {
    expect(() => absolutePageUrl("/images/example.webp")).toThrow(/file asset/u);
    expect(() => absolutePageUrl("https://mdftungphat.com/catalogue.pdf/")).toThrow(/file asset/u);
  });
});

describe("schemaPageId", () => {
  it("places the fragment after the canonical trailing slash", () => {
    expect(schemaPageId("/cat-cnc-go", "#service")).toBe(
      "https://mdftungphat.com/cat-cnc-go/#service",
    );
  });

  it("preserves query semantics before the fragment", () => {
    expect(schemaPageId("/path?key=value", "entity")).toBe(
      "https://mdftungphat.com/path/?key=value#entity",
    );
  });
});
