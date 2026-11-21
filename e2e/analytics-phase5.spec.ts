import { expect, test } from "@playwright/test";

// This suite requires a local test-mode build with a non-production GA ID.
// Both external GA requests and first-party analytics are intercepted.
test.beforeEach(async ({ page, context }) => {
  await context.route(/googletagmanager\.com|google-analytics\.com|analytics\.google\.com/, (route) => route.abort());
  await context.route("**/api/analytics/track", (route) => route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }));
  await page.addInitScript(() => { window.__TP_ANALYTICS_TEST_MODE__ = true; });
});

test("queues before config, sends one page view per navigation, and tracks one quote click as two signals", async ({ page }) => {
  const sent: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/analytics/track")) {
      const data = request.postDataJSON() as { event_name?: string };
      if (data.event_name) sent.push(data.event_name);
    }
  });
  await page.goto("/gia-cong-cnc/");
  await expect.poll(() => page.evaluate(() => (window.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>)[0]))).toContain("config");
  const commands = await page.evaluate(() => (window.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>)));
  expect(commands.findIndex((entry) => entry[0] === "config")).toBeLessThan(commands.findIndex((entry) => entry[0] === "event" && entry[1] === "page_view"));
  await expect.poll(() => sent.filter((event) => event === "page_view").length).toBe(1);
  await page.evaluate(() => {
    const link = document.querySelector<HTMLAnchorElement>('a[data-track-event="request_quote"][data-track-location="cnc_hero"]');
    if (!link) throw new Error("Missing quote CTA");
    link.addEventListener("click", (event) => event.preventDefault(), { once: true });
    link.click();
  });
  await expect.poll(() => sent.filter((event) => event === "click_quote").length).toBe(1);
  await expect.poll(() => sent.filter((event) => event === "click_zalo").length).toBe(1);
  await page.evaluate(() => {
    const link = document.querySelector<HTMLAnchorElement>('a[data-track-event="request_quote"][data-track-location="site_header"]');
    if (!link) throw new Error("Missing phone quote CTA");
    link.addEventListener("click", (event) => event.preventDefault(), { once: true });
    link.click();
  });
  await expect.poll(() => sent.filter((event) => event === "click_phone").length).toBe(1);
  await expect.poll(() => sent.filter((event) => event === "click_quote").length).toBe(2);
  await page.getByRole("link", { name: "Xem ảnh xưởng và chi nhánh" }).click();
  await expect.poll(() => sent.filter((event) => event === "page_view").length).toBe(2);
});

test("opt-out before bootstrap discards pending events and sends nothing", async ({ page, context }) => {
  await context.addCookies([{ name: "tp_analytics_opt_out", value: "1", url: "http://127.0.0.1:4178/" }]);
  await page.addInitScript(() => { window.__TP_GA4_PENDING__ = [["event", "page_view", {}]]; });
  let requests = 0;
  page.on("request", (request) => { if (request.url().endsWith("/api/analytics/track")) requests++; });
  await page.goto("/gia-cong-cnc/");
  await expect.poll(() => page.evaluate(() => window.__TP_GA4_PENDING__?.length)).toBe(0);
  await page.waitForTimeout(1500);
  expect(requests).toBe(0);
  expect(await page.evaluate(() => window.dataLayer?.length ?? 0)).toBe(0);
});

test("opt-out during a session blocks later click requests and quote app target remains separate", async ({ page }) => {
  const sent: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/analytics/track")) {
      const data = request.postDataJSON() as { event_name?: string };
      if (data.event_name) sent.push(data.event_name);
    }
  });
  await page.goto("/bao-gia/");
  await expect.poll(() => sent.filter((name) => name === "page_view").length).toBe(1);
  const quoteApp = page.getByRole("link", { name: "Mở công cụ báo giá" });
  await expect(quoteApp).toHaveAttribute("href", "https://baogia.mdftungphat.com");
  await page.evaluate(() => { document.cookie = "tp_analytics_opt_out=1; path=/"; });
  await page.evaluate(() => {
    const link = document.querySelector<HTMLAnchorElement>('a[data-track-event="request_quote"][data-track-location="quote_hero"]');
    if (!link) throw new Error("Missing Zalo CTA");
    link.addEventListener("click", (event) => event.preventDefault(), { once: true });
    link.click();
  });
  await page.waitForTimeout(1500);
  expect(sent.filter((name) => name === "click_quote" || name === "click_zalo")).toEqual([]);
});
