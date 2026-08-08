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
  "/san-pham/thanh-thuy/",
  "/san-pham/ba-thanh/",
  "/san-pham/kes/",
  "/catalogue/an-cuong/",
  "/catalogue/thanh-thuy/",
  "/catalogue/ba-thanh/",
  "/bao-gia/",
  "/du-an/",
  "/bai-viet/",
  "/lien-he/",
  "/chinh-sach-bao-mat/",
  "/dieu-khoan-su-dung/"
];
const representativeRoutes = [
  "/",
  "/go-ghep-cao-su/",
  "/van-mdf/",
  "/gia-cong-cnc/",
  "/san-pham/an-cuong/",
  "/catalogue/an-cuong/",
  "/lien-he/",
  "/chinh-sach-bao-mat/",
  "/bai-viet/"
];
const acceptanceViewports = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 }
];

function normalizedPath(value: string) {
  const path = new URL(value, "https://mdftungphat.com").pathname;
  return path === "/" ? path : `${path.replace(/\/+$/, "")}/`;
}

async function pageErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("Turnstile")) errors.push(message.text());
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
  turnstile_token: "XXXX.DUMMY.TOKEN.XXXX",
  source_url: "http://127.0.0.1:4173/bao-gia/",
  referrer: "",
  ...overrides
});

test("các route chính trả về trang có H1, canonical và không có lỗi console", async ({ page }) => {
  const errors = await pageErrors(page);
  for (const route of publicRoutes) {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status(), route).toBe(200);
    await expect(page.getByRole("heading", { level: 1 }), route).toHaveCount(1);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical, route).not.toBeNull();
    expect(normalizedPath(canonical || "/"), route).toBe(route);
  }
  expect(errors).toEqual([]);
});

test("shared site contract uses solid light chrome without blur", async ({ page }) => {
  for (const route of representativeRoutes) {
    await page.goto(route);
    const header = page.getByRole("banner");
    const footer = page.getByRole("contentinfo");
    await expect(header, route).toBeVisible();
    await expect(footer, route).toBeAttached();

    const headerStyles = await header.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        backdropFilter: style.backdropFilter,
        webkitBackdropFilter: style.getPropertyValue("-webkit-backdrop-filter")
      };
    });
    const footerBackground = await footer.evaluate((element) => getComputedStyle(element).backgroundColor);

    expect(headerStyles.backgroundColor, route).toMatch(/^rgb\(/);
    expect(headerStyles.backgroundColor, route).not.toBe("rgba(0, 0, 0, 0)");
    expect(headerStyles.backdropFilter, route).toBe("none");
    expect(headerStyles.webkitBackdropFilter || "none", route).toBe("none");
    expect(footerBackground, route).toMatch(/^rgb\((2[3-5]\d|255), (2[3-5]\d|255), (2[3-5]\d|255)\)$/);
  }
});

test("brand hero preserves the full logo without cropping", async ({ page }) => {
  await page.goto("/san-pham/an-cuong/");
  const logo = page.getByRole("img", { name: "Logo An Cường" });
  await expect(logo).toBeVisible();
  expect(await logo.evaluate((image) => getComputedStyle(image).objectFit)).toBe("contain");
});

test("representative routes expose breadcrumbs, intact images, and no horizontal overflow", async ({ page }) => {
  const errors = await pageErrors(page);
  for (const route of representativeRoutes.filter((route) => route !== "/")) {
    await page.goto(route, { waitUntil: "networkidle" });
    await expect(page.getByRole("navigation", { name: "Breadcrumb" }), route).toBeVisible();
    const brokenImages = await page.locator("img").evaluateAll((images) => images.filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.getAttribute("src")));
    expect(brokenImages, route).toEqual([]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, route).toBeLessThanOrEqual(1);
  }
  expect(errors).toEqual([]);
});

