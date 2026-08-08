import { describe, expect, it } from "vitest";
import { safeSsoReturn } from "../src/client/sso-return";

describe("Baogia SSO return target", () => {
  it("accepts only the Light CMS authorization continuation", () => {
    expect(safeSsoReturn("?returnTo=%2Fapi%2Fauth%2Fsso%2Fcms%3Fstate%3DabcdefghijklmnopqrstuvwxyzABCDEF123456"))
      .toBe("/api/auth/sso/cms?state=abcdefghijklmnopqrstuvwxyzABCDEF123456");
  });

  it("rejects external, protocol-relative, and unrelated local targets", () => {
    expect(safeSsoReturn("?returnTo=https%3A%2F%2Fevil.example")).toBeNull();
    expect(safeSsoReturn("?returnTo=%2F%2Fevil.example")).toBeNull();
    expect(safeSsoReturn("?returnTo=%2Fapi%2Fadmin%2Fusers")).toBeNull();
    expect(safeSsoReturn("?returnTo=%2Fapi%2Fauth%2Fsso%2Fcms%3Fstate%3Dshort")).toBeNull();
  });
});
