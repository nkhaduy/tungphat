// Run only with a disposable local database and local QA account.
import assert from "node:assert/strict";
import { chromium } from "playwright";

const { QA_USERNAME: username, QA_PASSWORD: password } = process.env;
if (!username || !password) throw new Error("Provide credentials for a disposable local admin.");
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext();
  let page = await context.newPage();
  await page.goto("http://127.0.0.1:5173/login");
  await page.getByLabel("Tên đăng nhập").fill(username);
  await page.getByLabel("Mật khẩu").fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin");
  await page.goto("http://127.0.0.1:5173/bao-gia/moi");
  await page.getByLabel("Tên sản phẩm dòng 1", { exact: true }).fill("MDF khôi phục thử");
  const customer = `Khách kiểm thử ${Date.now()}`;
  await page.locator(".customer-grid input").first().fill(customer);
  await page.route("**/api/quotes", async (route) => {
    if (route.request().method() === "POST") {
      await route.fetch(); // Commit on the local server; simulate loss of the response.
      await route.abort("failed");
    } else await route.continue();
  });
  await page.getByRole("button", { name: "Lưu nháp" }).click();
  await page.getByText("Chưa xác nhận được kết quả lưu.", { exact: false }).waitFor();
  await page.close();
  page = await context.newPage();
  await page.goto("http://127.0.0.1:5173/bao-gia/moi");
  await page.getByRole("button", { name: "Khôi phục bản nháp", exact: true }).first().click();
  assert.equal(await page.getByLabel("Tên sản phẩm dòng 1", { exact: true }).inputValue(), "MDF khôi phục thử");
  await page.getByRole("button", { name: "Lưu nháp" }).click();
  await page.waitForURL("**/chinh-sua");
  const count = await page.evaluate(async (name) => {
    const response = await fetch(`/api/quotes?customerName=${encodeURIComponent(name)}`);
    const body = await response.json();
    return body.quotes.filter((quote) => quote.customerName === name).length;
  }, customer);
  assert.equal(count, 1);
  console.log("PASS: lost response, closed tab and recovery retain one quote");
} finally {
  await browser.close();
}
