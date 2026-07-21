import { expect, test } from "@playwright/test";

test("login, Decap, Analytics, tab persistence and shared logout", async ({ page }) => {
  let authenticated = false;
  const csrf = crypto.randomUUID();
  const enteredPassword = crypto.randomUUID();
  const externalAuthRequests: string[] = [];

  await page.addInitScript(() => {
    const browserWindow = window as unknown as Window & { CMS: Record<string, unknown> };
    browserWindow.CMS = {
      init() {
        const root = document.querySelector("#nc-root");
        const node = document.createElement("div");
        node.dataset.testid = "decap-mounted";
        node.textContent = "Decap CMS";
        root?.appendChild(node);
      },
      registerEventListener() {},
      registerPreviewStyle() {},
      registerPreviewTemplate() {},
    };
  });
  await page.route("https://unpkg.com/decap-cms@3.14.1/dist/decap-cms.js", (route) => route.abort());

  page.on("request", (request) => {
    if (/github\.com\/login\/oauth|\/callback(?:\?|$)|\/auth(?:\?|$)|netlify|identity|gotrue/i.test(request.url())) externalAuthRequests.push(request.url());
  });

  await page.route("https://mdftungphat.com/cms-preview/", route => route.fulfill({
    contentType: "text/html",
    body: `<!doctype html><html><body><h1 id="draft-title">Chưa có nội dung</h1><button id="preview-cta">Nhắn Zalo</button><script>
      addEventListener('message', event => { if (event.origin !== location.origin.replace('mdftungphat.com', 'cms.mdftungphat.com') && event.origin !== 'http://127.0.0.1:4174') return; if (event.data?.type === 'tp-preview-draft') document.querySelector('#draft-title').textContent = event.data.payload.data.title; });
      document.querySelector('#preview-cta').addEventListener('click', event => { event.preventDefault(); document.body.dataset.ctaDisabled = 'true'; });
      parent.postMessage({ type: 'tp-preview-ready' }, '*');
    </script></body></html>`,
  }));

  await page.route("**/api/auth/session", (route) => authenticated
    ? route.fulfill({ json: { authenticated: true, user: { username: "nkhaduy" }, csrf, expiresAt: 1_900_000_000 } })
    : route.fulfill({ status: 401, json: { authenticated: false } }));
  await page.route("**/api/auth/csrf", (route) => route.fulfill({ json: { ok: true, csrf } }));
  await page.route("**/api/auth/login", async (route) => {
    const body = route.request().postDataJSON() as Record<string, string>;
    expect(body).toEqual({ username: "nkhaduy", password: enteredPassword, csrf });
    authenticated = true;
    await route.fulfill({ json: { ok: true, user: { username: "nkhaduy" }, csrf, expiresAt: 1_900_000_000 } });
  });
  await page.route("**/api/auth/logout", async (route) => {
    expect(route.request().headers()["x-csrf-token"]).toBe(csrf);
    authenticated = false;
    await route.fulfill({ json: { ok: true } });
  });
  await page.route("**/api/gateway/status", (route) => route.fulfill({ json: { ok: true, user: { username: "nkhaduy" } } }));
  await page.route("**/git-gateway/github/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes("/branches/main")) {
      await route.fulfill({ json: { name: "main", commit: { sha: "a".repeat(40), commit: { tree: { sha: "b".repeat(40) } } } } });
      return;
    }
    if (url.pathname.includes("/git/trees/")) {
      await route.fulfill({ json: { sha: "b".repeat(40), tree: [], truncated: false } });
      return;
    }
    await route.fulfill({ status: 404, json: { message: "Not Found" } });
  });
  await page.route("**/api/admin/analytics/**", async (route) => {
    expect(route.request().headers().cookie || "").not.toContain("tp_cms_admin");
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/overview")) {
      await route.fulfill({ json: { metrics: { visitors: 1, sessions: 1, pageviews: 1, zalo: 0, maps: 0, phone: 0, leads: 0, conversionRate: 0, active: 1 }, comparison: { visitors: 0, sessions: 0, pageviews: 0, zalo: 0, maps: 0, phone: 0, leads: 0, conversionRate: 0 }, activeDefinition: "Hoạt động trong 30 phút gần nhất", updatedAt: 1_800_000_000 } });
    } else if (path.endsWith("/timeseries")) {
      await route.fulfill({ json: { granularity: "hour", rows: [] } });
    } else if (path.endsWith("/landing-pages")) {
      await route.fulfill({ json: { rows: [] } });
    } else {
      await route.fulfill({ json: { status: "not_configured", rows: [] } });
    }
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Tùng Phát CMS" })).toHaveCount(0);
  await expect(page.getByText("Quản lý nội dung và theo dõi hoạt động website.")).toHaveCount(0);
  await expect(page.getByAltText("Tùng Phát — Wood & CNC Solutions")).toHaveAttribute("src", "https://mdftungphat.com/logo-horizontal.png");
  await expect(page.getByText("Login with GitHub")).toHaveCount(0);
  await expect(page.locator("#password")).toHaveAttribute("type", "password");
  await expect(page.locator("#password-toggle")).toHaveCount(0);
  await page.getByLabel("Tài khoản").fill("nkhaduy");
  await page.getByLabel("Mật khẩu", { exact: true }).fill(enteredPassword);
  await page.getByRole("button", { name: "Đăng nhập" }).click();

  await expect(page.getByRole("banner").getByRole("link", { name: "Tùng Phát CMS — Quản lý nội dung" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Quản lý nội dung" })).toHaveClass(/active/);
  await expect(page.getByRole("button", { name: "Xem trước" })).toBeVisible();
  await expect(page.locator("#nc-root")).not.toBeEmpty();
  const decapNodeCount = await page.locator("#nc-root *").count();
  expect(decapNodeCount).toBeGreaterThan(0);
  await expect(page.getByText(/Netlify Identity/i)).toHaveCount(0);

  await page.evaluate(() => {
    (window as unknown as { TPCMS: { receiveDraft: (draft: unknown) => void } }).TPCMS.receiveDraft({
      collection: "articles",
      data: { title: "Tiêu đề bản nháp chưa publish", slug: "ban-nhap", draft: true, body: "Nội dung mới" },
    });
  });
  await page.getByRole("button", { name: "Xem trước" }).click();
  await expect(page.getByText("Tiêu đề bản nháp chưa publish")).toBeVisible();
  await expect(page.getByText("Bản nháp chưa publish", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Desktop" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Tablet" }).click();
  await expect(page.locator("#preview-stage")).toHaveAttribute("data-width", "768");
  await page.getByRole("button", { name: "Mobile" }).click();
  await expect(page.locator("#preview-stage")).toHaveAttribute("data-width", "390");
  const previewLayout = await page.evaluate(() => ({ viewport: innerWidth, documentWidth: document.documentElement.scrollWidth }));
  expect(previewLayout.documentWidth).toBeLessThanOrEqual(previewLayout.viewport);
  await page.getByRole("button", { name: "Làm mới" }).click();
  await page.getByRole("button", { name: "Quay lại chỉnh sửa" }).click();
  await expect(page.locator("#nc-root")).not.toBeEmpty();

  await page.getByRole("button", { name: "Thống kê" }).click();
  await expect(page.getByRole("heading", { name: "Thống kê" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Tổng quan" })).toBeVisible();
  await expect(page.getByText("Người truy cập")).toBeVisible();
  await expect(page.getByText("Lượt nhấn chỉ đường")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Tổng quan" })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#analytics-view iframe")).toHaveCount(0);
  await expect(page.locator("#analytics-view")).toBeVisible();
  await expect(page.locator("#nc-root")).toBeAttached();

  await page.getByRole("button", { name: "Quản lý nội dung" }).click();
  expect(await page.locator("#nc-root *").count()).toBeGreaterThanOrEqual(decapNodeCount);
  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(page.locator("#login-form")).toBeVisible();
  await expect(page.locator("#content-view")).toBeHidden();
  await expect(page.locator("#analytics-view")).toBeHidden();
  expect(externalAuthRequests).toEqual([]);
});
