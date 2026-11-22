// Disposable local database only. Set QA_USERNAME and QA_PASSWORD.
import { chromium } from "playwright";
import assert from "node:assert/strict";
(async () => {
  const b = await chromium.launch({ headless: true }),
    ctx = await b.newContext();
  let p = await ctx.newPage();
  await p.goto("http://127.0.0.1:5173/login");
  await p.getByLabel("Tên đăng nhập").fill(process.env.QA_USERNAME ?? "");
  await p.getByLabel("Mật khẩu").fill(process.env.QA_PASSWORD ?? "");
  await p.getByRole("button", { name: "Đăng nhập" }).click();
  await p.waitForURL("**/admin");
  const a = "SWITCH A " + Date.now(),
    c = "SWITCH B " + Date.now();
  await p.goto("http://127.0.0.1:5173/bao-gia/moi");
  await p.locator(".customer-grid input").first().fill(a);
  await p.getByLabel("Tên sản phẩm dòng 1", { exact: true }).fill("A old");
  let release, start;
  const hold = new Promise((r) => (release = r)),
    started = new Promise((r) => (start = r));
  await p.route("**/api/quotes", async (r) => {
    if (r.request().method() === "POST") {
      start();
      await hold;
    }
    await r.continue();
  });
  await p.route("**/api/quotes/*", async (r) => {
    if (r.request().method() === "PUT")
      await r.fulfill({
        status: 500,
        contentType: "application/json",
        body: '{"message":"error"}',
      });
    else await r.continue();
  });
  await p.getByRole("button", { name: "Lưu nháp" }).click();
  await started;
  await p.getByLabel("Tên sản phẩm dòng 1", { exact: true }).fill("A pending");
  release();
  await p
    .getByText("Chưa xác nhận được kết quả lưu.", { exact: false })
    .waitFor();
  await p.close();
  p = await ctx.newPage();
  await p.goto("http://127.0.0.1:5173/bao-gia/moi");
  await p.locator(".customer-grid input").first().fill(c);
  await p.getByLabel("Tên sản phẩm dòng 1", { exact: true }).fill("B new");
  await p.close();
  p = await ctx.newPage();
  await p.goto("http://127.0.0.1:5173/bao-gia/moi");
  const buttons = p.getByRole("button", {
    name: "Khôi phục bản nháp",
    exact: true,
  });
  await buttons.first().waitFor();
  assert.equal(await buttons.count(), 2);
  await buttons.nth(1).click();
  await p.waitForFunction(
    () =>
      document.querySelector('[aria-label="Tên sản phẩm dòng 1"]')?.value ===
      "A pending",
  );
  p.on("dialog", (d) => d.accept());
  await buttons.first().click();
  await p.waitForFunction(
    () =>
      document.querySelector('[aria-label="Tên sản phẩm dòng 1"]')?.value ===
      "B new",
  );
  await p.getByRole("button", { name: "Lưu nháp" }).click();
  await p.waitForURL("**/chinh-sua");
  const result = await p.evaluate(
    async (names) => {
      const out = [];
      for (const name of names) {
        const x = await (
          await fetch("/api/quotes?customerName=" + encodeURIComponent(name))
        ).json();
        out.push(x.quotes.filter((q) => q.customerName === name).length);
      }
      return out;
    },
    [a, c],
  );
  assert.deepEqual(result, [1, 1]);
  console.log(
    "PASS switching between recovered drafts preserves existing quote and creates independent new quote",
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
