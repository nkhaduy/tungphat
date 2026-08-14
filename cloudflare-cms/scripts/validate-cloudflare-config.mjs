import { readFileSync, readdirSync } from "node:fs";
import { parse } from "yaml";

const config = JSON.parse(readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
const cms = parse(readFileSync(new URL("../public/config.yml", import.meta.url), "utf8"));
const migrations = readdirSync(new URL("../migrations", import.meta.url)).filter((name) => name.endsWith(".sql")).sort();
const errors = [];
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

function database(label, databases) {
  if (!Array.isArray(databases) || databases.length !== 1) {
    errors.push(`${label}: phải khai báo đúng một D1 database.`);
    return null;
  }
  const value = databases[0];
  if (value.binding !== "DB") errors.push(`${label}: D1 binding bắt buộc là DB.`);
  if (!uuid.test(value.database_id || "")) errors.push(`${label}: database_id không hợp lệ.`);
  if (value.migrations_dir !== "./migrations") errors.push(`${label}: migrations_dir phải là ./migrations.`);
  return value;
}

function mediaBucket(label, buckets, expectedName) {
  if (!Array.isArray(buckets) || buckets.length !== 1) {
    errors.push(`${label}: phải khai báo đúng một R2 bucket.`);
    return;
  }
  if (buckets[0].binding !== "MEDIA") errors.push(`${label}: R2 binding bắt buộc là MEDIA.`);
  if (buckets[0].bucket_name !== expectedName) errors.push(`${label}: R2 bucket name không đúng.`);
}

const production = database("production", config.d1_databases);
const preview = database("preview", config.env?.preview?.d1_databases);
mediaBucket("production", config.r2_buckets, "tung-phat-media");
mediaBucket("preview", config.env?.preview?.r2_buckets, "tung-phat-media-preview");
if (production && preview && production.database_id === preview.database_id) errors.push("Production và preview không được dùng chung D1 UUID.");
if (config.name !== "tungphat-light-cms-production") errors.push("Pages project production không đúng.");
if (config.pages_build_output_dir !== "./public") errors.push("pages_build_output_dir phải là ./public.");
if (!config.compatibility_flags?.includes("nodejs_compat")) errors.push("Thiếu nodejs_compat.");
if (migrations.join(",") !== "0001_create_leads.sql,0002_lead_status_history_triggers.sql,0003_add_request_context.sql,0004_create_analytics.sql,0005_create_cms_auth.sql,0006_create_cms_git_objects.sql,0007_create_gbp.sql,0008_gbp_multi_location.sql") errors.push("Danh sách migrations production không đúng.");
if (config.vars.CORS_ALLOWED_ORIGINS.includes("*")) errors.push("Production CORS không được dùng wildcard.");
if (config.vars.CORS_ALLOWED_ORIGINS !== "https://mdftungphat.com,https://www.mdftungphat.com") errors.push("Production CORS allowlist không đúng.");
if (cms.backend?.name !== "tungphat-gateway" || cms.backend?.branch !== "main") errors.push("Decap backend phải dùng custom Tùng Phát gateway trên branch main.");
if (cms.backend?.gateway_url !== "/git-gateway/github" || cms.backend?.status_endpoint !== "/api/gateway/status") errors.push("Decap Git Gateway phải dùng endpoint nội bộ cố định.");
if ("repo" in cms.backend || "auth_endpoint" in cms.backend || "base_url" in cms.backend) errors.push("Decap config không được chứa GitHub OAuth client config.");
if (cms.publish_mode !== "simple") errors.push("Decap phải dùng publish_mode: simple.");
if (cms.site_url !== "https://mdftungphat.com" || cms.display_url !== "https://mdftungphat.com") errors.push("CMS site/display URL phải là canonical apex.");
if (cms.media_library?.name === "default") errors.push("Không khai báo media_library name=default; Decap dùng media library tích hợp khi block này được bỏ.");

if (errors.length) {
  console.error(`Cloudflare CMS preflight thất bại (${errors.length} lỗi):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log("Cloudflare CMS preflight pass: Pages, D1, R2, session auth và Decap Git Gateway hợp lệ.");
