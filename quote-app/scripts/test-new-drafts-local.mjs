// Disposable local database only. Set QA_USERNAME and QA_PASSWORD.
import assert from "node:assert/strict";
import { chromium } from "playwright";
const { QA_USERNAME: username, QA_PASSWORD: password } = process.env;
if (!username || !password) throw new Error("Provide credentials for a disposable local admin.");
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext();
  const first = await context.newPage();
  await first.goto("http://127.0.0.1:5173/login");
  await first.getByLabel("Tên đăng nhập").fill(username);
  await first.getByLabel("Mật khẩu").fill(password);
  await first.getByRole("button", { name: "Đăng nhập" }).click();
  await first.waitForURL("**/admin");
  await first.goto("http://127.0.0.1:5173/bao-gia/moi");
  const second = await context.newPage();
  await second.goto("http://127.0.0.1:5173/bao-gia/moi");
  await first.getByLabel("Tên sản phẩm dòng 1", { exact: true }).fill("Báo giá A");
  await second.getByLabel("Tên sản phẩm dòng 1", { exact: true }).fill("Báo giá B");
  let release;
  let started;
  const hold = new Promise((resolve) => { release = resolve; });
  const pending = new Promise((resolve) => { started = resolve; });
  await first.route("**/api/quotes", async (route) => {
    if (route.request().method() === "POST") { started(); await hold; }
    await route.continue();
  });
  await first.getByRole("button", { name: "Lưu nháp" }).click();
  await pending;
  await second.getByRole("button", { name: "Lưu nháp" }).click();
  await second.waitForURL("**/chinh-sua");
  release();
  await first.waitForURL("**/chinh-sua");
  assert.notEqual(first.url(), second.url());
  console.log("PASS: independent new drafts create separate quotes");
} finally {
  await browser.close();
}
