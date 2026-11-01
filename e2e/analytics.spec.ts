import { expect, test } from "@playwright/test";

type CapturedEvent = { event_name: string; path: string; visitor_id: string; session_id: string };

test("tracks pages, content and CTA on test builds; suppresses preview analytics and honors opt-out", async ({ page, baseURL }) => {
  const events: CapturedEvent[] = [];
  // Real Pages artifacts deliberately reject preview hosts. CI's local artifact
  // explicitly enables the build-time flag to exercise positive event delivery.
  const preview = new URL(baseURL!).hostname.endsWith(".pages.dev");
  const expectCount = async (matches: (event: CapturedEvent) => boolean) => {
    if (preview) await page.waitForTimeout(1500); // Includes the 1200 ms idle dispatch deadline.
    await expect.poll(() => events.filter(matches).length).toBe(preview ? 0 : 1);
  };
  await page.route("**/api/analytics/track", async (route) => {
    const request = route.request();
    if (request.method() === "POST") events.push(request.postDataJSON() as CapturedEvent);
    await route.fulfill({ status: 204, body: "" });
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { configurable: true, get: () => false });
    window.__TP_ANALYTICS_TEST_MODE__ = true;
    document.addEventListener("click", (event) => {
      const anchor = event.target instanceof Element ? event.target.closest("a") : null;
      if (anchor?.getAttribute("href")?.match(/^(tel:|https:\/\/zalo\.)/)) event.preventDefault();
    });
  });

  await page.goto("/");
  await expectCount(event => event.event_name === "page_view" && event.path === "/");

  await page.goto("/go-ghep/");
  await expectCount(event => event.event_name === "page_view" && event.path === "/go-ghep/");
  await expectCount(event => event.event_name === "product_view");

  await page.locator('a[href^="tel:"]').first().dispatchEvent("click");
  await expectCount(event => event.event_name === "click_phone");
  if (preview) {
    expect(events).toHaveLength(0);
  } else {
    const first = events[0];
    expect(events.every(event => event.visitor_id === first.visitor_id)).toBe(true);
    expect(events.every(event => event.session_id === first.session_id)).toBe(true);
  }

  await page.evaluate(() => {
    document.cookie = "tp_analytics_opt_out=1; Path=/; SameSite=Lax";
  });
  const before = events.length;
  await page.goto("/san-pham/");
  await page.waitForTimeout(250);
  expect(events).toHaveLength(before);
});
