import fs from "node:fs";
import { buildIndexationStatusMatrix, type Phase7AuthSnapshot } from "../lib/phase7-evidence";

const observationPath = process.env.INDEXATION_OBSERVATION_INPUT ?? "reports/indexation-observations-phase7.json";
const authPath = process.env.PHASE7_AUTH_INPUT ?? "reports/phase7-auth-attempts.json";
const outputPath = process.env.INDEXATION_STATUS_OUTPUT ?? "reports/indexation-status.json";

const observationReport = JSON.parse(fs.readFileSync(observationPath, "utf8")) as {
  sitemap: { url: string };
  observations: Array<{ engine: "GOOGLE" | "BING"; url: string; state: "OBSERVED" | "NOT_OBSERVED" | "UNKNOWN"; checkedAt: string }>;
};
const authReport = JSON.parse(fs.readFileSync(authPath, "utf8")) as {
  googleSearchConsole: { status: "AUTH_BLOCKED" | "AVAILABLE" | "UNKNOWN" };
  bingWebmaster: { status: "AUTH_BLOCKED" | "AVAILABLE" | "UNKNOWN" };
};

const urls = [...new Set(observationReport.observations.map((observation) => observation.url))];
const auth: Phase7AuthSnapshot = {
  google: { status: authReport.googleSearchConsole.status, urls: {} },
  bing: { status: authReport.bingWebmaster.status, urls: {} },
};
const records = buildIndexationStatusMatrix({
  urls,
  auth,
  observations: observationReport.observations,
  sitemapUrl: observationReport.sitemap.url,
});

const result = {
  schemaVersion: "1.0",
  checkedAt: new Date().toISOString(),
  sitemap: observationReport.sitemap,
  authentication: {
    google: authReport.googleSearchConsole.status,
    bing: authReport.bingWebmaster.status,
  },
  summary: {
    urlCount: records.length,
    googleConfirmedIndexed: records.filter((record) => record.googleConfirmedIndexation === "CONFIRMED_INDEXED").length,
    bingConfirmedIndexed: records.filter((record) => record.bingConfirmedIndexation === "CONFIRMED_INDEXED").length,
    googleAuthBlocked: records.filter((record) => record.googleConfirmedIndexation === "AUTH_BLOCKED").length,
    bingAuthBlocked: records.filter((record) => record.bingConfirmedIndexation === "AUTH_BLOCKED").length,
    googleObserved: records.filter((record) => record.googleObservedFallback === "OBSERVED").length,
    bingObserved: records.filter((record) => record.bingObservedFallback === "OBSERVED").length,
    googleNotObserved: records.filter((record) => record.googleObservedFallback === "NOT_OBSERVED").length,
    bingNotObserved: records.filter((record) => record.bingObservedFallback === "NOT_OBSERVED").length,
  },
  caveat: "Public fallback observations do not confirm indexation; confirmed states require authenticated engine evidence.",
  urls: records,
};

fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, ...result.summary }, null, 2));
