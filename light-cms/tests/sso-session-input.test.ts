import { describe, expect, it } from "vitest";
import { applySsoSession, readSsoSession } from "../scripts/sso-session-input";

describe("remote Baogia SSO session input", () => {
  it("requires only an externally captured CMS session cookie", () => {
    expect(() => readSsoSession({})).toThrow(/LIGHT_CMS_ADMIN_SESSION_COOKIE/u);
    expect(() => readSsoSession({ LIGHT_CMS_ADMIN_SESSION_COOKIE: "tp_light_session=malformed" })).toThrow(/malformed/u);
  });

  it("forwards the CMS cookie while removing client-forged identity headers", () => {
    const session = readSsoSession({ LIGHT_CMS_ADMIN_SESSION_COOKIE: "tp_light_session=body_signature.signature" });
    const headers = new Headers({
      "Cf-Access-Jwt-Assertion": "forged.jwt.value",
      "Cf-Access-Authenticated-User-Email": "forged@example.com",
      "X-Baogia-User": "forged-user",
    });
    applySsoSession(headers, session);
    expect(headers.get("Cookie")).toBe("tp_light_session=body_signature.signature");
    expect(headers.get("Cf-Access-Jwt-Assertion")).toBeNull();
    expect(headers.get("Cf-Access-Authenticated-User-Email")).toBeNull();
    expect(headers.get("X-Baogia-User")).toBeNull();
  });

  it("rejects arbitrary cookies and additional cookie material", () => {
    expect(() => readSsoSession({ LIGHT_CMS_ADMIN_SESSION_COOKIE: "CF_Authorization=opaque" })).toThrow(/tp_light_session/u);
    expect(() => readSsoSession({ LIGHT_CMS_ADMIN_SESSION_COOKIE: "tp_light_session=body.signature; other=value" })).toThrow(/only/u);
  });
});
