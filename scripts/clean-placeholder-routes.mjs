import fs from "node:fs";
import path from "node:path";

for (const relative of ["bai-viet/__no-published-articles", "du-an/__no-published-projects"]) {
  const generated = path.join(process.cwd(), "out", relative);
  if (fs.existsSync(generated)) fs.rmSync(generated, { recursive: true, force: true });
}
console.log("Đã loại route placeholder khỏi static export.");
