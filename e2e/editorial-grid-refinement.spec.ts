import { expect, test } from "@playwright/test";

test("desktop article header and reading column share one editorial grid", async ({ page }) => {
  for (const width of [320, 390, 768, 1280, 1440, 1536]) {
    await page.setViewportSize({ width, height: 960 });
    const response = await page.goto("/bai-viet/chuan-bi-file-cnc/", { waitUntil: "networkidle" });
    expect(response?.status(), `${width}px article route`).toBe(200);

    const layout = await page.evaluate(() => {
      const rect = (selector: string) => {
        const element = document.querySelector(selector);
        if (!element) throw new Error(`Missing ${selector}`);
        const { left, right, width } = element.getBoundingClientRect();
        return { left, right, width };
      };
      return {
        title: rect(".editorial-header__title"),
        excerpt: rect(".editorial-header__excerpt"),
        metadata: rect(".editorial-header__metadata"),
        image: rect(".editorial-featured-media"),
        body: rect(".editorial-body"),
        sidebar: rect(".editorial-sidebar"),
      };
    });

    for (const [name, box] of Object.entries({ excerpt: layout.excerpt, metadata: layout.metadata, image: layout.image, body: layout.body })) {
      expect(Math.abs(box.left - layout.title.left), `${width}px ${name} aligns with H1`).toBeLessThanOrEqual(1);
    }
    if (width >= 1280) {
      expect(layout.title.width, `${width}px H1 uses the reading column`).toBeGreaterThanOrEqual(790);
      expect(layout.title.width, `${width}px H1 stays within the intended measure`).toBeLessThanOrEqual(830);
      expect(layout.sidebar.left - layout.body.right, `${width}px consistent column gap`).toBeGreaterThanOrEqual(36);
      expect(layout.sidebar.left - layout.body.right, `${width}px bounded column gap`).toBeLessThanOrEqual(48);
    } else {
      await expect(page.locator(".editorial-toc__disclosure")).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});
