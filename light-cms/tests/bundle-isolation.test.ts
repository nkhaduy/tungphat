import { describe, expect, it } from "vitest";
import { scanAccessBundleText } from "../scripts/scan-access-bundle";

describe("Access staging bundle isolation", () => {
  it("flags password authentication and PBKDF2 code in a production bundle", () => {
    expect(scanAccessBundleText("crypto.subtle.deriveBits({ name: 'PBKDF2' }); /api/auth/login tp_light_session")).toEqual([
      "PBKDF2",
      "/api/auth/login",
      "tp_light_session",
    ]);
  });

  it("accepts a bundle containing only Access JWT authentication", () => {
    expect(scanAccessBundleText("Cf-Access-Jwt-Assertion RSASSA-PKCS1-v1_5 /api/auth/session")).toEqual([]);
  });
});
