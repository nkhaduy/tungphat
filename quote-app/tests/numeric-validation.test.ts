import { expect, it } from "vitest";
import { numericInputError } from "../src/client/numeric-input";

it("rejects negative and out-of-range numeric input before it can be silently changed", () => {
  expect(numericInputError("money", "-1")).toBe("Không được nhập số âm.");
  expect(numericInputError("money", "9.007.199.254.740.992")).toBe("Số tiền vượt quá giới hạn cho phép.");
  expect(numericInputError("money", "9.007.199.254.740.991")).toBe("");
  expect(numericInputError("quantity", "1.2345")).toBe("Số lượng chỉ được có tối đa 3 chữ số thập phân.");
  expect(numericInputError("quantity", "1000000001")).toBe("Số lượng vượt quá giới hạn cho phép.");
  expect(numericInputError("quantity", "1,125")).toBe("");
  expect(numericInputError("quantity", "1.2.3")).toBe("Số lượng không hợp lệ.");
  expect(numericInputError("money", "123xyz")).toBe("Số tiền không hợp lệ.");
});
