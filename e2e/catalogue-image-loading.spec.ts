import { expect, test } from "@playwright/test";

test("catalogue images load when visitors scroll to results and supplier logos", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/catalogue/");
  const search = page.getByRole("searchbox").first();
  await expect(search).toBeVisible();
  const firstCard = page.locator('[data-testid="catalogue-card-link"]').first();
  await expect(firstCard).toBeVisible();
  await firstCard.scrollIntoViewIfNeeded();
  const image = firstCard.locator("img").first();
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
  const supplier = page.locator('a[href="/catalogue/ba-thanh/"]').filter({ hasText: "Mở mã màu Ba Thanh" });
  await supplier.scrollIntoViewIfNeeded();
  const logo = supplier.getByRole("img", { name: "Logo Ba Thanh" });
  await expect(logo).toBeVisible();
  await expect.poll(() => logo.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
});
