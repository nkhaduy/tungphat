import { describe, expect, it } from "vitest";
import { authenticateGbpAdmin } from "../functions/_shared/gbp-auth";

describe("Pages GBP admin authentication", () => {
  it("delegates session verification to the Light CMS Worker without exposing its session secret", async () => {
    const calls: Request[] = [];
    const fetcher = { fetch: async (request: Request) => {
      calls.push(request);
      return Response.json({ ok: true, data: { user: { id: "user-1", email: "admin@example.com", name: "Admin", role: "super-admin" }, csrf: "csrf-token", expiresAt: 2_000_000_000 } });
    } } as unknown as Fetcher;
    const session = await authenticateGbpAdmin(new Request("https://cms.mdftungphat.com/api/admin/gbp", { headers: { Cookie: "tp_light_session=signed" } }), fetcher);
    expect(session).toMatchObject({ userId: "user-1", csrf: "csrf-token", role: "super-admin" });
    expect(new URL(calls[0]!.url).pathname).toBe("/api/auth/session");
    expect(calls[0]!.headers.get("Cookie")).toBe("tp_light_session=signed");
  });

  it("returns null when the Light CMS session is not valid", async () => {
    const fetcher = { fetch: async () => Response.json({ ok: false }, { status: 401 }) } as unknown as Fetcher;
    await expect(authenticateGbpAdmin(new Request("https://cms.mdftungphat.com/api/admin/gbp"), fetcher)).resolves.toBeNull();
  });
});
