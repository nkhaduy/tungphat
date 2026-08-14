import { describe, expect, it } from "vitest";
import { absoluteMediaUrl, mediaUrl } from "../lib/media";

describe("central media URL resolution", () => {
  it("preserves same-origin public paths by default", () => {
    expect(mediaUrl("/catalog/a.webp")).toBe("/catalog/a.webp");
    expect(absoluteMediaUrl("/catalog/a.webp", "https://mdftungphat.com")).toBe("https://mdftungphat.com/catalog/a.webp");
  });

  it("can resolve catalogue paths against one configured external base", () => {
    expect(mediaUrl("/catalog/a.webp", "https://media.example.com/")).toBe("https://media.example.com/catalog/a.webp");
    expect(mediaUrl("https://source.example.com/a.webp", "https://media.example.com")).toBe("https://source.example.com/a.webp");
  });
});
