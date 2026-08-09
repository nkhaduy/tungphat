import fs from "node:fs";
import path from "node:path";
import raw from "../data/entity-corroboration.json";
import business from "../content/settings/business.json";
import { buildExternalEntityEdges, normalizeEntityRecord, summarizeEntityRecords } from "../lib/entity-corroboration";

const records = raw.records.map((record) => normalizeEntityRecord(record as Parameters<typeof normalizeEntityRecord>[0]));
const externalEdges = buildExternalEntityEdges(records);
const externalNodes = externalEdges.map((edge) => {
  const record = records.find((item) => item.url === edge.evidence)!;
  return { id: edge.to, type: record.sourceType, label: record.source, url: record.url, evidence: record.evidence };
});
const result = {
  schemaVersion: "5.0",
  checkedAt: raw.checkedAt,
  entity: raw.entity,
  summary: summarizeEntityRecords(records),
  records,
  graph: {
    canonicalEntity: raw.entity,
    firstParty: records.filter((record) => record.sourceType === "website").map((record) => record.url).filter(Boolean),
    corroboratingSources: records.filter((record) => ["CONSISTENT", "VERIFIED"].includes(record.consistency)).map((record) => record.source),
    unresolvedSources: records.filter((record) => !["CONSISTENT", "VERIFIED"].includes(record.consistency)).map((record) => record.source),
    nodes: [
      { id: "tung-phat", type: "Organization", label: business.businessName, evidence: "content/settings/business.json" },
      ...business.locations.map((location) => ({ id: location.id, type: "LocalBusiness", label: location.name, address: location.address, evidence: location.directionsUrl })),
      { id: "phone", type: "ContactPoint", label: business.phoneDisplay, evidence: "Official website + Zalo URL" },
      { id: "domain", type: "WebSite", label: business.website, evidence: "Official website" },
      { id: "zalo", type: "SocialProfile", label: business.zaloUrl, evidence: "Official website socialLinks" },
      { id: "materials", type: "ProductCategory", label: "MDF, MFC, plywood và gỗ ghép", evidence: "Published product and reference pages" },
      { id: "cnc", type: "Service", label: "Gia công CNC gỗ", evidence: "Published service pages" },
      ...externalNodes,
    ],
    edges: [
      ...business.locations.map((location) => ({ from: "tung-phat", to: location.id, relationship: "branch", evidence: location.directionsUrl, status: "UNVERIFIED_EXTERNAL_DETAILS" })),
      { from: "tung-phat", to: "phone", relationship: "contact", evidence: "Official website + Zalo", status: "CONSISTENT" },
      { from: "tung-phat", to: "domain", relationship: "officialWebsite", evidence: "Official website", status: "CONSISTENT" },
      { from: "tung-phat", to: "zalo", relationship: "contactProfile", evidence: "Official website socialLinks", status: "CONSISTENT" },
      { from: "tung-phat", to: "materials", relationship: "offersCategory", evidence: "Published material pages", status: "FIRST_PARTY" },
      { from: "tung-phat", to: "cnc", relationship: "providesService", evidence: "Published CNC pages", status: "FIRST_PARTY" },
      ...externalEdges,
    ],
  },
};
const outputPath = process.env.ENTITY_GRAPH_OUTPUT ?? "reports/entity-graph.json";
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, summary: result.summary }, null, 2));
