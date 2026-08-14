import { describe, expect, it } from "vitest";
import { buildVietQrUrl } from "../src/shared/vietqr";

const bank = { accountNumber: "3191158", bankCode: "ACB", holder: "CTY TNHH THUONG MAI DICH VU GO TUNG PHAT", store: "TUNG PHAT" };

describe("VietQR", () => {
  it("encodes verified account, bank and amount without forcing a quote description", () => {
    const url = new URL(buildVietQrUrl(bank, 1_624_000)!);
    expect(url.searchParams.get("acc")).toBe("3191158");
    expect(url.searchParams.get("bank")).toBe("ACB");
    expect(url.searchParams.get("amount")).toBe("1624000");
    expect(url.searchParams.has("des")).toBe(false);
    expect(url.searchParams.get("template")).toBe("compact");
    expect(url.searchParams.get("showinfo")).toBe("true");
    expect(url.searchParams.get("fullacc")).toBe("true");
    expect(url.searchParams.get("holder")).toBe("CTY TNHH THUONG MAI DICH VU GO TUNG PHAT");
    expect(url.searchParams.get("store")).toBe("TUNG PHAT");
  });

  it("hides the QR when remaining amount is zero", () => {
    expect(buildVietQrUrl(bank, 0)).toBeNull();
  });

  it("keeps the bank QR but omits the amount for quotes with old debt", () => {
    const url = new URL(buildVietQrUrl(bank, null)!);
    expect(url.searchParams.get("acc")).toBe("3191158");
    expect(url.searchParams.has("amount")).toBe(false);
  });
});
