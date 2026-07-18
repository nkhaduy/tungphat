import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "@/functions/_lib/turnstile";

afterEach(() => vi.unstubAllGlobals());

function siteverifyResult(body: object, status = 200) {
  vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }))));
}

describe("verifyTurnstile", () => {
  it("chấp nhận hostname và action production đúng", async () => {
    siteverifyResult({ success: true, hostname: "mdftungphat.com", action: "turnstile-spin-v1" });
    await expect(verifyTurnstile("token", "secret", "127.0.0.1", "mdftungphat.com")).resolves.toMatchObject({ ok: true });
  });

  it("từ chối action, hostname hoặc token lỗi", async () => {
    siteverifyResult({ success: true, hostname: "attacker.example", action: "wrong-action" });
    await expect(verifyTurnstile("token", "secret", "127.0.0.1", "mdftungphat.com")).resolves.toMatchObject({ ok: false, reason: "invalid" });
  });

  it("chỉ chấp nhận metadata test key trên localhost", async () => {
    siteverifyResult({ success: true, hostname: "example.com", metadata: { result_with_testing_key: true } });
    await expect(verifyTurnstile("token", "secret", "127.0.0.1", "localhost")).resolves.toMatchObject({ ok: true });
    await expect(verifyTurnstile("token", "secret", "127.0.0.1", "mdftungphat.com")).resolves.toMatchObject({ ok: false });
  });

  it("phân biệt lỗi upstream để API có thể trả retryable status", async () => {
    siteverifyResult({}, 502);
    await expect(verifyTurnstile("token", "secret", "127.0.0.1", "mdftungphat.com")).resolves.toMatchObject({ ok: false, reason: "upstream" });
  });

  it("fail closed khi Siteverify không khả dụng", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    await expect(verifyTurnstile("token", "secret", "127.0.0.1", "mdftungphat.com")).resolves.toMatchObject({ ok: false, reason: "unavailable" });
  });
});
