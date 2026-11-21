import { expect, test } from "@playwright/test";

for (const viewport of [{ name: "mobile", width: 390, height: 844 }, { name: "desktop", width: 1440, height: 900 }]) {
  test(`${viewport.name}: material answers and supplier links are usable`, async ({ page, request }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const mdf = await request.get("/mdf-chong-am/");
    expect(await mdf.text()).toContain("không chống nước");
    await page.goto("/mdf-chong-am/");
    await expect(page.getByText(/Ván không chống nước/).first()).toBeVisible();
    await page.goto("/acrylic/");
    const link = page.getByRole("link", { name: "bảng Acrylic An Cường" });
    await expect(link).toHaveAttribute("href", "/catalogue/an-cuong/acrylic/");
    await expect(link).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await link.click();
    await expect(page).toHaveURL(/\/catalogue\/an-cuong\/acrylic\/$/);
    await expect(page.locator("h1")).toBeVisible();
  });
}

test("crawlable HTML retains material navigation and canonical metadata", async ({ request }) => {
  for (const [path, target] of [
    ["/van-mdf/", "/bai-viet/chuan-bi-file-cnc/"],
    ["/melamine/", "/catalogue/an-cuong/melamine/"],
    ["/laminate/", "/catalogue/an-cuong/laminate/"],
    ["/gia-cong-cnc/", "/du-an/"],
  ]) {
    const response = await request.get(path);
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html).toContain(`href="${target}"`);
    expect(html).toContain(`rel="canonical" href="https://mdftungphat.com${path}"`);
  }
});