test("homepage có hero tĩnh sáng, CTA chính và chỉ ưu tiên ảnh CNC mở đầu", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator("#trang-chu");
  await expect(hero.getByRole("heading", { level: 1, name: "Ván gỗ công nghiệp & gia công CNC tại TP.HCM" })).toBeVisible();
  await expect(hero.getByRole("link", { name: "Gửi quy cách nhận báo giá" })).toBeVisible();
  await expect(hero.getByRole("link", { name: "Xem catalogue" })).toBeVisible();
  await expect(hero.getByRole("img", { name: /Máy CNC/ })).toBeVisible();
  await expect(hero.locator('img[fetchpriority="high"]')).toHaveCount(1);
  await expect(hero.locator("picture")).toHaveCount(0);
});

test("homepage uses the branded floating Zalo control only outside mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  const floatingZalo = page.getByRole("link", { name: "Mở Zalo Tùng Phát" });
  await expect(floatingZalo).toBeVisible();
  await expect(floatingZalo.locator('img[src="/images/zalo-contact.png"]')).toHaveCount(1);
  await expect(floatingZalo).toHaveClass(/floating-zalo/);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(floatingZalo).toBeHidden();
  await expect(page.getByRole("navigation", { name: "Liên hệ nhanh" })).toBeVisible();
});

test("homepage có đủ cấu trúc nội dung chính và chỉ một H1", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  for (const heading of [
    "Bạn đang cần gì?",
    "Danh mục vật liệu chính",
    "Năng lực gia công CNC",
    "Gửi file và quy cách để nhận báo giá",
    "Quy cách vật liệu thường được hỏi",
    "Chọn vật liệu theo nhu cầu",
    "Đơn hàng và thành phẩm thực tế tại Tùng Phát",
    "Các thương hiệu vật liệu Tùng Phát đang cung cấp",
    "Hệ thống hai chi nhánh tại TP.HCM"
  ]) {
    await expect(page.getByRole("heading", { level: 2, name: heading })).toBeVisible();
  }
  await expect(page.locator('iframe[src*="google.com/maps"]')).toHaveCount(0);
});

test("CTA báo giá vật liệu có accessible name khớp nhãn hiển thị", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Kiểm tra hàng / báo giá Ván MDF", exact: true })).toBeVisible();
});

test("requirement finder tạo nội dung có cấu trúc mà không gọi Forms API", async ({ page }) => {
  const formRequests: string[] = [];
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => undefined }
    });
    window.open = () => null;
  });
  page.on("request", (request) => {
    if (/\/api\/(quote|contact)|cms\.mdftungphat\.com\/api\/(quote|contact)/i.test(request.url())) formRequests.push(request.url());
  });

  await page.goto("/");
  const finder = page.locator("#requirement-finder");
  await expect(finder.getByRole("heading", { level: 2, name: "Tìm đúng vật liệu hoặc dịch vụ trong 30 giây" })).toBeVisible();
  await finder.getByRole("button", { name: "Gia công CNC theo file" }).click();
  await finder.getByRole("button", { name: "MDF chống ẩm" }).click();
  await finder.getByLabel("Độ dày").fill("18 mm");
  await finder.getByLabel("Kích thước").fill("600 x 1200 mm");
  await finder.getByLabel("Số lượng").fill("12 chi tiết");
  await finder.getByLabel("Nội dung yêu cầu").fill("Soi rãnh theo file DXF");
  await finder.getByLabel("Số điện thoại hoặc Zalo").fill("0909259160");
  await finder.getByRole("button", { name: "Chuẩn bị nội dung và mở Zalo" }).click();
  await expect(finder.getByRole("status")).toContainText("Đã chuẩn bị nội dung");
  expect(formRequests).toEqual([]);
});

