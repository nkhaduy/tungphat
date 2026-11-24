import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const screenshotDirectory = join(process.cwd(), "output", "playwright");
const viewportWidths = [320, 390, 768, 1280, 1440, 1536];

async function expectNoHorizontalOverflow(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), { message: `No page overflow at ${width}px` }).toBe(true);
}

function articlePathsFromSitemap(xml: string) {
  return [...xml.matchAll(/<loc>https?:\/\/[^<]*\/bai-viet\/([^/<]+)\/<\/loc>/gu)]
    .map((match) => `/bai-viet/${match[1]}/`);
}

test("every published article uses the shared editorial layout and remains responsive", async ({ page, request }) => {
  const sitemapResponse = await request.get("/sitemap.xml");
  expect(sitemapResponse.ok()).toBe(true);
  const paths = articlePathsFromSitemap(await sitemapResponse.text());
  expect(paths.length).toBeGreaterThan(0);

  const hydrationErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /hydration|did not match|server rendered html/i.test(message.text())) hydrationErrors.push(message.text());
  });

  for (const path of paths) {
    const response = await page.goto(path, { waitUntil: "networkidle" });
    expect(response?.status(), path).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    const articleTitleTop = await page.getByRole("heading", { level: 1 }).evaluate((element) => element.getBoundingClientRect().top);
    const siteHeaderBottom = await page.locator(".site-header").evaluate((element) => element.getBoundingClientRect().bottom);
    expect(articleTitleTop, `${path} title clears the site header`).toBeGreaterThanOrEqual(siteHeaderBottom);
    const breadcrumbTop = await page.locator('.editorial-header nav[aria-label="Đường dẫn"]').evaluate((element) => element.getBoundingClientRect().top);
    expect(breadcrumbTop, `${path} breadcrumb clears the site header`).toBeGreaterThanOrEqual(siteHeaderBottom);
    await expect(page.locator(".editorial-header__excerpt")).not.toBeEmpty();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);

    const schemaScripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const schemaObjects = schemaScripts.flatMap((value) => {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed as Array<Record<string, unknown>> : [parsed as Record<string, unknown>];
    });
    const articleSchema = schemaObjects.find((schema) => schema["@type"] === "Article");
    expect(articleSchema, `${path} Article schema`).toBeDefined();
    expect(articleSchema?.datePublished).toBeTruthy();
    expect(articleSchema?.dateModified).toBeTruthy();
    expect(schemaObjects.some((schema) => schema["@type"] === "BreadcrumbList")).toBe(true);
    expect(schemaScripts.join(" ")).not.toContain("FAQPage");

    const bodyHeadings = page.locator(".editorial-body h2[id], .editorial-body h3[id]");
    const headingIds = await bodyHeadings.evaluateAll((elements) => elements.map((element) => element.id));
    expect(new Set(headingIds).size, `${path} unique heading anchors`).toBe(headingIds.length);
    const desktopToc = page.locator(".editorial-toc__desktop");
    const mobileToc = page.locator(".editorial-toc__disclosure nav");
    if (headingIds.length) {
      await expect(desktopToc.locator("a")).toHaveCount(headingIds.length);
      await expect(mobileToc.locator("a")).toHaveCount(headingIds.length);
      for (const link of await desktopToc.locator("a").all()) {
        const href = await link.getAttribute("href");
        expect(href).toMatch(/^#[a-z0-9-]+$/u);
        await expect(page.locator(`[id="${href!.slice(1)}"]`)).toHaveCount(1);
      }
    } else {
      await expect(desktopToc).toHaveCount(0);
      await expect(mobileToc).toHaveCount(0);
    }

    const articleImages = page.locator("#article-content img");
    await expect(page.locator(".editorial-featured-media img")).toHaveAttribute("src", /^\/images\/editorial\/.+\.webp$/u);
    for (const image of await articleImages.all()) {
      await expect(image).toHaveAttribute("alt");
    }
    if (await page.locator(".editorial-featured-media").count()) {
      const box = await page.locator(".editorial-featured-media").boundingBox();
      expect(box?.height).toBeGreaterThan(0);
    }

    for (const width of viewportWidths) {
      await expectNoHorizontalOverflow(page, width);
      if (width <= 390) {
        for (const table of await page.locator(".editorial-table-scroll").all()) {
          await expect(table).toHaveAttribute("tabindex", "0");
          const dimensions = await table.evaluate((element) => ({ clientWidth: element.clientWidth, scrollWidth: element.scrollWidth, overflowX: getComputedStyle(element).overflowX }));
          if (dimensions.scrollWidth > dimensions.clientWidth) expect(dimensions.overflowX).toMatch(/auto|scroll/u);
        }
      }
    }

    if (headingIds.length) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      const disclosure = page.locator(".editorial-toc__disclosure");
      const summary = disclosure.locator("summary");
      await summary.focus();
      await page.keyboard.press("Enter");
      await expect(disclosure).toHaveAttribute("open", "");
      const firstLink = disclosure.locator("a").first();
      const targetId = (await firstLink.getAttribute("href"))!.slice(1);
      await firstLink.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp(`#${targetId}$`));
      const headerBottom = await page.locator(".site-header").evaluate((element) => element.getBoundingClientRect().bottom);
      await expect
        .poll(() =>
          page.locator(`[id="${targetId}"]`).evaluate((element) => element.getBoundingClientRect().top),
        )
        .toBeGreaterThanOrEqual(headerBottom - 2);

      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(path, { waitUntil: "networkidle" });
      const sidebar = page.locator(".editorial-sidebar");
      const stickyToc = page.locator(".editorial-toc__desktop");
      await expect(sidebar).toBeVisible();
      expect(await stickyToc.evaluate((element) => getComputedStyle(element).position)).toBe("sticky");
      await bodyHeadings.last().scrollIntoViewIfNeeded();
      const stickyTocTop = await stickyToc.evaluate((element) => element.getBoundingClientRect().top);
      expect(stickyTocTop).toBeGreaterThanOrEqual(79);
      const containment = await page.evaluate(() => {
        const section = document.querySelector(".editorial-reading-section")!.getBoundingClientRect();
        const toc = document.querySelector(".editorial-toc__desktop")!.getBoundingClientRect();
        return { sectionBottom: section.bottom, tocBottom: toc.bottom };
      });
      expect(containment.tocBottom).toBeLessThanOrEqual(containment.sectionBottom + 1);
    }

    if (path.endsWith("/chuan-bi-file-cnc/")) {
      await mkdir(screenshotDirectory, { recursive: true });
      for (const image of await articleImages.all()) {
        if (await image.getAttribute("loading") === "lazy") await image.scrollIntoViewIfNeeded();
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.setViewportSize({ width: 1440, height: 1050 });
      await page.screenshot({ path: join(screenshotDirectory, "editorial-redesign-article-desktop.png"), fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: join(screenshotDirectory, "editorial-redesign-article-mobile.png"), fullPage: true });
    }
  }

  expect(pageErrors).toEqual([]);
  expect(hydrationErrors).toEqual([]);

  const articleAxe = await new AxeBuilder({ page }).include(".editorial-header").include(".editorial-reading-section").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(articleAxe.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")).toEqual([]);
});

