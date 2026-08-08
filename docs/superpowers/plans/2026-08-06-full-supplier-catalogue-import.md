# Full Supplier Catalogue Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import and account for all current public catalogue records from An Cuong, Thanh Thuy and Ba Thanh, expose complete catalogue search/filter UI, and deploy a non-production preview.

**Architecture:** Supplier-specific discovery/crawl adapters emit a shared provenance manifest and normalized `CatalogueRecord` union. Validation reconciles every discovered source with an explicit outcome; the UI consumes a compact search index and data-derived filter summaries while SEO policy remains independent from import completeness.

**Tech Stack:** TypeScript, Node.js fetch, Next.js 15, React 19, Vitest, Playwright, Sharp, Cloudflare Pages/Wrangler.

## Global Constraints

- Base commit is `98be2e84d4c8d019d04464784fd05048b7bd239d`.
- Work only in `/Users/khaduy/Downloads/tungphat-catalog-full-supplier-import` on `codex/catalog-full-supplier-import`.
- Do not merge or deploy production; media rights remain `UNCONFIRMED`.
- Do not invent prices, stock, SKUs or products from marketing prose.
- Supplier crawling is offline and never runs during `next build`.
- Every discovered URL must have an accounted outcome and reason where applicable.
- Use official HTTPS supplier hosts only and retain retry, backoff, cache, resume and bounded concurrency.

---

### Task 1: Prove And Remove The An Cuong Sample Overwrite

**Files:**
- Create: `docs/catalogue/AN_CUONG_SAMPLE_LIMIT_ROOT_CAUSE.md`
- Modify: `scripts/ancuong/sample.ts`
- Modify: `scripts/ancuong/config.ts`
- Modify: `scripts/ancuong/validate.ts`
- Test: `tests/ancuong/sample.test.ts`
- Test: `tests/ancuong/pipeline-validate.test.ts`

**Interfaces:**
- Produces: isolated sample paths and `validateFullCatalogueCoverage(products, discovery, mode)`.

- [ ] Write a failing test that runs sample orchestration with temporary paths and proves canonical detail/normalized/export files are unchanged.
- [ ] Run `npx vitest run tests/ancuong/sample.test.ts tests/ancuong/pipeline-validate.test.ts` and confirm the overwrite test fails.
- [ ] Add sample-only raw, normalized, media, report and export paths; never call canonical normalize/export from sample mode.
- [ ] Add full validation that rejects `products.length <= 7`, rejects incomplete manifest accounting and compares full output with the sample count.
- [ ] Run the focused tests and confirm they pass.
- [ ] Document exact lines, commit history, pipeline stage, missing assertions and the regression protection.
- [ ] Commit with `audit(catalog): identify An Cuong sample export limit` and `fix(catalog): remove An Cuong production sample cap`.

### Task 2: Add Shared Full-Import Types And Manifest Validation

**Files:**
- Create: `lib/catalog/full-import/types.ts`
- Create: `lib/catalog/full-import/manifest.ts`
- Create: `lib/catalog/full-import/coverage.ts`
- Test: `tests/supplier-full-import-manifest.test.ts`

**Interfaces:**
- Produces: `CatalogueRecord`, `DiscoveredSourceUrl`, `AccountedSourceRecord`, `buildCoverageSummary()` and `validateFullSourceManifest()`.

- [ ] Write failing tests for unique canonical URLs, locale deduplication, required provenance, explicit rejection reasons and 100% accounted coverage.
- [ ] Run the focused test and confirm failures identify the missing module.
- [ ] Implement the discriminated SKU/family/document records and manifest helpers with stable checksum ordering.
- [ ] Run the focused test and refactor only after green.
- [ ] Commit with `feat(catalog): unify supplier full-import manifests`.

### Task 3: Complete An Cuong Multi-Source Discovery And Full Crawl

**Files:**
- Modify: `scripts/ancuong/types.ts`
- Modify: `scripts/ancuong/discover.ts`
- Modify: `scripts/ancuong/crawl-listings.ts`
- Modify: `scripts/ancuong/crawl-details.ts`
- Modify: `scripts/ancuong/cli.ts`
- Create: `scripts/ancuong/discover-sitemaps.ts`
- Create: `scripts/ancuong/discover-documents.ts`
- Create: `data/imports/an-cuong/full-source-manifest.json`
- Test: `tests/ancuong/full-discovery.test.ts`
- Test: `tests/ancuong/full-pagination.test.ts`

**Interfaces:**
- Consumes: shared full-import manifest types.
- Produces: all An Cuong product/category/collection/catalogue discoveries and full crawl checkpoints.

