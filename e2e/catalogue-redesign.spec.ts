import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { getCatalogueListingEntries } from "../lib/catalog/listing";
import { deriveCatalogueFacets, filterCatalogueEntries } from "../lib/catalog/facets";
import { canonicalCatalogGroups } from "../lib/catalog/material-taxonomy";

const entries = getCatalogueListingEntries();
const patternLabel = (value: string) => canonicalCatalogGroups.find((item) => item.slug === value)?.label ?? value;

test("desktop catalogue filters combine actual facets and preserve shareable state", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/catalogue/");

  await expect(page.getByRole("heading", { level: 1, name: "Mã màu", exact: true })).toBeVisible();
  await expect.poll(() => page.locator(".catalogue-material-hero").evaluate((hero) => Math.round(hero.getBoundingClientRect().height))).toBe(400);
  await expect(page.getByRole("heading", { name: "2.910 mã màu", exact: true })).toBeVisible();

  const sidebar = page.getByRole("complementary", { name: "Bộ lọc catalogue" });
  await expect(sidebar).toBeVisible();
  await expect(sidebar).toHaveCSS("position", "sticky");

  const supplier = "thanh-thuy" as const;
  const material = "laminate";
  const patterns = ["solid", "woodgrain"] as const;
  const expectedSupplierCount = filterCatalogueEntries(entries, { supplier: [supplier] }).length;
  const materialCount = deriveCatalogueFacets(entries, { supplier: [supplier] }).material.find((item) => item.value === material)?.count;
  const expectedWoodgrain = filterCatalogueEntries(entries, { supplier: [supplier], material: [material], pattern: ["woodgrain"] }).length;
  const expectedCombined = filterCatalogueEntries(entries, { supplier: [supplier], material: [material], pattern: [...patterns] }).length;
  const expectedAllBrands = filterCatalogueEntries(entries, { material: [material], pattern: [...patterns] }).length;
  expect(expectedSupplierCount).toBe(342);
  expect(materialCount).toBe(69);
  expect(expectedWoodgrain).toBe(33);
  expect(expectedCombined).toBe(63);

  await page.getByRole("button", { name: /^Thanh Thuỳ/ }).click();
  await expect(page.getByRole("heading", { name: "342 mã màu", exact: true })).toBeVisible();

  await sidebar.getByRole("checkbox", { name: /^Laminate/ }).check();
  await expect(page.getByRole("heading", { name: "69 mã màu", exact: true })).toBeVisible();

  const patternGroup = sidebar.locator("details").filter({ has: page.getByText("Nhóm vân", { exact: true }) });
  await patternGroup.getByRole("checkbox", { name: new RegExp(`^${patternLabel("woodgrain")}`) }).check();
  await expect(page.getByRole("heading", { name: `${expectedWoodgrain} mã màu`, exact: true })).toBeVisible();
  await patternGroup.getByRole("checkbox", { name: new RegExp(`^${patternLabel("solid")}`) }).check();
  await expect(page.getByRole("heading", { name: `${expectedCombined} mã màu`, exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Tất cả/ })).toContainText(expectedAllBrands.toLocaleString("vi-VN"));
  await expect(page).toHaveURL(/supplier=thanh-thuy/);
  await expect(page).toHaveURL(/material=laminate/);
  await expect(page).toHaveURL(/pattern=solid/);
  await expect(page).toHaveURL(/pattern=woodgrain/);

  await page.reload();
  await expect(page.getByRole("heading", { name: `${expectedCombined} mã màu`, exact: true })).toBeVisible();
  await expect(sidebar.getByRole("checkbox", { name: /^Laminate/ })).toBeChecked();

  await page.getByRole("button", { name: "Laminate", exact: true }).click();
  const expectedAfterRemovingMaterial = filterCatalogueEntries(entries, { supplier: [supplier], pattern: [...patterns] }).length;
  await expect(page.getByRole("heading", { name: `${expectedAfterRemovingMaterial} mã màu`, exact: true })).toBeVisible();
  await sidebar.getByRole("button", { name: "Xóa tất cả" }).click();
  await expect(page.getByRole("heading", { name: "2.910 mã màu", exact: true })).toBeVisible();
  await expect(page).not.toHaveURL(/(?:supplier|material|pattern|surface|query)=/);
});

