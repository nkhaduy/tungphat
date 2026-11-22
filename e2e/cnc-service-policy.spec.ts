import { expect, test } from "@playwright/test";

const services = [
  { path: "/gia-cong-cnc/", title: "Gia công CNC ván gỗ tại Thủ Đức" },
  { path: "/cat-cnc-go/", title: "Cắt CNC gỗ tại Thủ Đức" },
  { path: "/gia-cong-cnc-mdf/", title: "Gia công CNC MDF tại Thủ Đức" },
];

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  for (const service of services) {
    test(`${service.path} is usable at ${viewport.width}px`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize(viewport);
      await page.route(/googletagmanager|google-analytics|trustindex/, (route) => route.abort());
      const response = await page.goto(service.path, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(service.title);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://mdftungphat.com${service.path}`);
      const main = page.locator("main");
      await expect(main.getByRole("link", { name: "Liên hệ báo giá" }).first()).toHaveAttribute("href", /zalo\.me/);
      await expect(main).not.toContainText(/gửi file|checklist file/i);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(errors).toEqual([]);
    });
  }
}
