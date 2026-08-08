import { describe, expect, it } from "vitest";
import { customerIdentity } from "../src/worker/customers";

describe("shared customer identity", () => {
  it("deduplicates case, accents and whitespace for the same name and phone", () => {
    expect(customerIdentity("  Công ty An Phú ", "0909 555 111", "Địa chỉ A"))
      .toBe(customerIdentity("CONG TY AN   PHU", "0909555111", "Địa chỉ mới"));
  });

  it("keeps different names with the same phone separate", () => {
    expect(customerIdentity("Khách hàng A", "0909 000 111", "TP.HCM"))
      .not.toBe(customerIdentity("Khách hàng B", "0909 000 111", "TP.HCM"));
  });

  it("keeps the same name with different phones separate", () => {
    expect(customerIdentity("Khách hàng A", "0909 000 111", "TP.HCM"))
      .not.toBe(customerIdentity("Khách hàng A", "0909 000 222", "TP.HCM"));
  });

  it("uses normalized name and address when the phone is empty", () => {
    expect(customerIdentity("Xưởng Mộc Việt", "", " 14 Tam Bình "))
      .toBe(customerIdentity("xuong moc viet", "", "14   Tam Bình"));
  });

  it("does not create a customer identity from empty details", () => {
    expect(customerIdentity(" ", " ", " ")).toBeNull();
  });
});
