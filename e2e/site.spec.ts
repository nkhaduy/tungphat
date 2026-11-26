import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import trustindexReviews from "../data/trustindex-reviews.json";

const isReleaseStaging =
  new URL(
    process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173",
  ).hostname === "tungphat-release-staging-20261123.nkhaduy.workers.dev";

const publicRoutes = [
  "/",
  "/san-pham/",
  "/go-ghep/",
  "/go-ghep-cao-su/",
  "/go-ghep-tram/",
  "/van-mdf/",
  "/mdf-chong-am/",
  "/van-go-cong-nghiep/",
  "/gia-cong-cnc/",
  "/cat-cnc-go/",
  "/gia-cong-cnc-mdf/",
  "/san-pham/an-cuong/",
  "/san-pham/ba-thanh/",
  "/san-pham/kes/",
  "/catalogue/",
  "/catalogue/an-cuong/",
  "/catalogue/thanh-thuy/",
  "/catalogue/ba-thanh/",
  "/thuong-hieu/thanh-thuy/",
  "/thuong-hieu/ba-thanh/",
  "/ma-mau-melamine/ba-thanh/",
  "/bao-gia/",
  "/du-an/",
  "/bai-viet/",
  "/lien-he/",
  "/chi-nhanh/14-tam-binh/",
  "/chi-nhanh/81b-tam-binh/",
  "/chinh-sach-bao-mat/",
  "/dieu-khoan-su-dung/",
];
const canonicalRouteOverrides: Record<string, string> = {
  "/ma-mau-melamine/ba-thanh/": "/catalogue/ba-thanh/melamine/",
};
const representativeRoutes = [
  "/",
  "/go-ghep-cao-su/",
  "/van-mdf/",
  "/gia-cong-cnc/",
  "/san-pham/an-cuong/",
  "/catalogue/an-cuong/",
  "/lien-he/",
  "/chi-nhanh/14-tam-binh/",
  "/chinh-sach-bao-mat/",
  "/bai-viet/",
];
const acceptanceViewports = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

function normalizedPath(value: string) {
  const path = new URL(value, "https://gotungphat.com").pathname;
  return path === "/" ? path : `${path.replace(/\/+$/, "")}/`;
}

async function pageErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("Turnstile"))
      errors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText;
    if (failure && failure !== "net::ERR_ABORTED")
      errors.push(`${failure}: ${request.url()}`);
  });
  return errors;
}
test("các route chính trả về trang có H1, canonical và không có lỗi console", async ({
  page,
}) => {
  const errors = await pageErrors(page);
  for (const route of publicRoutes) {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status(), route).toBe(200);
    await expect(page.getByRole("heading", { level: 1 }), route).toHaveCount(1);
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(canonical, route).not.toBeNull();
    expect(normalizedPath(canonical || "/"), route).toBe(
      canonicalRouteOverrides[route] ?? route,
    );
  }
  expect(errors).toEqual([]);
});

test("shared header follows the surface of each route and turns solid after scroll", async ({
  page,
}) => {
  for (const { route, tone } of [
    { route: "/", tone: "light" },
    { route: "/catalogue/", tone: "dark" },
  ]) {
    await page.goto(route);
    const header = page.getByRole("banner");
    await expect(header, route).toHaveAttribute("data-tone", tone);
    await expect(header, route).toHaveAttribute("data-scrolled", "false");
    await expect(header, route).toHaveCSS(
      "background-color",
      route === "/" ? "rgb(255, 255, 255)" : "rgba(0, 0, 0, 0)",
    );
    await expect(header, route).toHaveCSS("position", "sticky");
    await expect(page.getByText("2 chi nhánh tại TP.HCM"), route).toHaveCount(0);

    await page.evaluate(() => window.scrollTo(0, 160));
    await expect(header, route).toHaveAttribute("data-scrolled", "true");
    await expect
      .poll(() =>
        header.evaluate(
          (element) => getComputedStyle(element).backgroundColor,
        ),
      )
      .toBe("rgba(255, 255, 255, 0.94)");
  }
});

test("brand hero preserves the full logo without cropping", async ({
  page,
}) => {
  await page.goto("/san-pham/an-cuong/");
  const logo = page.getByRole("img", { name: "Logo An Cường" });
  await expect(logo).toBeVisible();
  expect(
    await logo.evaluate((image) => getComputedStyle(image).objectFit),
  ).toBe("contain");
});

