import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { request as httpsRequest } from "node:https";
import jsQR from "jsqr";
import { PDFDocument } from "pdf-lib";
import { PNG } from "pngjs";
import { createIpLookupOverride } from "./network-lookup.mjs";

const host = "baogia.mdftungphat.com";
const origin = `https://${host}`;
const adminUsername = process.env.ADMIN_USERNAME?.trim();
const adminPassword = process.env.ADMIN_PASSWORD;
const artifactDir = "artifacts/production-acceptance";
const targetQuoteNumber = "TP81-260722-001";

if (!adminUsername || !adminPassword || adminPassword.length < 10) {
  console.error("Thiếu ADMIN_USERNAME hoặc ADMIN_PASSWORD production hợp lệ.");
  process.exit(1);
}

const lookupOverride = createIpLookupOverride(process.env.PRODUCTION_IP_OVERRIDE);

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
    const requestOptions = { hostname: host, port: 443, path: requestPath, method, headers };
    if (lookupOverride) requestOptions.lookup = lookupOverride;
    const startedAt = performance.now();
    const req = httpsRequest(requestOptions, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const buffer = Buffer.concat(chunks);
        jar?.absorb(response.headers);
        const contentType = String(response.headers["content-type"] ?? "");
        let data = null;
        if (contentType.includes("application/json") && buffer.length > 0) {
          try { data = JSON.parse(buffer.toString("utf8")); }
          catch { data = null; }
        }
        resolve({
          status: response.statusCode ?? 0,
          headers: response.headers,
          buffer,
          data,
          durationMs: Math.round(performance.now() - startedAt),
        });
      });
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function api(method, requestPath, options = {}) {
  const response = await request(method, requestPath, options);
  if (response.status < 200 || response.status >= 300) {
    const fallbackBody = response.buffer.toString("utf8").replace(/\s+/g, " ").slice(0, 180);
    const message = response.data?.message ?? (fallbackBody || `HTTP ${response.status}`);
    const ray = response.headers["cf-ray"] ? ` cf-ray=${response.headers["cf-ray"]}` : "";
    throw new Error(`${method} ${requestPath}: ${message}${ray}`);
  }
  return response;
}

async function createUserOrRecover(body, jar, csrf) {
  const response = await request("POST", "/api/admin/users", { jar, csrf, body });
  if (response.status >= 200 && response.status < 300) return response.data.id;
  if (response.status === 503) {
    // A gateway timeout can arrive after the D1 batch commits; recover by username.
    const users = await api("GET", "/api/admin/users", { jar });
    const recovered = users.data.users.find((user) => user.username === body.username);
    if (recovered) return recovered.id;
  }
  const fallbackBody = response.buffer.toString("utf8").replace(/\s+/g, " ").slice(0, 180);
  throw new Error(`POST /api/admin/users: ${response.data?.message ?? (fallbackBody || `HTTP ${response.status}`)}`);
}

async function login(username, password) {
  const jar = new CookieJar();
  const csrfResponse = await api("GET", "/api/auth/csrf", { jar });
  assert(typeof csrfResponse.data?.csrf === "string", "Không nhận được login CSRF.");
  const response = await api("POST", "/api/auth/login", {
    jar,
    body: { username, password, csrf: csrfResponse.data.csrf },
  });
  assert(typeof response.data?.csrf === "string", "Không nhận được session CSRF.");
  const setCookies = response.headers["set-cookie"] ?? [];
  const sessionCookie = (Array.isArray(setCookies) ? setCookies : [setCookies]).find((value) => value.startsWith("tp_quote_session="));
  assert(sessionCookie, "Không nhận được session cookie.");
  return {
    jar,
    csrf: response.data.csrf,
    user: response.data.user,
    cookieFlags: {
      httpOnly: /;\s*HttpOnly/i.test(sessionCookie),
      secure: /;\s*Secure/i.test(sessionCookie),
      sameSiteStrict: /;\s*SameSite=Strict/i.test(sessionCookie),
    },
  };
}

function queryD1(command) {
  const result = spawnSync("npx", ["wrangler", "d1", "execute", "tung-phat-quotes", "--remote", "--command", command, "--json"], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error("Không thể xác minh dữ liệu production trong D1.");
  return JSON.parse(result.stdout);
}

function parseTlv(value) {
  const fields = {};
  for (let offset = 0; offset + 4 <= value.length;) {
    const id = value.slice(offset, offset + 2);
    const length = Number(value.slice(offset + 2, offset + 4));
    assert(Number.isInteger(length) && length >= 0 && offset + 4 + length <= value.length, "Payload VietQR không hợp lệ.");
    fields[id] = value.slice(offset + 4, offset + 4 + length);
    offset += 4 + length;
  }
  return fields;
}

async function decodeRenderedQr(imagePath) {
  const png = PNG.sync.read(await readFile(imagePath));
  const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height, { inversionAttempts: "dontInvert" });
  assert(decoded?.data, "Không giải mã được VietQR từ ảnh render PDF production.");
  const root = parseTlv(decoded.data);
  const merchant = parseTlv(root["38"] ?? "");
  const account = parseTlv(merchant["01"] ?? "");
  return {
    payload: decoded.data,
    bankBin: account["00"] ?? null,
    accountNumber: account["01"] ?? null,
    serviceCode: merchant["02"] ?? null,
    currency: root["53"] ?? null,
    amount: Number(root["54"] ?? 0),
    country: root["58"] ?? null,
    additionalData: root["62"] ?? null,
  };
}

