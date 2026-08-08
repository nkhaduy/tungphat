import { paths } from "./config";
import { atomicWriteJson, readJsonIfExists } from "./stable-json";
import type { AnCuongProductRelation, CliOptions, RawProductDetail, RelationType } from "./types";

export type RelationRecord = {
  sourceId: string;
  sourceUrl: string;
  relationType: RelationType;
  targetSourceId?: string;
  targetSourceUrl?: string;
  targetProductCode?: string;
  targetName?: string;
};

type RelationDependencies = {
  detailsPath?: string;
  outputPath?: string;
};

function flatten(source: RawProductDetail, relations: AnCuongProductRelation[]): RelationRecord[] {
  return relations.map((relation) => ({
    sourceId: source.sourceId,
    sourceUrl: source.sourceUrl,
    relationType: relation.relationType,
    ...(relation.sourceId ? { targetSourceId: relation.sourceId } : {}),
    ...(relation.sourceUrl ? { targetSourceUrl: relation.sourceUrl } : {}),
    ...(relation.productCode ? { targetProductCode: relation.productCode } : {}),
    ...(relation.name ? { targetName: relation.name } : {})
  }));
}

export async function run(options: CliOptions, dependencies: RelationDependencies = {}): Promise<RelationRecord[]> {
  const detailsPath = dependencies.detailsPath ?? `${paths.raw}/details.json`;
  const details = await readJsonIfExists<RawProductDetail[]>(detailsPath);
  if (!details) throw new Error(`Detail dataset not found: ${detailsPath}`);
  const relations = details.flatMap((detail) => [
    ...flatten(detail, detail.sameColorProducts),
    ...flatten(detail, detail.relatedProducts),
    ...flatten(detail, detail.applicationProducts)
  ]);
  const seen = new Set<string>();
  const uniqueRelations = relations.filter((relation) => {
    const key = `${relation.sourceId}:${relation.relationType}:${relation.targetSourceId ?? relation.targetSourceUrl ?? relation.targetProductCode ?? relation.targetName}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => `${a.sourceId}:${a.relationType}:${a.targetSourceId ?? a.targetSourceUrl}`.localeCompare(`${b.sourceId}:${b.relationType}:${b.targetSourceId ?? b.targetSourceUrl}`));
  if (!options.dryRun) await atomicWriteJson(dependencies.outputPath ?? `${paths.normalized}/relations.json`, uniqueRelations);
  return uniqueRelations;
}
