# Phase 5 Search Authority Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Phase 4 technically-ready site into a truthfully observed, source-backed, indexation-aware search authority system without increasing indexable page count for its own sake.

**Architecture:** Keep the existing static Next.js export and its 19 canonical URLs. Add deterministic evidence modules for public indexation observations, source/provenance tiers, material comparison data, internal authority flow, IndexNow deltas, and Phase 5 reporting; expose only crawlable verified data and preserve unavailable authenticated metrics as `null`.

**Tech Stack:** Next.js 15 static export, React 19, TypeScript, Vitest, Playwright, JSON/CSV public datasets, Vercel, GitHub CLI, IndexNow.

## Global Constraints

- Production acceptance URL is `https://mdftungphat.com`.
- Preserve the Phase 4 19-page indexable foundation unless a measured regression requires a change.
- Never fabricate index status, material or CNC specifications, entity relationships, prices, stock, hours, reviews, customers, certifications, or AI citations.
- `NOT_OBSERVED` is not equivalent to `NOT_INDEXED`; authenticated confirmations stay `null` when unavailable.
- Use only primary manufacturer, official catalogue, first-party business, or reputable technical sources for published factual fields; P5 sources cannot support technical claims.
- Keep unknown values `null` and keep machine-specific CNC limits unknown without model/manual evidence.
- Preserve the GA/GTM `lazyOnload` performance contract and current security headers.
- Preserve `stash@{0}` and unrelated worktrees/branches.

---

### Task 1: Reliable Baseline And Evidence Contracts

**Files:**
- Create: `vitest.config.ts` under `cloudflare-cms/`
- Create: `lib/source-quality.ts`
- Create: `lib/indexation-observation.ts`
- Create: `tests/source-quality.test.ts`
- Create: `tests/indexation-observation.test.ts`

**Interfaces:**
- Produces: `SourceQualityTier`, `validatePublishedProvenance`, `classifyPublicObservation`, and typed observation records used by data validation and reporting.

- [ ] Write a failing test proving published technical fields reject P5/unreferenced sources while null fields remain valid.
- [ ] Run `npm test -- tests/source-quality.test.ts` and confirm failure because the validator does not exist.
- [ ] Implement the minimal provenance-tier validator and rerun the test to green.
- [ ] Write a failing test proving Google/Bing observations distinguish `OBSERVED`, `NOT_OBSERVED`, and `UNKNOWN` without deriving `CONFIRMED_INDEXED` from public search results.
- [ ] Run the targeted test, implement the observation classifier, and rerun it to green.
- [ ] Add a CMS Vitest timeout configuration sized for the existing Argon2 cost so `npm test` is reliable under concurrent validation load.
- [ ] Run root and CMS tests sequentially and record the baseline.

### Task 2: Material Dataset V2 And Comparison Matrix

**Files:**
- Modify: `data/materials/materials.json`
- Modify: `lib/materials.ts`
- Modify: `lib/material-reference.ts`
- Modify: `components/materials/MaterialReferenceTable.tsx`
- Modify: `app/tham-chieu-vat-lieu/page.tsx`
- Modify: `scripts/generate-material-reference.mjs`
- Create: `public/material-comparison-matrix.csv`
- Create: `public/material-comparison-matrix.json`
- Modify: `tests/material-reference.test.ts`
- Create: `tests/material-provenance.test.ts`
- Create: `tests/material-comparison.test.ts`

**Interfaces:**
- Produces: crawlable family-level records for MDF, moisture-resistant MDF, HDF, MFC/particleboard, plywood, and finger-jointed wood with field-level source IDs and provenance tiers.

- [ ] Write failing tests for stable IDs, family/product distinction, required provenance tier, null unknowns, and CSV/JSON matrix parity.
- [ ] Run targeted tests and confirm failures against schema version 1.0.
- [ ] Add only source-backed family facts from primary or reputable technical sources; retain all unverified commercial and machine-specific fields as `null`.
- [ ] Generate the CSV/JSON assets and rerun targeted tests.
- [ ] Render source tier, source links, and last-verified metadata in HTML while keeping the full table in server-rendered markup before client filtering.
- [ ] Add concise MDF-vs-plywood, MDF-vs-MFC, and MDF-vs-HDF fact blocks with composition, surface/machining, moisture caveats, applications, and non-universal choice guidance.

### Task 3: Query Map, Internal Authority, And CNC Evidence

**Files:**
- Modify: `lib/query-url-map.ts`
- Modify: `data/query-url-map.json`
- Modify: `content/articles/mdf-thuong-va-chong-am.md`
- Modify: `content/articles/chuan-bi-file-cnc.md`
- Modify: `content/articles/go-ghep-la-gi.md`
- Modify: `content/pages/cat-cnc-go.md`
- Modify: `content/products/van-go-cong-nghiep.md`
- Modify: `tests/query-url-map.test.ts`
- Create: `lib/internal-link-graph.ts`
- Create: `scripts/audit-internal-link-graph.ts`
- Create: `tests/internal-link-graph.test.ts`

