import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { request as httpsRequest } from "node:https";
import jsQR from "jsqr";
import { PDFDocument } from "pdf-lib";
import { PNG } from "pngjs";

const host = "baogia.mdftungphat.com";
const origin = `https://${host}`;
const quoteNumber = "TP81-260722-001";
const quoteId = "69d9f6ae-b2b8-4b19-836e-d9738615172c";
const employeeId = "068358ad-397b-42cc-9b3e-97daf1b98ecf";
const artifactDir = "artifacts/production-acceptance";
const adminUsername = process.env.ADMIN_USERNAME?.trim();
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminUsername || !adminPassword || adminPassword.length < 10) {
  console.error("Thiếu ADMIN_USERNAME hoặc ADMIN_PASSWORD production hợp lệ.");
  process.exit(1);
}

class CookieJar {
  cookies = new Map();

  absorb(headers) {
    const values = headers["set-cookie"];
    for (const value of Array.isArray(values) ? values : values ? [values] : []) {
      const [pair] = value.split(";", 1);
      const separator = pair.indexOf("=");
      if (separator < 1) continue;
      const name = pair.slice(0, separator);
      const cookieValue = pair.slice(separator + 1);
      if (cookieValue) this.cookies.set(name, cookieValue);
      else this.cookies.delete(name);
    }
  }

  header() {
    return [...this.cookies].map(([name, value]) => `${name}=${value}`).join("; ");
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function request(method, requestPath, { body, jar, csrf, accept = "application/json" } = {}) {
  const payload = body === undefined ? null : Buffer.from(JSON.stringify(body));
  const headers = { Accept: accept };
  if (payload) {
    headers["Content-Type"] = "application/json";
    headers["Content-Length"] = String(payload.byteLength);
  }
  if (jar?.header()) headers.Cookie = jar.header();
  if (method !== "GET" && method !== "HEAD") {
    headers.Origin = origin;
    if (csrf) headers["X-CSRF-Token"] = csrf;
  }
  return new Promise((resolve, reject) => {
    const startedAt = performance.now();
    const req = httpsRequest({ hostname: host, port: 443, path: requestPath, method, headers }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const buffer = Buffer.concat(chunks);
        jar?.absorb(response.headers);
        let data = null;
        if (String(response.headers["content-type"] ?? "").includes("application/json") && buffer.length) {
          try { data = JSON.parse(buffer.toString("utf8")); }
          catch { data = null; }
        }
        resolve({ status: response.statusCode ?? 0, headers: response.headers, buffer, data, durationMs: Math.round(performance.now() - startedAt) });
      });
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function api(method, requestPath, options = {}) {
  const response = await request(method, requestPath, options);
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`${method} ${requestPath}: ${response.data?.message ?? `HTTP ${response.status}`}`);
  }
  return response;
}

async function login() {
  const jar = new CookieJar();
  const csrfResponse = await api("GET", "/api/auth/csrf", { jar });
  const response = await api("POST", "/api/auth/login", {
    jar,
    body: { username: adminUsername, password: adminPassword, csrf: csrfResponse.data.csrf },
  });
  assert(response.data.user?.role === "ADMIN", "Tài khoản không có quyền ADMIN.");
  return { jar, csrf: response.data.csrf, user: response.data.user };
}

function queryD1(command) {
  const result = spawnSync("npx", ["wrangler", "d1", "execute", "tung-phat-quotes", "--remote", "--command", command, "--json"], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error("Không thể xác minh D1 production.");
  return JSON.parse(result.stdout);
}

function parseTlv(value) {
  const fields = {};
  for (let offset = 0; offset + 4 <= value.length;) {
    const id = value.slice(offset, offset + 2);
    const length = Number(value.slice(offset + 2, offset + 4));
    assert(Number.isInteger(length) && offset + 4 + length <= value.length, "Payload VietQR không hợp lệ.");
    fields[id] = value.slice(offset + 4, offset + 4 + length);
    offset += 4 + length;
  }
  return fields;
}

function inspectRenderedPng(buffer) {
  const png = PNG.sync.read(buffer);
  const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height, { inversionAttempts: "dontInvert" });
  assert(decoded?.data, "Không giải mã được QR từ ảnh render PDF.");
  let left = png.width;
  let right = -1;
  let top = png.height;
  let bottom = -1;
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const offset = (y * png.width + x) * 4;
      if (png.data[offset] > 248 && png.data[offset + 1] > 248 && png.data[offset + 2] > 248) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  const root = parseTlv(decoded.data);
  const merchant = parseTlv(root["38"] ?? "");
  const account = parseTlv(merchant["01"] ?? "");
  return {
    width: png.width,
    height: png.height,
    inkBounds: { left, right, top, bottom },
    qr: { bankBin: account["00"], accountNumber: account["01"], serviceCode: merchant["02"], currency: root["53"], amount: Number(root["54"]), country: root["58"], additionalData: root["62"] ?? null },
  };
}

async function captureAdminPages() {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto(`${origin}/login`, { waitUntil: "networkidle" });
    await page.getByLabel("Tên đăng nhập").fill(adminUsername);
    await page.getByLabel("Mật khẩu").fill(adminPassword);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await page.waitForURL("**/admin", { timeout: 20_000 });
    const pages = [
      ["/admin/chi-nhanh", "Chi nhánh", "admin-branches.png"],
      ["/admin/cai-dat", "Cài đặt hệ thống", "admin-settings.png"],
      ["/admin/bao-gia", "Tất cả báo giá", "admin-quotes.png"],
      ["/admin/lich-su", "Lịch sử hệ thống", "admin-audit.png"],
    ];
    for (const [path, heading, fileName] of pages) {
      await page.goto(`${origin}${path}`, { waitUntil: "networkidle" });
      await page.getByRole("heading", { name: heading, exact: true }).waitFor();
      await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important}" });
      await page.screenshot({ path: `${artifactDir}/${fileName}`, fullPage: true });
    }
  } finally {
    await browser.close();
  }
  assert(errors.length === 0, `UI production có page error: ${errors[0] ?? "không xác định"}`);
}

