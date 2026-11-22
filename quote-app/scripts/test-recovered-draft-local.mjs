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
  const product = page.getByLabel("Tên sản phẩm dòng 1", { exact: true });
  await product.fill("Bản gốc thử");
  await page.getByRole("button", { name: "Lưu nháp" }).click();
  await page.waitForURL("**/chinh-sua");
  let writes = 0;
  await page.route("**/api/quotes/*", async (route) => {
    if (route.request().method() === "PUT") {
      writes += 1;
      await route.fulfill({ status: 500, contentType: "application/json", body: '{"message":"error"}' });
    } else await route.continue();
  });
  await product.fill("Bản nháp thử");
  await page.getByRole("button", { name: "Lưu nháp" }).click();
  await page.getByText("Chưa xác nhận được kết quả lưu.", { exact: false }).waitFor();
  writes = 0;
  page.on("dialog", (dialog) => void dialog.accept());
  await page.reload();
  await product.waitFor();
  await page.waitForTimeout(2300);
  assert.equal(writes, 0, "Restored drafts require an explicit save");
  assert.equal(await product.inputValue(), "Bản nháp thử");
  console.log("PASS recovered draft is retained without an automatic write");
} finally {
  await browser.close();
}
