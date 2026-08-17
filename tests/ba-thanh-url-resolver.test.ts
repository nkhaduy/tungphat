import { describe, expect, it } from "vitest";
import {
  baThanhCandidateProductUrls,
  recognizeBaThanhDetail,
} from "@/lib/catalog/ba-thanh-source";

describe("Ba Thanh candidate product URL resolver", () => {
  it("normalizes standard and alternate BT formatting", () => {
    expect(baThanhCandidateProductUrls("BT 182")).toContain("https://bathanh.com.vn/bt182");
    expect(baThanhCandidateProductUrls("BT-182")).toContain("https://bathanh.com.vn/bt182");
  });

  it("builds WAY routes for any discovered alphabetic family", () => {
    expect(baThanhCandidateProductUrls("P2061", ["P", "F", "W", "X"]))
      .toContain("https://bathanh.com.vn/way-p2061");
    expect(baThanhCandidateProductUrls("F3292", ["P", "F", "W", "X"]))
      .toContain("https://bathanh.com.vn/way-f3292");
    expect(baThanhCandidateProductUrls("X1000", ["P", "F", "W", "X"]))
      .toContain("https://bathanh.com.vn/way-x1000");
  });

  it("accepts only pages whose heading matches the expected derived code", () => {
    const valid = recognizeBaThanhDetail(`
      <main><h1>BT 182 - WOOD GRAINS</h1>
      <a href="/wp-content/uploads/BT-182.jpg"><img src="/wp-content/uploads/BT-182-300x300.jpg" srcset="/wp-content/uploads/BT-182-300x300.jpg 300w, /wp-content/uploads/BT-182.jpg 2400w"></a>
      MELAMINE</main>
    `, { expectedCode: "BT182", sourceUrl: "https://bathanh.com.vn/bt182" });
    const wrong = recognizeBaThanhDetail("<main><h1>BT 181</h1>MELAMINE</main>", {
      expectedCode: "BT182",
      sourceUrl: "https://bathanh.com.vn/bt182",
    });

    expect(valid.accepted).toBe(true);
    expect(valid.images).toEqual(["https://bathanh.com.vn/wp-content/uploads/BT-182.jpg"]);
    expect(wrong.accepted).toBe(false);
  });
});
