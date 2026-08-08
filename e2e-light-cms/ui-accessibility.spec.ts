import AxeBuilder from "@axe-core/playwright";
import { test, expect, type Page, type Route } from "@playwright/test";
async function installApiFixtures(page: Page) {
  await page.route("**/api/**", async (route: Route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const payload = (() => {
      if (path === "/api/auth/session") return { ok: true, data: { user: { id: "local-e2e-admin", email: "admin@example.com", name: "Quản trị E2E", role: "super-admin" }, csrf: "fixture-csrf", expiresAt: Math.floor(Date.now() / 1000) + 600 } };
      if (path === "/api/dashboard") return { ok: true, data: { counts: { products: 6, articles: 2, projects: 2, pages: 2 }, published: 8 } };
      if (/^\/api\/products\/?$/u.test(path)) return { ok: true, data: { items: [{ id: "product-van-mdf", title: "Ván MDF chống ẩm", slug: "van-mdf-chong-am", status: "published", version: 1, updatedAt: "2026-08-08T00:00:00.000Z" }] } };
      if (path === "/api/products/product-van-mdf") return { ok: true, data: { id: "product-van-mdf", title: "Ván MDF chống ẩm", status: "published", version: 1, content_json: JSON.stringify({ title: "Ván MDF chống ẩm", slug: "van-mdf-chong-am", excerpt: "Fixture" }) } };
      if (path === "/api/media") return { ok: true, data: { results: [] } };
      if (path === "/api/users" || path === "/api/audit") return { ok: true, data: [] };
      if (path === "/api/settings/business-settings" || path === "/api/settings/seo-defaults") return { ok: true, data: { data: {}, version: 1 } };
      return { ok: true, data: {} };
    })();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) });
  });
}

async function checkA11y(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact || "critical"))).toEqual([]);
}

test.describe("Light CMS identity UI", () => {
  test("unauthenticated screen exposes only Cloudflare Access login", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Đăng nhập");
    await expect(page.getByRole("button", { name: "Đăng nhập quản trị" })).toBeVisible();
    await expect(page.locator("input, textarea, select")).toHaveCount(0);
    await checkA11y(page);
  });

  for (const viewport of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "laptop", width: 1024, height: 800 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    test(`dashboard and navigation are usable at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await installApiFixtures(page);
      await page.goto("/");
      await expect(page.getByRole("heading", { name: "Nội dung Tùng Phát" })).toBeVisible();
      await checkA11y(page);

      const menu = page.getByRole("button", { name: "Menu" });
      if (viewport.width < 901) {
        await expect(menu).toBeVisible();
        await menu.click();
        const sidebar = page.getByRole("complementary", { name: "Điều hướng quản trị" });
        await expect(sidebar).toHaveAttribute("id", "admin-sidebar");
        await expect(sidebar).toHaveClass(/is-open/);
        await expect(page.getByRole("navigation")).toBeVisible();
        await expect(page.getByRole("button", { name: "Thư viện" })).toBeVisible();
        await page.getByRole("button", { name: "Tổng quan" }).click();
        await expect(sidebar).not.toHaveClass(/is-open/);
        await expect(sidebar).toBeHidden();
      } else {
        await expect(menu).toBeHidden();
      }

      if (viewport.width < 901) await menu.click();
      await page.getByRole("button", { name: "Sản phẩm" }).click();
      await expect(page.getByRole("heading", { name: "products" })).toBeVisible();
      await checkA11y(page);
      await page.getByRole("button", { name: /Ván MDF/ }).first().click();
      await expect(page.getByRole("textbox", { name: "Dữ liệu nội dung" })).toBeVisible();
      await checkA11y(page);
    });
  }

  test("denied identity renders a generic access message", async ({ page }) => {
    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ ok: false, error: { message: "Tài khoản chưa được cấp quyền quản trị hoặc đã bị vô hiệu hóa." } }) });
    });
    await page.goto("/");
    await expect(page.getByRole("alert")).toContainText("chưa được cấp quyền quản trị");
    await expect(page.getByRole("alert")).not.toContainText("admin@example.com");
    await checkA11y(page);
  });
});