test("representative routes expose breadcrumbs, intact images, and no horizontal overflow", async ({
  page,
}) => {
  const errors = await pageErrors(page);
  for (const route of representativeRoutes.filter((route) => route !== "/")) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    if (route === "/lien-he/") {
      const structuredData = await page
        .locator('script[type="application/ld+json"]')
        .allTextContents();
      const schemas = structuredData.flatMap((value) => {
        const parsed = JSON.parse(value) as
          | Record<string, unknown>
          | Record<string, unknown>[];
        return Array.isArray(parsed) ? parsed : [parsed];
      });
      expect(
        schemas.some((schema) => schema["@type"] === "BreadcrumbList"),
        route,
      ).toBe(true);
    } else {
      await expect(
        page.getByRole("navigation", { name: /Đường dẫn|Breadcrumb/ }),
        route,
      ).toBeVisible();
    }
    const brokenImages = await page
      .locator("img")
      .evaluateAll((images) =>
        images
          .filter((image) => image.complete && image.naturalWidth === 0)
          .map((image) => image.getAttribute("src")),
      );
    expect(brokenImages, route).toEqual([]);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow, route).toBeLessThanOrEqual(1);
  }
  expect(errors).toEqual([]);
});

test("homepage có hero ván gỗ, hai CTA và một ảnh LCP ưu tiên", async ({
  page,
}) => {
  await page.goto("/");
  const hero = page.locator("#trang-chu");
  await expect(
    hero.getByRole("heading", {
      level: 1,
      name: "Ván gỗ công nghiệp & gia công CNC",
    }),
  ).toBeVisible();
  await expect(hero.getByRole("link")).toHaveCount(2);
  await expect(hero.getByRole("link", { name: "Xem mã màu" })).toBeVisible();
  await expect(hero.getByRole("link", { name: "Mở catalogue" })).toHaveCount(0);
  await expect(hero.getByRole("link", { name: "Liên hệ báo giá" })).toBeVisible();
  await expect(hero.getByRole("link", { name: "Xem báo giá" })).toHaveCount(0);
  await expect(hero.locator(".material-panels-hero-image")).toBeVisible();
  await expect(hero.locator('source[type="image/avif"]:not([media])')).toHaveAttribute(
    "srcset",
    /material-panels-hero-960\.avif 960w.*material-panels-hero\.avif 1916w/,
  );
  await expect(hero.locator('img[fetchpriority="high"]')).toHaveCount(1);
  await expect(hero.locator("picture")).toHaveCount(1);
  await expect
    .poll(() =>
      hero.locator(".material-panels-hero-image").evaluate((image) => {
        const element = image as HTMLImageElement;
        return element.complete && element.naturalWidth > 0;
      }),
    )
    .toBe(true);
});

test("mobile homepage hero selects the optimized AVIF source", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const image = page.locator("#trang-chu .material-panels-hero-image");
  await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).currentSrc)).toContain("material-panels-hero-mobile-780.avif");
  await expect(image).toHaveAttribute("fetchpriority", "high");
  await expect
    .poll(() =>
      image.evaluate((element) => {
        const imageElement = element as HTMLImageElement;
        return imageElement.naturalWidth === imageElement.getBoundingClientRect().width;
      }),
    )
    .toBe(true);
});

test("homepage does not prefetch the catalogue payload before user intent", async ({
  page,
}) => {
  const catalogueRequests: string[] = [];
  page.on("request", (request) => {
    if (/\/catalogue\/(?:index\.txt|.*\.js)(?:\?|$)/.test(request.url())) {
      catalogueRequests.push(request.url());
    }
  });

  await page.goto("/");
  await page.waitForTimeout(1500);
  expect(catalogueRequests).toEqual([]);
});

test("homepage keeps the branded floating Zalo control visible on every viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  const floatingZalo = page.getByRole("link", { name: "Mở Zalo Tùng Phát" });
  await expect(floatingZalo).toBeVisible();
  await expect(
    floatingZalo.locator('img[src="/images/zalo-contact.png"]'),
  ).toHaveCount(1);
  await expect(floatingZalo).toHaveClass(/floating-zalo/);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(floatingZalo).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Liên hệ nhanh" }),
  ).toBeVisible();
});

