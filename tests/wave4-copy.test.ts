import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("Wave 4 public microcopy", () => {
  it("keeps brand-page copy customer-facing", () => {
    const copy = fs.readFileSync("components/BrandPage.tsx", "utf8");

    expect(copy).toContain("Gửi mã màu qua Zalo");
    expect(copy).not.toMatch(/Website không tạo bộ lọc|CMS có mã hàng thật|được publish|đang được xác minh/iu);
  });

  it("keeps catalogue detail notes customer-facing", () => {
    const copy = fs.readFileSync("app/catalogue/[supplier]/[material]/[code]/page.tsx", "utf8");

    expect(copy).toContain("Màu trên màn hình có thể khác mẫu thật");
    expect(copy).not.toContain("Media rights: UNCONFIRMED");
  });
});
