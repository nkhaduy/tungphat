export type SearchMonitorRecord = {
  query: string;
  category: "commercial" | "informational" | "comparison" | "local-cnc";
  engine: string;
  checkedAt: string;
  responseStatus: number;
  searchAvailable: boolean;
  found: boolean;
  sourcePosition: number | null;
  directAiCitation: boolean | null;
  targetUrl: string;
  targetStatus: number | null;
  targetIndexable: boolean | null;
  targetAvailable: boolean;
  competitorSources: string[];
  limitation: string;
};

export function summarizeSearchRecords(records: SearchMonitorRecord[]) {
  const categoryCounts: Record<string, { queries: number; found: number; cited: number }> = {};
  const competitorCounts = new Map<string, number>();

  for (const record of records) {
    const category = categoryCounts[record.category] ?? { queries: 0, found: 0, cited: 0 };
    category.queries += 1;
    category.found += Number(record.found);
    if (record.directAiCitation === true) category.cited += 1;
    categoryCounts[record.category] = category;
    for (const domain of new Set(record.competitorSources)) {
      competitorCounts.set(domain, (competitorCounts.get(domain) ?? 0) + 1);
    }
  }

  const topCompetitors = [...competitorCounts.entries()]
    .map(([domain, observationCount]) => ({ domain, observationCount }))
    .sort((a, b) => b.observationCount - a.observationCount || a.domain.localeCompare(b.domain))
    .slice(0, 20);

  return {
    queryCount: records.length,
    foundCount: records.filter((record) => record.found).length,
    citedCount: records.some((record) => record.directAiCitation !== null) ? records.filter((record) => record.directAiCitation === true).length : null,
    directAiCitationAvailable: records.some((record) => record.directAiCitation !== null),
    categoryCounts,
    topCompetitors,
  };
}

export function compareSearchReports(current: SearchMonitorRecord[], previous: SearchMonitorRecord[]) {
  const previousByQuery = new Map(previous.map((record) => [record.query, record]));
  const previousCompetitors = new Set(previous.flatMap((record) => record.competitorSources));
  const currentCompetitors = new Set(current.flatMap((record) => record.competitorSources));
  const gainedPresence: string[] = [];
  const lostPresence: string[] = [];
  const indexabilityChanges: Array<{ query: string; from: boolean | null; to: boolean | null }> = [];

  for (const record of current) {
    const prior = previousByQuery.get(record.query);
    if (record.searchAvailable && record.found && !prior?.found) gainedPresence.push(record.query);
    if (record.searchAvailable && !record.found && prior?.found && prior.searchAvailable !== false) lostPresence.push(record.query);
    const priorIndexable = prior?.targetIndexable ?? null;
    if (record.targetAvailable && record.targetIndexable !== null && priorIndexable !== null && record.targetIndexable !== priorIndexable) {
      indexabilityChanges.push({ query: record.query, from: priorIndexable, to: record.targetIndexable });
    }
  }

  return {
    gainedPresence,
    lostPresence,
    newCompetitors: [...currentCompetitors].filter((domain) => !previousCompetitors.has(domain)).sort(),
    indexabilityChanges,
  };
}
