import { argon2id } from "@noble/hashes/argon2.js";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const username = process.env.ADMIN_USERNAME?.trim();
const fullName = process.env.ADMIN_FULL_NAME?.trim();
const password = process.env.ADMIN_PASSWORD;
if (!username || !fullName || !password) {
  console.error("Thiếu ADMIN_USERNAME, ADMIN_FULL_NAME hoặc ADMIN_PASSWORD.");
  process.exit(1);
}
if (!/^[a-zA-Z0-9._-]{3,100}$/.test(username) || password.length < 10) {
  console.error("Tên đăng nhập hoặc mật khẩu không hợp lệ.");
  process.exit(1);
}
const salt = randomBytes(16);
const hash = argon2id(password, salt, { t: 2, m: 19_456, p: 1, dkLen: 32, maxmem: 32 * 1024 * 1024 });
const base64url = (value) => Buffer.from(value).toString("base64url");
const passwordHash = `v1$argon2id$m=19456,t=2,p=1$${base64url(salt)}$${base64url(hash)}`;
const now = new Date().toISOString();
const escapeSql = (value) => value.replaceAll("'", "''");
const remote = process.argv.includes("--remote");
const locationFlag = remote ? "--remote" : "--local";

function runWrangler(args) {
  return spawnSync("npx", ["wrangler", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
}

const existingResult = runWrangler([
  "d1", "execute", "tung-phat-quotes", locationFlag,
  "--command", "SELECT id FROM users WHERE role='ADMIN' ORDER BY created_at,id;",
  "--json",
]);
if (existingResult.status !== 0) {
  console.error("Không thể kiểm tra tài khoản admin hiện tại.");
  process.exit(1);
}

let existingAdmins;
try {
  existingAdmins = JSON.parse(existingResult.stdout)?.[0]?.results ?? [];
} catch {
  console.error("Không thể đọc kết quả kiểm tra admin.");
  process.exit(1);
}
if (existingAdmins.length > 1) {
  console.error("Có nhiều hơn một tài khoản ADMIN; dừng để tránh cập nhật nhầm.");
  process.exit(1);
}

const id = existingAdmins[0]?.id ?? crypto.randomUUID();
const safeId = escapeSql(id);
const safeUsername = escapeSql(username);
const safeFullName = escapeSql(fullName);
const safePasswordHash = escapeSql(passwordHash);
const safeNow = escapeSql(now);
const sql = existingAdmins.length === 1
  ? `UPDATE users SET username='${safeUsername}',password_hash='${safePasswordHash}',full_name='${safeFullName}',role='ADMIN',branch_id='branch-tp81',is_active=1,updated_at='${safeNow}',deleted_at=NULL WHERE id='${safeId}';\nDELETE FROM sessions WHERE user_id='${safeId}';`
  : `INSERT INTO users(id,username,password_hash,full_name,role,branch_id,is_active,created_at,updated_at) VALUES('${safeId}','${safeUsername}','${safePasswordHash}','${safeFullName}','ADMIN','branch-tp81',1,'${safeNow}','${safeNow}');`;

const temporaryDirectory = mkdtempSync(join(tmpdir(), "quote-admin-sync-"));
const sqlPath = join(temporaryDirectory, "admin.sql");
try {
  writeFileSync(sqlPath, sql, { mode: 0o600 });
  const updateResult = runWrangler(["d1", "execute", "tung-phat-quotes", locationFlag, "--file", sqlPath]);
  if (updateResult.status !== 0) {
    console.error("Không thể đồng bộ tài khoản admin.");
    process.exitCode = 1;
  } else {
    const verifyCommand = `SELECT username,full_name,role,is_active,deleted_at,(SELECT COUNT(*) FROM sessions WHERE user_id=users.id) AS session_count FROM users WHERE id='${safeId}';`;
    const verifyResult = runWrangler(["d1", "execute", "tung-phat-quotes", locationFlag, "--command", verifyCommand, "--json"]);
    if (verifyResult.status !== 0) {
      console.error("Đã cập nhật nhưng không thể xác minh tài khoản admin.");
      process.exitCode = 1;
    } else {
      const row = JSON.parse(verifyResult.stdout)?.[0]?.results?.[0];
      const verified = row?.username === username && row?.full_name === fullName && row?.role === "ADMIN"
        && Number(row?.is_active) === 1 && row?.deleted_at === null && Number(row?.session_count) === 0;
      if (!verified) {
        console.error("Tài khoản admin chưa đạt trạng thái yêu cầu sau khi đồng bộ.");
        process.exitCode = 1;
      } else {
        console.log("ADMIN_SYNC_RESULT=PASS");
      }
    }
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
