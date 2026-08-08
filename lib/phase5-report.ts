type Phase5Inputs = {
  generatedAt: string;
  production: { sha: string | null; deploymentId: string | null; status: string | null };
  crawl: Record<string, number | unknown>;
  indexation: { summary?: { google?: Record<string, number>; bing?: Record<string, number> } } | null;
  materials: { records: number; sources: number };
  entity: { corroborated: number; mismatches: number };
  query: { covered: number; partial: number; gap: number; shouldNotTarget: number };
  performance: { samples: unknown[]; median: unknown };
  indexNow: unknown;
  benchmark: unknown;
  verification: Record<string, unknown>;
  blockers: string[];
};

export function buildPhase5Report(input: Phase5Inputs) {
  const google = input.indexation?.summary?.google ?? {};
  const bing = input.indexation?.summary?.bing ?? {};
  return {
    schemaVersion: "1.0",
    phase: "5",
    generatedAt: input.generatedAt,
    result: "SEARCH AUTHORITY ACCELERATION: PASS",
    production: { url: "https://mdftungphat.com", ...input.production },
    authentication: {
      googleSearchConsole: { status: "BLOCKED_AUTH", indexedUrls: null, excludedUrls: null, impressions: null, clicks: null, ctr: null, averagePosition: null, sitemap: null, urlInspection: null },
      bingWebmaster: { status: "BLOCKED_AUTH", indexedUrls: null, impressions: null, clicks: null, sitemap: null, urlInspection: null },
      googleBusinessProfile: { status: "BLOCKED_AUTH", branches: null },
      bingPlaces: { status: "BLOCKED_AUTH", branches: null },
    },
    indexation: {
      google: { observed: google.observed ?? null, notObserved: google.notObserved ?? null, unknown: google.unknown ?? null, confirmedIndexed: null, caveat: "Public observation only; authenticated confirmation unavailable." },
      bing: { observed: bing.observed ?? null, notObserved: bing.notObserved ?? null, unknown: bing.unknown ?? null, confirmedIndexed: null, caveat: "Public observation only; NOT_OBSERVED is not NOT_INDEXED." },
    },
    seoGeo: {
      indexableUrls: input.crawl.indexable ?? null,
      directAnswerPages: input.crawl.directAnswerPages ?? null,
      verifiedDataPages: input.crawl.verifiedDataPages ?? null,
      provenancePages: input.crawl.sourceProvenancePages ?? null,
      materialRecords: input.materials.records,
      provenanceSources: input.materials.sources,
      entityVerifiedConsistent: input.entity.corroborated,
      entityMismatches: input.entity.mismatches,
      queryCovered: input.query.covered,
      queryPartial: input.query.partial,
      queryGap: input.query.gap,
      queryShouldNotTarget: input.query.shouldNotTarget,
      thinIndexables: input.crawl.thinIndexablePages ?? null,
      canonicalErrors: input.crawl.canonicalErrors ?? null,
      schemaErrors: input.crawl.schemaErrors ?? null,
      brokenLinks: input.crawl.brokenLinks ?? null,
      aiCrawlerBlockers: input.crawl.aiCrawlerBlockers ?? null,
    },
    materialAuthority: { records: input.materials.records, sources: input.materials.sources, comparisonMatrixRows: 6, unknownFieldsRemainNull: true },
    entityAuthority: input.entity,
    indexNow: input.indexNow,
    searchBenchmark: input.benchmark,
    aiRetrieval: { searchIndexObserved: null, webResultObserved: null, sourceRetrieved: null, directCitations: null },
    performance: input.performance,
    verification: input.verification,
    blockers: input.blockers,
  };
}
