import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

/** Implementations MUST atomically insert only if absent in durable storage.
 * expiresAtMs must be retained until at least that instant across instances. */
export interface WebhookClaimStore {
  claim(eventId: string, expiresAtMs: number): Promise<boolean>;
}

const eventSchema = z.object({ id: z.string().regex(/^[a-zA-Z0-9_-]{8,128}$/), type: z.literal("post.changed") });
const WINDOW_MS = 5 * 60 * 1000;

/** A protocol primitive only: no endpoint, build trigger or durable store is installed. */
export async function acceptWordPressWebhook(input: {
  body: string;
  timestamp: string;
  signature: string;
  secret: string;
  now?: number;
  store: WebhookClaimStore;
}): Promise<{ status: "accepted" | "duplicate"; eventId: string }> {
  const now = input.now ?? Date.now();
  if (Buffer.byteLength(input.secret, "utf8") < 32 || Buffer.byteLength(input.body, "utf8") > 256 * 1024) throw new Error("Invalid webhook configuration or body size");
  if (!/^\d{10}$/.test(input.timestamp) || !Number.isFinite(now)) throw new Error("Invalid webhook timestamp");
  const timestampMs = Number(input.timestamp) * 1000;
  if (Math.abs(now - timestampMs) > WINDOW_MS) throw new Error("Expired webhook timestamp");
  if (!/^[0-9a-f]{64}$/i.test(input.signature)) throw new Error("Invalid webhook signature");
  const expected = createHmac("sha256", input.secret).update(`${input.timestamp}.${input.body}`, "utf8").digest();
  const supplied = Buffer.from(input.signature, "hex");
  if (!timingSafeEqual(expected, supplied)) throw new Error("Invalid webhook signature");
  const event = eventSchema.parse(JSON.parse(input.body));
  const claimed = await input.store.claim(event.id, Math.max(now, timestampMs) + WINDOW_MS + 60_000);
  return { status: claimed ? "accepted" : "duplicate", eventId: event.id };
}
