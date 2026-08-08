import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { publicSnapshotSchema } from "../src/contracts/content";
import { analyzeSource } from "./analyze-source";

const root = path.resolve(import.meta.dirname, "../.."); const analysis = analyzeSource(root); const snapshotFile = process.env.LIGHT_CMS_SNAPSHOT;
if (!snapshotFile) { console.log(JSON.stringify({ ok: analysis.issues.length === 0, counts: analysis.counts, settings: analysis.settings.length, media: analysis.media.length, issues: analysis.issues }, null, 2)); process.exitCode = analysis.issues.length ? 1 : 0; }
else {
  const snapshot = publicSnapshotSchema.parse(JSON.parse(fs.readFileSync(path.resolve(snapshotFile), "utf8")));
  const unsigned = { schemaVersion: snapshot.schemaVersion, generatedAt: snapshot.generatedAt, records: snapshot.records, settings: snapshot.settings, media: snapshot.media };
  const checksum = createHash("sha256").update(JSON.stringify(unsigned)).digest("hex");
  const expectedSlugs = analysis.records.filter((record) => record.status === "published").map((record) => `${record.collection}:${record.slug}`).sort();
  const actualSlugs = snapshot.records.map((record) => `${record.collection}:${record.slug}`).sort();
  const issues = [...analysis.issues]; if (checksum !== snapshot.checksum) issues.push("Snapshot checksum mismatch"); if (JSON.stringify(expectedSlugs) !== JSON.stringify(actualSlugs)) issues.push("Published slug parity mismatch");
  console.log(JSON.stringify({ ok: issues.length === 0, expectedSlugs, actualSlugs, media: snapshot.media.length, issues }, null, 2)); process.exitCode = issues.length ? 1 : 0;
}