let admin;
let loggedOut = false;
try {
  admin = await login();
  const publicChecks = await Promise.all([
    request("GET", "/api/health"),
    request("GET", "/api/quotes"),
    request("GET", "/api/admin/users"),
    request("GET", "/_worker.js.map"),
  ]);
  assert(publicChecks[0].status === 200 && publicChecks[1].status === 401 && publicChecks[2].status === 401 && publicChecks[3].status === 404, "Public authorization/source-map check không đạt.");

  const state = queryD1(`
    SELECT quote_number,pdf_version,latest_pdf_key,deleted_at FROM quotes WHERE id='${quoteId}';
    SELECT version_number,id,pdf_key,pdf_size FROM quote_versions WHERE quote_id='${quoteId}' ORDER BY version_number;
    SELECT COUNT(*) AS item_count FROM quote_items WHERE quote_id='${quoteId}';
    SELECT username,is_active FROM users WHERE id='${employeeId}' OR username LIKE 'phanquyen-%' ORDER BY updated_at DESC;
    SELECT new_data FROM audit_logs WHERE action='QUOTE_DELETED' AND entity_id='${quoteId}' ORDER BY created_at DESC LIMIT 1;
  `);
  const quote = state[0]?.results?.[0];
  const versions = state[1]?.results ?? [];
  assert(quote?.quote_number === quoteNumber && quote.deleted_at && quote.pdf_version === 3 && quote.latest_pdf_key?.includes("/v3/"), "Quote nghiệm thu chưa ở trạng thái soft-delete với PDF v3.");
  assert(versions.length === 3 && versions.map((version) => version.version_number).join(",") === "1,2,3", "Các PDF cũ hoặc version mới không được giữ đầy đủ.");
  assert(Number(state[2]?.results?.[0]?.item_count) === 1, "quote_items bị mất sau soft-delete.");
  assert(state[3]?.results?.some((user) => user.username === "chau" && user.is_active === 0), "Tài khoản nghiệm thu Châu chưa khóa.");
  assert(state[3]?.results?.some((user) => user.username.startsWith("phanquyen-") && user.is_active === 0), "Tài khoản phân quyền nghiệm thu chưa khóa.");
  assert(JSON.parse(state[4]?.results?.[0]?.new_data ?? "{}").deletionMode === "SOFT_DELETE", "Audit soft-delete không hợp lệ.");

  const latestVersion = versions.at(-1);
  const anonymousPdf = await request("GET", `/api/quote-versions/${latestVersion.id}/pdf`);
  assert(anonymousPdf.status === 401, "Anonymous tải được PDF production.");
  const pdfResponse = await api("GET", `/api/quote-versions/${latestVersion.id}/pdf`, { jar: admin.jar });
  assert(String(pdfResponse.headers["content-type"]).includes("application/pdf") && pdfResponse.buffer.byteLength === latestVersion.pdf_size, "PDF v3 tải lại từ production không khớp D1/R2.");
  const previousPdf = await readFile(`${artifactDir}/production-acceptance.pdf`);
  assert(createHash("sha256").update(previousPdf).digest("hex") === createHash("sha256").update(pdfResponse.buffer).digest("hex"), "PDF tải lại không khớp file đã nghiệm thu trước soft-delete.");

  const finalPdfPath = `${artifactDir}/production-final.pdf`;
  const finalPngPrefix = `${artifactDir}/production-final-page-1`;
  await writeFile(finalPdfPath, pdfResponse.buffer);
  const document = await PDFDocument.load(pdfResponse.buffer);
  assert(document.getPageCount() === 1, "PDF production nghiệm thu không đúng số trang.");
  const fonts = spawnSync("pdffonts", [finalPdfPath], { encoding: "utf8" });
  assert(fonts.status === 0 && fonts.stdout.includes("Montserrat-Regular") && fonts.stdout.includes("Montserrat-Bold") && !fonts.stdout.includes("Noto Sans"), "Font production không đúng Montserrat Regular/Bold.");
  const rendered = spawnSync("pdftoppm", ["-png", "-f", "1", "-singlefile", "-r", "144", finalPdfPath, finalPngPrefix], { encoding: "utf8" });
  assert(rendered.status === 0, "Không render lại được PDF production.");
  const renderedInspection = inspectRenderedPng(await readFile(`${finalPngPrefix}.png`));
  const rightMargin = renderedInspection.width - 1 - renderedInspection.inkBounds.right;
  assert(renderedInspection.inkBounds.left >= 50 && rightMargin >= 50 && Math.abs(renderedInspection.inkBounds.left - rightMargin) <= 8, "Lề trái/phải PDF render không cân đối.");
  assert(renderedInspection.qr.bankBin === "970416" && renderedInspection.qr.accountNumber === "3191158" && renderedInspection.qr.serviceCode === "QRIBFTTA", "QR render sai ngân hàng hoặc tài khoản.");
  assert(renderedInspection.qr.currency === "704" && renderedInspection.qr.amount === 66_000 && renderedInspection.qr.country === "VN" && !renderedInspection.qr.additionalData, "QR render sai số tiền hoặc có nội dung chuyển khoản không mong muốn.");

  for (const file of ["quote-preview.png", "pdf-page-1.png", "employee-quote-editor.png", "customer-autocomplete.png"]) {
    assert((await stat(`${artifactDir}/${file}`)).size > 50_000, `Thiếu artifact production ${file}.`);
  }
  await captureAdminPages();

  await api("POST", "/api/auth/logout", { jar: admin.jar, csrf: admin.csrf });
  loggedOut = true;
  assert((await request("GET", "/api/auth/session", { jar: admin.jar })).status === 401, "Admin session chưa logout.");

  console.log(`FINAL_ACCEPTANCE_RESULT=${JSON.stringify({
    status: "PASS",
    quoteNumber,
    quoteSoftDeleted: true,
    quoteItemsPreserved: true,
    pdfVersionsPreserved: versions.length,
    productionPdfBytes: pdfResponse.buffer.byteLength,
    fonts: ["Montserrat Regular", "Montserrat Bold"],
    balancedMargins: true,
    qrDecodedFromRenderedPdf: true,
    qrAmount: renderedInspection.qr.amount,
    anonymousPdfBlocked: true,
    acceptanceAccountsLocked: true,
    adminUiPass: true,
    artifactDir,
  })}`);
} catch (error) {
  console.error(`FINAL_ACCEPTANCE_FAILED=${error instanceof Error ? error.message : "Lỗi không xác định"}`);
  process.exitCode = 1;
} finally {
  if (admin && !loggedOut) {
    try { await api("POST", "/api/auth/logout", { jar: admin.jar, csrf: admin.csrf }); }
    catch { /* Preserve the original acceptance error. */ }
  }
}
