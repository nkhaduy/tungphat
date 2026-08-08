import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Baogia SSO entry and logout", () => {
  test("logged-out startup navigates to the same-origin SSO start route", async ({ page }) => {
    await page.route("**/api/auth/session", (route) => route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ ok: false, error: { code: "unauthorized", message: "Phiên không hợp lệ" } }) }));
    await page.route("**/api/auth/sso/start", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "Baogia SSO start" }));
    const request = page.waitForRequest((candidate) => new URL(candidate.url()).pathname === "/api/auth/sso/start");
    await page.goto("/");
    await request;
    await expect(page).toHaveURL(/\/api\/auth\/sso\/start$/u);
  });

  test("failed SSO shows the Baogia-branded retry screen without credentials", async ({ page }) => {
    await page.route("**/api/auth/session", (route) => route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ ok: false, error: { code: "unauthorized", message: "Phiên không hợp lệ" } }) }));
    await page.goto("/?auth_error=invalid_state");
    await expect(page.getByRole("img", { name: "Tùng Phát" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Đăng nhập" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Đăng nhập bằng tài khoản Báo Giá" })).toBeVisible();
    await expect(page.locator("input, textarea, select")).toHaveCount(0);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact || "critical"))).toEqual([]);
  });

  test("CMS logout revokes only the CMS session and stays on the canonical origin", async ({ page }) => {
    await page.route("**/api/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      const payload = path === "/api/auth/session"
        ? { ok: true, data: { user: { id: "admin", email: "sso@example.invalid", name: "Quản trị E2E", role: "super-admin" }, csrf: "csrf", expiresAt: Math.floor(Date.now() / 1000) + 600 } }
        : path === "/api/auth/logout"
          ? { ok: true, data: { loggedOut: true } }
          : { ok: true, data: { counts: { products: 6, articles: 3, projects: 1, pages: 2 }, published: 8 } };
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) });
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Đăng xuất" }).last().click();
    await expect(page.getByRole("heading", { name: "Đăng nhập" })).toBeVisible();
    await expect(page).toHaveURL("http://127.0.0.1:4175/");
  });
});