test("article listing uses real categories and crawlable article links", async ({ page }) => {
  const response = await page.goto("/bai-viet/", { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kiến thức vật liệu và CNC");
  const listingTitleTop = await page.getByRole("heading", { level: 1 }).evaluate((element) => element.getBoundingClientRect().top);
  const siteHeaderBottom = await page.locator(".site-header").evaluate((element) => element.getBoundingClientRect().bottom);
  expect(listingTitleTop, "listing title clears the site header").toBeGreaterThanOrEqual(siteHeaderBottom);
  const breadcrumbTop = await page.locator('.editorial-listing-header nav[aria-label="Đường dẫn"]').evaluate((element) => element.getBoundingClientRect().top);
  expect(breadcrumbTop, "listing breadcrumb clears the site header").toBeGreaterThanOrEqual(siteHeaderBottom);
  const categoryLinks = page.locator(".editorial-category-nav a");
  const categorySections = page.locator(".editorial-category-section");
  const categoryCount = await categoryLinks.count();
  expect(categoryCount).toBeGreaterThan(0);
  await expect(categorySections).toHaveCount(categoryCount);
  for (const link of await categoryLinks.all()) {
    const href = await link.getAttribute("href");
    expect(href).toMatch(/^#chu-de-[a-z0-9-]+$/u);
    await expect(page.locator(`[id="${href!.slice(1)}"]`)).toHaveCount(1);
  }
  await expect(page.locator(".editorial-card h3 a")).not.toHaveCount(0);
  for (const image of await page.locator(".editorial-card__media img").all()) {
    await expect(image).toHaveAttribute("src", /^\/images\/editorial\/.+-480\.webp$/u);
  }
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/bai-viet\/$/u);
  await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);

  await mkdir(screenshotDirectory, { recursive: true });
  await page.screenshot({ path: join(screenshotDirectory, "editorial-redesign-listing-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: join(screenshotDirectory, "editorial-redesign-listing-mobile.png"), fullPage: true });
  for (const width of viewportWidths) await expectNoHorizontalOverflow(page, width);

  const listingAxe = await new AxeBuilder({ page }).include(".editorial-listing-header").include(".editorial-listing-main").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(listingAxe.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")).toEqual([]);
});

test("CMS preview stays noindex and waits for a trusted draft", async ({ page }) => {
  const response = await page.goto("/cms-preview/", { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByText("Mở một nội dung trong CMS để xem bản nháp.")).toBeVisible();
  await expect(page.locator("[data-cms-preview='true']")).toHaveCount(0);
});
