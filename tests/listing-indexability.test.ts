import { describe, expect, it } from "vitest";
import { filterPublishedContent, getListingIndexability } from "@/lib/listing-indexability";

const draft = { slug: "draft-entry", draft: true, noindex: true };
const noindex = { slug: "noindex-entry", draft: false, noindex: true };
const published = { slug: "published-entry", draft: false, noindex: false };

describe("listing indexability", () => {
  it("keeps an empty published listing noindex and out of the sitemap", () => {
    const entries = filterPublishedContent([draft, noindex]);
    expect(entries).toEqual([]);
    expect(getListingIndexability(entries.length)).toEqual({
      index: false,
      follow: true,
      includeInSitemap: false,
    });
  });

  it("automatically indexes and includes a listing with published content", () => {
    const entries = filterPublishedContent([draft, noindex, published]);
    expect(entries).toEqual([published]);
    expect(getListingIndexability(entries.length)).toEqual({
      index: true,
      follow: true,
      includeInSitemap: true,
    });
  });
});