**Interfaces:**
- Produces: query coverage `COVERED 90 / PARTIAL 0 / GAP 0 / SHOULD_NOT_TARGET 10` only if the three comparison answers have accepted sources; produces click-depth, inlink-type, breadcrumb, and anchor-variation metrics.

- [ ] Write failing tests for the three remaining comparison intents and internal graph depth/inlink metrics.
- [ ] Run the targeted tests and confirm the current three `PARTIAL` entries and missing graph analyzer.
- [ ] Mark the intents covered only after the material matrix sources exist.
- [ ] Add natural contextual links from the three published knowledge articles to priority commercial/reference URLs without repeated exact-match anchors.
- [ ] Preserve the CNC distinction between general file hygiene and unverified Tùng Phát machine requirements; record the machine-model search result as unavailable evidence rather than adding numeric limits.
- [ ] Build and audit exported HTML; correct only genuinely weak authority flow.

### Task 4: Indexation Observation, Search Monitor V3, Sitemap, And IndexNow Delta

**Files:**
- Create: `scripts/observe-indexation.ts`
- Create: `reports/indexation-observations.json`
- Modify: `lib/search-monitor.ts`
- Modify: `scripts/monitor-search.ts`
- Modify: `data/ai-search-query-set.json`
- Modify: `tests/search-monitor.test.ts`
- Modify: `app/sitemap.ts`
- Modify: `scripts/check-sitemap-output.mjs`
- Modify: `lib/indexnow.ts`
- Modify: `scripts/submit-indexnow.mjs`
- Modify: `tests/indexnow.test.ts`

**Interfaces:**
- Produces: per-URL public observation states with method/date/confidence/caveat, immutable benchmark history, fixed 40-query comparable sample, fixed 15-query priority sample, and changed/deleted URL IndexNow payloads.

- [ ] Write failing tests for observation record truthfulness, priority sample stability, run-history preservation, and changed/deleted IndexNow URL selection.
- [ ] Run targeted tests and confirm current full-sitemap submission behavior fails the delta contract.
- [ ] Implement public Google/Bing observation capture with `UNKNOWN` on blocked/ambiguous response and never claim authenticated confirmation.
- [ ] Keep sitemap `lastmod` tied to actual content/settings dates; remove metadata hints only if they cannot be justified.
- [ ] Implement URL-level hash state, retry/backoff, observable response evidence, and changed/deleted delta submission.
- [ ] Rerun targeted tests and dry-run IndexNow against the built sitemap.

### Task 5: Entity Evidence, Diagnosis, And Phase 5 Snapshot

**Files:**
- Modify: `data/entity-corroboration.json`
- Modify: `scripts/build-entity-graph.ts`
- Create: `data/authority-opportunities.json`
- Create: `scripts/build-phase5-report.ts`
- Create: `tests/phase5-report.test.ts`
- Create: `reports/phase5-search-authority.json`
- Create: `docs/phase5-authority-diagnosis.md`

**Interfaces:**
- Produces: evidence-classified entity graph, ranked legitimate authority opportunities, zero-result diagnosis, and final machine-readable Phase 5 snapshot.

- [ ] Write a failing report test requiring null authenticated metrics, distinct observed/confirmed counts, query/material/entity metrics, IndexNow evidence, benchmark history, performance samples, and true blockers.
- [ ] Run the test and confirm the Phase 5 builder is absent.
- [ ] Record browser authentication attempts as `BLOCKED_AUTH` because no browser session is available; do not store credentials.
- [ ] Record official website and Zalo consistency, Google Maps place-ID evidence with its caveat, Facebook search outcome, public directory quality, and unresolved hours/GBP/Bing Places.
- [ ] Rank authority opportunities by impact, relevance, verifiability, and effort; exclude spam directories.
- [ ] Implement the report builder and rerun its test.

### Task 6: Full Validation, Deployment, And Production Evidence

**Files:**
- Modify: `package.json` only for deterministic Phase 5 commands.
- Update generated reports and public data assets from actual command output.

**Interfaces:**
- Produces: merged main SHA, READY Vercel deployment, production crawl, 3-sample mobile Lighthouse evidence, IndexNow delta response, and exact 40-query Phase 5 benchmark.

- [ ] Run lint, typecheck, root tests, CMS lint/typecheck/tests/build, production build, SEO audit, schema validation, link validation, provenance validation, dependency audit, secrets scan, and E2E.
- [ ] Inspect the diff and run the full verification suite again on the exact commit candidate.
- [ ] Commit logical batches, push the Phase 5 branch, create and merge a PR without force-push, then verify `origin/main`.
- [ ] Deploy production to Vercel, verify READY and aliases, crawl all production URLs, and verify security/bot/retrieval assets.
- [ ] Run three mobile Lighthouse samples and report the median plus outliers.
- [ ] Submit only changed canonical URLs to IndexNow and store status/response/hash evidence.
- [ ] Run the unchanged exact 40-query benchmark, store full history, generate `reports/phase5-search-authority.json`, and verify Git is clean.
