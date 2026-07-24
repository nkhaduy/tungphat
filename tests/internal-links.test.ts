import { describe, expect, it } from "vitest";
import { classifyNavigationalHref } from "../scripts/check-internal-links.mjs";

function classify(rawHref: string, anchorTag = `<a href="${rawHref}">`) {
  return classifyNavigationalHref({ rawHref, sourcePath: "/van-mdf/", anchorTag });
}

describe("internal navigational link classification", () => {
  it.each([
    ["homepage", "/", "https://mdftungphat.com/", false],
    ["route missing slash", "/lien-he", "https://mdftungphat.com/lien-he", true],
    ["route with slash", "/lien-he/", "https://mdftungphat.com/lien-he/", false],
    ["query", "/lien-he?source=home", "https://mdftungphat.com/lien-he?source=home", true],
    ["fragment", "/van-mdf#quy-cach", "https://mdftungphat.com/van-mdf#quy-cach", true],
    ["query and fragment", "/van-mdf?source=home#quy-cach", "https://mdftungphat.com/van-mdf?source=home#quy-cach", true],
    ["absolute same-origin", "https://mdftungphat.com/lien-he", "https://mdftungphat.com/lien-he", true]
  ])("keeps %s navigational semantics", (_name, rawHref, resolvedTarget, invalidTrailingSlash) => {
    const result = classify(rawHref);
    expect(result.kind).toBe("internal");
    if (result.kind !== "internal") return;
    expect(result.resolvedTarget).toBe(resolvedTarget);
    expect(result.invalidTrailingSlash).toBe(invalidTrailingSlash);
  });

  it.each([
    ["external URL", "https://example.com/lien-he/"],
    ["mailto", "mailto:info@mdftungphat.com"],
    ["tel", "tel:+84909259160"],
    ["PDF", "/catalogue/bang-mau.pdf"],
    ["image asset", "/images/wood-panels.webp"],
    ["API route", "/api/leads"],
    ["fragment-only", "#quy-cach"]
  ])("skips %s", (_name, rawHref) => {
    expect(classify(rawHref).kind).toBe("skip");
  });

  it("skips download links even when the path has no extension", () => {
    expect(classify("/download/catalogue", '<a href="/download/catalogue" download>').kind).toBe("skip");
  });
});