test("floating Zalo stays still until the pointer hovers it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  const floatingZalo = page.getByRole("link", { name: "Mở Zalo Tùng Phát" });
  const idleAnimationCount = await floatingZalo.evaluate(
    (element) =>
      element
        .getAnimations({ subtree: true })
        .filter((animation) => animation.playState !== "finished").length,
  );
  expect(idleAnimationCount).toBe(0);

  const restingTransform = await floatingZalo.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  await floatingZalo.hover();
  await expect
    .poll(() =>
      floatingZalo.evaluate((element) => getComputedStyle(element).transform),
    )
    .not.toBe(restingTransform);
});

test("homepage có đủ cấu trúc nội dung chính và chỉ một H1", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  for (const heading of [
    "Danh mục sản phẩm",
    "Mã màu",
    "Lên bản vẽ, cắt CNC và dán chỉ",
    "Địa chỉ",
    "Bài viết nổi bật",
  ]) {
    await expect(
      page.getByRole("heading", { level: 2, name: heading, exact: true }),
    ).toBeVisible();
  }
  const maps = page.locator('iframe[src*="google.com/maps"]');
  await expect(maps).toHaveCount(4);
  const mapEmbeds = await maps.evaluateAll((frames) =>
    frames.map((frame) => ({
      loading: frame.getAttribute("loading"),
      title: frame.getAttribute("title"),
    })),
  );
  expect(mapEmbeds.every((embed) => embed.loading === "lazy")).toBe(true);
  expect(mapEmbeds.every((embed) => embed.title?.startsWith("Google Maps - "))).toBe(true);
});

test("homepage product taxonomy links to the current material and surface routes", async ({ page }) => {
  await page.goto("/");
  const groups = page.locator("#vat-lieu");
  const cards = await groups.locator("article").evaluateAll((items) =>
    items.map((item) => [item.querySelector("h3")?.textContent?.trim(), item.querySelector("h3 a")?.getAttribute("href")]),
  );
  expect(cards).toEqual([
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
  ]);
});

test("homepage links visitors to supplier catalogues and the full catalogue", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("#ma-mau");
  await expect(
    section.getByRole("link", { name: "Mở catalogue" }),
  ).toHaveAttribute("href", "/catalogue/?supplier=thanh-thuy");
  await expect(section.getByRole("link", { name: "Tìm mã khác" })).toHaveAttribute("href", "/catalogue/");
  for (const supplier of ["an-cuong", "ba-thanh", "thanh-thuy"]) {
    await expect(
      section.locator(`a[href="/catalogue/${supplier}/"]`),
    ).toBeVisible();
  }
});

test("CTA báo giá vật liệu có accessible name khớp nhãn hiển thị", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.locator("#trang-chu").getByRole("link", {
      name: "Liên hệ báo giá",
      exact: true,
    }),
  ).toBeVisible();
});

