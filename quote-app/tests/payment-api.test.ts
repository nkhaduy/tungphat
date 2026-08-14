import { describe, expect, it } from "vitest";
import {
  lifecycleStatusForPayment,
  paymentStatusFromLegacyQuote,
} from "../src/shared/calculations";

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
});