- [ ] Write failing fixtures/tests proving robots sitemap declarations, sitemap index entries, HTML links and locale variants merge without duplicates.
- [ ] Write a failing pagination test with a 20-record page source that requires page two and stops only at total/empty page.
- [ ] Run focused tests and confirm they fail for missing discovery/pagination behavior.
- [ ] Implement full commands with cache, resume, progress, retry and no default record limit.
- [ ] Reconcile fresh discovery against the previous 2,682-record snapshot and account for removed URLs.
- [ ] Run full detail, relation, normalize, media, export and validation twice; require stable checksums on run two.
- [ ] Commit with `feat(catalog): add full An Cuong discovery and pagination`.

### Task 4: Audit And Refresh Thanh Thuy From Sitemaps, REST And Documents

**Files:**
- Modify: `scripts/thanh-thuy/types.ts`
- Modify: `scripts/thanh-thuy/discover.ts`
- Modify: `scripts/thanh-thuy/crawl.ts`
- Modify: `scripts/thanh-thuy/import.ts`
- Create: `scripts/thanh-thuy/catalogue-documents.ts`
- Create: `data/imports/thanh-thuy/full-source-manifest.json`
- Test: `tests/thanh-thuy-full-import.test.ts`

**Interfaces:**
- Produces: reconciled REST/sitemap/document records with previous/new/changed/removed/catalogue-only counts.

- [ ] Write failing tests for REST pagination headers, sitemap/API reconciliation, catalogue-only records and locale deduplication.
- [ ] Confirm the focused tests fail.
- [ ] Extend discovery to all declared product/category/catalogue sitemaps and public catalogue document links.
- [ ] Import only verifiable document codes, mark them `needsEditorialReview`, and leave missing facts unset.
- [ ] Refresh, import and validate twice; compare against the previous 348 records.
- [ ] Commit with `feat(catalog): expand Thanh Thuy completeness discovery`.

### Task 5: Expand Ba Thanh Beyond Melamine

**Files:**
- Modify: `scripts/ba-thanh/config.ts`
- Modify: `scripts/ba-thanh/discover.ts`
- Modify: `scripts/ba-thanh/crawl.ts`
- Modify: `scripts/ba-thanh/import.ts`
- Modify: `scripts/ba-thanh/validate.ts`
- Modify: `lib/catalog/ba-thanh-source.ts`
- Create: `data/imports/ba-thanh/full-source-manifest.json`
- Test: `tests/ba-thanh-full-import.test.ts`

**Interfaces:**
- Produces: retained Melamine SKU records plus source-backed Ba Thanh family/document records.

- [ ] Write failing fixtures/tests for MDF/HDF/HMR, joined-board species, OKAL/MFC, faced-board, edge-banding and Dongwha family extraction.
- [ ] Write a failing test proving thickness lists remain attributes instead of fabricated SKU records.
- [ ] Confirm focused tests fail.
- [ ] Discover menu, sitemap, family, catalogue and Melamine-map URLs; parse factual specs and reject source contact leakage.
- [ ] Preserve all 233 current Melamine records and add verified family/document records.
- [ ] Import and validate twice with stable checksums.
- [ ] Commit with `feat(catalog): add full Ba Thanh product families`.

### Task 6: Local Media Provenance And Rights-Safe Export

**Files:**
- Create: `lib/catalog/full-import/media.ts`
- Modify: `scripts/ancuong/download-media.ts`
- Modify: `scripts/thanh-thuy/import.ts`
- Modify: `scripts/ba-thanh/download-media.ts`
- Test: `tests/supplier-full-media.test.ts`

**Interfaces:**
- Produces: checksum-deduplicated local assets and media metadata with `rightsStatus: "UNCONFIRMED"`.

- [ ] Write failing tests for HTTPS allowlists, MIME verification, checksum reuse, multi-product references, no hotlinks and stable second runs.
- [ ] Confirm focused tests fail.
- [ ] Implement supplier-namespaced local paths without color-changing transforms or upscaling.
- [ ] Download referenced media within a bounded concurrency and record failures as accounted unresolved media.
- [ ] Run media validation twice and confirm no unexpected changes.
- [ ] Commit with `feat(catalog): store supplier media provenance`.

### Task 7: Index The Complete Search Catalogue

**Files:**
- Modify: `lib/catalog/core/types.ts`
- Modify: `lib/catalog/core/search.ts`
- Modify: `lib/catalog/suppliers/an-cuong.ts`
- Modify: `lib/catalog/suppliers/thanh-thuy.ts`
- Modify: `lib/catalog/suppliers/ba-thanh.ts`
- Create: `lib/catalog/full-import/search-index.ts`
- Test: `tests/supplier-full-search.test.ts`