test("homepage removes the utility blocks and keeps contact actions focused", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#requirement-finder")).toHaveCount(0);
  await expect(page.getByText("Công cụ gửi yêu cầu nhanh", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Lợi ích chính", { exact: true })).toHaveCount(0);
  await expect(page.locator("[data-answer-block]")).toHaveCount(0);
});

test("homepage featured-code strip stays horizontal without moving the page vertically", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
    { width: 430, height: 844 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const marquee = page.locator(".color-code-marquee");
    await marquee.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => window.scrollY);
    const track = marquee.locator(".color-code-marquee-track");
    const transformBefore = await track.evaluate((element) => getComputedStyle(element).transform);
    await page.waitForTimeout(350);
    expect(await page.evaluate(() => window.scrollY), `${viewport.width}px scroll`).toBe(before);
    expect(await track.evaluate((element) => getComputedStyle(element).transform), `${viewport.width}px marquee`).not.toBe(transformBefore);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${viewport.width}px overflow`).toBeLessThanOrEqual(1);
  }
});

test("mobile navigation contract supports focus, Escape, and a solid surface", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Mở menu" });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const mobileNavigation = page.getByRole("dialog", {
    name: "Điều hướng di động",
  });
  await expect(mobileNavigation).toBeVisible();
  await expect(
    mobileNavigation.getByRole("link", { name: "Sản phẩm", exact: true }),
  ).toBeFocused();
  const navigationStyles = await mobileNavigation.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      backdropFilter: style.backdropFilter,
    };
  });
  expect(navigationStyles.backgroundColor).toMatch(/^rgb\(/);
  expect(navigationStyles.backdropFilter).toBe("none");
  await page.keyboard.press("Escape");
  await expect(mobileNavigation).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("mobile navigation remains usable up to the desktop breakpoint", async ({
  page,
}) => {
  for (const width of [1024, 1279]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Mở menu" });
    await expect(trigger, `${width}px trigger`).toBeVisible();
    await trigger.click();
    await expect(
      page.getByRole("dialog", { name: "Điều hướng di động" }),
      `${width}px drawer`,
    ).toBeVisible();
    await page.keyboard.press("Escape");
  }

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Mở menu" })).toBeHidden();
  await expect(
    page.getByRole("navigation", { name: "Điều hướng chính" }),
  ).toBeVisible();
});

test("language control lets persisted English users return to Vietnamese", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("tungphat-lang", "en"));
  await page.goto("/chinh-sach-bao-mat/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Privacy Policy" }),
  ).toBeVisible();
  await expect(
    page.getByRole("contentinfo").getByRole("heading", { name: "Materials" }),
  ).toBeAttached();
  const languageControl = page.getByRole("button", { name: "Switch language" });
  await expect(languageControl).toBeVisible();
  await languageControl.click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Chính sách bảo mật" }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
});

test("shared navigation links meet the 44px target contract", async ({
  page,
}) => {
  await page.goto("/go-ghep-cao-su/");
  const targets = [
    page
      .getByRole("navigation", { name: "Breadcrumb" })
      .getByRole("link")
      .first(),
    page.getByRole("contentinfo").getByRole("link", { name: "Ván MDF" }),
    page
      .getByRole("contentinfo")
      .getByRole("link", { name: "Chính sách bảo mật" }),
  ];
  for (const target of targets) {
    const box = await target.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
});

test("footer names the active public hostname", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("contentinfo").getByRole("link", {
      name: "gotungphat.com",
      exact: true,
    }),
  ).toHaveAttribute("href", "/");
});

test("thanh hành động mobile có nền trắng rõ ràng", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const styles = await page
    .getByRole("navigation", { name: "Liên hệ nhanh" })
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        backdropFilter: style.backdropFilter,
      };
    });
  expect(styles.backgroundColor).toBe("rgb(255, 255, 255)");
  expect(styles.backdropFilter).toBe("none");
});

test("thanh hành động mobile không che footer khi cuộn đến cuối trang", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/go-ghep-cao-su/");
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(1_000);
  const actionTop = await page
    .getByRole("navigation", { name: "Liên hệ nhanh" })
    .evaluate((element) => element.getBoundingClientRect().top);
  const footerBottom = await page
    .getByRole("contentinfo")
    .evaluate((element) => element.getBoundingClientRect().bottom);
  expect(footerBottom).toBeLessThanOrEqual(actionTop + 1);
});

test("representative routes không tràn ngang trên các viewport acceptance", async ({
  page,
}) => {
  test.setTimeout(90_000);
  for (const route of representativeRoutes) {
    for (const viewport of acceptanceViewports) {
      await page.setViewportSize(viewport);
      await page.goto(route);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(
        overflow,
        `${route} at ${viewport.width}x${viewport.height}`,
      ).toBeLessThanOrEqual(1);
    }
  }
});

test("robots, sitemap, Vercel admin redirect và 404 đúng", async ({
  page,
  request,
}) => {
  const robots = await request.get("/robots.txt");
  const robotsText = await robots.text();
  if (isReleaseStaging) {
    expect(robotsText).toContain("Allow: /");
    expect(robotsText).not.toContain("Sitemap:");
    expect(robots.headers()["x-robots-tag"]).toContain("noindex");
  } else {
    expect(robotsText).toContain(
      "Sitemap: https://gotungphat.com/sitemap.xml",
    );
  }
  const sitemap = await request.get("/sitemap.xml");
  const xml = await sitemap.text();
  expect(xml).toContain("https://gotungphat.com/go-ghep");
  for (const route of [
    "/san-pham/an-cuong",
    "/san-pham/thanh-thuy",
    "/san-pham/ba-thanh",
    "/san-pham/kes",
  ])
    expect(xml).not.toContain(`<loc>https://gotungphat.com${route}/</loc>`);
  for (const route of [
    "/catalogue/an-cuong",
    "/catalogue/thanh-thuy",
    "/catalogue/ba-thanh",
  ])
    expect(xml).toContain(`<loc>https://gotungphat.com${route}/</loc>`);
  for (const route of ["melamine", "laminate", "acrylic"])
    expect(xml).toContain(
      `<loc>https://gotungphat.com/catalogue/an-cuong/${route}/</loc>`,
    );
  expect(xml).toContain("https://gotungphat.com/bao-gia/");
  expect(xml).not.toContain("https://gotungphat.com/cms-preview");
  expect(xml).not.toContain("/admin");
  expect(xml).not.toContain("__empty-collection");
  expect(
    await request
      .get("/bai-viet/__empty-collection/")
      .then((response) => response.status()),
  ).toBe(404);
  expect(
    await request
      .get("/du-an/__empty-collection/")
      .then((response) => response.status()),
  ).toBe(404);
  const redirects = JSON.parse(readFileSync("vercel.json", "utf8")).redirects;
  expect(redirects).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        source: "/admin",
        destination: "https://cms.mdftungphat.com",
        permanent: true,
      }),
      expect.objectContaining({
        source: "/admin/:path*",
        destination: "https://cms.mdftungphat.com",
        permanent: true,
      }),
    ]),
  );
  const missing = await page.goto("/khong-ton-tai/");
  expect(missing?.status()).toBe(404);
});

