import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

export function measurePagesCapacity(
  directory,
  scope,
  limits = { fileLimit: 20_000, maxFileBytes: 25 * 1024 * 1024 },
) {
  if (!existsSync(directory)) throw new Error(`Pages capacity directory does not exist: ${directory}`);
  let fileCount = 0;
  let bytes = 0;
  let maxFileBytes = 0;
  const visit = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const child = path.join(current, entry.name);
      if (entry.isDirectory()) visit(child);
      else if (entry.isFile()) {
        const size = statSync(child).size;
        fileCount += 1;
        bytes += size;
        maxFileBytes = Math.max(maxFileBytes, size);
      }
    }
  };
  visit(directory);
  return {
    scope,
    directory,
    fileCount,
    bytes,
    maxFileBytes,
    cloudflarePagesFileLimit: limits.fileLimit,
    cloudflarePagesMaxFileBytes: limits.maxFileBytes,
    fileCountGate: fileCount <= limits.fileLimit ? "PASS" : "FAIL",
    maxFileGate: maxFileBytes <= limits.maxFileBytes ? "PASS" : "FAIL",
  };
}
