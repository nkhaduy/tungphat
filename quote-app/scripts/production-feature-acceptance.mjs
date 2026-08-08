import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { request as httpsRequest } from "node:https";
import jsQR from "jsqr";
import { PDFDocument } from "pdf-lib";
import { PNG } from "pngjs";

const host = "baogia.mdftungphat.com";
const origin = `https://${host}`;
const adminUsername = process.env.ADMIN_USERNAME?.trim();
const adminPassword = process.env.ADMIN_PASSWORD;
const artifactDir = "artifacts/production-feature-20260723";

if (!adminUsername || !adminPassword || adminPassword.length < 10) {
  console.error("Thiếu credential admin production hợp lệ.");
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
  header() { return [...this.cookies].map(([name, value]) => `${name}=${value}`).join("; "); }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function request(method, path, { body, jar, csrf, accept = "application/json" } = {}) {
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
    const req = httpsRequest({ hostname: host, port: 443, path, method, headers }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const buffer = Buffer.concat(chunks);
        jar?.absorb(response.headers);
        let data = null;
        if (String(response.headers["content-type"] ?? "").includes("application/json") && buffer.length) {
          try { data = JSON.parse(buffer.toString("utf8")); } catch { data = null; }
        }
        resolve({ status: response.statusCode ?? 0, headers: response.headers, buffer, data });
      });
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function api(method, path, options = {}) {
  const response = await request(method, path, options);
  if (response.status < 200 || response.status >= 300) {
    const fallback = response.buffer.toString("utf8").replace(/\s+/g, " ").slice(0, 180);
    throw new Error(`${method} ${path}: ${(response.data?.message ?? fallback) || `HTTP ${response.status}`}`);
  }
  return response;
}

async function exportPdfWithRetry(path, options) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await request("POST", path, options);
    if (response.status >= 200 && response.status < 300) return response;
    if (response.status !== 503 || attempt === 3) {
      const fallback = response.buffer.toString("utf8").replace(/\s+/g, " ").slice(0, 180);
      throw new Error(`POST ${path}: ${(response.data?.message ?? fallback) || `HTTP ${response.status}`}`);
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 1_500));
  }
  throw new Error("Không thể xuất PDF production.");
}

async function login(username, password) {
  const jar = new CookieJar();
  const csrfResponse = await api("GET", "/api/auth/csrf", { jar });
  const response = await api("POST", "/api/auth/login", { jar, body: { username, password, csrf: csrfResponse.data.csrf } });
  return { jar, csrf: response.data.csrf, user: response.data.user };
}

function queryD1(command) {
  const result = spawnSync("npx", ["wrangler", "d1", "execute", "tung-phat-quotes", "--remote", "--command", command, "--json"], {
    cwd: process.cwd(), encoding: "utf8", maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error("Không thể xác minh D1 production.");
  return JSON.parse(result.stdout);
}

function parseTlv(value) {
  const fields = {};
  for (let offset = 0; offset + 4 <= value.length;) {
    const id = value.slice(offset, offset + 2);
    const length = Number(value.slice(offset + 2, offset + 4));
    assert(Number.isInteger(length) && offset + 4 + length <= value.length, "QR payload không hợp lệ.");
    fields[id] = value.slice(offset + 4, offset + 4 + length);
    offset += 4 + length;
  }
  return fields;
}

function inspectRenderedPng(buffer) {
  const png = PNG.sync.read(buffer);
  const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height, { inversionAttempts: "dontInvert" });
  assert(decoded?.data, "Không giải mã được QR từ ảnh render PDF.");
  let left = png.width; let right = -1;
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const offset = (y * png.width + x) * 4;
      if (png.data[offset] > 248 && png.data[offset + 1] > 248 && png.data[offset + 2] > 248) continue;
      left = Math.min(left, x); right = Math.max(right, x);
    }
  }
  const root = parseTlv(decoded.data);
  const merchant = parseTlv(root["38"] ?? "");
  const account = parseTlv(merchant["01"] ?? "");
  return { width: png.width, left, right, amount: Number(root["54"]), bankBin: account["00"], accountNumber: account["01"] };
}

