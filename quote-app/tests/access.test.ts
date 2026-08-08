import { describe, expect, it } from "vitest";
import type { SessionUser } from "../src/shared/types";
import { canAccessQuote, canArchiveQuote } from "../src/worker/quotes";

const employee: SessionUser = { id: "employee-a", username: "a", fullName: "A", phone: "0909 000 000", role: "EMPLOYEE", branchId: "b", branchCode: "TP81", branchName: "Tùng Phát 2", mustChangePassword: false };
const admin: SessionUser = { ...employee, id: "admin", role: "ADMIN" };

describe("quote authorization", () => {
  it("prevents an employee from viewing another employee's quote", () => {
    expect(canAccessQuote(employee, "employee-b")).toBe(false);
    expect(canAccessQuote(employee, "employee-a")).toBe(true);
  });

  it("allows an admin to view every quote", () => {
    expect(canAccessQuote(admin, "employee-a")).toBe(true);
    expect(canAccessQuote(admin, "employee-b")).toBe(true);
  });

  it("allows an employee to archive only their own quote", () => {
    expect(canArchiveQuote(employee, "employee-a")).toBe(true);
    expect(canArchiveQuote(employee, "employee-b")).toBe(false);
    expect(canArchiveQuote(admin, "employee-a")).toBe(false);
  });
});
