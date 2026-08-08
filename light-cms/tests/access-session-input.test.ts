import { describe, expect, it } from "vitest";
import { applyAccessSession, readAccessSession } from "../scripts/access-session-input";

describe("remote Access session input", () => {
  it("requires an externally supplied JWT and never accepts password credentials", () => {
    expect(() => readAccessSession({}, "ADMIN")).toThrow(/LIGHT_CMS_ADMIN_ACCESS_JWT/u);
    expect(() => readAccessSession({ LIGHT_CMS_ADMIN_ACCESS_JWT: "not-a-jwt" }, "ADMIN")).toThrow(/malformed/u);
  });

  it("forwards only the Access assertion and optional Access cookie", () => {
    const session = readAccessSession({
      LIGHT_CMS_ADMIN_ACCESS_JWT: "header.payload.signature",
      LIGHT_CMS_ADMIN_ACCESS_COOKIE: "CF_Authorization=opaque-session",
    }, "ADMIN");
    const headers = new Headers({ "Cf-Access-Authenticated-User-Email": "forged@example.com" });
    applyAccessSession(headers, session);
    expect(headers.get("Cf-Access-Jwt-Assertion")).toBe("header.payload.signature");
    expect(headers.get("Cookie")).toBe("CF_Authorization=opaque-session");
    expect(headers.get("Cf-Access-Authenticated-User-Email")).toBeNull();
  });

  it("rejects arbitrary cookie material", () => {
    expect(() => readAccessSession({
      LIGHT_CMS_EDITOR_ACCESS_JWT: "header.payload.signature",
      LIGHT_CMS_EDITOR_ACCESS_COOKIE: "session=untrusted",
    }, "EDITOR")).toThrow(/CF_Authorization/u);
  });
});
