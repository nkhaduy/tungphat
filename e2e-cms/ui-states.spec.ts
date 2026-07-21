import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const csrf = "ui-test-csrf";
const sessionId = "123e4567-e89b-42d3-a456-426614174123";

async function stubDecap(page: Page) {
  await page.addInitScript(() => {
    const browserWindow = window as unknown as Window & { CMS: Record<string, unknown> };
    browserWindow.CMS = {
      init() {
        const root = document.querySelector("#nc-root");
        const node = document.createElement("main");
        node.dataset.testid = "decap-mounted";
        node.textContent = "Decap CMS";
        root?.appendChild(node);
      },
      registerEventListener() {},
      registerPreviewStyle() {},
      registerPreviewTemplate() {},
    };
  });
  await page.route("https://unpkg.com/decap-cms@3.14.1/dist/decap-cms.js", route => route.abort());
}

async function stubWideDecapEditor(page: Page) {
  await page.addInitScript(() => {
    const browserWindow = window as unknown as Window & { CMS: Record<string, unknown> };
    browserWindow.CMS = {
      init() {
        const root = document.querySelector("#nc-root");
        const node = document.createElement("div");
        node.dataset.testid = "wide-decap-editor";
        node.style.cssText = "position:absolute;width:800px;height:700px";
        node.textContent = "Decap editor";
        root?.appendChild(node);
      },
      registerEventListener() {},
      registerPreviewStyle() {},
      registerPreviewTemplate() {},
    };
  });
  await page.route("https://unpkg.com/decap-cms@3.14.1/dist/decap-cms.js", route => route.abort());
}

test("login remains readable and contained at required breakpoints", async ({ page }) => {
  await stubDecap(page);
  await page.route("**/api/auth/session", route => route.fulfill({ status: 401, json: { authenticated: false } }));

  for (const width of [375, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 600 ? 812 : 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Tùng Phát CMS" })).toBeVisible();
    await expect(page.getByAltText("Tùng Phát — Wood & CNC Solutions")).toBeVisible();
    const layout = await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      cardWidth: document.querySelector(".login-card")?.getBoundingClientRect().width || 0,
    }));
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewport);
    expect(layout.cardWidth).toBeLessThanOrEqual(layout.viewport - 24);
  }
  const accessibility = await new AxeBuilder({ page }).include("#login-view").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(accessibility.violations, accessibility.violations.map(item => `${item.id}: ${item.help}`).join("\n")).toEqual([]);
});

