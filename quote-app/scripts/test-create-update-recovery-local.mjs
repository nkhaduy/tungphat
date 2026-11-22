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
  await p.goto("http://127.0.0.1:5173/bao-gia/moi");
  const name = "PENDING " + Date.now();
  await p.locator(".customer-grid input").first().fill(name);
  await p.getByLabel("Tên sản phẩm dòng 1", { exact: true }).fill("Bản cũ");
  let release;
  const hold = new Promise((r) => (release = r));
  let started;
  const startedP = new Promise((r) => (started = r));
  await p.route("**/api/quotes", async (r) => {
    if (r.request().method() === "POST") {
      started();
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
  await startedP;
  await p.getByLabel("Tên sản phẩm dòng 1", { exact: true }).fill("Bản mới");
  release();
  await p
    .getByText("Chưa xác nhận được kết quả lưu.", { exact: false })
    .waitFor();
  await p.close();
  p = await ctx.newPage();
  await p.goto("http://127.0.0.1:5173/bao-gia/moi");
  await p
    .getByRole("button", { name: "Khôi phục bản nháp", exact: true })
    .first()
    .click();
  await p
    .waitForFunction(
      () =>
        document.querySelector('[aria-label=\"Tên sản phẩm dòng 1\"]')
          ?.value === "Bản mới",
      { timeout: 5000 },
    )
    .catch(async (e) => {
      console.error("errors", await p.locator(".form-error").allTextContents());
      throw e;
    });
  await p.getByRole("button", { name: "Lưu nháp" }).click();
  await p.waitForURL("**/chinh-sua");
  const result = await p.evaluate(async (name) => {
    const list = await (
      await fetch("/api/quotes?customerName=" + encodeURIComponent(name))
    ).json();
    return {
      count: list.quotes.filter((q) => q.customerName === name).length,
      quote: (
        await (
          await fetch("/api/quotes/" + location.pathname.split("/")[2])
        ).json()
      ).quote,
    };
  }, name);
  assert.equal(result.count, 1);
  assert.equal(result.quote.items[0].productName, "Bản mới");
  console.log(
    "PASS create acknowledged, later update fails, close and recover without duplicate",
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
