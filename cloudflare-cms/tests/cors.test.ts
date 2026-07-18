import { describe, expect, it } from "vitest";
import { allowedOrigin, preflight } from "../src/leads/http";

const production = {
  ENVIRONMENT: "production",
  CORS_ALLOWED_ORIGINS: "https://mdftungphat.com,https://www.mdftungphat.com",
  CORS_ALLOWED_ORIGIN_SUFFIXES: ".vercel.app"
};

describe("form API CORS", () => {
  it("allows only exact production origins", () => {
    expect(allowedOrigin(new Request("https://cms.mdftungphat.com/api/contact", { headers: { Origin: "https://mdftungphat.com" } }), production)).toBe("https://mdftungphat.com");
    expect(allowedOrigin(new Request("https://cms.mdftungphat.com/api/contact", { headers: { Origin: "https://preview.vercel.app" } }), production)).toBeNull();
  });

  it("returns complete preflight headers without credentials", () => {
    const response = preflight(new Request("https://cms.mdftungphat.com/api/contact", { method: "OPTIONS", headers: { Origin: "https://www.mdftungphat.com" } }), production);
    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://www.mdftungphat.com");
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe("POST, OPTIONS");
    expect(response.headers.get("Vary")).toBe("Origin");
    expect(response.headers.has("Access-Control-Allow-Credentials")).toBe(false);
  });
});
