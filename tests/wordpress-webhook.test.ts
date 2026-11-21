import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { acceptWordPressWebhook } from "@/lib/wordpress/webhook";
const secret = "x".repeat(32);
const body = JSON.stringify({ id: "event-123", type: "post.changed" });
const timestamp = "1790000000";
const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
const make = () => ({ body, timestamp, signature, secret, now: Number(timestamp) * 1000, store: { claim: vi.fn().mockResolvedValue(true) } });
describe("WordPress webhook admission", () => {
  it("accepts authenticated events and deduplicates with an atomic store", async () => {
    const input = make();
    expect(await acceptWordPressWebhook(input)).toEqual({ status: "accepted", eventId: "event-123" });
    expect(input.store.claim).toHaveBeenCalledWith("event-123", expect.any(Number));
    input.store.claim.mockResolvedValue(false);
    expect(await acceptWordPressWebhook(input)).toEqual({ status: "duplicate", eventId: "event-123" });
  });
  it("rejects tampering, expired timestamps and short secrets before touching storage", async () => {
    for (const mutation of [{ body: body + " " }, { now: Number(timestamp) * 1000 + 301000 }, { secret: "short" }]) {
      const input = { ...make(), ...mutation };
      await expect(acceptWordPressWebhook(input)).rejects.toThrow();
      expect(input.store.claim).not.toHaveBeenCalled();
    }
  });
  it("fails closed when storage is unavailable", async () => {
    const input = make(); input.store.claim.mockRejectedValue(new Error("offline"));
    await expect(acceptWordPressWebhook(input)).rejects.toThrow("offline");
  });
});
