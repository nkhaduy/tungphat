import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it("ends a stalled save without sending another request", async () => {
  const { apiWithTimeout } = await import("../src/client/api");
  vi.useFakeTimers();
  let calls = 0;
  vi.stubGlobal("fetch", (_path: string, init: RequestInit) => {
    calls += 1;
    return new Promise((_resolve, reject: (error: Error) => void) => {
      init.signal?.addEventListener("abort", () => reject(new Error("aborted")));
    });
  });
  const pending = apiWithTimeout("/api/quotes", { method: "POST", body: "{}" }, 100);
  const outcome = expect(pending).rejects.toThrow("aborted");
  await vi.advanceTimersByTimeAsync(100);
  await outcome;
  expect(calls).toBe(1);
});