test("analytics tabs, states, tables and journey detail stay usable", async ({ page }) => {
  await stubDecap(page);
  let failContent = false;
  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, user: { username: "nkhaduy" }, csrf, expiresAt: 1_900_000_000 } }));
  await page.route("**/api/gateway/status", route => route.fulfill({ json: { ok: true, user: { username: "nkhaduy" } } }));
  await page.route("**/api/admin/analytics/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/overview")) {
      await route.fulfill({ json: { metrics: { visitors: 12, sessions: 17, pageviews: 42, zalo: 3, maps: 2, phone: 4, leads: 7, conversionRate: .41, active: 2 }, comparison: { visitors: 9, sessions: -2, pageviews: 5, zalo: 0, maps: 100, phone: -8, leads: 4, conversionRate: 6 }, activeDefinition: "Hoạt động trong 30 phút gần nhất", updatedAt: 1_800_000_000 } });
    } else if (path.endsWith("/timeseries")) {
      await route.fulfill({ json: { granularity: "hour", rows: [{ bucket: "08:00", pageviews: 12 }, { bucket: "10:00", pageviews: 30 }] } });
    } else if (path.endsWith("/landing-pages")) {
      await route.fulfill({ json: { rows: [{ title: "Tùng Phát", path: "/", sessions: 17, leads: 7 }] } });
    } else if (path.endsWith("/sources")) {
      await route.fulfill({ json: { rows: [{ source: "google", medium: "organic", visitors: 12, sessions: 17, pageviews: 42, engaged_sessions: 9, zalo: 3, maps: 2, phone: 4, leads: 7 }] } });
    } else if (path.includes("/search-console/")) {
      await route.fulfill({ json: { status: "connected", rows: [], lastSync: 1_800_000_000 } });
    } else if (path.endsWith("/content")) {
      await new Promise(resolve => setTimeout(resolve, 120));
      if (failContent) await route.fulfill({ status: 503, json: { code: "analytics_unavailable" } });
      else await route.fulfill({ json: { rows: [], assistedDefinition: "Nội dung được xem trước hành động liên hệ trong cùng phiên." } });
    } else if (path.endsWith("/conversions")) {
      await route.fulfill({ json: { rows: [] } });
    } else if (path.endsWith(`/journeys/${sessionId}`)) {
      await route.fulfill({ json: { session: { source: "google", medium: "organic", device_category: "mobile", landing_path: "/" }, events: [{ event_name: "page_view", occurred_at: 1_800_000_000, path: "/" }] } });
    } else if (path.endsWith("/journeys")) {
      await route.fulfill({ json: { rows: [{ session_id: sessionId, started_at: 1_800_000_000, last_activity_at: 1_800_000_090, source: "google", medium: "organic", landing_path: "/", device_category: "mobile", pageviews: 2, converted: 1 }] } });
    } else if (path.endsWith("/status")) {
      await route.fulfill({ json: { firstParty: "connected", database: "connected", ga4: "configured", ga4ActiveUsers: null, searchConsole: "connected", latestEvent: 1_800_000_000, retention: { rawDays: 90 } } });
    } else {
      await route.fulfill({ json: { rows: [] } });
    }
  });

  await page.goto("/?view=analytics");
  await expect(page.getByText("Lượt nhấn chỉ đường")).toBeVisible();

  await page.getByRole("tab", { name: "Nguồn truy cập" }).click();
  await expect(page.getByRole("region", { name: /Nguồn truy cập — có thể cuộn ngang/ })).toBeVisible();

  await page.getByRole("tab", { name: "SEO và từ khóa" }).click();
  await expect(page.getByText("Chưa có dữ liệu trong khoảng thời gian này.").first()).toBeVisible();

  failContent = true;
  await page.getByRole("tab", { name: "Nội dung" }).click();
  await expect(page.locator(".skeleton-grid")).toBeVisible();
  await expect(page.getByText("Dữ liệu tạm thời chưa sẵn sàng.")).toBeVisible();
  failContent = false;
  await page.getByRole("button", { name: "Thử lại" }).click();
  await expect(page.getByText("Chưa có dữ liệu trong khoảng thời gian này.")).toBeVisible();

  await page.getByRole("tab", { name: "Hành trình" }).click();
  await page.getByRole("button", { name: "123E…4123" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Đóng" }).click();

  await page.getByRole("tab", { name: "Cấu hình" }).click();
  await expect(page.getByText("Theo dõi website", { exact: true })).toBeVisible();

  await page.getByRole("tab", { name: "Tổng quan" }).focus();
  await page.getByRole("tab", { name: "Tổng quan" }).press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Nguồn truy cập" })).toHaveAttribute("aria-selected", "true");

  for (const width of [375, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 600 ? 812 : 900 });
    await page.getByRole("tab", { name: "Tổng quan" }).click();
    await expect(page.getByText("Lượt nhấn chỉ đường")).toBeVisible();
    const layout = await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      headerWidth: document.querySelector(".admin-header")?.getBoundingClientRect().width || 0,
      smallestShellControl: Math.min(...[...document.querySelectorAll(".admin-header button, #analytics-view button")]
        .filter(element => element.getBoundingClientRect().width > 0)
        .map(element => element.getBoundingClientRect().height)),
    }));
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewport);
    expect(layout.headerWidth).toBeLessThanOrEqual(layout.viewport);
    expect(layout.smallestShellControl).toBeGreaterThanOrEqual(44);
  }
  const accessibility = await new AxeBuilder({ page }).include(".admin-header").include("#analytics-view").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(accessibility.violations, accessibility.violations.map(item => `${item.id}: ${item.help}`).join("\n")).toEqual([]);
});

test("wide Decap editor scrolls inside its shell instead of widening mobile page", async ({ page }) => {
  await stubWideDecapEditor(page);
  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, user: { username: "nkhaduy" }, csrf, expiresAt: 1_900_000_000 } }));
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/?view=content");
  await expect(page.getByTestId("wide-decap-editor")).toBeVisible();
  const layout = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    shellClientWidth: document.querySelector("#content-view")?.clientWidth || 0,
    shellScrollWidth: document.querySelector("#content-view")?.scrollWidth || 0,
  }));
  expect(layout.documentWidth).toBe(layout.viewport);
  expect(layout.shellClientWidth).toBe(layout.viewport);
  expect(layout.shellScrollWidth).toBeGreaterThanOrEqual(800);
});
