import { describe, expect, it } from "vitest";
import { buildVerifiedMapIdentity } from "@/lib/entity-schema";

describe("verified map entity schema", () => {
  it("extracts a public Google Place ID and preserves the canonical map edge", () => {
    expect(buildVerifiedMapIdentity("https://www.google.com/maps/place/?q=place_id:ChIJ123")).toEqual({
      sameAs: ["https://www.google.com/maps/place/?q=place_id:ChIJ123"],
      identifier: {
        "@type": "PropertyValue",
        propertyID: "Google Place ID",
        value: "ChIJ123",
      },
    });
  });

  it("does not emit an identifier for an unrelated directions URL", () => {
    expect(buildVerifiedMapIdentity("https://maps.example/directions")).toEqual({
      sameAs: ["https://maps.example/directions"],
      identifier: null,
    });
  });
});