**Interfaces:**
- Produces: compact searchable entries for every imported searchable SKU/family/document record.

- [ ] Write failing ranking tests for exact normalized code, exact code/name, prefix, supplier/family/category, partial match and alphabetical tie-break.
- [ ] Write a failing reconciliation test requiring every searchable import to appear in the search index.
- [ ] Confirm focused tests fail.
- [ ] Implement the compact index and data-derived material taxonomy.
- [ ] Run focused and existing supplier search tests.
- [ ] Commit with `feat(search): index complete supplier catalogue`.

### Task 8: Expose Full Material Filters And Supplier UI

**Files:**
- Modify: `app/catalogue/page.tsx`
- Modify: `components/CatalogueView.tsx`
- Replace: `components/catalog/AnCuongSampleSearch.tsx`
- Modify: `components/home/HomeContent.tsx`
- Modify: `components/Partners.tsx`
- Modify: supplier route components under `app/catalogue`, `app/thuong-hieu` and `app/ma-mau-melamine`
- Test: `tests/catalogue-view.test.ts`
- Test: `tests/supplier-customer-journey.test.ts`

**Interfaces:**
- Consumes: compact search index and available material filters.
- Produces: responsive full catalogue search/filter UI with Tùng Phát CTAs.

- [ ] Write failing tests proving no sample labels remain, empty filters are hidden, exact codes from all suppliers are discoverable and homepage does not import the full dataset.
- [ ] Confirm focused tests fail.
- [ ] Implement data-derived material/supplier selectors while preserving the production design language and contact ownership.
- [ ] Add representative category routes without generating sparse noindex pages unnecessarily.
- [ ] Run Vitest and Playwright desktop/mobile journeys.
- [ ] Commit with `feat(catalog): expose full material filters`.

### Task 9: SEO, Coverage Reports And Runbook

**Files:**
- Create: `docs/catalogue/AN_CUONG_FULL_IMPORT_REPORT.md`
- Create: `docs/catalogue/THANH_THUY_FULL_IMPORT_REPORT.md`
- Create: `docs/catalogue/BA_THANH_FULL_IMPORT_REPORT.md`
- Create: `docs/catalogue/SUPPLIER_FULL_CATALOGUE_COVERAGE.md`
- Create: `docs/catalogue/SUPPLIER_FULL_IMPORT_RUNBOOK.md`
- Create: `docs/catalogue/SUPPLIER_FULL_IMPORT_FINAL_REPORT.md`
- Modify: sitemap/metadata/structured-data helpers under `lib/catalog/core`
- Test: `tests/supplier-full-seo.test.ts`

**Interfaces:**
- Produces: index/noindex reconciliation, coverage tables and exact operational commands.

- [ ] Write failing tests that exclude noindex/search/filter routes from sitemap and require canonical 200, unique metadata and valid JSON-LD for indexable routes.
- [ ] Confirm focused tests fail.
- [ ] Implement status mapping for `READY_TO_INDEX`, `NOINDEX_USEFUL`, `NEEDS_ENRICHMENT`, `SOURCE_ONLY` and `INVALID`.
- [ ] Generate reports directly from manifests/import outputs, including unresolved reasons and coverage percentage.
- [ ] Document discover, crawl, resume, dry-run, stale removal, restore, media refresh, search rebuild, preview deploy, pagination troubleshooting and new supplier onboarding.
- [ ] Commit with `test(catalog): enforce full catalogue coverage` and `docs(catalog): document supplier full import`.

### Task 10: Full Verification, Preview, Push And Draft PR

**Files:**
- Modify only files required by verification findings.

**Interfaces:**
- Produces: clean branch, pushed commits, draft PR against `codex/main-sitewide-catalog-rollout` and Cloudflare preview URL.

- [ ] Run format checks without mass-rewriting unrelated legacy files.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build` and repository audit commands.
- [ ] Run internal-link, sitemap, canonical, JSON-LD, accessibility, Lighthouse and secret scans.
- [ ] Run all three import pipelines a second time and confirm created/updated/duplicate/checksum idempotency expectations.
- [ ] Push `codex/catalog-full-supplier-import`, create a draft PR targeting `codex/main-sitewide-catalog-rollout`, and deploy a Cloudflare Pages preview without production mutation.
- [ ] Smoke test required routes, exact-code search, supplier/material filters, mobile, media, console, Zalo and no-result state.
- [ ] Confirm `git status --short --branch` is clean and write the final report.