test("quote route is indexable while CMS preview stays noindex", async ({ page }) => {
  await page.goto("/bao-gia/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index/i);

  await page.goto("/cms-preview/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/i);
});

test("404 chỉ hiện footer sau khi người dùng cuộn trên desktop và mobile", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/khong-ton-tai/");

    const footer = page.getByRole("contentinfo");
    const footerTop = await footer.evaluate(
      (element) => element.getBoundingClientRect().top,
    );
    expect(footerTop).toBeGreaterThanOrEqual(viewport.height - 1);

    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeInViewport();
  }
});

test("404 dùng ảnh responsive và có hai đường thoát rõ ràng", async ({
  page,
}) => {
  const response = await page.goto("/khong-ton-tai/");

  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Trang này không tồn tại",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Về trang chủ" }),
  ).toHaveAttribute("href", "/");
  await expect(
    page.getByRole("link", { name: "Xem catalogue" }),
  ).toHaveAttribute("href", "/catalogue/");
  await expect(page.locator("main picture source")).toHaveAttribute(
    "srcset",
    "/images/404-mobile.webp",
  );
  await expect(page.locator("main picture img")).toHaveAttribute(
    "src",
    "/images/404-desktop.webp",
  );
});

test("404 keeps content visible and background coverage stable across viewports", async ({
  page,
}) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1280, height: 800 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/khong-ton-tai/");

    const stage = page.getByTestId("not-found-stage");
    const heading = page.getByRole("heading", {
      level: 1,
      name: "Trang này không tồn tại",
      exact: true,
    });
    const homeLink = page.getByRole("link", { name: "Về trang chủ" });
    const catalogueLink = page.getByRole("link", { name: "Xem catalogue" });
    const stageBox = await stage.boundingBox();
    const headingBox = await heading.boundingBox();

    expect(stageBox).not.toBeNull();
    expect(headingBox).not.toBeNull();
    expect(stageBox!.width).toBeGreaterThanOrEqual(viewport.width - 1);
    expect(stageBox!.height).toBeGreaterThan(viewport.height * 0.75);
    expect(headingBox!.x).toBeGreaterThanOrEqual(0);
    expect(headingBox!.x + headingBox!.width).toBeLessThanOrEqual(viewport.width);
    expect(headingBox!.y).toBeGreaterThanOrEqual(0);
    expect(headingBox!.y + headingBox!.height).toBeLessThanOrEqual(
      viewport.height,
    );
    await expect(homeLink).toBeInViewport();
    await expect(catalogueLink).toBeInViewport();

    const layout = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      stagePosition: getComputedStyle(
        document.querySelector('[data-testid="not-found-stage"]')!,
      ).position,
    }));
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.stagePosition).toBe("sticky");
  }

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/khong-ton-tai/");

  const stage = page.getByTestId("not-found-stage");
  const footer = page.getByRole("contentinfo");

  await page.evaluate(() => window.scrollTo(0, 200));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(200);

  const stageDuringScroll = await stage.boundingBox();
  expect(stageDuringScroll).not.toBeNull();
  expect(stageDuringScroll!.y).toBeLessThanOrEqual(0);
  expect(stageDuringScroll!.y + stageDuringScroll!.height).toBeGreaterThanOrEqual(
    700,
  );

  await footer.scrollIntoViewIfNeeded();
  await expect(footer).toBeInViewport();
});

