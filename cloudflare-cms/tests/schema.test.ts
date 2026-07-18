import { describe, expect, it } from "vitest";
import { leadPayloadSchema, normalizePhone } from "../src/validation/lead-schema";

describe("lead schema", () => {
  it("normalizes Vietnamese phone numbers", () => {
    expect(normalizePhone("+84 909 259 160")).toBe("0909259160");
  });

  it("requires consent, UUID and a Turnstile token", () => {
    const parsed = leadPayloadSchema.safeParse({ full_name: "Khách thử", phone: "0909259160", consent: false, submission_id: "bad", turnstile_token: "" });
    expect(parsed.success).toBe(false);
  });
});
