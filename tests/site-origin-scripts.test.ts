import { describe, expect, it } from "vitest";
import { releaseSiteOrigin } from "@/scripts/lib/site-origin.mjs";

describe("release origin for output validators", () => {
  it("accepts only the existing and migrated canonical origins", () => {
    expect(releaseSiteOrigin({ NEXT_PUBLIC_SITE_ORIGIN: "https://gotungphat.com" })).toBe("https://gotungphat.com");
    expect(releaseSiteOrigin({})).toBe("https://mdftungphat.com");
    expect(() => releaseSiteOrigin({ NEXT_PUBLIC_SITE_ORIGIN: "https://preview.example" })).toThrow(/approved/i);
  });
});