test("mobile navigation contract supports focus, Escape, and a solid surface", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Mở menu" });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const mobileNavigation = page.getByRole("dialog", { name: "Điều hướng di động" });
  await expect(mobileNavigation).toBeVisible();
  await expect(mobileNavigation.getByRole("link", { name: "Vật liệu", exact: true })).toBeFocused();
  const navigationStyles = await mobileNavigation.evaluate((element) => {
    const style = getComputedStyle(element);
    return { backgroundColor: style.backgroundColor, backdropFilter: style.backdropFilter };
  });
  expect(navigationStyles.backgroundColor).toMatch(/^rgb\(/);
  expect(navigationStyles.backdropFilter).toBe("none");
  await page.keyboard.press("Escape");
  await expect(mobileNavigation).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("mobile navigation remains usable up to the desktop breakpoint", async ({ page }) => {
  for (const width of [1024, 1279]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Mở menu" });
    await expect(trigger, `${width}px trigger`).toBeVisible();
    await trigger.click();
    await expect(page.getByRole("dialog", { name: "Điều hướng di động" }), `${width}px drawer`).toBeVisible();
    await page.keyboard.press("Escape");
  }

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Mở menu" })).toBeHidden();
  await expect(page.getByRole("navigation", { name: "Điều hướng chính" })).toBeVisible();
});

test("language control lets persisted English users return to Vietnamese", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("tungphat-lang", "en"));
  await page.goto("/chinh-sach-bao-mat/");
  await expect(page.getByRole("heading", { level: 1, name: "Privacy Policy" })).toBeVisible();
  await expect(page.getByRole("contentinfo").getByRole("heading", { name: "Materials" })).toBeAttached();
  const languageControl = page.getByRole("button", { name: "Switch language" });
  await expect(languageControl).toBeVisible();
  await languageControl.click();
  await expect(page.getByRole("heading", { level: 1, name: "Chính sách bảo mật" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
});

test("shared navigation links meet the 44px target contract", async ({ page }) => {
  await page.goto("/go-ghep-cao-su/");
  const targets = [
    page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link").first(),
    page.getByRole("contentinfo").getByRole("link", { name: "Ván MDF" }),
    page.getByRole("contentinfo").getByRole("link", { name: "Chính sách bảo mật" })
  ];
  for (const target of targets) {
    const box = await target.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
});

test("thanh hành động mobile có nền trắng rõ ràng", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const styles = await page.getByRole("navigation", { name: "Liên hệ nhanh" }).evaluate((element) => {
    const style = getComputedStyle(element);
    return { backgroundColor: style.backgroundColor, backdropFilter: style.backdropFilter };
  });
  expect(styles.backgroundColor).toBe("rgb(255, 255, 255)");
  expect(styles.backdropFilter).toBe("none");
});

test("thanh hành động mobile không che footer khi cuộn đến cuối trang", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/go-ghep-cao-su/");
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1_000);
  const actionTop = await page.getByRole("navigation", { name: "Liên hệ nhanh" }).evaluate((element) => element.getBoundingClientRect().top);
  const footerBottom = await page.getByRole("contentinfo").evaluate((element) => element.getBoundingClientRect().bottom);
  expect(footerBottom).toBeLessThanOrEqual(actionTop + 1);
});

test("representative routes không tràn ngang trên các viewport acceptance", async ({ page }) => {
  for (const route of representativeRoutes) {
    for (const viewport of acceptanceViewports) {
      await page.setViewportSize(viewport);
      await page.goto(route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${route} at ${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(1);
    }
  }
});

test("robots, sitemap, Vercel admin redirect và 404 đúng", async ({ page, request }) => {
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("Sitemap: https://mdftungphat.com/sitemap.xml");
  const sitemap = await request.get("/sitemap.xml");
  const xml = await sitemap.text();
  expect(xml).toContain("https://mdftungphat.com/go-ghep");
  for (const route of [
    "/san-pham/an-cuong",
    "/san-pham/thanh-thuy",
    "/san-pham/ba-thanh",
    "/san-pham/kes",
    "/catalogue/an-cuong",
    "/catalogue/thanh-thuy",
    "/catalogue/ba-thanh"
  ]) expect(xml).not.toContain(`https://mdftungphat.com${route}`);
  expect(xml).not.toContain("https://mdftungphat.com/bao-gia");
  expect(xml).not.toContain("https://mdftungphat.com/cms-preview");
  expect(xml).not.toContain("/admin");
  expect(xml).not.toContain("__empty-collection");
  expect(await request.get("/bai-viet/__empty-collection/").then((response) => response.status())).toBe(404);
  expect(await request.get("/du-an/__empty-collection/").then((response) => response.status())).toBe(404);
  const redirects = JSON.parse(readFileSync("vercel.json", "utf8")).redirects;
  expect(redirects).toEqual(expect.arrayContaining([
    expect.objectContaining({ source: "/admin", destination: "https://cms.mdftungphat.com", permanent: true }),
    expect.objectContaining({ source: "/admin/:path*", destination: "https://cms.mdftungphat.com", permanent: true })
  ]));
  const missing = await page.goto("/khong-ton-tai/");
  expect(missing?.status()).toBe(404);
});

test("direct quote and CMS preview routes stay noindex", async ({ page }) => {
  for (const route of ["/bao-gia/", "/cms-preview/"]) {
    await page.goto(route);
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots, route).toMatch(/noindex/i);
  }
});

test("404 chỉ hiện footer sau khi người dùng cuộn trên desktop và mobile", async ({ page }) => {
  for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/khong-ton-tai/");

    const footer = page.getByRole("contentinfo");
    const footerTop = await footer.evaluate((element) => element.getBoundingClientRect().top);
    expect(footerTop).toBeGreaterThanOrEqual(viewport.height - 1);

    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeInViewport();
  }
});

test("trang liên hệ trực tiếp không có lỗi accessibility nghiêm trọng", async ({ page }) => {
  await page.goto("/bao-gia/");
  const results = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
  expect(results.violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious")).toEqual([]);
});

test("homepage không có lỗi accessibility nghiêm trọng", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious")).toEqual([]);
});

test("representative routes meet accessibility without serious or critical violations", async ({ page }) => {
  for (const route of ["/go-ghep-cao-su/", "/van-mdf/", "/gia-cong-cnc/", "/san-pham/an-cuong/", "/lien-he/", "/chinh-sach-bao-mat/"]) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious"), route).toEqual([]);
  }
});

