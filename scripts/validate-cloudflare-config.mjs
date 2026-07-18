import { readFileSync } from "node:fs";

const config = JSON.parse(readFileSync("wrangler.jsonc", "utf8"));
const requiredSecrets = ["TURNSTILE_SECRET_KEY", "IP_HASH_SALT"];
const deploymentChecklist = readFileSync("docs/CLOUDFLARE_DEPLOYMENT.md", "utf8");
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const placeholderIds = new Set([
  "00000000-0000-0000-0000-000000000000",
  "11111111-1111-1111-1111-111111111111"
]);
const errors = [];

function database(environment, databases) {
  if (!Array.isArray(databases) || databases.length !== 1) {
    errors.push(`${environment}: phải khai báo đúng một D1 database.`);
    return undefined;
  }
  const entry = databases[0];
  if (entry.binding !== "DB") errors.push(`${environment}: D1 binding bắt buộc là DB.`);
  if (!uuid.test(entry.database_id ?? "") || placeholderIds.has(entry.database_id)) {
    errors.push(`${environment}: database_id chưa là D1 UUID thật; không được deploy.`);
  }
  return entry;
}

const production = database("production", config.d1_databases);
const preview = database("preview", config.env?.preview?.d1_databases);
if (production && preview && production.database_id === preview.database_id) {
  errors.push("production và preview không được dùng chung D1 database_id.");
}
for (const secret of requiredSecrets) {
  if (!deploymentChecklist.includes(`\`${secret}\``)) errors.push(`Checklist deploy chưa khai báo secret bắt buộc ${secret}.`);
}

if (errors.length) {
  console.error(`Cloudflare deployment preflight thất bại (${errors.length} lỗi):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log("Cloudflare deployment preflight pass: D1 production/preview tách biệt và checklist secrets đầy đủ.");
