// Disposable local database only. Set QA_USERNAME and QA_PASSWORD.
import assert from "node:assert/strict";
import { chromium } from "playwright";
const { QA_USERNAME: username, QA_PASSWORD: password } = process.env;
if (!username || !password) throw new Error("Provide credentials for a disposable local admin.");
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:5173/login");
  await page.getByLabel("Tên đăng nhập").fill(username);
  await page.getByLabel("Mật khẩu").fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin");
  await page.goto("http://127.0.0.1:5173/bao-gia/moi");
  await page.getByLabel("Tên sản phẩm dòng 1", { exact: true }).fill("Sản phẩm thử số lượng");
  await page.getByLabel("Đơn giá dòng 1", { exact: true }).fill("100000");
  const quantity = page.getByLabel("Số lượng dòng 1", { exact: true });
  await quantity.click();
  await quantity.pressSequentially("1,125");
  assert.equal(await quantity.inputValue(), "1,125");
  await page.getByRole("button", { name: "Lưu nháp" }).click();
  await page.waitForURL("**/chinh-sua");
  const quote = await page.evaluate(async () => (await (await fetch(`/api/quotes/${location.pathname.split("/")[2]}`)).json()).quote);
  assert.equal(quote.items[0].quantity, 1.125);
  assert.equal(quote.items[0].lineTotal, 112500);
  await page.reload();
  assert.equal(Number((await page.getByLabel("Số lượng dòng 1", { exact: true }).inputValue()).replace(",", ".")), 1.125);
  console.log("PASS typed decimal quantity, total, save and readback");
} finally {
  await browser.close();
}
