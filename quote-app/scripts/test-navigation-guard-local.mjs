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
  await page.locator('a[href="/bao-gia/moi"]').first().click();
  await page.getByLabel("Tên sản phẩm dòng 1", { exact: true }).fill("Sản phẩm thử");
  const confirmation = page.waitForEvent("dialog");
  await page.locator('a[href="/admin/bao-gia"]').first().click();
  const dialog = await confirmation;
  await dialog.dismiss();
  await page.waitForURL("**/bao-gia/moi");
  assert.ok(page.url().endsWith("/bao-gia/moi"));
  const backConfirmation = page.waitForEvent("dialog");
  const goingBack = page.goBack();
  await (await backConfirmation).dismiss();
  await goingBack;
  await page.waitForURL("**/bao-gia/moi");
  console.log("PASS: canceling link and browser-back warnings keeps the editor open");
} finally {
  await browser.close();
}
