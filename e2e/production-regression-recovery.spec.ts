import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const approvedCards = [
  ["Ván MDF – HDF", "/van-mdf/"],
  ["MDF chống ẩm (LMR – MMR – HMR)", "/mdf-chong-am/"],
  ["Ván Okal – MFC (Ván dăm)", "/van-okal/"],
  ["Ván ép – Plywood", "/van-plywood/"],
  ["Gỗ ghép cao su", "/go-ghep-cao-su/"],
  ["Melamine", "/melamine/"],
  ["Laminate", "/laminate/"],
  ["Ván phủ Veneer", "/tam-veneer/"],
  ["Ván nhựa", "/van-nhua-pvc/"],
  ["Chỉ dán cạnh", "/chi-nep-nhua/"],
] as const;

const restoredProductRoutes = [
  "/acrylic/",
  "/chi-nep-nhua/",
  "/laminate/",
  "/melamine/",
  "/plywood-phu-melamine/",
  "/pvc-film-pet/",
  "/tam-veneer/",
  "/van-hdf/",
  "/van-mfc/",
  "/van-nhua-pvc/",
  "/van-okal/",
  "/van-plywood/",
];

test("homepage matches the approved hero, ten cards, navigation, and Zalo quote path", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const hero = page.locator("#trang-chu");
  const heading = (await hero.getByRole("heading", { level: 1 }).innerText()).replace(/\s+/gu, " ").trim();
  expect(heading).toMatch(/^Ván gỗ công nghiệp\s*&\s*gia công CNC$/u);
  await expect(hero.getByText(/Tùng Phát chuyên cung cấp đa dạng vật liệu gỗ công nghiệp/u)).toBeVisible();
  await expect(hero.getByRole("link", { name: /Xem mã màu/u })).toBeVisible();
  await expect(hero.getByRole("link", { name: /Liên hệ báo giá/u })).toHaveAttribute("href", /zalo\.me/u);

  const cards = await page.locator("#vat-lieu .material-grid article").evaluateAll((items) =>
    items.map((item) => [item.querySelector("h3")?.textContent?.trim(), item.querySelector("h3 a")?.getAttribute("href")]),
  );
  expect(cards).toEqual(approvedCards);
  await expect(page.locator(".site-header")).toContainText("Mã màu");
  await expect(page.locator(".site-header")).toContainText("Cắt CNC");
  await expect(page.locator(".site-header")).toContainText("Bài viết");
  await expect(page.locator(".site-header")).not.toContainText("Xưởng & chi nhánh");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://gotungphat.com/");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Chọn ván, bề mặt Thanh Thùy, Ba Thanh và dịch vụ cắt/CNC tại Tùng Phát, Thủ Đức. Tra mã màu rồi gửi quy cách để nhận báo giá.",
  );
});

test("recovered homepage stays accessible and fits desktop and mobile widths", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const desktopAxe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(desktopAxe.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([]);

  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);
  }
});

test("all twelve previously published material guide URLs resolve with gotungphat canonicals", async ({ page }) => {
  for (const route of restoredProductRoutes) {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status(), route).toBe(200);
    await expect(page.getByRole("heading", { level: 1 }), route).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]'), route).toHaveAttribute("href", `https://gotungphat.com${route}`);
    await expect(page.locator('meta[name="robots"][content*="noindex"]'), route).toHaveCount(0);
  }
});

test("catalogue and editorial route behavior remains available alongside the recovery", async ({ page }) => {
  const catalogue = await page.goto("/catalogue/", { waitUntil: "domcontentloaded" });
  expect(catalogue?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Mã màu");
  await expect(page.locator('h2[aria-live="polite"]')).toHaveText("2.910 mã màu");

  const article = await page.goto("/bai-viet/go-ghep-la-gi/", { waitUntil: "domcontentloaded" });
  expect(article?.status()).toBe(200);
  await expect(page.locator(".editorial-toc__desktop a").first()).toBeVisible();
  await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
});
