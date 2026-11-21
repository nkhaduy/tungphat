import { expect, test } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`CNC drawing is readable and does not overflow the page at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/bai-viet/chuan-bi-file-cnc/");
    const region = page.getByRole("region", { name: "Sơ đồ bản vẽ CNC, có thể cuộn ngang" });
    const diagram = region.getByRole("img");
    await diagram.scrollIntoViewIfNeeded();
    await expect.poll(() => diagram.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    await expect(page.getByRole("heading", { name: "Ba chỗ hay nhầm trong file" })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390) {
      await region.focus();
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    }
  });
}

test("CNC service links to the technical guide without embedding file instructions", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/gia-cong-cnc/");
  await expect(page.getByRole("img", { name: /Sơ đồ minh họa bản vẽ CNC/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Kiến thức chuẩn bị gia công CNC" })).toHaveAttribute("href", "/bai-viet/chuan-bi-file-cnc/");
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
