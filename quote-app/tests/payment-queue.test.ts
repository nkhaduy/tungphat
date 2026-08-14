import { describe, expect, it } from "vitest";
import { PAYMENT_QUEUE_SECTIONS, groupPaymentQueue, replaceQuoteInPaymentQueue } from "../src/shared/payment";
import type { QuoteRecord } from "../src/shared/types";

function quote(paymentStatus: QuoteRecord["paymentStatus"], id: string = paymentStatus, oldDebtAmount = 0): QuoteRecord {
  return {
    id,
    quoteNumber: `TP81-${id}`,
    branchId: "branch-tp81",
    branchCode: "TP81",
    branchName: "Tùng Phát 2",
    branchAddress: "81B Tam Bình",
    branchPhone: "0909",
    createdBy: "employee-lanh",
    employeeName: "MS Lành",
    employeePhone: "0909",
    quoteDate: "2026-08-14",
    customerName: "Khách hàng",
    customerPhone: "0909",
    customerAddress: "",
    deliveryNote: "",
    generalNote: "",
    oldDebtAmount,
    status: paymentStatus === "PAID" ? "PAID" : "ISSUED",
    paymentStatus,
    totals: { subtotal: 100, discount: 0, shippingFee: 0, processingFee: 0, vatAmount: 0, grandTotal: 100, depositAmount: paymentStatus === "UNPAID" ? 0 : paymentStatus === "PAID" ? 100 : 25, remainingAmount: paymentStatus === "PAID" ? 0 : paymentStatus === "UNPAID" ? 100 : 75 },
    items: [],
    latestPdfKey: null,
    version: 1,
    createdAt: "2026-08-14T00:00:00.000Z",
    updatedAt: "2026-08-14T00:00:00.000Z",
  };
}

describe("Admin payment queue grouping", () => {
  it("keeps old-debt quotes in their own Admin group", () => {
    const queue = groupPaymentQueue([quote("UNPAID"), quote("DEPOSITED"), quote("PARTIAL"), quote("PAID"), quote("UNPAID", "old-debt", 450_000)]);
    expect(queue.unpaid).toHaveLength(1);
    expect(queue.deposited).toHaveLength(1);
    expect(queue.partial).toHaveLength(1);
    expect(queue.paid).toHaveLength(1);
    expect(queue.oldDebt.map((item) => item.id)).toEqual(["old-debt"]);
  });

  it("does not put a cancelled quote into any group", () => {
    const cancelled = quote("UNPAID", "cancelled");
    cancelled.status = "CANCELLED";
    const queue = groupPaymentQueue([cancelled]);
    expect(Object.values(queue).flat()).toHaveLength(0);
  });

  it("defines the five Admin landing sections in business order", () => {
    expect(PAYMENT_QUEUE_SECTIONS.map((section) => section.label)).toEqual([
      "Cần xử lý",
      "Đã cọc",
      "Thanh toán một phần",
      "Đã thanh toán",
      "Nợ cũ",
    ]);
  });

  it("moves an updated quote into its new payment group", () => {
    const unpaid = quote("UNPAID", "quote-1");
    const queue = groupPaymentQueue([unpaid]);
    const paid = quote("PAID", "quote-1");
    const next = replaceQuoteInPaymentQueue(queue, paid);
    expect(next.unpaid).toHaveLength(0);
    expect(next.paid.map((item) => item.id)).toEqual(["quote-1"]);
  });
});
