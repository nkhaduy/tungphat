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
  await first.getByLabel("Tên sản phẩm dòng 1", { exact: true }).fill("Đã lưu");
  await first.getByRole("button", { name: "Lưu nháp" }).click();
  await first.waitForURL("**/chinh-sua");
  const editUrl = first.url();
  const second = await context.newPage();
  await second.goto(editUrl);
  await second.getByLabel("Tên sản phẩm dòng 1", { exact: true }).waitFor();
  for (const page of [first, second]) {
    await page.route("**/api/quotes/*", async (route) => {
      if (route.request().method() === "PUT") await route.fulfill({ status: 500, contentType: "application/json", body: '{"message":"error"}' });
      else await route.continue();
    });
  }
  await first.getByLabel("Tên sản phẩm dòng 1", { exact: true }).fill("Nháp tab A");
  await second.getByLabel("Tên sản phẩm dòng 1", { exact: true }).fill("Nháp tab B");
  await first.close();
  await second.close();
  const reopened = await context.newPage();
  await reopened.goto(editUrl);
  const choices = reopened.getByRole("button", { name: "Khôi phục bản nháp", exact: true });
  await choices.first().waitFor();
  assert.equal(await choices.count(), 2);
  await choices.first().click();
  assert.equal(await reopened.getByLabel("Tên sản phẩm dòng 1", { exact: true }).inputValue(), "Nháp tab B");
  reopened.on("dialog", (dialog) => void dialog.accept());
  await choices.nth(1).click();
  assert.equal(await reopened.getByLabel("Tên sản phẩm dòng 1", { exact: true }).inputValue(), "Nháp tab A");
  console.log("PASS: separate edit drafts survive closed tabs and recover independently");
} finally {
  await browser.close();
}
