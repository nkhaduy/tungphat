import { expect, test } from "@playwright/test";

test("mobile hero selects a compact responsive image", async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const hero = page.locator(".material-panels-hero-image");
  const source = await hero.evaluate((node: HTMLImageElement) => node.currentSrc);
  expect(source).toMatch(/material-panels-hero-mobile(?:-768)?\.webp$/);
  const image = await request.get(source);
  expect(image.status()).toBe(200);
  expect((await image.body()).byteLength).toBeLessThan(200_000);
  expect(await hero.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 1)).toBe(true);
});
