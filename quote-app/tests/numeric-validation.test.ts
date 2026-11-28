import { expect, it } from "vitest";
import { numericInputError, parseDiscountPercentInput } from "../src/client/numeric-input";
import { quoteItemSchema } from "../src/worker/schemas";

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

it("validates product discount percentages and limits precision to two decimals", () => {
  expect(numericInputError("percent", "20,5")).toBe("");
  expect(numericInputError("percent", "100.01")).toBe("Chiết khấu phải từ 0 đến 100%.");
  expect(numericInputError("percent", "12.345")).toBe("Chiết khấu chỉ được có tối đa 2 chữ số thập phân.");
  expect(parseDiscountPercentInput("20,5")).toBe(20.5);
  expect(parseDiscountPercentInput("")).toBe(0);
});

it("defaults older quote item payloads to zero product discount", () => {
  const item = { productName: "MDF", specification: "18mm", quantity: 2, unit: "Tấm", unitPrice: 203_000, note: "" };
  expect(quoteItemSchema.parse(item).discountPercent).toBe(0);
  expect(quoteItemSchema.parse({ ...item, discountPercent: 20 }).discountPercent).toBe(20);
  expect(quoteItemSchema.safeParse({ ...item, discountPercent: 100.01 }).success).toBe(false);
  expect(quoteItemSchema.safeParse({ ...item, discountPercent: 12.345 }).success).toBe(false);
});
