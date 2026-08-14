import { describe, expect, it } from "vitest";
import { paymentActionAmount, paymentActionsInitiallyVisible, paymentReceivedLabel, shouldPromptForPaymentAmount, shouldShowPaymentQr } from "../src/shared/payment";

describe("payment action amounts", () => {
  it("fills the full total for the paid action", () => {
    expect(paymentActionAmount("PAID", 250_000, 30_000)).toBe(250_000);
  });

  it("keeps the entered received amount for deposit and partial actions", () => {
    expect(paymentActionAmount("DEPOSITED", 250_000, 30_000)).toBe(30_000);
    expect(paymentActionAmount("PARTIAL", 250_000, 30_000)).toBe(30_000);
    expect(paymentActionAmount("UNPAID", 250_000, 30_000)).toBe(0);
  });

  it("uses payment-aware labels and hides QR only after full payment", () => {
    expect(paymentReceivedLabel("DEPOSITED")).toBe("Tiền đã cọc");
    expect(paymentReceivedLabel("PARTIAL")).toBe("Đã nhận");
    expect(shouldShowPaymentQr("PARTIAL", 70_000)).toBe(true);
    expect(shouldShowPaymentQr("PAID", 0)).toBe(false);
    expect(shouldShowPaymentQr("PAID", 0, 450_000)).toBe(true);
  });

  it("asks for a corrected deposit when a fully paid order is edited", () => {
    expect(shouldPromptForPaymentAmount("DEPOSITED", 1_000_000, 1_000_000)).toBe(true);
    expect(shouldPromptForPaymentAmount("DEPOSITED", 200_000, 1_000_000)).toBe(false);
  });

  it("only opens the three actions automatically for unprocessed orders", () => {
    expect(paymentActionsInitiallyVisible("UNPAID")).toBe(true);
    expect(paymentActionsInitiallyVisible("DEPOSITED")).toBe(false);
    expect(paymentActionsInitiallyVisible("PARTIAL")).toBe(false);
    expect(paymentActionsInitiallyVisible("PAID")).toBe(false);
  });
});
