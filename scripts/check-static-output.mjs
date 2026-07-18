import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const outputDirectory = path.resolve("out");
const maximumBytes = 24 * 1024 * 1024;
const violations = [];

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (entry.isFile()) {
      const relative = path.relative(outputDirectory, absolute);
      const size = statSync(absolute).size;
      if (relative === "0619.mp4") violations.push(`${relative}: legacy video must not be in static output`);
      if (size > maximumBytes) violations.push(`${relative}: ${size} bytes exceeds the 24 MiB safety threshold`);
    }
  }
}

walk(outputDirectory);
if (violations.length) {
  console.error(violations.join("\n"));
  process.exit(1);
}
console.log("Static output check passed: no legacy 0619.mp4 and no file over 24 MiB.");
