import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("material reference citation contract", () => {
  it("publishes a concise methodology and citation boundary on the existing asset", () => {
    const source = fs.readFileSync("app/tham-chieu-vat-lieu/page.tsx", "utf8");

    expect(source).toContain("Phương pháp và cách trích dẫn");
    expect(source).toContain("Dữ kiện nhà sản xuất");
    expect(source).toContain("Khuyến nghị của Tùng Phát");
    expect(source).toContain("/tham-chieu-vat-lieu/#comparison-");
  });
});
