import { expect, test } from "@playwright/test";

test("wood guide shows a labeled rubberwood example", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/bai-viet/go-ghep-la-gi/");
  const image = page.getByRole("img", { name: "Mặt tấm gỗ ghép cao su, nhìn thấy các thanh gỗ và mối ghép" });
  await image.scrollIntoViewIfNeeded();
  await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
  await expect(page.getByText(/Ví dụ mặt ván ghép cao su/)).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
