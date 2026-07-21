import { expect, test } from "@playwright/test";

test("custom shared-session backend mounts real Decap without Identity UI", async ({ page }) => {
  const csrf = "real-decap-test-csrf";
  const forbiddenRequests: string[] = [];
  const gatewayAuthorizations: Array<string | undefined> = [];
  page.on("request", request => {
    if (/identity\.netlify\.com|gotrue|netlify-identity-widget/i.test(request.url())) forbiddenRequests.push(request.url());
  });
  await page.route("**/api/auth/session", route => route.fulfill({ json: { authenticated: true, user: { username: "cms-test" }, csrf, expiresAt: 1_900_000_000 } }));
  await page.route("**/api/gateway/status", route => route.fulfill({ json: { ok: true, user: { username: "cms-test" } } }));
  await page.route("**/git-gateway/github/**", async route => {
    const url = new URL(route.request().url());
    gatewayAuthorizations.push(route.request().headers().authorization);
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

  await page.goto("/?view=content", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Xem trước" })).toBeVisible();
  await expect(page.locator("#nc-root")).not.toBeEmpty({ timeout: 20_000 });
  await page.waitForTimeout(1_000);
  await expect(page.locator("#admin-app")).toBeVisible();
  await expect(page.locator("#login-form")).toBeHidden();
  await expect(page.getByText(/Netlify Identity/i)).toHaveCount(0);
  await expect(page.getByText(/Đăng nhập bằng Netlify/i)).toHaveCount(0);
  expect(await page.evaluate(() => "netlifyIdentity" in window)).toBe(false);
  expect(forbiddenRequests).toEqual([]);
  expect(gatewayAuthorizations.length).toBeGreaterThan(0);
  expect(gatewayAuthorizations).toEqual(gatewayAuthorizations.map(() => `Bearer ${csrf}`));
});
