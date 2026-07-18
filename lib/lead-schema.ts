import { z } from "zod";

const cleanText = (max: number, required = false) => {
  const schema = z.string().transform((value) => value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim()).pipe(z.string().max(max));
  return required ? schema.pipe(z.string().min(2)) : schema.default("");
};

export const leadPayloadSchema = z.object({
  submission_id: z.string().uuid(),
  full_name: cleanText(100, true),
  phone: cleanText(30, true).transform(normalizePhone).pipe(z.string().regex(/^0\d{8,10}$/, "Số điện thoại không hợp lệ")),
  email: z.union([z.literal(""), z.string().trim().email().max(160)]).default(""),
  company: cleanText(160),
  city: cleanText(100),
  product: cleanText(160),
  material: cleanText(120),
  thickness: cleanText(80),
  dimensions: cleanText(160),
  quantity: cleanText(100),
  cnc_requirement: cleanText(800),
  message: cleanText(2000),
  source_url: z.string().max(500).default(""),
  referrer: z.string().max(500).default(""),
  utm_source: cleanText(100),
  utm_medium: cleanText(100),
  utm_campaign: cleanText(120),
  consent: z.literal(true),
  website: z.string().max(200).default(""),
  turnstile_token: z.string().min(1).max(2048)
});

export type LeadPayload = z.infer<typeof leadPayloadSchema>;

export function normalizePhone(input: string) {
  const compact = input.replace(/[^\d+]/g, "");
  if (compact.startsWith("+84")) return `0${compact.slice(3)}`;
  if (compact.startsWith("84") && compact.length >= 10) return `0${compact.slice(2)}`;
  return compact;
}