const suffix = `${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
const employeeUsername = `nghiemthu-${suffix}`;
const temporaryPassword = `Tmp-${randomBytes(10).toString("base64url")}`;
const changedPassword = `Moi-${randomBytes(12).toString("base64url")}`;
let admin;
let employee;
let employeeId = null;
let quoteId = null;
let quoteNumber = null;

try {
  await mkdir(artifactDir, { recursive: true });
  admin = await login(adminUsername, adminPassword);
  assert(admin.user?.role === "ADMIN", "Credential không có quyền admin.");
  const meta = (await api("GET", "/api/meta", { jar: admin.jar })).data;
  const tp81 = meta.branches.find((branch) => branch.code === "TP81");
  assert(tp81, "Không tìm thấy chi nhánh TP81.");

  const createdUser = await api("POST", "/api/admin/users", {
    jar: admin.jar, csrf: admin.csrf,
    body: { username: employeeUsername, fullName: "Nhân viên nghiệm thu tính năng", phone: "0909 259 899", password: temporaryPassword, role: "EMPLOYEE", branchId: tp81.id, isActive: true },
  });
  employeeId = createdUser.data.id;
  employee = await login(employeeUsername, temporaryPassword);
  assert(employee.user?.mustChangePassword === true, "Nhân viên mới không bị yêu cầu đổi mật khẩu.");
  assert((await request("GET", "/api/meta", { jar: employee.jar })).status === 409, "Nhân viên chưa đổi mật khẩu vẫn truy cập được dữ liệu.");
  await api("POST", "/api/auth/change-password", { jar: employee.jar, csrf: employee.csrf, body: { currentPassword: temporaryPassword, newPassword: changedPassword } });
  const employeeSession = await api("GET", "/api/auth/session", { jar: employee.jar });
  assert(employeeSession.data.user?.mustChangePassword === false, "Trạng thái đổi mật khẩu chưa được cập nhật.");

  const quoteDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
  const createdQuote = await api("POST", "/api/quotes", {
    jar: employee.jar, csrf: employee.csrf,
    body: {
      branchId: tp81.id, quoteDate, customerName: `Nghiệm thu ${suffix}`, customerPhone: "0909000000",
      customerAddress: "123 Đường số 8, Phường Hiệp Bình, TP.HCM", deliveryNote: "", generalNote: "",
      discount: 0, shippingFee: 0, processingFee: 0, vatAmount: 0, depositAmount: 0,
      items: [
        { productName: "Ván MDF chống ẩm phủ Melamine màu vân gỗ tên rất dài để kiểm tra xuống dòng tiếng Việt", specification: "1220 x 2440 x 18 mm", quantity: 2, unit: "Tấm", unitPrice: 33_000, note: "" },
        { productName: "Ván MDF lõi xanh", specification: "1220 x 2440 x 9 mm", quantity: 1, unit: "Tấm", unitPrice: 15_000, note: "" },
      ],
    },
  });
  quoteId = createdQuote.data.quote.id;
  quoteNumber = createdQuote.data.quote.quoteNumber;
  assert(quoteNumber.startsWith("TP81-"), "Báo giá mới không mặc định mã TP81.");
  const exported = await exportPdfWithRetry(`/api/quotes/${quoteId}/pdf`, { jar: employee.jar, csrf: employee.csrf });
  const pdfResponse = await api("GET", exported.data.downloadUrl, { jar: employee.jar, accept: "application/pdf" });
  const pdfPath = `${artifactDir}/feature-acceptance.pdf`;
  const pngPrefix = `${artifactDir}/feature-acceptance-page-1`;
  await writeFile(pdfPath, pdfResponse.buffer);
  const document = await PDFDocument.load(pdfResponse.buffer);
  assert(document.getPageCount() === 1, "PDF nghiệm thu không gọn trong một trang.");
  const fonts = spawnSync("pdffonts", [pdfPath], { encoding: "utf8" });
  assert(fonts.status === 0 && fonts.stdout.includes("Montserrat-Regular") && fonts.stdout.includes("Montserrat-Bold"), "PDF thiếu Montserrat Regular/Bold.");
  const text = spawnSync("pdftotext", [pdfPath, "-"], { encoding: "utf8" });
  assert(text.status === 0 && text.stdout.includes("CN1:") && text.stdout.includes("CN2:") && text.stdout.includes("Chi nhánh: Tùng Phát 2 (81B Tam Bình"), "Header hoặc địa chỉ chi nhánh PDF không đúng.");
  assert(!text.stdout.includes("Ghi chú") && !text.stdout.includes("GHI CHÚ"), "PDF vẫn hiện ghi chú khi dữ liệu trống.");
  const rendered = spawnSync("pdftoppm", ["-png", "-f", "1", "-singlefile", "-r", "144", pdfPath, pngPrefix], { encoding: "utf8" });
  assert(rendered.status === 0, "Không render được PDF production.");
  const inspection = inspectRenderedPng(await readFile(`${pngPrefix}.png`));
  const rightMargin = inspection.width - 1 - inspection.right;
  assert(inspection.left >= 50 && rightMargin >= 50 && Math.abs(inspection.left - rightMargin) <= 10, "Lề PDF không cân đối.");
  assert(inspection.bankBin === "970416" && inspection.accountNumber === "3191158" && inspection.amount === 81_000, "QR PDF sai ngân hàng, tài khoản hoặc số tiền.");

  const passwordResponse = await api("GET", `/api/admin/users/${employeeId}/password`, { jar: admin.jar });
  assert(passwordResponse.data.password === changedPassword, "Dashboard admin không xem được mật khẩu nhân viên đã đổi.");
  await api("DELETE", `/api/admin/quotes/${quoteId}`, { jar: admin.jar, csrf: admin.csrf });
  await api("DELETE", `/api/admin/users/${employeeId}`, { jar: admin.jar, csrf: admin.csrf });

  const state = queryD1(`
    SELECT deleted_at FROM quotes WHERE id='${quoteId}';
    SELECT COUNT(*) AS item_count FROM quote_items WHERE quote_id='${quoteId}';
    SELECT COUNT(*) AS version_count FROM quote_versions WHERE quote_id='${quoteId}';
    SELECT is_active,deleted_at FROM users WHERE id='${employeeId}';
    SELECT action FROM audit_logs WHERE entity_id IN ('${quoteId}','${employeeId}') ORDER BY created_at;
  `);
  assert(state[0]?.results?.[0]?.deleted_at, "Quote nghiệm thu chưa soft-delete.");
  assert(Number(state[1]?.results?.[0]?.item_count) === 2 && Number(state[2]?.results?.[0]?.version_count) === 1, "Item hoặc PDF version bị mất sau soft-delete.");
  assert(Number(state[3]?.results?.[0]?.is_active) === 0 && state[3]?.results?.[0]?.deleted_at, "Tài khoản nghiệm thu chưa khóa và soft-delete.");
  const actions = new Set((state[4]?.results ?? []).map((row) => row.action));
  for (const action of ["USER_PASSWORD_CHANGED", "USER_PASSWORD_VIEWED", "USER_DELETED", "QUOTE_DELETED"]) assert(actions.has(action), `Thiếu audit ${action}.`);
  await api("POST", "/api/auth/logout", { jar: admin.jar, csrf: admin.csrf });
  console.log(`FEATURE_ACCEPTANCE_RESULT=${JSON.stringify({ status: "PASS", quoteNumber, quoteSoftDeleted: true, employeeSoftDeleted: true, passwordFirstLogin: true, adminPasswordReveal: true, pdfFonts: ["Montserrat Regular", "Montserrat Bold"], headerBranches: true, emptyNoteHidden: true, qrDecoded: true, artifactDir })}`);
} catch (error) {
  console.error(`FEATURE_ACCEPTANCE_FAILED=${error instanceof Error ? error.message : "Lỗi không xác định"}`);
  if (admin && quoteId) await request("DELETE", `/api/admin/quotes/${quoteId}`, { jar: admin.jar, csrf: admin.csrf }).catch(() => undefined);
  if (admin && employeeId) await request("DELETE", `/api/admin/users/${employeeId}`, { jar: admin.jar, csrf: admin.csrf }).catch(() => undefined);
  process.exitCode = 1;
}
