import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("brand catalogue supports code search without creating hotlinks", async ({ page }) => {
  await page.goto("/thuong-hieu/thanh-thuy/");
  await expect(page.getByRole("heading", { level: 1, name: /Catalogue Thanh Thuỳ/ })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://mdftungphat.com/thuong-hieu/thanh-thuy/");
  const search = page.getByRole("searchbox", { name: "Tìm tên hoặc mã Thanh Thuỳ" });
  await search.fill("142 Roman Oak");
  await expect(page.getByRole("link", { name: /142 Roman Oak/ })).toBeVisible();
  await expect(page.locator('img[src*="gothanhthuy.com"]')).toHaveCount(0);
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious")).toEqual([]);
});

test("sparse code page is useful but noindex", async ({ page }) => {
  await page.goto("/san-pham/melamine/thanh-thuy-142-roman-oak/");
  await expect(page.getByRole("heading", { level: 1, name: /142 Roman Oak/ })).toBeVisible();
  await expect(page.getByText("Liên hệ kiểm tra tồn kho")).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("link", { name: "Gửi mã qua Zalo" })).toHaveAttribute("href", /142%20ROMAN%20OAK|142/);
});

test("ready product has factual Product schema without Offer", async ({ page }) => {
  await page.goto("/san-pham/laminate/thanh-thuy-lp-101-104g-white/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index/);
  const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
  const product = schemas.map((value) => JSON.parse(value)).flatMap((value) => Array.isArray(value) ? value : [value]).find((value) => value["@type"] === "Product");
  expect(product).toMatchObject({ sku: "LP 101/104G", brand: { name: "Thanh Thùy" }, material: "Laminate" });
  expect(product).not.toHaveProperty("offers");
});

test("mobile catalogue has labels, focus and no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/thuong-hieu/thanh-thuy/");
  await page.getByRole("searchbox", { name: "Tìm tên hoặc mã Thanh Thuỳ" }).focus();
  await expect(page.getByRole("searchbox", { name: "Tìm tên hoặc mã Thanh Thuỳ" })).toBeFocused();
  await page.getByRole("combobox", { name: "Lọc theo nhóm vật liệu" }).selectOption("acrylic");
  await expect(page.getByText(/mã phù hợp/)).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious")).toEqual([]);
});