test("API từ chối origin khác và không lộ stack trace", async ({ request }) => {
  const response = await request.post("/api/quote", { headers: { Origin: "https://attacker.example", "Content-Type": "application/json" }, data: {} });
  expect(response.status()).toBe(403);
  const body = await response.text();
  expect(body).not.toMatch(/stack|node_modules|Error:/i);
});

test("API trả CORS preflight chính xác cho origin được phép", async ({ request }) => {
  const response = await request.fetch("/api/contact", { method: "OPTIONS", headers: { Origin: "http://127.0.0.1:4173", "Access-Control-Request-Method": "POST" } });
  expect(response.status()).toBe(204);
  expect(response.headers()["access-control-allow-origin"]).toBe("http://127.0.0.1:4173");
  expect(response.headers()["access-control-allow-methods"]).toBe("POST, OPTIONS");
  expect(response.headers()["vary"]).toContain("Origin");
  expect(response.headers()["access-control-allow-credentials"]).toBeUndefined();
});

test("API validation và rate limit hoạt động", async ({ request }) => {
  const origin = "http://127.0.0.1:4173";
  const invalid = await request.post("/api/quote", { headers: { Origin: origin }, data: { consent: false } });
  expect(invalid.status()).toBe(400);
  expect(await invalid.json()).toMatchObject({ code: "validation_failed" });
  const quoteWithoutMaterial = await request.post("/api/quote", {
    headers: { Origin: origin, "CF-Connecting-IP": `e2e-required-${Date.now()}` },
    data: apiPayload({ material: "" })
  });
  expect(quoteWithoutMaterial.status()).toBe(400);
  expect(await quoteWithoutMaterial.json()).toMatchObject({ code: "validation_failed", fields: ["material"] });
  const contactWithoutMessage = await request.post("/api/contact", {
    headers: { Origin: origin, "CF-Connecting-IP": `e2e-required-contact-${Date.now()}` },
    data: apiPayload({ message: "" })
  });
  expect(contactWithoutMessage.status()).toBe(400);
  expect(await contactWithoutMessage.json()).toMatchObject({ code: "validation_failed", fields: ["message"] });

  const rateIdentity = `e2e-rate-${Date.now()}`;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await request.post("/api/quote", { headers: { Origin: origin, "CF-Connecting-IP": rateIdentity }, data: apiPayload() });
    expect(response.status()).toBe(201);
  }
  const limited = await request.post("/api/quote", { headers: { Origin: origin, "CF-Connecting-IP": rateIdentity }, data: apiPayload() });
  expect(limited.status()).toBe(429);
  expect(await limited.json()).toMatchObject({ code: "rate_limited" });
});

