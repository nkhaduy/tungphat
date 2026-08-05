import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";

const publicRoutes = ["/", "/san-pham/", "/go-ghep/", "/go-ghep-cao-su/", "/go-ghep-tram/", "/van-mdf/", "/mdf-chong-am/", "/van-go-cong-nghiep/", "/gia-cong-cnc/", "/cat-cnc-go/", "/gia-cong-cnc-mdf/", "/bao-gia/", "/du-an/", "/bai-viet/", "/lien-he/"];
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
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error" && !message.text().includes("Turnstile")) errors.push(message.text()); });
  for (const route of publicRoutes) {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status(), route).toBe(200);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\/mdftungphat\.com\//);
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

test("hero trang pháp lý chọn ảnh ngẫu nhiên khi tải trang", async ({ page }) => {
  await page.addInitScript(() => {
    Crypto.prototype.getRandomValues = function <T extends ArrayBufferView | null>(array: T): T {
      (array as Uint32Array)[0] = 3;
      return array;
    };
  });
  await page.goto("/chinh-sach-bao-mat/");
  await expect(page.locator("main section").first().locator('img[src*="hero-workshop6.webp"]')).toBeVisible();
});

test("menu mobile mở được, không tràn ngang", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator("summary").filter({ hasText: "Mở hoặc đóng menu" }).click();
  await expect(page.getByRole("banner").getByRole("link", { name: "Liên hệ", exact: true })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("thanh hành động mobile có nền trắng rõ ràng", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const backgroundColor = await page.getByRole("navigation", { name: "Liên hệ nhanh" }).evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(backgroundColor).toBe("rgba(255, 255, 255, 0.95)");
});

test("homepage không tràn ngang trên các viewport acceptance", async ({ page }) => {
  for (const viewport of [
    { width: 375, height: 812 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(1);
  }
});

test("header tham chiếu đúng bề mặt mở đầu trên toàn bộ nhóm trang", async ({ page }) => {
  const darkHeaderRoutes = [
    ...publicRoutes.filter((route) => route !== "/" && route !== "/lien-he/"),
    "/chinh-sach-bao-mat/",
    "/dieu-khoan-su-dung/",
    "/san-pham/an-cuong/",
    "/catalogue/an-cuong/"
  ];

  for (const route of darkHeaderRoutes) {
    await page.goto(route);
    const header = page.getByRole("banner");
    await expect(header, route).toHaveClass(/bg-forest-950/);
    await expect(header.locator('img[src="/logo-horizontal-white.png"]'), route).toHaveClass(/opacity-100/);
    await expect(header.locator('img[src="/logo-horizontal.png"]'), route).toHaveClass(/opacity-0/);
  }

  await page.goto("/lien-he/");
  const contactHeader = page.getByRole("banner");
  await expect(contactHeader).toHaveClass(/bg-transparent/);
  await expect(contactHeader.locator('img[src="/logo-horizontal-white.png"]')).toHaveClass(/opacity-100/);
  await expect(contactHeader.locator('img[src="/logo-horizontal.png"]')).toHaveClass(/opacity-0/);

  await page.goto("/san-pham/");
  await page.evaluate(() => window.scrollTo(0, 120));
  await expect(page.getByRole("banner")).toHaveClass(/bg-white\/95/);
  await expect(page.getByRole("banner").locator('img[src="/logo-horizontal.png"]')).toHaveClass(/opacity-100/);

  await page.goto("/khong-ton-tai/");
  await expect(page.getByRole("banner")).toHaveClass(/bg-white\/95/);
});

test("robots, sitemap, Vercel admin redirect và 404 đúng", async ({ page, request }) => {
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("Sitemap: https://mdftungphat.com/sitemap.xml");
  const sitemap = await request.get("/sitemap.xml");
  const xml = await sitemap.text();
  expect(xml).toContain("https://mdftungphat.com/go-ghep");
  expect(xml).not.toContain("https://mdftungphat.com/bao-gia");
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