test("404 phủ kín mép trên mà không lộ nền body", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/khong-ton-tai/");

  const sceneTop = await page
    .getByTestId("not-found-scene")
    .evaluate((element) => element.getBoundingClientRect().top);

  expect(Math.abs(sceneTop)).toBeLessThanOrEqual(4);
});

test("trang liên hệ trực tiếp không có lỗi accessibility nghiêm trọng", async ({
  page,
}) => {
  await page.goto("/bao-gia/");
  const results = await new AxeBuilder({ page })
    .disableRules(["color-contrast"])
    .analyze();
  expect(
    results.violations.filter(
      (violation) =>
        violation.impact === "critical" || violation.impact === "serious",
    ),
  ).toEqual([]);
});

test("homepage không có lỗi accessibility nghiêm trọng", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter(
      (violation) =>
        violation.impact === "critical" || violation.impact === "serious",
    ),
  ).toEqual([]);
});

test("representative routes meet accessibility without serious or critical violations", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of [
    "/go-ghep-cao-su/",
    "/van-mdf/",
    "/gia-cong-cnc/",
    "/san-pham/an-cuong/",
    "/lien-he/",
    "/chinh-sach-bao-mat/",
  ]) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter(
        (violation) =>
          violation.impact === "critical" || violation.impact === "serious",
      ),
      route,
    ).toEqual([]);
  }
});

test("frontend công khai không tải Turnstile hoặc Forms API", async ({
  page,
}) => {
  const unexpectedRequests: string[] = [];
  page.on("request", (request) => {
    if (
      /challenges\.cloudflare\.com\/turnstile|cms\.mdftungphat\.com\/api\/(contact|quote)/i.test(
        request.url(),
      )
    ) {
      unexpectedRequests.push(request.url());
    }
  });

  for (const route of [
    "/",
    "/lien-he/",
    "/bao-gia/",
    "/go-ghep/",
    "/cat-cnc-go/",
  ]) {
    await page.goto(route, { waitUntil: "networkidle" });
    await expect(
      page.locator('.cf-turnstile, script[src*="turnstile"]'),
    ).toHaveCount(0);
    if (route !== "/") await expect(page.locator("form")).toHaveCount(0);
  }

  expect(unexpectedRequests).toEqual([]);
});