function loadVersionSnapshot(versionId) {
  const escapedId = versionId.replaceAll("'", "''");
  const parsed = queryD1(`SELECT snapshot_json,pdf_key,pdf_size FROM quote_versions WHERE id='${escapedId}';`);
  const row = parsed?.[0]?.results?.[0];
  if (!row) throw new Error("Không tìm thấy PDF snapshot trong D1.");
  return { snapshot: JSON.parse(row.snapshot_json), pdfKey: row.pdf_key, pdfSize: Number(row.pdf_size) };
}

async function loginUi(page, username, password, expectedPath) {
  await page.goto(`${origin}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Tên đăng nhập").fill(username);
  await page.getByLabel("Mật khẩu").fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL(`**${expectedPath}`, { timeout: 20_000 });
}

async function captureScreenshots({ adminUsernameValue, adminPasswordValue, employeeUsername, employeePassword, quoteId, customerName }) {
  const { chromium } = await import("playwright");
  await mkdir(artifactDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  const insecureRequests = [];
  const contextOptions = { viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 };
  const observePage = (page) => {
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (requestValue) => {
      if (requestValue.url().startsWith("http://")) insecureRequests.push(requestValue.url());
    });
  };
  const screenshot = async (page, fileName) => {
    await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important}" });
    await page.screenshot({ path: `${artifactDir}/${fileName}`, fullPage: true });
  };
  try {
    const loginContext = await browser.newContext(contextOptions);
    const loginPage = await loginContext.newPage();
    observePage(loginPage);
    await loginPage.goto(`${origin}/login`, { waitUntil: "networkidle" });
    const loginLayout = await loginPage.evaluate(() => {
      const page = document.querySelector(".login-page");
      const panel = document.querySelector(".login-panel");
      if (!(page instanceof HTMLElement) || !(panel instanceof HTMLElement)) return null;
      const pageRect = page.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const panelStyle = getComputedStyle(panel);
      return {
        pageWidth: pageRect.width,
        pageHeight: pageRect.height,
        viewportWidth: innerWidth,
        viewportHeight: innerHeight,
        centerDeltaX: Math.abs(panelRect.x + panelRect.width / 2 - innerWidth / 2),
        centerDeltaY: Math.abs(panelRect.y + panelRect.height / 2 - innerHeight / 2),
        borderWidth: Number.parseFloat(panelStyle.borderWidth),
        hasLegacyLeftCopy: document.body.innerText.includes("Báo giá Tùng Phát"),
      };
    });
    assert(loginLayout, "Không đọc được layout trang đăng nhập.");
    assert(loginLayout.pageWidth >= loginLayout.viewportWidth && loginLayout.pageHeight >= loginLayout.viewportHeight, "Background login không phủ toàn màn hình.");
    assert(loginLayout.centerDeltaX < 80 && loginLayout.centerDeltaY < 100, "Form đăng nhập không nằm giữa màn hình.");
    assert(loginLayout.borderWidth >= 1, "Form đăng nhập thiếu border.");
    assert(!loginLayout.hasLegacyLeftCopy, "Trang đăng nhập còn khối chữ Báo giá Tùng Phát bên trái.");
    await screenshot(loginPage, "login.png");
    await loginContext.close();

    const employeeContext = await browser.newContext(contextOptions);
    const employeePage = await employeeContext.newPage();
    observePage(employeePage);
    await loginUi(employeePage, employeeUsername, employeePassword, "/bao-gia");
    await employeePage.goto(`${origin}/bao-gia/${quoteId}/chinh-sua`, { waitUntil: "networkidle" });
    await employeePage.getByRole("heading", { name: /Chỉnh sửa TP(14|81)-/ }).waitFor();
    await screenshot(employeePage, "employee-quote-editor.png");

    await employeePage.goto(`${origin}/bao-gia/moi`, { waitUntil: "networkidle" });
    await employeePage.getByLabel("Tên khách hàng").fill(customerName);
    await employeePage.getByRole("listbox", { name: "Khách hàng đã lưu" }).waitFor({ state: "visible" });
    await screenshot(employeePage, "customer-autocomplete.png");

    await employeePage.goto(`${origin}/bao-gia/${quoteId}/xem-truoc`, { waitUntil: "networkidle" });
    await employeePage.getByRole("heading", { name: "BẢNG BÁO GIÁ" }).waitFor();
    const previewTypography = await employeePage.evaluate(async () => {
      await document.fonts.ready;
      const sheet = document.querySelector(".quote-preview-sheet");
      const title = document.querySelector(".quote-preview-sheet > h1");
      if (!(sheet instanceof HTMLElement) || !(title instanceof HTMLElement)) return null;
      const sheetStyle = getComputedStyle(sheet);
      const titleStyle = getComputedStyle(title);
      return {
        fontFamily: sheetStyle.fontFamily,
        fontLoaded: document.fonts.check('12px "Montserrat TP"'),
        bodyLineHeight: sheetStyle.lineHeight,
        titleFontWeight: Number(titleStyle.fontWeight),
      };
    });
    assert(previewTypography?.fontLoaded && previewTypography.fontFamily.includes("Montserrat TP"), "Quote preview production không dùng Montserrat TP.");
    assert(previewTypography.titleFontWeight >= 700, "Quote preview production thiếu font đậm cho tiêu đề.");
    await screenshot(employeePage, "quote-preview.png");
    await employeeContext.close();

    const adminContext = await browser.newContext(contextOptions);
    const adminPage = await adminContext.newPage();
    observePage(adminPage);
    await loginUi(adminPage, adminUsernameValue, adminPasswordValue, "/admin");
    const adminPages = [
      ["/admin", "Tổng quan báo giá", "admin-dashboard.png"],
      ["/admin/nhan-vien", "Nhân viên", "admin-users.png"],
      ["/admin/chi-nhanh", "Chi nhánh", "admin-branches.png"],
      ["/admin/cai-dat", "Cài đặt hệ thống", "admin-settings.png"],
      ["/admin/bao-gia", "Tất cả báo giá", "admin-quotes.png"],
    ];
    for (const [path, heading, fileName] of adminPages) {
      await adminPage.goto(`${origin}${path}`, { waitUntil: "networkidle" });
      await adminPage.getByRole("heading", { name: heading, exact: true }).waitFor();
      await screenshot(adminPage, fileName);
    }
    await adminPage.goto(`${origin}/admin/lich-su`, { waitUntil: "networkidle" });
    await adminPage.getByRole("heading", { name: "Lịch sử hệ thống" }).waitFor();
    await adminContext.close();
  } finally {
    await browser.close();
  }
  assert(errors.length === 0, `UI production có page error: ${errors[0] ?? "không xác định"}`);
  assert(insecureRequests.length === 0, "UI production có mixed content.");
}

let admin;
try {
  admin = await login(adminUsername, adminPassword);
  assert(admin.user?.role === "ADMIN", "Tài khoản admin không có quyền ADMIN.");
  assert(Object.values(admin.cookieFlags).every(Boolean), "Cookie production thiếu HttpOnly, Secure hoặc SameSite=Strict.");
} catch (error) {
  console.error(`ACCEPTANCE_FAILED=${error instanceof Error ? error.message : "Lỗi đăng nhập không xác định"}`);
  process.exit(1);
}

let employeeId = null;
let employeeActive = false;
let otherEmployeeId = null;
let otherEmployeeActive = false;
let quoteId = null;
let quoteVerifiedAsAcceptance = false;
let pdfVerified = false;
let quoteSoftDeleted = false;
let adminLoggedOut = false;

try {
  const publicChecks = await Promise.all([
    request("GET", "/login", { accept: "text/html" }),
    request("GET", "/api/health"),
    request("GET", "/api/quotes"),
    request("GET", "/api/admin/users"),
    request("GET", "/api/customers?q=test"),
    request("GET", "/mot-route-spa-khong-ton-tai", { accept: "text/html" }),
    request("GET", `/_worker.js.map?acceptance=${Date.now()}`),
  ]);
  assert(publicChecks[0].status === 200, "GET /login không trả 200.");
  assert(publicChecks[1].status === 200, "GET /api/health không trả 200.");
  assert(publicChecks[2].status === 401 && publicChecks[3].status === 401 && publicChecks[4].status === 401, "API protected không trả 401 khi anonymous.");
  assert(publicChecks[5].status === 200 && publicChecks[5].buffer.toString("utf8").includes("<div id=\"root\"></div>"), "SPA fallback không hoạt động.");
  assert(publicChecks[6].status === 404, "Source map Worker đang public.");
  const publicPayload = Buffer.concat(publicChecks.map((response) => response.buffer)).toString("utf8");
  assert(!/SESSION_SECRET|password_hash|c531441e-5410-4a16-8607-ba983f50b215|\"stack\"\s*:/i.test(publicPayload), "Public response làm lộ secret, D1 ID hoặc stack trace.");
  assert(publicChecks[1].headers["access-control-allow-origin"] !== "*", "API có CORS wildcard.");

  for (const path of ["/admin", "/admin/bao-gia", "/admin/nhan-vien", "/admin/chi-nhanh", "/admin/cai-dat", "/admin/lich-su"]) {
    const response = await request("GET", path, { jar: admin.jar, accept: "text/html" });
    assert(response.status === 200, `${path} không hoạt động.`);
  }

  const settingsResponse = await api("GET", "/api/admin/settings", { jar: admin.jar });
  const settings = settingsResponse.data?.settings;
  assert(settings?.company?.headerContactName === "Mr. Tùng" && settings?.company?.headerPhone === "0909 259 160", "Header contact production không đúng.");
  assert(settings?.bank?.bankCode === "ACB" && settings?.bank?.accountNumber === "3191158", "Thông tin ngân hàng production không đúng.");
  assert(settings?.bank?.holder === "CTY TNHH THUONG MAI DICH VU GO TUNG PHAT", "Chủ tài khoản production không đúng.");
  assert(settings?.bank?.store === "TUNG PHAT", "Tên cửa hàng VietQR production không đúng.");

  const meta = (await api("GET", "/api/meta", { jar: admin.jar })).data;
  const tp14 = meta?.branches?.find((branch) => branch.code === "TP14");
  const tp81 = meta?.branches?.find((branch) => branch.code === "TP81");
  assert(tp14?.name === "Tùng Phát 1" && tp14?.address === "14 Tam Bình, Hiệp Bình, TP.HCM" && tp14?.phone === "0909 259 160", "Chi nhánh TP14 production không đúng.");
  assert(tp81?.name === "Tùng Phát 2" && tp81?.address === "81B Tam Bình, Hiệp Bình, TP.HCM" && tp81?.phone === "0909 259 160", "Chi nhánh TP81 production không đúng.");

  const runSuffix = Date.now().toString(36);
  const employeeUsername = "chau";
  const otherEmployeeUsername = `phanquyen-${runSuffix}`;
  const employeePassword = randomBytes(32).toString("base64url");
  const otherEmployeePassword = randomBytes(32).toString("base64url");
  const employeePhone = "";
  const customerName = "anh huy";
  const customerPhone = "0909259100";

  const evidence = queryD1(`
    SELECT q.id,q.quote_number,q.created_by,q.quote_date,q.customer_name,q.customer_phone,q.customer_address,q.general_note,
      q.subtotal,q.grand_total,q.remaining_amount,q.status,q.pdf_version,q.latest_pdf_key,q.deleted_at,q.created_at,
      u.username,u.full_name,u.phone,u.role,u.branch_id,u.is_active,u.created_at AS user_created_at
    FROM quotes q JOIN users u ON u.id=q.created_by WHERE q.quote_number='${targetQuoteNumber}';
    SELECT position,product_name,specification,quantity_milli,unit,unit_price,line_total,note,deleted_at
    FROM quote_items WHERE quote_id=(SELECT id FROM quotes WHERE quote_number='${targetQuoteNumber}') ORDER BY position;
    SELECT action,actor_user_id,entity_type,entity_id,new_data,created_at FROM audit_logs
    WHERE entity_id IN ((SELECT id FROM quotes WHERE quote_number='${targetQuoteNumber}'),(SELECT created_by FROM quotes WHERE quote_number='${targetQuoteNumber}'))
      OR entity_id IN (SELECT id FROM quote_versions WHERE quote_id=(SELECT id FROM quotes WHERE quote_number='${targetQuoteNumber}'))
    ORDER BY created_at;
    SELECT COUNT(*) AS quote_count FROM quotes WHERE created_by=(SELECT created_by FROM quotes WHERE quote_number='${targetQuoteNumber}');
  `);
  const evidenceQuote = evidence[0]?.results?.[0];
  const evidenceItems = evidence[1]?.results ?? [];
  const evidenceActions = new Set((evidence[2]?.results ?? []).map((row) => row.action));
  const createdAfterUserMs = new Date(evidenceQuote?.created_at ?? 0).getTime() - new Date(evidenceQuote?.user_created_at ?? 0).getTime();
  assert(evidenceQuote?.quote_number === targetQuoteNumber && !evidenceQuote.deleted_at, "Không tìm thấy quote nghiệm thu đang hoạt động.");
  assert(evidenceQuote.username === "chau" && evidenceQuote.full_name === "Châu" && evidenceQuote.role === "EMPLOYEE" && evidenceQuote.branch_id === tp81.id, "Chủ quote không khớp tài khoản nghiệm thu ban đầu.");
  assert(createdAfterUserMs >= 0 && createdAfterUserMs < 2 * 60_000 && Number(evidence[3]?.results?.[0]?.quote_count) === 1, "Không đủ bằng chứng quote được tạo bởi tài khoản nghiệm thu mới.");
  assert(evidenceQuote.customer_name === customerName && evidenceQuote.customer_phone === customerPhone && evidenceQuote.subtotal === 66_000 && evidenceQuote.grand_total === 66_000 && evidenceQuote.remaining_amount === 66_000, "Nội dung quote không khớp dữ liệu nghiệm thu đã biết.");
  assert(evidenceItems.length === 1 && evidenceItems[0].product_name === "aa" && evidenceItems[0].specification === "aa" && evidenceItems[0].quantity_milli === 2_000 && evidenceItems[0].unit_price === 33_000 && evidenceItems[0].line_total === 66_000 && !evidenceItems[0].deleted_at, "Dòng sản phẩm quote không khớp dữ liệu nghiệm thu.");
  for (const action of ["USER_CREATED", "QUOTE_CREATED", "PDF_EXPORTED", "QUOTE_CANCELLED", "QUOTE_RESTORED"]) {
    assert(evidenceActions.has(action), `Audit lịch sử quote nghiệm thu thiếu ${action}.`);
  }
  quoteId = evidenceQuote.id;
  employeeId = evidenceQuote.created_by;
  quoteVerifiedAsAcceptance = true;

  const users = await api("GET", "/api/admin/users", { jar: admin.jar });
  const acceptanceEmployee = users.data.users.find((user) => user.id === employeeId && user.username === employeeUsername);
  assert(acceptanceEmployee, "Không tìm thấy tài khoản nghiệm thu Châu qua API admin.");
  await api("PUT", `/api/admin/users/${employeeId}`, {
    jar: admin.jar,
    csrf: admin.csrf,
    body: { username: acceptanceEmployee.username, fullName: acceptanceEmployee.fullName, phone: acceptanceEmployee.phone, password: employeePassword, role: acceptanceEmployee.role, branchId: acceptanceEmployee.branchId, isActive: true },
  });
  employeeActive = true;

  otherEmployeeId = await createUserOrRecover({ username: otherEmployeeUsername, fullName: "Nhân viên kiểm tra phân quyền", phone: "0909 259 889", password: otherEmployeePassword, role: "EMPLOYEE", branchId: tp81.id, isActive: true }, admin.jar, admin.csrf);
  otherEmployeeActive = true;

  const employee = await login(employeeUsername, employeePassword);
  const otherEmployee = await login(otherEmployeeUsername, otherEmployeePassword);
  assert(employee.user?.role === "EMPLOYEE" && employee.user?.branchCode === "TP81" && employee.user?.phone === employeePhone, "Tài khoản nghiệm thu sai role, chi nhánh hoặc số điện thoại.");
  assert(otherEmployee.user?.role === "EMPLOYEE" && otherEmployee.user?.branchCode === "TP81", "Tài khoản kiểm tra phân quyền không hợp lệ.");

  const employeeQuote = await api("GET", `/api/quotes/${quoteId}`, { jar: employee.jar });
  const acceptanceQuote = employeeQuote.data.quote;
  assert(acceptanceQuote.quoteNumber === targetQuoteNumber && acceptanceQuote.quoteDate === "2026-07-22", "API trả sai quote nghiệm thu.");
  assert(!Object.hasOwn(acceptanceQuote, "validUntil"), "Báo giá production vẫn có trường hiệu lực.");
  assert(acceptanceQuote.employeeName === "Châu" && acceptanceQuote.employeePhone === employeePhone, "Người lập quote nghiệm thu không đúng.");
  assert(acceptanceQuote.totals.subtotal === 66_000 && acceptanceQuote.totals.grandTotal === 66_000 && acceptanceQuote.totals.remainingAmount === 66_000, "Tổng tiền quote nghiệm thu bị thay đổi.");
  assert(acceptanceQuote.items.length === 1 && acceptanceQuote.items[0].productName === "aa" && acceptanceQuote.items[0].quantity === 2, "Nội dung quote nghiệm thu bị thay đổi.");
  const employeeQuotes = await api("GET", "/api/quotes", { jar: employee.jar });
  assert(employeeQuotes.data.quotes.some((quote) => quote.id === quoteId), "Employee không thấy báo giá của mình.");
  assert(employeeQuotes.data.quotes.every((quote) => quote.createdBy === employeeId), "Employee thấy báo giá không thuộc quyền.");
  const adminQuote = await api("GET", `/api/quotes/${quoteId}`, { jar: admin.jar });
  assert(adminQuote.data.quote.createdBy === employeeId, "Admin không đọc được báo giá nghiệm thu.");

  const employeeCustomers = await api("GET", `/api/customers?q=${encodeURIComponent(customerPhone)}`, { jar: employee.jar });
  const adminCustomers = await api("GET", `/api/customers?q=${encodeURIComponent(customerPhone)}`, { jar: admin.jar });
  assert(employeeCustomers.data.customers.some((customer) => customer.name === customerName), "Employee không đọc được customer nghiệm thu đã lưu.");
  assert(adminCustomers.data.customers.some((customer) => customer.name === customerName), "Admin không nhìn thấy customer nghiệm thu shared.");
  assert((await request("GET", `/api/customers?q=${encodeURIComponent(customerPhone)}`)).status === 401, "Anonymous truy cập được customer route.");

  const exported = await api("POST", `/api/quotes/${quoteId}/pdf`, { jar: employee.jar, csrf: employee.csrf });
  const employeePdf = await api("GET", exported.data.downloadUrl, { jar: employee.jar });
  assert(employeePdf.durationMs < 20_000, "Thời gian tải PDF production quá lâu.");
  assert(String(employeePdf.headers["content-type"]).includes("application/pdf"), "PDF route không trả application/pdf.");
  assert(employeePdf.buffer.subarray(0, 5).toString("ascii") === "%PDF-", "File tải về không phải PDF.");
  assert(employeePdf.buffer.byteLength > 20_000, "PDF production quá nhỏ bất thường.");

  const anonymousPdf = await request("GET", exported.data.downloadUrl);
  assert(anonymousPdf.status === 401, "Người chưa đăng nhập tải được PDF.");
  const adminPdf = await api("GET", exported.data.downloadUrl, { jar: admin.jar });
  assert(adminPdf.buffer.byteLength === employeePdf.buffer.byteLength, "Admin tải PDF không khớp phiên bản employee.");
  const otherEmployeePdf = await request("GET", exported.data.downloadUrl, { jar: otherEmployee.jar });
  assert(otherEmployeePdf.status === 404, "Employee khác tải được PDF không thuộc quyền.");

  const document = await PDFDocument.load(employeePdf.buffer);
  const imageCount = (employeePdf.buffer.toString("latin1").match(/\/Subtype\s*\/Image/g) ?? []).length;
  assert(document.getPageCount() >= 1, "PDF production không có trang.");
  assert(imageCount >= 2, "PDF production thiếu logo hoặc QR image.");

  await mkdir(artifactDir, { recursive: true });
  const pdfPath = `${artifactDir}/production-acceptance.pdf`;
  await writeFile(pdfPath, employeePdf.buffer);
  const extracted = spawnSync("pdftotext", [pdfPath, "-"], { encoding: "utf8", maxBuffer: 5 * 1024 * 1024 });
  assert(extracted.status === 0, "Không thể trích xuất text từ PDF production.");
  const pdfText = extracted.stdout;
  const normalizedPdfText = pdfText.replace(/\s+/g, " ");
  for (const expected of ["TÙNG PHÁT", targetQuoteNumber, "Báo giá chưa bao gồm", "Mr. Tùng - 0909 259 160", "Tùng Phát 2", "Châu", "ACB", "3191158", "CTY TNHH THUONG MAI DICH VU GO TUNG PHAT"]) {
    assert(normalizedPdfText.includes(expected), `PDF thiếu nội dung bắt buộc: ${expected}`);
  }
  assert(!/Hiệu lực|Chữ ký|Ký tên|des=undefined|-0\s*₫/i.test(pdfText), "PDF còn hiệu lực, chữ ký, des=undefined hoặc -0 ₫.");
  const fonts = spawnSync("pdffonts", [pdfPath], { encoding: "utf8", maxBuffer: 5 * 1024 * 1024 });
  assert(fonts.status === 0, "Không thể kiểm tra font nhúng trong PDF production.");
  assert(/Montserrat-Regular[\s\S]*yes\s+no\s+yes/i.test(fonts.stdout), "PDF production chưa embed đầy đủ Montserrat Regular Unicode.");
  assert(/Montserrat-Bold[\s\S]*yes\s+no\s+yes/i.test(fonts.stdout), "PDF production chưa embed đầy đủ Montserrat Bold Unicode.");
  assert(!/Noto Sans/i.test(fonts.stdout), "PDF production vẫn dùng font Noto Sans khác quote preview.");
  const rendered = spawnSync("pdftoppm", ["-png", "-f", "1", "-singlefile", "-r", "144", pdfPath, `${artifactDir}/pdf-page-1`], { encoding: "utf8", maxBuffer: 5 * 1024 * 1024 });
  assert(rendered.status === 0, "Không thể render PDF page 1.");
  const decodedQr = await decodeRenderedQr(`${artifactDir}/pdf-page-1.png`);

  const version = loadVersionSnapshot(exported.data.versionId);
  const qrUrl = new URL(version.snapshot.qrUrl);
  assert(qrUrl.searchParams.get("acc") === "3191158", "VietQR sai số tài khoản.");
  assert(qrUrl.searchParams.get("bank") === "ACB", "VietQR sai ngân hàng.");
  assert(qrUrl.searchParams.get("amount") === "66000", "VietQR sai remaining amount.");
  assert(qrUrl.searchParams.get("template") === "compact", "VietQR sai template.");
  assert(qrUrl.searchParams.get("showinfo") === "true" && qrUrl.searchParams.get("fullacc") === "true", "VietQR thiếu showinfo/fullacc.");
  assert(qrUrl.searchParams.get("holder") === "CTY TNHH THUONG MAI DICH VU GO TUNG PHAT", "VietQR sai holder.");
  assert(qrUrl.searchParams.get("store") === "TUNG PHAT", "VietQR sai store.");
  assert(!qrUrl.searchParams.has("des"), "VietQR còn dùng mã báo giá làm nội dung chuyển khoản.");
  assert(decodedQr.bankBin === "970416" && decodedQr.accountNumber === "3191158" && decodedQr.serviceCode === "QRIBFTTA", "VietQR render sai ngân hàng, tài khoản hoặc service code.");
  assert(decodedQr.currency === "704" && decodedQr.amount === 66_000 && decodedQr.country === "VN" && !decodedQr.additionalData, "VietQR render sai tiền tệ, số tiền hoặc chứa nội dung chuyển khoản ngoài yêu cầu.");
  assert(version.pdfKey && version.pdfSize === employeePdf.buffer.byteLength, "D1 PDF metadata không khớp R2 object.");
  pdfVerified = true;

  await captureScreenshots({
    adminUsernameValue: adminUsername,
    adminPasswordValue: adminPassword,
    employeeUsername,
    employeePassword,
    quoteId,
    customerName,
  });

  const beforeDelete = queryD1(`SELECT COUNT(*) AS item_count FROM quote_items WHERE quote_id='${quoteId}'; SELECT COUNT(*) AS version_count FROM quote_versions WHERE quote_id='${quoteId}';`);
  await api("DELETE", `/api/admin/quotes/${quoteId}`, { jar: admin.jar, csrf: admin.csrf });
  quoteSoftDeleted = true;
  const adminQuotesAfterDelete = await api("GET", "/api/quotes", { jar: admin.jar });
  assert(!adminQuotesAfterDelete.data.quotes.some((quote) => quote.id === quoteId), "Quote soft-deleted vẫn còn trong list mặc định.");
  assert((await request("GET", `/api/quotes/${quoteId}`, { jar: admin.jar })).status === 404, "Quote soft-deleted vẫn đọc được.");
  assert((await request("POST", `/api/quotes/${quoteId}/pdf`, { jar: employee.jar, csrf: employee.csrf })).status === 404, "Quote soft-deleted vẫn export thêm được.");
  const afterDelete = queryD1(`SELECT deleted_at,latest_pdf_key FROM quotes WHERE id='${quoteId}'; SELECT COUNT(*) AS item_count FROM quote_items WHERE quote_id='${quoteId}'; SELECT COUNT(*) AS version_count FROM quote_versions WHERE quote_id='${quoteId}'; SELECT new_data FROM audit_logs WHERE action='QUOTE_DELETED' AND entity_id='${quoteId}' ORDER BY created_at DESC LIMIT 1;`);
  assert(afterDelete[0]?.results?.[0]?.deleted_at && afterDelete[0]?.results?.[0]?.latest_pdf_key, "Quote chưa soft-delete hoặc mất PDF key.");
  assert(Number(afterDelete[1]?.results?.[0]?.item_count) === Number(beforeDelete[0]?.results?.[0]?.item_count), "quote_items bị mất sau soft-delete.");
  assert(Number(afterDelete[2]?.results?.[0]?.version_count) === Number(beforeDelete[1]?.results?.[0]?.version_count), "quote_versions bị mất sau soft-delete.");
  assert(JSON.parse(afterDelete[3]?.results?.[0]?.new_data ?? "{}").deletionMode === "SOFT_DELETE", "Audit log thiếu deletionMode=SOFT_DELETE.");

  await api("PUT", `/api/admin/users/${employeeId}`, {
    jar: admin.jar,
    csrf: admin.csrf,
    body: { username: employeeUsername, fullName: "Châu", phone: employeePhone, role: "EMPLOYEE", branchId: tp81.id, isActive: false },
  });
  employeeActive = false;
  await api("PUT", `/api/admin/users/${otherEmployeeId}`, {
    jar: admin.jar,
    csrf: admin.csrf,
    body: { username: otherEmployeeUsername, fullName: "Nhân viên kiểm tra phân quyền", phone: "0909 259 889", role: "EMPLOYEE", branchId: tp81.id, isActive: false },
  });
  otherEmployeeActive = false;
  assert((await request("GET", "/api/auth/session", { jar: employee.jar })).status === 401, "Session employee vẫn hoạt động sau khi khóa.");
  assert((await request("GET", "/api/auth/session", { jar: otherEmployee.jar })).status === 401, "Session employee phân quyền vẫn hoạt động sau khi khóa.");

  const auditResponse = await api("GET", "/api/admin/audit-logs?limit=500", { jar: admin.jar });
  assert(auditResponse.data.logs.some((log) => log.action === "LOGIN_SUCCEEDED" && log.entityId === admin.user.id), "Audit log thiếu admin login.");
  const relevantLogs = auditResponse.data.logs.filter((log) => [employeeId, otherEmployeeId, quoteId, exported.data.versionId].includes(log.entityId) || log.actorName === "Châu");
  const actions = new Set(relevantLogs.map((log) => log.action));
  for (const action of ["LOGIN_SUCCEEDED", "USER_CREATED", "QUOTE_CREATED", "PDF_EXPORTED", "QUOTE_DELETED", "USER_UPDATED"]) {
    assert(actions.has(action), `Audit log thiếu ${action}.`);
  }
  const auditPayload = JSON.stringify(relevantLogs.map((log) => ({ oldData: log.oldData, newData: log.newData })));
  assert(!/password_hash|tp_quote_session|SESSION_SECRET|csrf|cookie/i.test(auditPayload), "Audit log có dấu hiệu chứa credential hoặc secret.");

  await api("POST", "/api/auth/logout", { jar: admin.jar, csrf: admin.csrf });
  adminLoggedOut = true;
  assert((await request("GET", "/api/auth/session", { jar: admin.jar })).status === 401, "Logout admin không vô hiệu hóa session.");

  const pdfStats = await stat(pdfPath);
  console.log(`ACCEPTANCE_RESULT=${JSON.stringify({
    status: "PASS",
    quoteNumber: acceptanceQuote.quoteNumber,
    quoteId,
    reusedExistingAcceptanceQuote: quoteVerifiedAsAcceptance,
    customerShared: true,
    employeePhone,
    totals: acceptanceQuote.totals,
    cookieFlags: admin.cookieFlags,
    pdf: { bytes: pdfStats.size, pages: document.getPageCount(), embeddedImages: imageCount, responseMs: employeePdf.durationMs, vietnameseText: true, fonts: ["Montserrat Regular", "Montserrat Bold"] },
    vietQrUrl: qrUrl.toString(),
    qrAmount: decodedQr.amount,
    qrDecodedFromRenderedPdf: true,
    anonymousPdfBlocked: true,
    otherEmployeePdfBlocked: true,
    r2MetadataMatched: true,
    quoteSoftDeleted,
    employeeLocked: !employeeActive,
    otherEmployeeLocked: !otherEmployeeActive,
    employeeSessionInvalidated: true,
    adminLogout: true,
    artifactDir,
  })}`);
} catch (error) {
  console.error(`ACCEPTANCE_FAILED=${error instanceof Error ? error.message : "Lỗi không xác định"}`);
  process.exitCode = 1;
} finally {
  if (!quoteSoftDeleted && pdfVerified && quoteId) {
    try {
      await api("DELETE", `/api/admin/quotes/${quoteId}`, { jar: admin.jar, csrf: admin.csrf });
      quoteSoftDeleted = true;
    } catch { /* Preserve the original acceptance error. */ }
  }
  if (employeeActive && employeeId) {
    try {
      const users = await api("GET", "/api/admin/users", { jar: admin.jar });
      const employee = users.data.users.find((user) => user.id === employeeId);
      if (employee) {
        await api("PUT", `/api/admin/users/${employeeId}`, {
          jar: admin.jar,
          csrf: admin.csrf,
          body: { username: employee.username, fullName: employee.fullName, phone: employee.phone, role: employee.role, branchId: employee.branchId, isActive: false },
        });
        employeeActive = false;
      }
    } catch { /* Preserve the original acceptance error. */ }
  }
  if (otherEmployeeActive && otherEmployeeId) {
    try {
      const users = await api("GET", "/api/admin/users", { jar: admin.jar });
      const employee = users.data.users.find((user) => user.id === otherEmployeeId);
      if (employee) {
        await api("PUT", `/api/admin/users/${otherEmployeeId}`, {
          jar: admin.jar,
          csrf: admin.csrf,
          body: { username: employee.username, fullName: employee.fullName, phone: employee.phone, role: employee.role, branchId: employee.branchId, isActive: false },
        });
        otherEmployeeActive = false;
      }
    } catch { /* Preserve the original acceptance error. */ }
  }
  if (!adminLoggedOut) {
    try { await api("POST", "/api/auth/logout", { jar: admin.jar, csrf: admin.csrf }); }
    catch { /* Preserve the original acceptance error. */ }
  }
}
