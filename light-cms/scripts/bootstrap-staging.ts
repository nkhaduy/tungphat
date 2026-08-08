import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { assertStagingResources } from "./guard-environment";

const root = path.resolve(import.meta.dirname, "..");
const resources = { environment: "staging", worker: "tungphat-light-cms-api-20260805-0855-staging", pages: "tungphat-light-cms-20260805-0855-staging", d1: "tungphat-light-cms-20260805-0855-staging", r2: "tungphat-light-media-20260805-0855-staging" };
assertStagingResources(resources);
const email = (process.env.LIGHT_CMS_BOOTSTRAP_EMAIL || "").trim().toLowerCase();
const displayName = (process.env.LIGHT_CMS_BOOTSTRAP_NAME || "Quản trị Tùng Phát").trim();
const role = process.env.LIGHT_CMS_BOOTSTRAP_ROLE || "super-admin";
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) throw new Error("LIGHT_CMS_BOOTSTRAP_EMAIL is required and must be an explicit approved email");
if (displayName.length < 2) throw new Error("LIGHT_CMS_BOOTSTRAP_NAME is invalid");
if (!["super-admin", "admin", "editor"].includes(role)) throw new Error("LIGHT_CMS_BOOTSTRAP_ROLE is invalid");
const now = new Date().toISOString();
const quote = (value: string) => `'${value.replaceAll("'", "''")}'`;
const sql = `INSERT INTO users(id,email,name,display_name,role,password_hash,active,status,access_subject,failed_attempts,locked_until,created_at,updated_at)
VALUES('staging-bootstrap-user',${quote(email)},${quote(displayName)},${quote(displayName)},${quote(role)},'!access-only!',1,'active',NULL,0,NULL,${quote(now)},${quote(now)})
ON CONFLICT(id) DO UPDATE SET email=excluded.email,name=excluded.name,display_name=excluded.display_name,role=excluded.role,active=1,status='active',failed_attempts=0,locked_until=NULL,updated_at=excluded.updated_at;`;
const directory = fs.mkdtempSync(path.join(os.tmpdir(), "tungphat-light-bootstrap-"));
const sqlFile = path.join(directory, "bootstrap.sql"); fs.writeFileSync(sqlFile, sql, { mode: 0o600 });
const wrangler = path.join(root, "node_modules/.bin/wrangler");
try {
  execFileSync(wrangler, ["d1", "execute", resources.d1, "--remote", "--config", path.join(root, "wrangler.worker.jsonc"), "--file", sqlFile], { stdio: "inherit" });
  console.log(`Staging identity user bootstrapped for ${email}; Access subject will bind on first verified login.`);
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