test("mobile filter drawer applies verified filters without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/catalogue/");

  await expect.poll(() => page.locator(".catalogue-material-hero").evaluate((hero) => Math.round(hero.getBoundingClientRect().height))).toBe(270);
  const accessibilityAudit = await new AxeBuilder({ page }).analyze();
  expect(
    accessibilityAudit.violations.filter(
      (violation) => violation.impact === "critical" || violation.impact === "serious",
    ),
  ).toEqual([]);
  await expect(page.getByRole("button", { name: /Bộ lọc/ })).toBeVisible();
  await page.getByRole("button", { name: /Bộ lọc/ }).click();
  const dialog = page.getByRole("dialog", { name: "Bộ lọc mã màu" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("checkbox", { name: /^Ba Thanh/ }).check();
  await expect(page.getByText("373 mã", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: /Xem 373 mã/ }).click();
  await expect(dialog).not.toBeVisible();

  const filterButton = page.getByRole("button", { name: /Bộ lọc/ });
  await filterButton.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(filterButton).toBeFocused();

  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test("desktop filter sidebar stays sticky and stops with the catalogue section", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/catalogue/");
  const sidebar = page.getByRole("complementary", { name: "Bộ lọc catalogue" });
  expect(await sidebar.evaluate((element) => getComputedStyle(element).position)).toBe("sticky");

  await page.evaluate(() => window.scrollTo(0, 1200));
  await expect.poll(() => sidebar.evaluate((element) => Math.round(element.getBoundingClientRect().top))).toBeGreaterThanOrEqual(80);
  await expect.poll(() => sidebar.evaluate((element) => Math.round(element.getBoundingClientRect().top))).toBeLessThanOrEqual(120);

  await page.evaluate(() => {
    const section = document.querySelector(".catalogue-page");
    if (!section) return;
    const bottom = section.getBoundingClientRect().bottom + window.scrollY;
    window.scrollTo(0, bottom - window.innerHeight + 12);
  });
  const bounds = await page.evaluate(() => {
    const aside = document.querySelector('[aria-label="Bộ lọc catalogue"]');
    const section = document.querySelector(".catalogue-page");
    if (!aside || !section) return null;
    return { asideBottom: aside.getBoundingClientRect().bottom, sectionBottom: section.getBoundingClientRect().bottom };
  });
  expect(bounds).not.toBeNull();
  expect(bounds!.asideBottom).toBeLessThanOrEqual(bounds!.sectionBottom + 1);
});

test("catalogue infinite scroll matches static crawlable pages without duplicates", async ({ page, request }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/catalogue/");
  const rootHtml = await (await request.get("/catalogue/")).text();
  expect(rootHtml).toContain('href="/catalogue/page/2/"');
  await expect(page.getByRole("region", { name: "Kết quả mã màu" }).getByRole("article")).toHaveCount(48);

  const pageTwoResponse = await request.get("/catalogue/page/2/");
  expect(pageTwoResponse.ok()).toBeTruthy();
  const pageTwoHtml = await pageTwoResponse.text();
  expect(pageTwoHtml).toContain('rel="canonical" href="https://mdftungphat.com/catalogue/page/2/"');
  expect(pageTwoHtml).toContain('href="/catalogue/page/3/"');
  expect(pageTwoHtml).toContain("Danh sách lấy từ catalogue của các nhà cung cấp");
  expect(pageTwoHtml).toContain("Hỏi về mã màu qua Zalo");
  for (const entry of entries.slice(48, 96)) expect(pageTwoHtml).toContain(`href="${entry.canonicalRoute}"`);

  await page.getByTestId("catalogue-load-sentinel").scrollIntoViewIfNeeded();
  const resultRegion = page.getByRole("region", { name: "Kết quả mã màu" });
  await expect(resultRegion.getByRole("article")).toHaveCount(96);
  const loadedHrefs = await resultRegion.getByTestId("catalogue-card-link").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(new Set(loadedHrefs).size).toBe(96);
  expect(loadedHrefs).toEqual(entries.slice(0, 96).map((entry) => entry.canonicalRoute));
});

test("static catalogue links and next-page path remain available without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/catalogue/");
  await expect(page.getByRole("heading", { level: 1, name: "Mã màu", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Kết quả mã màu" }).getByRole("article")).toHaveCount(48);
  await expect(page.getByRole("link", { name: "Mở danh sách catalogue theo trang" })).toHaveAttribute("href", "/catalogue/page/2/");
  await page.goto("/catalogue/page/2/");
  await expect(page.getByRole("heading", { level: 1, name: "Mã màu vật liệu · trang 2" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Các trang mã màu" }).getByRole("link", { name: "Trang tiếp" })).toHaveAttribute("href", "/catalogue/page/3/");
  await context.close();
});

test("infinite-scroll batch failures can be retried without changing result order", async ({ page }) => {
  let failFirstRequest = true;
  await page.route("**/data/catalogue-pages/page-2.json", async (route) => {
    if (failFirstRequest) {
      failFirstRequest = false;
      await route.abort();
      return;
    }
    await route.continue();
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/catalogue/");
  await page.getByTestId("catalogue-load-sentinel").scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: "Thử tải lại" })).toBeVisible();
  await page.getByRole("button", { name: "Thử tải lại" }).click();
  const cards = page.getByRole("region", { name: "Kết quả mã màu" }).getByTestId("catalogue-card-link");
  await expect(cards).toHaveCount(96);
  const hrefs = await cards.evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(hrefs).toEqual(entries.slice(0, 96).map((entry) => entry.canonicalRoute));
});

test("catalogue cards report missing previews and recover from image request failures", async ({ page }) => {
  await page.route("**/*", async (route) => {
    const request = route.request();
    const requestUrl = decodeURIComponent(request.url());
    if (request.resourceType() === "image" && requestUrl.includes("/catalog/")) await route.abort();
    else await route.continue();
  });
  await page.goto("/catalogue/");

  const firstCard = page.getByRole("region", { name: "Kết quả mã màu" }).getByRole("article").first();
  await expect(firstCard.getByRole("img", { name: "Không tải được ảnh xem trước từ nguồn." })).toBeVisible();

  const missingIndex = entries.findIndex((entry) => !entry.thumbnail);
  expect(missingIndex).toBeGreaterThanOrEqual(0);
  expect(entries.filter((entry) => !entry.thumbnail)).toHaveLength(55);
  const pageNumber = Math.floor(missingIndex / 48) + 1;
  const route = pageNumber === 1 ? "/catalogue/" : `/catalogue/page/${pageNumber}/`;
  const entry = entries[missingIndex];
  const html = await (await page.request.get(route)).text();
  expect(html).toContain(`href="${entry.canonicalRoute}"`);
  expect(html).toContain("Nguồn chưa cung cấp ảnh màu");
  expect(html).toContain('src="/images/catalogue-preview-unavailable.svg"');
});
