import fs from "node:fs";
import path from "node:path";
import raw from "../data/entity-corroboration.json";
import { normalizeEntityRecord, summarizeEntityRecords } from "../lib/entity-corroboration";

const records = raw.records.map((record) => normalizeEntityRecord(record as Parameters<typeof normalizeEntityRecord>[0]));
const result = {
  schemaVersion: "2.0",
  checkedAt: raw.checkedAt,
  entity: raw.entity,
  summary: summarizeEntityRecords(records),
  records,
  graph: {
    canonicalEntity: raw.entity,
    firstParty: records.filter((record) => record.sourceType === "website").map((record) => record.url).filter(Boolean),
    corroboratingSources: records.filter((record) => ["CONSISTENT", "VERIFIED"].includes(record.consistency)).map((record) => record.source),
    unresolvedSources: records.filter((record) => !["CONSISTENT", "VERIFIED"].includes(record.consistency)).map((record) => record.source),
  },
};
const outputPath = process.env.ENTITY_GRAPH_OUTPUT ?? "reports/entity-graph.json";
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, summary: result.summary }, null, 2));
