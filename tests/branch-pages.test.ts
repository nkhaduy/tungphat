import { describe, expect, it } from "vitest";
import { locations } from "@/lib/locations";
import {
  branchPathForLocationId,
  getBranchPageConfig,
  branchPageSlugs,
} from "@/lib/branch-pages";
import { buildLocalBusinessSchema } from "@/lib/entity-schema";

describe("branch landing page model", () => {
  it("keeps both canonical Tam Binh locations addressable", () => {
    expect(branchPageSlugs).toEqual(["14-tam-binh", "81b-tam-binh"]);
    expect(branchPathForLocationId("chi-nhanh-1")).toBe(
      "/chi-nhanh/14-tam-binh/",
    );
    expect(branchPathForLocationId("chi-nhanh-2")).toBe(
      "/chi-nhanh/81b-tam-binh/",
    );
    expect(getBranchPageConfig("14-tam-binh")).toMatchObject({
      locationId: "chi-nhanh-1",
      title: "Tùng Phát tại 14 Tam Bình, Thủ Đức",
    });
  });

  it("builds one stable local business entity without unverified hours", () => {
    const location = locations.find((item) => item.id === "chi-nhanh-1");
    if (!location) throw new Error("Missing branch fixture");

    expect(
      buildLocalBusinessSchema(location, "/chi-nhanh/14-tam-binh/"),
    ).toMatchObject({
      "@type": "LocalBusiness",
      "@id": "https://mdftungphat.com/chi-nhanh/14-tam-binh/#local-business",
      url: "https://mdftungphat.com/chi-nhanh/14-tam-binh/",
      hasMap: location.directionsUrl,
      address: {
        "@type": "PostalAddress",
        streetAddress: "14 Tam Bình, phường Hiệp Bình",
      },
    });
    expect(
      buildLocalBusinessSchema(location, "/chi-nhanh/14-tam-binh/"),
    ).not.toHaveProperty("openingHours");
  });
});
