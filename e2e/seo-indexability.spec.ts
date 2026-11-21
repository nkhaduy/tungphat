import { expect, test } from "@playwright/test";

test("canonical catalogue stays indexable after search hydration and filters stay excluded", async ({ page }) => {
  await page.goto("/catalogue/");
  await expect(page.getByRole("heading", { name: /\d+ mục tra cứu/ })).toBeVisible();
  await expect(page).toHaveURL(/\/catalogue\/$/);
  await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://mdftungphat.com/catalogue/");

  await page.getByRole("searchbox", { name: "Nhập mã màu, tên màu hoặc thương hiệu..." }).fill("0330");
  await expect(page).toHaveURL(/query=0330/);
  await expect(page.locator('meta[name="robots"][data-catalogue-filter-state]')).toHaveAttribute("content", "noindex, follow");

  await page.goto("/catalogue/");
  await expect(page.getByRole("heading", { name: /\d+ mục tra cứu/ })).toBeVisible();
  await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
});

test("supplier hubs are reachable from initial catalogue HTML", async ({ request }) => {
  const response = await request.get("/catalogue/");
  const html = await response.text();
  for (const supplier of ["thanh-thuy", "an-cuong", "ba-thanh"]) {
    expect(html.includes(`href="/catalogue/${supplier}/"`), `${supplier} must have a server-rendered canonical hub link`).toBe(true);
  }
});

test("global catalogue navigation points to the indexable hub", async ({ request }) => {
  const response = await request.get("/");
  expect((await response.text()).includes('href="/catalogue/"')).toBe(true);
});
