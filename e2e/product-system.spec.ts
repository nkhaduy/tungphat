import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { homeProductCards } from "../lib/product-taxonomy";

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  test.describe(`material system ${viewport.width}px`, () => {
    test.use({ viewport, reducedMotion: "reduce" });
    test("all homepage image/title/detail links select the corresponding material", async ({ page }) => {
      await page.goto("/");
      const section = page.locator("#vat-lieu");
      await expect(section.locator("article")).toHaveCount(homeProductCards.length);
      for (const card of homeProductCards) {
        const article = section.locator("article").filter({ has: page.getByRole("heading", { name: card.title, exact: true }) });
        await expect(article.locator("a")).toHaveCount(3);
        for (const link of await article.locator("a").all()) await expect(link).toHaveAttribute("href", card.href);
      }
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
    test("homepage and catalogue share the ten ordered main groups", async ({ page }) => {
      const titles = ["Ván MDF – HDF", "MDF chống ẩm (LMR – MMR – HMR)", "Ván Okal – MFC (Ván dăm)", "Ván ép – Plywood", "Gỗ ghép cao su", "Melamine", "Laminate", "Ván phủ Veneer", "Ván nhựa", "Chỉ dán cạnh"];
      await page.goto("/san-pham/");
      await expect(page.locator('[aria-labelledby="product-finder-title"] article h3')).toHaveText(titles);
      await page.goto("/");
      await expect(page.locator("#vat-lieu article h3")).toHaveText(titles);
    });
    test("selects a second material photograph", async ({ page }) => {
      await page.goto("/van-plywood/");
      const gallery = page.getByRole("group", { name: "Chọn ảnh vật liệu" });
      const buttons = gallery.getByRole("button");
      await expect(buttons).toHaveCount(2);
      await buttons.nth(1).click();
      await expect(buttons.nth(1)).toHaveAttribute("aria-pressed", "true");
      await expect(buttons.nth(0)).toHaveAttribute("aria-pressed", "false");
    });
    for (const card of homeProductCards) {
      test(`direct load, refresh, SEO, image and links ${card.href}`, async ({ page, request }) => {
        expect(card.image, `${card.title} requires an approved product image`).not.toBe("");
        const canonical = `https://mdftungphat.com${card.href}`;
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        const response = await request.get(card.href);
        expect(response.status()).toBe(200);
        const html = await response.text();
        expect(html).toContain(`https://mdftungphat.com${card.href}`);
        await page.goto(card.href);
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(card.title);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonical);
        await page.reload();
        await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonical);
        await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", new RegExp(card.image.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
        await expect(page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Sản phẩm", exact: true })).toHaveAttribute("href", "/san-pham/");
        await expect(page.getByRole("link", { name: "Gửi yêu cầu báo giá", exact: true }).first()).toHaveAttribute("href", "/bao-gia/");
        await expect(page.getByRole("link", { name: "Liên hệ tư vấn", exact: true })).toHaveAttribute("href", /zalo\.me/);
        const photos = page.locator("main img");
        for (const photo of await photos.all()) { await photo.scrollIntoViewIfNeeded(); await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true); }
        const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
        const serialized = schemas.join(" ");
        expect(serialized).toContain('"BreadcrumbList"');
        expect(serialized).toContain('"CollectionPage"');
        expect(serialized).not.toMatch(/"(?:Offer|AggregateRating|aggregateRating|availability)"/);
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(errors).toEqual([]);
      });
    }
    test("representative material page has no serious or critical axe violations", async ({ page }) => {
      await page.goto("/van-mdf/");
      const results = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      expect(results.violations.filter((item) => item.impact === "serious" || item.impact === "critical")).toEqual([]);
    });
  });
}
