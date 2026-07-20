import { expect, test } from "@playwright/test";

type CapturedEvent = { event_name: string; path: string; visitor_id: string; session_id: string };

test("tracks App Router pages, content and CTA once, then honors opt-out", async ({ page }) => {
  const events: CapturedEvent[] = [];
  await page.route("**/api/analytics/track", async (route) => {
    const request = route.request();
    if (request.method() === "POST") events.push(request.postDataJSON() as CapturedEvent);
    await route.fulfill({ status: 204, body: "" });
  });
  await page.addInitScript(() => {
    window.__TP_ANALYTICS_TEST_MODE__ = true;
    document.addEventListener("click", (event) => {
      const anchor = event.target instanceof Element ? event.target.closest("a") : null;
      if (anchor?.getAttribute("href")?.match(/^(tel:|https:\/\/zalo\.)/)) event.preventDefault();
    });
  });

  await page.goto("/");
  await expect.poll(() => events.filter(event => event.event_name === "page_view" && event.path === "/").length).toBe(1);

  await page.goto("/go-ghep/");
  await expect.poll(() => events.filter(event => event.event_name === "page_view" && event.path === "/go-ghep/").length).toBe(1);
  await expect.poll(() => events.filter(event => event.event_name === "product_view").length).toBe(1);

  await page.locator('a[href^="tel:"]').first().dispatchEvent("click");
  await expect.poll(() => events.filter(event => event.event_name === "click_phone").length).toBe(1);
  const first = events[0];
  expect(events.every(event => event.visitor_id === first.visitor_id)).toBe(true);
  expect(events.every(event => event.session_id === first.session_id)).toBe(true);

  await page.evaluate(() => {
    document.cookie = "tp_analytics_opt_out=1; Path=/; SameSite=Lax";
  });
  const before = events.length;
  await page.goto("/san-pham/");
  await page.waitForTimeout(250);
  expect(events).toHaveLength(before);
});
