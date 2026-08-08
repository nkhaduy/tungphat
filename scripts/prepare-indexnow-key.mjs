import { writeFileSync } from "node:fs";

const key = process.env.INDEXNOW_KEY?.trim();
if (!key) {
  console.log("IndexNow key preparation skipped: INDEXNOW_KEY is not configured.");
  process.exit(0);
}
if (!/^[a-z0-9-]{8,128}$/iu.test(key)) throw new Error("INDEXNOW_KEY must contain 8-128 letters, numbers, or hyphens.");
writeFileSync("public/indexnow-key.txt", `${key}\n`, { mode: 0o600 });
console.log("Prepared public/indexnow-key.txt for the static export.");
