import { afterEach, expect, it, vi } from "vitest";
vi.mock("@/lib/analytics/client", () => ({ sendAnalyticsEvent: vi.fn() }));
import { sendAnalyticsEvent } from "@/lib/analytics/client";
import { trackEvent } from "@/lib/analytics";
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
it("records phone and quote intent as separate signals from one phone CTA", () => {
  vi.stubGlobal("window", { location: { pathname: "/" } });
  vi.stubGlobal("document", { cookie: "" });
  trackEvent("request_quote", { channel: "phone", location: "site_header" });
  expect(vi.mocked(sendAnalyticsEvent).mock.calls.map(([event]) => event)).toEqual(["click_quote", "click_phone"]);
});
