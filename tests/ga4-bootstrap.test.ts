import { describe, expect, it, vi } from "vitest";
import { ga4BootstrapScript } from "@/lib/analytics/ga4-bootstrap";
import { sendGa4Event } from "@/lib/analytics/client";

describe("GA4 initialization ordering", () => {
  it("holds early events until configuration and then sends them in order", () => {
    const browser = { dataLayer: [] as unknown[] };
    vi.stubGlobal("window", browser);
    sendGa4Event("page_view", { page_path: "/van-mdf/" });
    expect(browser.dataLayer).toHaveLength(0);
    const execute = new Function("window", "document", ga4BootstrapScript("G-ABC123"));
    execute(browser, { cookie: "" });
    const commands = browser.dataLayer.map((item) => Array.from(item as ArrayLike<unknown>));
    expect(commands.map((args) => args[0])).toEqual(["js", "config", "event"]);
    expect(commands[2]).toEqual(["event", "page_view", { page_path: "/van-mdf/" }]);
    vi.unstubAllGlobals();
  });
  it("does not configure or flush queued events after opt-out", () => {
    const browser = { dataLayer: [], __TP_GA4_PENDING__: [["event", "page_view", {}]] };
    const execute = new Function("window", "document", ga4BootstrapScript("G-ABC123"));
    execute(browser, { cookie: "tp_analytics_opt_out=1" });
    expect(browser.dataLayer).toHaveLength(0);
    expect(browser.__TP_GA4_PENDING__).toEqual([]);
  });
});
