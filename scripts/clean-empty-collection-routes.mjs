import fs from "node:fs";
import path from "node:path";

// Next.js 15 static export rejects a dynamic segment when generateStaticParams
// returns an empty array. A sentinel lets the compiler finish; it resolves via
// notFound() and is removed here so no draft/fake URL reaches the deployment.
for (const collection of ["bai-viet", "du-an"]) {
  const generated = path.join(process.cwd(), "out", collection, "__empty-collection");
  if (fs.existsSync(generated)) fs.rmSync(generated, { recursive: true, force: true });
}

console.log("Đã loại route sentinel của collection rỗng khỏi static export.");
