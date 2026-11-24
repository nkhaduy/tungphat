import { expect, test } from "@playwright/test";

test("canonical catalogue stays indexable while filter URLs are crawlable and noindexed after hydration", async ({ page, request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Allow: /catalogue/*?supplier=");
  expect(robots).toContain("Allow: /catalogue/*?material=");
  expect(robots).toContain("Allow: /catalogue/*?query=");
  expect(robots).not.toContain("Allow: /catalogue/*?search=");

  await page.goto("/catalogue/");
  await expect(page.getByRole("heading", { name: /\d[\d.]* mã màu/ })).toBeVisible();
  await expect(page).toHaveURL(/\/catalogue\/$/);
  await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://gotungphat.com/catalogue/");

  await page.goto("/catalogue/?type=melamine&group=laminate");
  await expect(page.getByRole("heading", { name: "1.302 mã màu", exact: true })).toBeVisible();
  const sidebar = page.getByRole("complementary", { name: "Bộ lọc catalogue" });
  await expect(sidebar.getByRole("checkbox", { name: /^Laminate/ })).toBeChecked();
  await expect(sidebar.getByRole("checkbox", { name: /^Melamine/ })).not.toBeChecked();
  await expect(page.locator('meta[name="robots"][data-catalogue-filter-state]')).toHaveAttribute("content", "noindex, follow");

  await page.goto("/catalogue/?material=not-in-catalogue");
  await expect(page.getByRole("heading", { name: "2.910 mã màu", exact: true })).toBeVisible();
  await expect(page.locator('meta[name="robots"][data-catalogue-filter-state]')).toHaveAttribute("content", "noindex, follow");

  await page.getByRole("searchbox", { name: "Tìm theo mã màu, tên màu hoặc thương hiệu" }).fill("0330");
  await expect(page).toHaveURL(/query=0330/);
  await expect(page.locator('meta[name="robots"][data-catalogue-filter-state]')).toHaveAttribute("content", "noindex, follow");

  await page.goto("/catalogue/");
  await expect(page.getByRole("heading", { name: /\d[\d.]* mã màu/ })).toBeVisible();
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
