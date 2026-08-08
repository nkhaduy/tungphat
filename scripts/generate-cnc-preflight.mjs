import fs from "node:fs";
import path from "node:path";
import checklist from "../data/cnc-preflight-checklist.json" with { type: "json" };

const output = process.env.CNC_PREFLIGHT_OUTPUT ?? "public/cnc-preflight-checklist.csv";

function cell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

const header = ["id", "label", "check", "status", "lastVerified", "sourceUrls"];
const rows = checklist.items.map((item) => [item.id, item.label, item.check, item.status, checklist.lastVerified, checklist.sourceUrls.join("; ")]);
const csv = [header.join(","), ...rows.map((row) => row.map(cell).join(","))].join("\n") + "\n";

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, csv);
console.log(`Generated ${output} (${checklist.items.length} checks)`);
