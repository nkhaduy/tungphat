import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";

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
  const path = new URL(value, "https://mdftungphat.com").pathname;
  return path === "/" ? path : `${path.replace(/\/+$/, "")}/`;
}

async function pageErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("Turnstile"))
      errors.push(message.text());
  });
  return errors;
}
const apiPayload = (overrides: Record<string, unknown> = {}) => ({
  submission_id: crypto.randomUUID(),
  full_name: "Khách kiểm thử",
  phone: "0909259160",
  material: "Ván MDF",
  consent: true,
  website: "",
  turnstile_token:
    process.env.E2E_TURNSTILE_TOKEN || "XXXX.DUMMY.TOKEN.XXXX",
  source_url: "https://mdftungphat.com/bao-gia/",
  referrer: "",
  ...overrides,
});

function apiRoute(path: string, baseURL?: string) {
  return new URL(baseURL || "http://127.0.0.1:4173").hostname ===
    "mdftungphat.com"
    ? `${path}/`
    : path;
}

function usesProductionTurnstile(baseURL?: string) {
  return (
    new URL(baseURL || "http://127.0.0.1:4173").hostname ===
      "mdftungphat.com" && !process.env.E2E_TURNSTILE_TOKEN
  );
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

test("shared header is transparent over the first section and solid after scroll", async ({
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
      "rgba(0, 0, 0, 0)",
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
      .not.toBe("rgba(0, 0, 0, 0)");
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
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }),
      route,
    ).toBeVisible();
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

test("homepage có hero vật liệu editorial, CTA gọn và một ảnh LCP ưu tiên", async ({
  page,
}) => {
  await page.goto("/");
  const hero = page.locator("#trang-chu");
  await expect(
    hero.getByRole("heading", {
      level: 1,
      name: "Vật liệu gỗ và gia công CNC tại Thủ Đức",
    }),
  ).toBeVisible();
  await expect(hero.getByRole("link")).toHaveCount(3);
  await expect(hero.getByRole("link", { name: "Xem vật liệu" })).toBeVisible();
  await expect(hero.getByRole("link", { name: "Mở catalogue" })).toBeVisible();
  await expect(hero.getByRole("link", { name: "Gửi quy cách qua Zalo" })).toBeVisible();
  await expect(hero.getByRole("link", { name: "Xem báo giá" })).toHaveCount(0);
  await expect(hero.locator(".material-panels-hero-image")).toBeVisible();
  await expect(hero.locator('source[type="image/avif"]')).toHaveAttribute(
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

test("homepage uses the branded floating Zalo control only outside mobile", async ({
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
  await expect(floatingZalo).toBeHidden();
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
    "MDF, MFC, Plywood và gỗ ghép",
    "Mã màu và bề mặt",
    "Cắt và gia công CNC theo quy cách",
    "Xưởng và chi nhánh tại Thủ Đức",
    "Kiến thức vật liệu và CNC",
  ]) {
    await expect(
      page.getByRole("heading", { level: 2, name: heading }),
    ).toBeVisible();
  }
  await expect(page.locator('iframe[src*="google.com/maps"]')).toHaveCount(0);
});

test("CTA báo giá vật liệu có accessible name khớp nhãn hiển thị", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", {
      name: "Gửi quy cách qua Zalo",
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
    mobileNavigation.getByRole("link", { name: "Vật liệu", exact: true }),
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
  expect(await robots.text()).toContain(
    "Sitemap: https://mdftungphat.com/sitemap.xml",
  );
  const sitemap = await request.get("/sitemap.xml");
  const xml = await sitemap.text();
  expect(xml).toContain("https://mdftungphat.com/go-ghep");
  for (const route of [
    "/san-pham/an-cuong",
    "/san-pham/thanh-thuy",
    "/san-pham/ba-thanh",
    "/san-pham/kes",
  ])
    expect(xml).not.toContain(`<loc>https://mdftungphat.com${route}/</loc>`);
  for (const route of [
    "/catalogue/an-cuong",
    "/catalogue/thanh-thuy",
    "/catalogue/ba-thanh",
  ])
    expect(xml).toContain(`<loc>https://mdftungphat.com${route}/</loc>`);
  for (const route of ["melamine", "laminate", "acrylic"])
    expect(xml).toContain(
      `<loc>https://mdftungphat.com/catalogue/an-cuong/${route}/</loc>`,
    );
  expect(xml).toContain("https://mdftungphat.com/bao-gia/");
  expect(xml).not.toContain("https://mdftungphat.com/cms-preview");
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

test("API từ chối origin khác và không lộ stack trace", async ({ request }) => {
  const response = await request.post("/api/quote", {
    headers: {
      Origin: "https://attacker.example",
      "Content-Type": "application/json",
    },
    data: {},
  });
  expect(response.status()).toBe(403);
  const body = await response.text();
  expect(body).not.toMatch(/stack|node_modules|Error:/i);
});

test("API trả CORS preflight chính xác cho origin được phép", async ({
  request,
  baseURL,
}) => {
  const origin = new URL(baseURL || "http://127.0.0.1:4173").origin;
  const response = await request.fetch(apiRoute("/api/contact", baseURL), {
    method: "OPTIONS",
    headers: {
      Origin: origin,
      "Access-Control-Request-Method": "POST",
    },
  });
  expect(response.status()).toBe(204);
  expect(response.headers()["access-control-allow-origin"]).toBe(origin);
  expect(response.headers()["access-control-allow-methods"]).toBe(
    "POST, OPTIONS",
  );
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(
    response.headers()["access-control-allow-credentials"],
  ).toBeUndefined();
});

test("API validation và rate limit hoạt động", async ({ request, baseURL }) => {
  const origin = new URL(baseURL || "http://127.0.0.1:4173").origin;
  const quoteRoute = apiRoute("/api/quote", baseURL);
  const contactRoute = apiRoute("/api/contact", baseURL);
  const invalid = await request.post(quoteRoute, {
    headers: { Origin: origin },
    data: { consent: false },
  });
  expect(invalid.status()).toBe(400);
  expect(await invalid.json()).toMatchObject({ code: "validation_failed" });
  const quoteWithoutMaterial = await request.post(quoteRoute, {
    headers: { Origin: origin },
    data: apiPayload({ material: "" }),
  });
  expect(quoteWithoutMaterial.status()).toBe(400);
  expect(await quoteWithoutMaterial.json()).toMatchObject({ code: "validation_failed" });
  const contactWithoutMessage = await request.post(contactRoute, {
    headers: { Origin: origin },
    data: apiPayload({ message: "" }),
  });
  expect(contactWithoutMessage.status()).toBe(400);
  expect(await contactWithoutMessage.json()).toMatchObject({ code: "validation_failed" });

  if (usesProductionTurnstile(baseURL)) {
    const protectedSubmission = await request.post(quoteRoute, {
      headers: { Origin: origin },
      data: apiPayload(),
    });
    expect(protectedSubmission.status()).toBe(400);
    expect(await protectedSubmission.json()).toMatchObject({
      code: "verification_failed",
    });
    return;
  }

  const rateIdentity = `e2e-rate-${Date.now()}`;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await request.post(quoteRoute, {
      headers: { Origin: origin, "CF-Connecting-IP": rateIdentity },
      data: apiPayload(),
    });
    expect(response.status()).toBe(201);
  }
  const limited = await request.post(quoteRoute, {
    headers: { Origin: origin, "CF-Connecting-IP": rateIdentity },
    data: apiPayload(),
  });
  expect(limited.status()).toBe(429);
  expect(await limited.json()).toMatchObject({ code: "rate_limited" });
});

test("API nhận submission idempotent mà không tạo lead lặp", async ({
  request,
  baseURL,
}) => {
  test.skip(
    usesProductionTurnstile(baseURL),
    "Production requires a real Turnstile token for lead-creation tests.",
  );
  const origin = new URL(baseURL || "http://127.0.0.1:4173").origin;
  const submissionId = crypto.randomUUID();
  const headers = {
    Origin: origin,
    "CF-Connecting-IP": `e2e-duplicate-${Date.now()}`,
  };
  const quoteRoute = apiRoute("/api/quote", baseURL);
  const first = await request.post(quoteRoute, {
    headers,
    data: apiPayload({ submission_id: submissionId }),
  });
  expect(first.status()).toBe(201);
  const second = await request.post(quoteRoute, {
    headers,
    data: apiPayload({ submission_id: submissionId }),
  });
  expect(second.status()).toBe(200);
  expect(await second.json()).toMatchObject({ ok: true, duplicate: true });
});

test("payload kiểu SQL injection không làm thay đổi schema", async ({
  request,
  baseURL,
}) => {
  test.skip(
    usesProductionTurnstile(baseURL),
    "Production requires a real Turnstile token for lead-creation tests.",
  );
  const origin = new URL(baseURL || "http://127.0.0.1:4173").origin;
  const headers = {
    Origin: origin,
    "CF-Connecting-IP": `e2e-sql-${Date.now()}`,
  };
  const contactRoute = apiRoute("/api/contact", baseURL);
  const injected = await request.post(contactRoute, {
    headers,
    data: apiPayload({
      full_name: "Robert'); DROP TABLE leads;--",
      message: "Kiểm tra query binding",
    }),
  });
  expect(injected.status()).toBe(201);
  const after = await request.post(contactRoute, {
    headers,
    data: apiPayload({
      full_name: "Kiểm tra bảng còn tồn tại",
      message: "Yêu cầu thứ hai",
    }),
  });
  expect(after.status()).toBe(201);
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
  await expect(section.getByText("Lưu Phúc Điền", { exact: true })).toBeVisible();
  await expect(section.locator("[data-trustindex-card]").first()).not.toContainText("svgsvg");
  await expect(section.getByRole("link", { name: /Google/i }).first()).toHaveAttribute("href", /google\.com\/maps/);
  await expect(section.getByText("Verified by Trustindex")).toBeVisible();
  const previous = section.getByRole("button", { name: "Đánh giá trước" });
  const next = section.getByRole("button", { name: "Đánh giá tiếp theo" });
  const rail = section.locator("[data-trustindex-rail]");
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
