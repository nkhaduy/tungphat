import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  DEFAULT_JS_BUDGETS,
  measureRouteBundles,
  validateJsBudgets,
} from "../lib/performance-budgets";

const nextDirectory = process.env.NEXT_BUILD_DIR ?? ".next";
const buildManifest = JSON.parse(
  readFileSync(path.join(nextDirectory, "build-manifest.json"), "utf8"),
);
const appManifest = JSON.parse(
  readFileSync(path.join(nextDirectory, "app-build-manifest.json"), "utf8"),
);

const measured = measureRouteBundles(
  {
    rootMainFiles: buildManifest.rootMainFiles,
    pages: appManifest.pages,
  },
  (file) => statSync(path.join(nextDirectory, file)).size,
);
const failures = validateJsBudgets(measured);
const report = {
  schemaVersion: "1.0",
  checkedAt: new Date().toISOString(),
  methodology: "Parsed production JavaScript bytes from Next.js app-build-manifest.json; budgets allow about 10% growth over the recovered Phase 6 build.",
  budgets: DEFAULT_JS_BUDGETS,
  measured,
  failures,
};

if (process.env.JS_BUDGET_OUTPUT) {
  mkdirSync(path.dirname(process.env.JS_BUDGET_OUTPUT), { recursive: true });
  writeFileSync(process.env.JS_BUDGET_OUTPUT, `${JSON.stringify(report, null, 2)}\n`);
}

console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
