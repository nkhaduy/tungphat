import { describe, expect, it } from "vitest";
import { scanSsoBundleText } from "../scripts/scan-sso-bundle";

describe("Baogia SSO staging bundle isolation", () => {
  it("flags Access and password authentication markers in production artifacts", () => {
    expect(scanSsoBundleText("Cf-Access-Jwt-Assertion ACCESS_AUD /cdn-cgi/access PBKDF2 /api/auth/login password_hash Mật khẩu").forbidden).toEqual([
      "Cf-Access-Jwt-Assertion",
      "ACCESS_AUD",
      "/cdn-cgi/access",
      "/api/auth/login",
      "PBKDF2",
      "password_hash",
      "Mật khẩu",
    ]);
  });

  it("requires SSO callback, ES256 verification, CSRF, and session revocation", () => {
    expect(scanSsoBundleText("ordinary application bundle").missing).toEqual([
      "/api/auth/sso/callback",
      "ES256",
      "X-CSRF-Token",
      "UPDATE sessions SET revoked_at",
    ]);
  });

  it("accepts a complete Baogia SSO Worker and SPA artifact set", () => {
    expect(scanSsoBundleText("/api/auth/sso/callback ES256 X-CSRF-Token UPDATE sessions SET revoked_at")).toEqual({ forbidden: [], missing: [] });
  });
});
