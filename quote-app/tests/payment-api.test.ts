import { describe, expect, it } from "vitest";
import {
  lifecycleStatusForPayment,
  paymentStatusFromLegacyQuote,
} from "../src/shared/calculations";
import { quoteInputSchema } from "../src/worker/schemas";

describe("payment API compatibility rules", () => {
  it("backfills legacy payment states without changing monetary values", () => {
    expect(paymentStatusFromLegacyQuote("PAID", 1_000_000, 1_000_000)).toBe("PAID");
    expect(paymentStatusFromLegacyQuote("DEPOSITED", 200_000, 1_000_000)).toBe("DEPOSITED");
    expect(paymentStatusFromLegacyQuote("ISSUED", 0, 1_000_000)).toBe("UNPAID");
    expect(paymentStatusFromLegacyQuote("ISSUED", 1_000_000, 1_000_000)).toBe("PAID");
  });

  it("keeps legacy lifecycle status compatible with explicit payment states", () => {
    expect(lifecycleStatusForPayment("DRAFT", "UNPAID", false)).toBe("DRAFT");
    expect(lifecycleStatusForPayment("ISSUED", "UNPAID", true)).toBe("ISSUED");
    expect(lifecycleStatusForPayment("ISSUED", "DEPOSITED", true)).toBe("DEPOSITED");
    expect(lifecycleStatusForPayment("ISSUED", "PARTIAL", true)).toBe("DEPOSITED");
    expect(lifecycleStatusForPayment("ISSUED", "PAID", true)).toBe("PAID");
    expect(lifecycleStatusForPayment("CANCELLED", "PAID", true)).toBe("CANCELLED");
  });

  it("accepts a manually entered VAT amount and rejects percentage-based saves", () => {
    const input = {
      quoteDate: "2026-08-14",
      customerName: "Khách VAT",
      customerPhone: "",
      customerAddress: "",
      deliveryNote: "",
      generalNote: "",
      discount: 0,
      shippingFee: 0,
      processingFee: 0,
      vatAmount: 125_000,
      depositAmount: 0,
      items: [{ productName: "MDF", specification: "", quantity: 1, unit: "Tấm", unitPrice: 100_000, note: "" }],
    };
    expect(quoteInputSchema.safeParse({ ...input, vatRate: null }).success).toBe(true);
    expect(quoteInputSchema.safeParse(input).success).toBe(true);
    expect(quoteInputSchema.safeParse({ ...input, vatRate: 8 }).success).toBe(false);
    expect(quoteInputSchema.safeParse({ ...input, vatRate: 10 }).success).toBe(false);
  });
});
