import { describe, expect, it } from "vitest";
import { leadPayloadSchema, normalizePhone } from "@/lib/lead-schema";

const validPayload = {
  submission_id: "1c8ed22e-e682-4c27-9ef4-a2d9575e3fe4",
  full_name: "Nguyễn Văn A",
  phone: "0909 259 160",
  email: "customer@example.com",
  company: "Xưởng thử nghiệm",
  city: "TP.HCM",
  product: "MDF chống ẩm mã thử nghiệm",
  material: "Ván MDF",
  thickness: "18 mm",
  dimensions: "1220 x 2440 mm",
  quantity: "10 tấm",
  cnc_requirement: "Cắt theo danh sách kích thước",
  message: "Vui lòng liên hệ để xác nhận quy cách.",
  source_url: "https://mdftungphat.com/bao-gia",
  referrer: "https://www.google.com/",
  utm_source: "google",
  utm_medium: "organic",
  utm_campaign: "",
  consent: true,
  website: "",
  turnstile_token: "test-token"
};

describe("leadPayloadSchema", () => {
  it("chuẩn hóa số điện thoại Việt Nam", () => {
    expect(normalizePhone("+84 909 259 160")).toBe("0909259160");
    expect(normalizePhone("84-909-259-160")).toBe("0909259160");
  });

  it("chấp nhận payload hợp lệ và loại field status do client tự gửi", () => {
    const parsed = leadPayloadSchema.parse({ ...validPayload, status: "won" });
    expect(parsed.phone).toBe("0909259160");
    expect(parsed).not.toHaveProperty("status");
  });

  it("loại control characters và giới hạn độ dài", () => {
    const parsed = leadPayloadSchema.parse({ ...validPayload, full_name: "Nguyễn\u0000 Văn A" });
    expect(parsed.full_name).toBe("Nguyễn Văn A");
    expect(() => leadPayloadSchema.parse({ ...validPayload, message: "a".repeat(2001) })).toThrow();
  });

  it("từ chối thiếu consent, token hoặc số điện thoại sai", () => {
    expect(leadPayloadSchema.safeParse({ ...validPayload, consent: false }).success).toBe(false);
    expect(leadPayloadSchema.safeParse({ ...validPayload, turnstile_token: "" }).success).toBe(false);
    expect(leadPayloadSchema.safeParse({ ...validPayload, phone: "123" }).success).toBe(false);
  });
});