test("API nhận submission idempotent mà không tạo lead lặp", async ({ request }) => {
  const origin = "http://127.0.0.1:4173";
  const submissionId = crypto.randomUUID();
  const headers = { Origin: origin, "CF-Connecting-IP": `e2e-duplicate-${Date.now()}` };
  const first = await request.post("/api/quote", { headers, data: apiPayload({ submission_id: submissionId }) });
  expect(first.status()).toBe(201);
  const second = await request.post("/api/quote", { headers, data: apiPayload({ submission_id: submissionId }) });
  expect(second.status()).toBe(200);
  expect(await second.json()).toMatchObject({ ok: true, duplicate: true });
});

test("payload kiểu SQL injection không làm thay đổi schema", async ({ request }) => {
  const origin = "http://127.0.0.1:4173";
  const headers = { Origin: origin, "CF-Connecting-IP": `e2e-sql-${Date.now()}` };
  const injected = await request.post("/api/contact", { headers, data: apiPayload({ full_name: "Robert'); DROP TABLE leads;--", message: "Kiểm tra query binding" }) });
  expect(injected.status()).toBe(201);
  const after = await request.post("/api/contact", { headers, data: apiPayload({ full_name: "Kiểm tra bảng còn tồn tại", message: "Yêu cầu thứ hai" }) });
  expect(after.status()).toBe(201);
});

test("frontend công khai không tải Turnstile hoặc Forms API", async ({ page }) => {
  const unexpectedRequests: string[] = [];
  page.on("request", (request) => {
    if (/challenges\.cloudflare\.com\/turnstile|cms\.mdftungphat\.com\/api\/(contact|quote)/i.test(request.url())) {
      unexpectedRequests.push(request.url());
    }
  });

  for (const route of ["/", "/lien-he/", "/bao-gia/", "/go-ghep/", "/cat-cnc-go/"]) {
    await page.goto(route, { waitUntil: "networkidle" });
    await expect(page.locator('.cf-turnstile, script[src*="turnstile"]')).toHaveCount(0);
    if (route !== "/") await expect(page.locator("form")).toHaveCount(0);
  }

  expect(unexpectedRequests).toEqual([]);
});

test("preview shell không tự gửi Analytics và không render draft ngoài CMS tin cậy", async ({ page }) => {
  const analyticsRequests: string[] = [];
  page.on("request", request => {
    if (/\/api\/analytics\/track|google-analytics\.com|googletagmanager\.com/i.test(request.url())) analyticsRequests.push(request.url());
  });
  const response = await page.goto("/cms-preview/", { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByText("Mở một nội dung trong CMS để xem bản nháp.")).toBeVisible();
  await expect(page.locator("[data-cms-preview='true']")).toHaveCount(0);
  expect(analyticsRequests).toEqual([]);
});

test("ngân sách Web Vitals lab không regression rõ rệt", async ({ page }) => {
  await page.addInitScript(() => {
    const store = { lcp: 0, cls: 0 };
    Object.assign(window, { __vitals: store });
    new PerformanceObserver((list) => { for (const entry of list.getEntries()) store.lcp = entry.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => { for (const entry of list.getEntries()) { const item = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number }; if (!item.hadRecentInput) store.cls += item.value || 0; } }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto("/", { waitUntil: "networkidle" });
  const metrics = await page.evaluate(() => (window as Window & { __vitals: { lcp: number; cls: number } }).__vitals);
  expect(metrics.lcp).toBeLessThan(4_000);
  expect(metrics.cls).toBeLessThan(0.1);
});
