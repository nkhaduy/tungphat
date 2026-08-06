import { describe, expect, it } from "vitest";
import {
  classifyDuplication,
  shingleSimilarity,
} from "@/scripts/thanh-thuy/duplication-audit";

describe("Thanh Thuy duplicate-content audit", () => {
  it("flags copied marketing paragraphs even when punctuation and accents differ", () => {
    const source =
      "Tông trắng giúp không gian trở nên sáng hơn, sạch sẽ và dễ kết hợp với nhiều vật liệu khác.";
    const generated =
      "Tong trang giup khong gian tro nen sang hon sach se va de ket hop voi nhieu vat lieu khac";

    expect(shingleSimilarity(source, generated)).toBe(1);
    expect(classifyDuplication(source, generated)).toBe("TOO_SIMILAR");
  });

  it("does not flag original Tùng Phát service guidance that only shares a product code", () => {
    const source =
      "Mã sản phẩm LP 101/104G. Kích thước 1220 x 2440 x 0.7mm. Màu White.";
    const generated =
      "Khi hỏi hàng tại Tùng Phát, khách nên gửi mã LP 101/104G để kiểm tra mẫu thực tế, tồn kho và phương án dán cạnh trước khi đặt.";

    expect(shingleSimilarity(source, generated)).toBeLessThan(0.2);
    expect(classifyDuplication(source, generated)).toBe("ORIGINAL_ENOUGH");
  });

  it("treats empty source marketing text as not auditable instead of copied", () => {
    expect(classifyDuplication("", "Nội dung do Tùng Phát biên soạn.")).toBe(
      "SOURCE_EMPTY",
    );
  });
});
