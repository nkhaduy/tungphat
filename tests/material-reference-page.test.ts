import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("material reference citation contract", () => {
  it("publishes a concise methodology and citation boundary on the existing asset", () => {
    const source = fs.readFileSync("app/tham-chieu-vat-lieu/page.tsx", "utf8");

    expect(source).toContain("Đọc bảng thế nào trước khi gửi yêu cầu?");
    expect(source).toContain("Đã có trong bảng:");
    expect(source).toContain("Nên hỏi thêm:");
    expect(source).toContain("Nguồn tham khảo:");
    expect(source).toContain("id={`comparison-${row.id}`}");
    expect(source).toContain("href={`#comparison-${row.id}`}");
    expect(source).not.toContain("JSON có cả bản ghi nguồn");
  });
});
