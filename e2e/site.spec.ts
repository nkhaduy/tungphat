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

test("hero giữ slideshow tự động và chỉ slide đầu có ưu tiên cao", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator("#trang-chu");
  await expect(hero.getByRole("img", { name: /Kho vật liệu/ })).toBeVisible();
  await expect(hero.locator('img[fetchpriority="high"]')).toHaveCount(1);
  await expect(hero.getByRole("img", { name: /Bề mặt vật liệu/ })).toBeVisible({ timeout: 7_000 });
});

test("menu mobile mở được, không tràn ngang", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Mở menu" }).click();
  await expect(page.getByRole("banner").getByRole("link", { name: "Liên hệ", exact: true })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
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

test("frontend công khai không tải form, Turnstile hoặc Forms API", async ({ page }) => {
  const unexpectedRequests: string[] = [];
  page.on("request", (request) => {
    if (/challenges\.cloudflare\.com\/turnstile|cms\.mdftungphat\.com\/api\/(contact|quote)/i.test(request.url())) {
      unexpectedRequests.push(request.url());
    }
  });

  for (const route of ["/", "/lien-he/", "/bao-gia/", "/go-ghep/", "/cat-cnc-go/"]) {
    await page.goto(route, { waitUntil: "networkidle" });
    await expect(page.locator('form, .cf-turnstile, script[src*="turnstile"]')).toHaveCount(0);
  }

  expect(unexpectedRequests).toEqual([]);
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