test("trang báo giá công khai hướng khách tới Zalo và điện thoại", async ({
  page,
}) => {
  await page.goto("/bao-gia/");

  await expect(page.locator("form")).toHaveCount(0);
  await expect(page.locator('a[href^="https://baogia.mdftungphat.com"]')).toHaveCount(0);
  const zaloLinks = page.getByRole("link", { name: /Gửi quy cách qua Zalo/ });
  await expect(zaloLinks).toHaveCount(2);
  for (const link of await zaloLinks.all()) {
    await expect(link).toHaveAttribute("href", /^https:\/\/zalo\.me\//);
  }
  await expect(page.locator('a[href^="tel:"]').first()).toBeVisible();
});

test("preview shell không tự gửi Analytics và không render draft ngoài CMS tin cậy", async ({
  page,
}) => {
  const analyticsRequests: string[] = [];
  page.on("request", (request) => {
    if (
      /\/api\/analytics\/track|google-analytics\.com|googletagmanager\.com/i.test(
        request.url(),
      )
    )
      analyticsRequests.push(request.url());
  });
  const response = await page.goto("/cms-preview/", {
    waitUntil: "networkidle",
  });
  expect(response?.status()).toBe(200);
  await expect(
    page.getByText("Mở một nội dung trong CMS để xem bản nháp."),
  ).toBeVisible();
  await expect(page.locator("[data-cms-preview='true']")).toHaveCount(0);
  expect(analyticsRequests).toEqual([]);
});

test("ngân sách Web Vitals lab không regression rõ rệt", async ({ page }) => {
  await page.addInitScript(() => {
    const store = { lcp: 0, cls: 0 };
    Object.assign(window, { __vitals: store });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) store.lcp = entry.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const item = entry as PerformanceEntry & {
          hadRecentInput?: boolean;
          value?: number;
        };
        if (!item.hadRecentInput) store.cls += item.value || 0;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto("/", { waitUntil: "networkidle" });
  const metrics = await page.evaluate(
    () =>
      (window as Window & { __vitals: { lcp: number; cls: number } }).__vitals,
  );
  expect(metrics.lcp).toBeLessThan(4_000);
  expect(metrics.cls).toBeLessThan(0.1);
});

test("Trustindex review slider renders current source data and remains usable on mobile", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const section = page.locator("[data-trustindex-reviews]");
  await expect(section).toBeVisible();
  await expect(page.getByRole("heading", { name: "Đánh giá từ Trustindex" })).toHaveCount(0);
  await expect(section.getByText("Phản hồi khách hàng được Trustindex công khai từ Google cho Tùng Phát.", { exact: true })).toHaveCount(0);
  await expect(section).toContainText("4.8");
  await expect(section).toContainText("26 đánh giá");
  await expect(section).toContainText("Thuy Pham");
  await expect(section).toContainText("Đa dạng sản phẩm, sản xuất nhanh");
  const renderedReviewers = await section
    .locator("[data-trustindex-card] h3")
    .allTextContents();
  const sourceReviewers = new Set(
    trustindexReviews.reviews.map((review) => review.reviewerName),
  );
  expect(renderedReviewers.length).toBeGreaterThan(0);
  expect(renderedReviewers.every((reviewer) => sourceReviewers.has(reviewer.trim()))).toBe(true);
  await expect(section.locator("[data-trustindex-card]").first()).not.toContainText("svgsvg");
  await expect(section.getByRole("link", { name: /Google/i }).first()).toHaveAttribute("href", /google\.com\/maps/);
  await expect(section.getByText("Nguồn đánh giá Google")).toBeVisible();
  const sourceLinks = section.locator('a:has-text("Google")');
  const sourceHrefs = await sourceLinks.evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).href));
  expect(sourceHrefs.length).toBeGreaterThanOrEqual(3);
  expect(sourceHrefs.every((href) => href.startsWith("https://www.google.com/maps/"))).toBe(true);
  expect(sourceHrefs.some((href) => href.includes("gotungphat.com"))).toBe(false);
  const previous = section.getByRole("button", { name: "Đánh giá trước" });
  const next = section.getByRole("button", { name: "Đánh giá tiếp theo" });
  const rail = section.locator("[data-trustindex-rail]");
  await expect(rail).toHaveAttribute("data-active-index", "0");
  await section.scrollIntoViewIfNeeded();
  await expect.poll(() => rail.getAttribute("data-active-index"), { timeout: 7_000 }).toBe("1");
  await previous.click();
  await expect(rail).toHaveAttribute("data-active-index", "0");
  await next.click();
  await expect(rail).toHaveAttribute("data-active-index", "1");
  await previous.click();
  await expect(rail).toHaveAttribute("data-active-index", "0");
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileLayout = await page.evaluate(() => {
    const rail = document.querySelector<HTMLElement>("[data-trustindex-rail]");
    const wrap = document.querySelector<HTMLElement>("[data-trustindex-viewport]");
    return {
      pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
      oneCardVisible: Boolean(rail && wrap && rail.querySelector<HTMLElement>("[data-trustindex-card]")?.getBoundingClientRect().width && rail.querySelector<HTMLElement>("[data-trustindex-card]")!.getBoundingClientRect().width <= wrap.clientWidth * 1.05),
    };
  });
  expect(mobileLayout.pageOverflow).toBeLessThanOrEqual(1);
  expect(mobileLayout.oneCardVisible).toBe(true);
});

test("Trustindex review slider has no serious accessibility violations", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const results = await new AxeBuilder({ page })
    .include("[data-trustindex-reviews]")
    .analyze();
  expect(
    results.violations.filter(
      (violation) =>
        violation.impact === "critical" || violation.impact === "serious",
    ),
  ).toEqual([]);
});
