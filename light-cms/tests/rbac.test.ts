import { describe, expect, it } from "vitest";
import { authorize } from "../src/worker/security/rbac";

describe("RBAC", () => {
  it("allows editor drafts but denies publishing, restore and audit", () => {
    expect(authorize("editor", "content:update")).toBe(true);
    expect(authorize("editor", "content:publish")).toBe(false);
    expect(authorize("editor", "version:restore")).toBe(false);
    expect(authorize("editor", "audit:read")).toBe(false);
  });

  it("allows admin publishing but reserves user role changes for super-admin", () => {
    expect(authorize("admin", "content:publish")).toBe(true);
    expect(authorize("admin", "users:update-role")).toBe(false);
    expect(authorize("super-admin", "users:update-role")).toBe(true);
  });
});
