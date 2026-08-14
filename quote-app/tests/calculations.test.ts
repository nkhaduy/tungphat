import { describe, expect, it } from "vitest";
import {
  calculateLineTotal,
  calculateTotals,
  derivePaymentStatus,
  deriveQuoteStatus,
  normalizePayment,
  quantityFromMilli,
  quantityToMilli,
} from "../src/shared/calculations";

describe("quote calculations", () => {
  it("calculates each product line using integer VND", () => {
    expect(calculateLineTotal(8, 203_000)).toBe(1_624_000);
  });

  it("stores decimal quantities as fixed-point milli-units and rounds VND half-up", () => {
    expect(quantityToMilli(1.5)).toBe(1_500);
    expect(quantityFromMilli(3_125)).toBe(3.125);
    expect(calculateLineTotal(1.5, 203_001)).toBe(304_502);
    expect(calculateLineTotal(3.125, 12_345)).toBe(38_578);
    expect(() => quantityToMilli(1.2345)).toThrow(/3 chữ số/);
  });

  it("calculates subtotal, grand total, deposit and remaining amount", () => {
    const totals = calculateTotals([
      { productName: "MDF", specification: "18mm", quantity: 8, unit: "Tấm", unitPrice: 203_000, note: "" },
      { productName: "Cắt CNC", specification: "", quantity: 2, unit: "Bộ", unitPrice: 350_000, note: "" },
    ], { discount: 100_000, shippingFee: 150_000, processingFee: 50_000, vatAmount: 0, depositAmount: 500_000 });
    expect(totals).toMatchObject({ subtotal: 2_324_000, grandTotal: 2_424_000, depositAmount: 500_000, remainingAmount: 1_924_000 });
    expect(deriveQuoteStatus("DRAFT", totals, true)).toBe("DEPOSITED");
  });

  it("adds the manually entered VAT amount to the taxable base", () => {
    const totals = calculateTotals([
      { productName: "MDF", specification: "", quantity: 1, unit: "Tấm", unitPrice: 1_000_001, note: "" },
    ], { discount: 1, shippingFee: 0, processingFee: 0, vatAmount: 12_345, depositAmount: 0 });
    expect(totals.vatAmount).toBe(12_345);
    expect(totals.grandTotal).toBe(1_012_345);
  });

  it("marks a fully paid quote and rejects negative or excessive deposits", () => {
    const paid = calculateTotals([{ productName: "MDF", specification: "", quantity: 1, unit: "Tấm", unitPrice: 500_000, note: "" }], { discount: 0, shippingFee: 0, processingFee: 0, vatAmount: 0, depositAmount: 500_000 });
    expect(paid.remainingAmount).toBe(0);
    expect(deriveQuoteStatus("ISSUED", paid, true)).toBe("PAID");
    expect(() => calculateTotals([], { discount: 1, shippingFee: 0, processingFee: 0, vatAmount: 0, depositAmount: 0 })).toThrow();
    expect(() => calculateTotals([{ productName: "x", specification: "", quantity: 1, unit: "", unitPrice: 1, note: "" }], { discount: 0, shippingFee: 0, processingFee: 0, vatAmount: 0, depositAmount: 2 })).toThrow();
  });

  it("does not mark a zero-value draft as paid", () => {
    const zero = calculateTotals([{ productName: "Mẫu", specification: "", quantity: 0, unit: "", unitPrice: 0, note: "" }], { discount: 0, shippingFee: 0, processingFee: 0, vatAmount: 0, depositAmount: 0 });
    expect(deriveQuoteStatus("DRAFT", zero, false)).toBe("DRAFT");
  });

  it("keeps deposited and partial payments as distinct business states", () => {
    expect(derivePaymentStatus("UNPAID", 0, 1_000_000)).toBe("UNPAID");
    expect(derivePaymentStatus("DEPOSITED", 200_000, 1_000_000)).toBe("DEPOSITED");
    expect(derivePaymentStatus("PARTIAL", 500_000, 1_000_000)).toBe("PARTIAL");
    expect(derivePaymentStatus("PAID", 1_000_000, 1_000_000)).toBe("PAID");
  });

  it("rejects payment states that do not match the received amount", () => {
    expect(normalizePayment("UNPAID", 0, 1_000_000)).toEqual({ receivedAmount: 0, remainingAmount: 1_000_000 });
    expect(normalizePayment("PAID", 1_000_000, 1_000_000)).toEqual({ receivedAmount: 1_000_000, remainingAmount: 0 });
    expect(() => normalizePayment("PARTIAL", 0, 1_000_000)).toThrow(/lớn hơn 0/);
    expect(() => normalizePayment("DEPOSITED", 1_000_000, 1_000_000)).toThrow(/nhỏ hơn tổng/);
    expect(() => normalizePayment("PAID", 999_999, 1_000_000)).toThrow(/đủ tổng/);
  });
});
