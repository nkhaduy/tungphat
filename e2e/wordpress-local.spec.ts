import { expect, test } from "@playwright/test";

test.skip(process.env.BLOG_CONTENT_PROVIDER !== "wordpress", "WordPress local export only");

test("renders imported articles from local WordPress at existing public routes", async ({ page, request }) => {
  for (const slug of ["mdf-thuong-va-chong-am", "chuan-bi-file-cnc", "go-ghep-la-gi"]) {
    const response = await page.goto(`/bai-viet/${slug}/`);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://mdftungphat.com/bai-viet/${slug}/`);
    expect(await page.locator('script[type="application/ld+json"]').allTextContents()).toContainEqual(expect.stringContaining('"Article"'));
  }
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/bai-viet/mdf-thuong-va-chong-am/");
  expect(sitemap).not.toContain("/bai-viet/phase8-draft/");
  expect(sitemap).not.toContain("/bai-viet/phase8-private/");
  expect(sitemap).not.toContain("/bai-viet/phase8-future/");
  for (const slug of ["phase8-draft", "phase8-private", "phase8-future"]) expect((await request.get(`/bai-viet/${slug}/`)).status()).toBe(404);
});

test("renders an actual Gutenberg image, caption and table", async ({ page }) => {
  await page.goto("/bai-viet/phase8-bai-thu-local/");
  const figure = page.locator("article figure").first();
  await expect(figure.locator("img")).toHaveAttribute("alt", "Hình thử nghiệm màu xanh");
  await expect(figure.locator("figcaption")).toHaveText("Ảnh thử nghiệm tự tạo");
  await expect(page.locator("article table")).toContainText("Giá trị");
  await expect(figure.locator("img")).toHaveAttribute("srcset", /300w/);
});
