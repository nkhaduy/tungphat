import { describe, expect, it, vi } from "vitest";
import { fetchAuditResource } from "@/lib/http-audit";

describe("audited HTTP requests", () => {
  it("adds a deadline and keeps the headers used by production checks", async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return new Response("ok", { status: 200, headers: { "content-type": "text/plain", "permissions-policy": "camera=()" } });
    });
    const result = await fetchAuditResource("https://example.com", "AuditBot/1.0", fetcher as typeof fetch, 1000);
    expect(result).toMatchObject({ status: 200, body: "ok", headers: { "content-type": "text/plain", "permissions-policy": "camera=()" } });
  });
});
