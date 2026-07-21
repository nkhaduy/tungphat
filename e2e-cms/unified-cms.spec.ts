import { expect, test } from "@playwright/test";

test("login, Decap, Analytics, tab persistence and shared logout", async ({ page }) => {
  let authenticated = false;
  const csrf = crypto.randomUUID();
  const enteredPassword = crypto.randomUUID();
  const externalAuthRequests: string[] = [];

  await page.addInitScript(() => {
    const browserWindow = window as unknown as Window & { CMS: Record<string, unknown> };
    browserWindow.CMS = {
      init() {
        const root = document.querySelector("#nc-root");
        const node = document.createElement("div");
        node.dataset.testid = "decap-mounted";
        node.textContent = "Decap CMS";
        root?.appendChild(node);
      },
      registerEventListener() {},
      registerPreviewStyle() {},
      registerPreviewTemplate() {},
    };
  });
  await page.route("https://unpkg.com/decap-cms@3.14.1/dist/decap-cms.js", (route) => route.abort());

  page.on("request", (request) => {
    if (/github\.com\/login\/oauth|\/callback(?:\?|$)|\/auth(?:\?|$)/.test(request.url())) externalAuthRequests.push(request.url());
  });

  await page.route("**/api/auth/session", (route) => authenticated
    ? route.fulfill({ json: { authenticated: true, user: { username: "nkhaduy" }, csrf, expiresAt: 1_900_000_000 } })
    : route.fulfill({ status: 401, json: { authenticated: false } }));
  await page.route("**/api/auth/csrf", (route) => route.fulfill({ json: { ok: true, csrf } }));
  await page.route("**/api/auth/login", async (route) => {
    const body = route.request().postDataJSON() as Record<string, string>;
    expect(body).toEqual({ username: "nkhaduy", password: enteredPassword, csrf });
    authenticated = true;
    await route.fulfill({ json: { ok: true, user: { username: "nkhaduy" }, csrf, expiresAt: 1_900_000_000 } });
  });
  await page.route("**/api/auth/logout", async (route) => {
    expect(route.request().headers()["x-csrf-token"]).toBe(csrf);
    authenticated = false;
    await route.fulfill({ json: { ok: true } });
  });
  await page.route("**/api/gateway/status", (route) => route.fulfill({ json: { ok: true, user: { username: "nkhaduy" } } }));
  await page.route("**/git-gateway/github/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes("/branches/main")) {
      await route.fulfill({ json: { name: "main", commit: { sha: "a".repeat(40), commit: { tree: { sha: "b".repeat(40) } } } } });
      return;
    }
    if (url.pathname.includes("/git/trees/")) {
      await route.fulfill({ json: { sha: "b".repeat(40), tree: [], truncated: false } });
      return;
    }
    await route.fulfill({ status: 404, json: { message: "Not Found" } });
  });
  await page.route("**/api/admin/analytics/**", async (route) => {
    expect(route.request().headers().cookie || "").not.toContain("tp_cms_admin");
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/overview")) {
      await route.fulfill({ json: { metrics: { visitors: 1, sessions: 1, pageviews: 1, zalo: 0, phone: 0, leads: 0, conversionRate: 0, active: 1 }, comparison: { visitors: 0, sessions: 0, pageviews: 0, zalo: 0, phone: 0, leads: 0, conversionRate: 0 }, activeDefinition: "Hoạt động trong 30 phút gần nhất", updatedAt: 1_800_000_000 } });
    } else if (path.endsWith("/timeseries")) {
      await route.fulfill({ json: { granularity: "hour", rows: [] } });
    } else if (path.endsWith("/landing-pages")) {
      await route.fulfill({ json: { rows: [] } });
    } else {
      await route.fulfill({ json: { status: "not_configured", rows: [] } });
    }
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Đăng nhập quản trị" })).toBeVisible();
  await expect(page.getByText("Login with GitHub")).toHaveCount(0);
  await page.getByLabel("Tên đăng nhập").fill("nkhaduy");
  await page.getByLabel("Mật khẩu").fill(enteredPassword);
  await page.getByRole("button", { name: "Đăng nhập" }).click();

  await expect(page.getByRole("banner").getByText("Tùng Phát CMS")).toBeVisible();
  await expect(page.getByRole("button", { name: "Quản lý nội dung" })).toHaveClass(/active/);
  await expect(page.locator("#nc-root")).not.toBeEmpty();
  const decapNodeCount = await page.locator("#nc-root *").count();
  expect(decapNodeCount).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Thống kê" }).click();
  await expect(page).toHaveURL(/view=analytics/);
  await expect(page.getByRole("button", { name: "Tổng quan" })).toBeVisible();
  await expect(page.getByText("Người truy cập")).toBeVisible();
  await expect(page.locator("#analytics-view iframe")).toHaveCount(0);
  await expect(page.locator("#analytics-view")).toBeVisible();
  await expect(page.locator("#nc-root")).toBeAttached();

  await page.getByRole("button", { name: "Quản lý nội dung" }).click();
  expect(await page.locator("#nc-root *").count()).toBeGreaterThanOrEqual(decapNodeCount);
  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(page.getByRole("heading", { name: "Đăng nhập quản trị" })).toBeVisible();
  await expect(page.locator("#content-view")).toBeHidden();
  await expect(page.locator("#analytics-view")).toBeHidden();
  expect(externalAuthRequests).toEqual([]);
});
